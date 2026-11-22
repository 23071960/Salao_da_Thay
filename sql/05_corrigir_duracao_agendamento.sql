-- CORREÇÃO DA DURAÇÃO: serviços.duracao está em MINUTOS (integer).
-- Executar SOMENTE depois de confirmar backup e a estrutura atual do banco.
-- Não modifica tabelas, RLS, is_admin ou privilégios administrativos.
BEGIN;
CREATE OR REPLACE FUNCTION public.horarios_publicos(p_servico_id integer, p_data date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_duracao interval; v_result jsonb;
BEGIN
 IF p_data < (now() AT TIME ZONE 'America/Sao_Paulo')::date OR p_data > (now() AT TIME ZONE 'America/Sao_Paulo')::date + 90 THEN
   RETURN '[]'::jsonb; END IF;
 SELECT pg_catalog.make_interval(mins => duracao) INTO v_duracao FROM public.servicos WHERE id=p_servico_id AND ativo IS TRUE;
 IF v_duracao IS NULL OR v_duracao <= interval '0 minute' OR v_duracao > interval '4 hours' THEN RETURN '[]'::jsonb; END IF;
 SELECT coalesce(jsonb_agg(to_char(slot AT TIME ZONE 'America/Sao_Paulo','HH24:MI') ORDER BY slot),'[]'::jsonb)
 INTO v_result FROM pg_catalog.generate_series(
   (p_data + time '09:00') AT TIME ZONE 'America/Sao_Paulo',
   ((p_data + time '18:00') AT TIME ZONE 'America/Sao_Paulo') - v_duracao,
   interval '30 minutes') AS slot
 WHERE slot > now() AND NOT EXISTS (
   SELECT 1 FROM public.agendamentos a
   WHERE a.status NOT IN ('cancelado')
     AND a.data_hora_inicio < slot + v_duracao
     AND coalesce(a.data_hora_fim, a.data_hora_inicio + interval '1 hour') > slot
 );
 RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.agendar_ficticio(
 p_token uuid, p_servico_id integer, p_data date, p_hora time,
 p_pagamento text DEFAULT NULL, p_observacoes text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_cliente integer; v_valor numeric; v_duracao interval; v_inicio timestamptz; v_fim timestamptz; v_id integer;
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(582741);
 SELECT cliente_id INTO v_cliente FROM private.public_client_tokens
 WHERE token=p_token AND created_at > now() - interval '14 days';
 IF v_cliente IS NULL THEN RAISE EXCEPTION 'Cadastro não identificado: faça um novo cadastro fictício'; END IF;
 IF p_data IS NULL OR p_hora IS NULL OR p_data < (now() AT TIME ZONE 'America/Sao_Paulo')::date
    OR p_data > (now() AT TIME ZONE 'America/Sao_Paulo')::date + 90 THEN
  RAISE EXCEPTION 'Data inválida'; END IF;
 IF p_pagamento IS NOT NULL AND p_pagamento NOT IN ('dinheiro','cartao','pix') THEN
  RAISE EXCEPTION 'Forma de pagamento inválida'; END IF;
 IF length(coalesce(p_observacoes,'')) > 500 THEN RAISE EXCEPTION 'Observações muito extensas'; END IF;
 SELECT valor, pg_catalog.make_interval(mins => duracao) INTO v_valor,v_duracao
 FROM public.servicos WHERE id=p_servico_id AND ativo IS TRUE;
 IF v_duracao IS NULL OR v_duracao <= interval '0 minute' OR v_duracao > interval '4 hours' THEN
  RAISE EXCEPTION 'Serviço indisponível'; END IF;
 v_inicio := (p_data + p_hora) AT TIME ZONE 'America/Sao_Paulo';
 v_fim := v_inicio + v_duracao;
 IF v_inicio <= now() OR p_hora < time '09:00' OR v_fim > ((p_data + time '18:00') AT TIME ZONE 'America/Sao_Paulo') THEN
  RAISE EXCEPTION 'Horário fora do expediente'; END IF;
 IF EXISTS(SELECT 1 FROM public.agendamentos a WHERE a.status <> 'cancelado'
  AND a.data_hora_inicio < v_fim AND coalesce(a.data_hora_fim,a.data_hora_inicio+interval '1 hour') > v_inicio) THEN
  RAISE EXCEPTION 'Horário já reservado. Selecione outro'; END IF;
 INSERT INTO public.agendamentos(cliente_id,servico_id,data_consulta,data_hora_inicio,data_hora_fim,status,pago,valor_cobrado,forma_pagamento,observacoes)
 VALUES(v_cliente,p_servico_id,p_data,v_inicio,v_fim,'agendado',false,v_valor,p_pagamento,left(p_observacoes,500)) RETURNING id INTO v_id;
 RETURN pg_catalog.jsonb_build_object('id',v_id,'status','agendado');
END;
$$;

NOTIFY pgrst, 'reload schema';
COMMIT;
