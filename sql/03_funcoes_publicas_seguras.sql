-- EXECUTE UMA VEZ, NO SQL EDITOR DO PROJETO CORRETO. Faça backup antes.
-- Sem GRANT direto de SELECT/INSERT/UPDATE/DELETE nas tabelas para anon.
BEGIN;
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE IF NOT EXISTS private.public_client_tokens (
    token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id integer NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON private.public_client_tokens FROM PUBLIC, anon, authenticated;
ALTER TABLE private.public_client_tokens ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.cadastrar_cliente_ficticio(p_dados jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 v_safe jsonb; v_id integer; v_token uuid; v_nomes text; v_campos text;
 v_nome text; v_cpf text; v_telefone text;
BEGIN
 IF jsonb_typeof(p_dados) <> 'object' OR length(p_dados::text) > 9000 THEN
   RAISE EXCEPTION 'Dados de cadastro inválidos'; END IF;
 v_nome := trim(coalesce(p_dados->>'nome',''));
 v_cpf := pg_catalog.regexp_replace(coalesce(p_dados->>'cpf',''), '[^0-9]', '', 'g');
 v_telefone := pg_catalog.regexp_replace(coalesce(p_dados->>'telefone',''), '[^0-9]', '', 'g');
 IF length(v_nome) NOT BETWEEN 2 AND 100 OR length(v_cpf) <> 11
    OR length(v_telefone) NOT BETWEEN 10 AND 11 THEN
   RAISE EXCEPTION 'Preencha nome, CPF fictício de 11 dígitos e telefone'; END IF;
 -- Controle básico de volume global. Complementar com CAPTCHA e rate-limit por IP em Edge Function.
 IF (SELECT count(*) FROM private.public_client_tokens WHERE created_at > now() - interval '1 minute') >= 20 THEN
   RAISE EXCEPTION 'Limite temporário de cadastros atingido'; END IF;
 -- Somente campos de ficha expressamente permitidos e EXISTENTES na tabela, sem id/roles/dados de controle.
 SELECT COALESCE(pg_catalog.jsonb_object_agg(j.key, j.value), '{}'::jsonb)
 INTO v_safe
 FROM pg_catalog.jsonb_each(p_dados) j
 JOIN pg_catalog.pg_attribute a ON a.attname = j.key AND a.attrelid = 'public.clientes'::regclass
 WHERE a.attnum > 0 AND NOT a.attisdropped
 AND j.key = ANY(ARRAY['endereco','email','tipo_cabelo','estado_cabelo','mudar_cor',
 'oleosidade','textura','procedimento','aparencia','motivacao','autoestima',
 'tempo_autocuidado','estilo','felicidade','gostos','exercicios','tem_filhos',
 'alergia','descricao_alergia','frequencia_salao','expectativa','nascimento']);
 v_safe := v_safe || pg_catalog.jsonb_build_object('nome',v_nome,'cpf',v_cpf,'telefone',v_telefone);
 -- Se a tabela usar nascimento (date) e o formulário fornecer data_nascimento, converta explicitamente.
 IF p_dados ? 'data_nascimento' AND EXISTS (
  SELECT 1 FROM pg_catalog.pg_attribute WHERE attrelid='public.clientes'::regclass
   AND attname='nascimento' AND attnum > 0 AND NOT attisdropped) THEN
  v_safe := v_safe || pg_catalog.jsonb_build_object('nascimento',p_dados->>'data_nascimento');
 END IF;
 SELECT pg_catalog.string_agg(pg_catalog.format('%I',key),','),
        pg_catalog.string_agg(pg_catalog.format('r.%I',key),',')
 INTO v_nomes,v_campos FROM pg_catalog.jsonb_each(v_safe);
 EXECUTE pg_catalog.format('INSERT INTO public.clientes (%s) SELECT %s FROM pg_catalog.jsonb_populate_record(NULL::public.clientes, $1) AS r RETURNING id',v_nomes,v_campos)
 USING v_safe INTO v_id;
 INSERT INTO private.public_client_tokens(cliente_id) VALUES(v_id) RETURNING token INTO v_token;
 RETURN pg_catalog.jsonb_build_object('id',v_id,'token',v_token,'nome',v_nome,'telefone',v_telefone,'cpf',v_cpf);
EXCEPTION WHEN unique_violation THEN
 RAISE EXCEPTION 'Identificador fictício já cadastrado; escolha outro para este teste';
END;
$$;

CREATE OR REPLACE FUNCTION public.listar_servicos_publicos()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'servico',servico,
 'valor',valor,'duracao',duracao::text) ORDER BY servico),'[]'::jsonb)
 FROM public.servicos WHERE ativo IS TRUE;
$$;

CREATE OR REPLACE FUNCTION public.horarios_publicos(p_servico_id integer, p_data date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_duracao interval; v_result jsonb;
BEGIN
 IF p_data < (now() AT TIME ZONE 'America/Sao_Paulo')::date OR p_data > (now() AT TIME ZONE 'America/Sao_Paulo')::date + 90 THEN
   RETURN '[]'::jsonb; END IF;
 SELECT duracao::text::interval INTO v_duracao FROM public.servicos WHERE id=p_servico_id AND ativo IS TRUE;
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
 SELECT valor, duracao::text::interval INTO v_valor,v_duracao
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

REVOKE ALL ON FUNCTION public.cadastrar_cliente_ficticio(jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.listar_servicos_publicos() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.horarios_publicos(integer,date) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.agendar_ficticio(uuid,integer,date,time,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cadastrar_cliente_ficticio(jsonb) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.listar_servicos_publicos() TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.horarios_publicos(integer,date) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.agendar_ficticio(uuid,integer,date,time,text,text) TO anon,authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
