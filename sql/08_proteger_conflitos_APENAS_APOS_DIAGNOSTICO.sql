-- ATENÇÃO: altera estrutura do banco. Faça backup e só execute após
-- confirmar que o diagnóstico 07 não encontrou conflitos nem intervalos inválidos.
-- Política assumida: UM atendimento por vez no salão, independente do profissional,
-- conforme funções públicas atuais. Para vários profissionais simultâneos,
-- REPROJETAR esta regra em vez de executar este script.
-- Em caso de reservas conflitantes preexistentes, o ALTER TABLE falhará sem apagar registros.
BEGIN;
ALTER TABLE public.agendamentos
  ADD CONSTRAINT agendamentos_sem_sobreposicao
  EXCLUDE USING gist (
    tstzrange(data_hora_inicio,
      COALESCE(data_hora_fim, data_hora_inicio + interval '1 hour'), '[)') WITH &&
  )
  WHERE (status IS DISTINCT FROM 'cancelado');
COMMIT;
