-- OPÇÃO B: executa DDL e atualiza RPCs somente após pré-verificação 09B.
-- Faça backup. Se houver reserva ativa sem profissional ou conflito, o script falha e faz rollback.
-- Atenção: pressupõe data_hora_inicio/fim timestamptz, profissional_id integer,
-- profissionais(id integer, pnome text, ativo boolean), servicos.duracao interval.
BEGIN;
DO $guard$
BEGIN
 IF EXISTS (SELECT 1 FROM public.agendamentos WHERE status IS DISTINCT FROM 'cancelado' AND profissional_id IS NULL) THEN
   RAISE EXCEPTION 'Existem reservas ativas sem profissional. Atribua um profissional a cada uma antes de prosseguir.';
 END IF;
 IF EXISTS (SELECT 1 FROM public.agendamentos WHERE status IS DISTINCT FROM 'cancelado' AND (data_hora_fim IS NULL OR data_hora_fim <= data_hora_inicio)) THEN
   RAISE EXCEPTION 'Há reservas ativas com intervalo de tempo inválido.';
 END IF;
 IF EXISTS (SELECT 1 FROM public.agendamentos a JOIN public.agendamentos b ON a.id < b.id AND a.profissional_id = b.profissional_id WHERE a.status IS DISTINCT FROM 'cancelado' AND b.status IS DISTINCT FROM 'cancelado' AND a.data_hora_inicio < b.data_hora_fim AND b.data_hora_inicio < a.data_hora_fim) THEN
   RAISE EXCEPTION 'Existem reservas conflitantes para o mesmo profissional.';
 END IF;
 IF (SELECT count(*) FROM public.profissionais WHERE ativo IS TRUE) < 1 THEN
   RAISE EXCEPTION 'Cadastre pelo menos um profissional ativo.';
 END IF;
 IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'servicos' AND column_name = 'duracao' AND udt_name <> 'interval') THEN
   RAISE EXCEPTION 'servicos.duracao não é interval. Não prossiga com esta versão.';
 END IF;
END $guard$;

CREATE EXTENSION IF NOT EXISTS btree_gist;
-- Restrições aplicadas a TODAS as escritas: público, admin, API e SQL.
ALTER TABLE public.agendamentos
 ADD CONSTRAINT agendamento_ativo_exige_profissional
 CHECK (status = 'cancelado' OR profissional_id IS NOT NULL);
ALTER TABLE public.agendamentos
 ADD CONSTRAINT agendamento_ativo_intervalo_valido
 CHECK (status = 'cancelado' OR (data_hora_fim IS NOT NULL AND data_hora_fim > data_hora_inicio));
ALTER TABLE public.agendamentos
 ADD CONSTRAINT agendamentos_profissional_sem_sobreposicao
 EXCLUDE USING gist (
   profissional_id WITH =,
   tstzrange(data_hora_inicio, data_hora_fim, '[)') WITH &&
 ) WHERE (status IS DISTINCT FROM 'cancelado');

-- Catálogo público de profissionais: apenas nome e identificador de ativos.
CREATE OR REPLACE FUNCTION public.listar_profissionais_publicos()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'pnome',pnome) ORDER BY pnome),'[]'::jsonb)
 FROM public.profissionais WHERE ativo IS TRUE;
$$;

-- Assinatura NOVA inclui profissional. Horários entre 09h e 18h de 30 em 30 minutos.
CREATE OR REPLACE FUNCTION public.horarios_publicos(p_servico_id integer, p_data date, p_profissional_id integer)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_duracao interval; v_result jsonb;
BEGIN
 IF p_data IS NULL OR p_profissional_id IS NULL OR p_data < (now() AT TIME ZONE 'America/Sao_Paulo')::date
   OR p_data > (now() AT TIME ZONE 'America/Sao_Paulo')::date + 90 THEN RETURN '[]'::jsonb; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.profissionais WHERE id=p_profissional_id AND ativo IS TRUE) THEN RETURN '[]'::jsonb; END IF;
 SELECT duracao INTO v_duracao FROM public.servicos WHERE id=p_servico_id AND ativo IS TRUE;
 IF v_duracao IS NULL OR v_duracao <= interval '0 minute' OR v_duracao > interval '4 hours' THEN RETURN '[]'::jsonb; END IF;
 SELECT COALESCE(jsonb_agg(to_char(slot AT TIME ZONE 'America/Sao_Paulo','HH24:MI') ORDER BY slot),'[]'::jsonb)
 INTO v_result
 FROM pg_catalog.generate_series(
   (p_data + time '09:00') AT TIME ZONE 'America/Sao_Paulo',
   ((p_data + time '18:00') AT TIME ZONE 'America/Sao_Paulo') - v_duracao,
   interval '30 minutes') AS slot
 WHERE slot > now() AND NOT EXISTS (
    SELECT 1 FROM public.agendamentos a
    WHERE a.profissional_id = p_profissional_id AND a.status IS DISTINCT FROM 'cancelado'
      AND a.data_hora_inicio < slot + v_duracao AND a.data_hora_fim > slot
 );
 RETURN v_result;
END;
$$;

-- A EXCLUSION CONSTRAINT garante o bloqueio mesmo em duas requisições simultâneas.
CREATE OR REPLACE FUNCTION public.agendar_ficticio(
 p_token uuid, p_servico_id integer, p_data date, p_hora time,
 p_profissional_id integer, p_pagamento text DEFAULT NULL, p_observacoes text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_cliente integer; v_valor numeric; v_duracao interval; v_inicio timestamptz; v_fim timestamptz; v_id integer;
BEGIN
 SELECT cliente_id INTO v_cliente FROM private.public_client_tokens
 WHERE token=p_token AND created_at > now() - interval '14 days';
 IF v_cliente IS NULL THEN RAISE EXCEPTION 'Cadastro não identificado: faça novo cadastro fictício'; END IF;
 IF p_profissional_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.profissionais WHERE id=p_profissional_id AND ativo IS TRUE) THEN
   RAISE EXCEPTION 'Selecione um profissional ativo'; END IF;
 IF p_data IS NULL OR p_hora IS NULL OR p_data < (now() AT TIME ZONE 'America/Sao_Paulo')::date
   OR p_data > (now() AT TIME ZONE 'America/Sao_Paulo')::date + 90 THEN RAISE EXCEPTION 'Data inválida'; END IF;
 IF p_pagamento IS NOT NULL AND p_pagamento NOT IN ('dinheiro','cartao','pix') THEN RAISE EXCEPTION 'Forma de pagamento inválida'; END IF;
 IF length(COALESCE(p_observacoes,'')) > 500 THEN RAISE EXCEPTION 'Observações muito extensas'; END IF;
 SELECT valor,duracao INTO v_valor,v_duracao FROM public.servicos WHERE id=p_servico_id AND ativo IS TRUE;
 IF v_duracao IS NULL OR v_duracao <= interval '0 minute' OR v_duracao > interval '4 hours' THEN RAISE EXCEPTION 'Serviço indisponível'; END IF;
 v_inicio := (p_data + p_hora) AT TIME ZONE 'America/Sao_Paulo';
 v_fim := v_inicio + v_duracao;
 IF v_inicio <= now() OR p_hora < time '09:00'
   OR v_fim > ((p_data + time '18:00') AT TIME ZONE 'America/Sao_Paulo')
   OR extract(minute from p_hora)::integer % 30 <> 0 OR extract(second from p_hora) <> 0 THEN
   RAISE EXCEPTION 'Horário fora do expediente ou grade de 30 minutos'; END IF;
 IF EXISTS(SELECT 1 FROM public.agendamentos a
  WHERE a.profissional_id=p_profissional_id AND a.status IS DISTINCT FROM 'cancelado'
    AND a.data_hora_inicio < v_fim AND a.data_hora_fim > v_inicio) THEN
   RAISE EXCEPTION 'Profissional já reservado nesse horário'; END IF;
 BEGIN
  INSERT INTO public.agendamentos(
    cliente_id,servico_id,profissional_id,data_consulta,data_hora_inicio,data_hora_fim,
    status,pago,valor_cobrado,forma_pagamento,observacoes)
  VALUES(v_cliente,p_servico_id,p_profissional_id,p_data,v_inicio,v_fim,
    'agendado',false,v_valor,p_pagamento,left(p_observacoes,500)) RETURNING id INTO v_id;
 EXCEPTION WHEN exclusion_violation THEN RAISE EXCEPTION 'Horário ocupado. Atualize os horários disponíveis';
 END;
 RETURN jsonb_build_object('id',v_id,'status','agendado');
END;
$$;

REVOKE ALL ON FUNCTION public.listar_profissionais_publicos() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.horarios_publicos(integer,date,integer) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.agendar_ficticio(uuid,integer,date,time,integer,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.listar_profissionais_publicos() TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.horarios_publicos(integer,date,integer) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.agendar_ficticio(uuid,integer,date,time,integer,text,text) TO anon,authenticated;
-- Remova acesso público às assinaturas antigas para evitar contornar a regra.
REVOKE ALL ON FUNCTION public.horarios_publicos(integer,date) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.agendar_ficticio(uuid,integer,date,time,text,text) FROM PUBLIC,anon,authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
