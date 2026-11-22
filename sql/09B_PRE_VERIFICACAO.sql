-- SOMENTE LEITURA: rode antes de instalar a Opção B.
SELECT 'profissionais_ativos' AS verificacao, count(*)::bigint AS quantidade FROM public.profissionais WHERE ativo IS TRUE
UNION ALL
SELECT 'reservas_ativas_sem_profissional', count(*) FROM public.agendamentos WHERE status IS DISTINCT FROM 'cancelado' AND profissional_id IS NULL
UNION ALL
SELECT 'reservas_ativas_com_fim_invalido', count(*) FROM public.agendamentos WHERE status IS DISTINCT FROM 'cancelado' AND (data_hora_fim IS NULL OR data_hora_fim <= data_hora_inicio)
UNION ALL
SELECT 'conflitos_mesmo_profissional', count(*) FROM public.agendamentos a JOIN public.agendamentos b ON a.id < b.id AND a.profissional_id = b.profissional_id WHERE a.status IS DISTINCT FROM 'cancelado' AND b.status IS DISTINCT FROM 'cancelado' AND a.data_hora_inicio < b.data_hora_fim AND b.data_hora_inicio < a.data_hora_fim;

-- Identifique os agendamentos antigos que precisam de atribuição manual.
SELECT id, cliente_id, servico_id, data_hora_inicio, data_hora_fim, status
FROM public.agendamentos
WHERE status IS DISTINCT FROM 'cancelado' AND profissional_id IS NULL
ORDER BY data_hora_inicio;

-- Profissionais reais disponíveis para seleção (não atribua IDs por suposição).
SELECT id, pnome, ativo FROM public.profissionais ORDER BY id;
