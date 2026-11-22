-- SOMENTE LEITURA. Mostra conflitos entre reservas ativas (independente do profissional).
-- A função pública atual já bloqueia qualquer conflito de horário globalmente.
SELECT a.id AS agendamento_a, b.id AS agendamento_b,
       a.data_hora_inicio AS inicio_a, a.data_hora_fim AS fim_a,
       b.data_hora_inicio AS inicio_b, b.data_hora_fim AS fim_b,
       a.profissional_id AS profissional_a, b.profissional_id AS profissional_b
FROM public.agendamentos a
JOIN public.agendamentos b ON a.id < b.id
WHERE a.status IS DISTINCT FROM 'cancelado'
  AND b.status IS DISTINCT FROM 'cancelado'
  AND a.data_hora_inicio < COALESCE(b.data_hora_fim, b.data_hora_inicio + interval '1 hour')
  AND b.data_hora_inicio < COALESCE(a.data_hora_fim, a.data_hora_inicio + interval '1 hour')
ORDER BY a.data_hora_inicio;

-- Reservas sem término ou com término inválido. Não são alteradas.
SELECT id, status, profissional_id, data_hora_inicio, data_hora_fim
FROM public.agendamentos
WHERE status IS DISTINCT FROM 'cancelado'
  AND (data_hora_fim IS NULL OR data_hora_fim <= data_hora_inicio)
ORDER BY data_hora_inicio;
