-- SOMENTE LEITURA. Execute no SQL Editor do mesmo projeto Supabase.
-- Não mostra dados pessoais de clientes.
-- Confirme se os serviços ativos têm duração entre 1 minuto e 4 horas.
SELECT id, servico, ativo, valor, duracao,
       CASE WHEN duracao IS NULL THEN 'SEM DURACAO'
            WHEN duracao <= interval '0 minute' THEN 'DURACAO INVALIDA'
            WHEN duracao > interval '4 hours' THEN 'MAIOR QUE 4H: RPC RETORNA LISTA VAZIA'
            ELSE 'OK' END AS diagnostico
FROM public.servicos
ORDER BY servico;

-- Para analisar um serviço e uma data, execute esta consulta SEPARADAMENTE,
-- substituindo o texto pelo nome exato e a data por uma data futura.
SELECT s.id, s.servico, s.duracao, s.ativo,
       public.horarios_publicos(s.id, DATE '2026-11-23') AS horarios_retornados
FROM public.servicos s
WHERE s.servico ILIKE '%mandioca%';

-- Quantidade de agendamentos por dia, sem expor CPF, nome ou telefone:
SELECT data_consulta, count(*) AS quantidade
FROM public.agendamentos
WHERE data_consulta >= current_date
GROUP BY data_consulta ORDER BY data_consulta LIMIT 30;
