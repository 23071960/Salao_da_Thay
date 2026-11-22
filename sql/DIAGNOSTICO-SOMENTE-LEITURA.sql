-- Execute no SQL Editor do Supabase. DIAGNÓSTICO SOMENTE LEITURA.
-- Não altera registros, políticas ou permissões.
-- Compartilhe resultados de estrutura; não compartilhe dados de clientes.

-- 1. Colunas e tipos das tabelas utilizadas pelo site público.
SELECT table_name, ordinal_position, column_name, data_type, udt_name,
       is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('clientes','servicos','agendamentos','profissionais')
ORDER BY table_name, ordinal_position;

-- 2. Políticas RLS vigentes.
SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('clientes','servicos','agendamentos','profissionais')
ORDER BY tablename, policyname;

-- 3. Privilégios anônimos (TRUE indica permissão SQL; RLS ainda pode filtrar).
SELECT t.table_name,
       has_table_privilege('anon', format('public.%I',t.table_name), 'SELECT') AS anon_select,
       has_table_privilege('anon', format('public.%I',t.table_name), 'INSERT') AS anon_insert,
       has_table_privilege('anon', format('public.%I',t.table_name), 'UPDATE') AS anon_update,
       has_table_privilege('anon', format('public.%I',t.table_name), 'DELETE') AS anon_delete
FROM information_schema.tables t
WHERE t.table_schema='public' AND t.table_name IN ('clientes','servicos','agendamentos','profissionais')
ORDER BY t.table_name;

-- 4. Restrições e chaves estrangeiras.
SELECT tc.table_name, tc.constraint_name, tc.constraint_type,
       kcu.column_name, ccu.table_name AS referenced_table, ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_schema=kcu.constraint_schema AND tc.constraint_name=kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_schema=ccu.constraint_schema AND tc.constraint_name=ccu.constraint_name
WHERE tc.table_schema='public'
  AND tc.table_name IN ('clientes','servicos','agendamentos','profissionais')
ORDER BY tc.table_name,tc.constraint_name,kcu.ordinal_position;
