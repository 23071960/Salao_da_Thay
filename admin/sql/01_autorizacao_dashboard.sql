-- Execute no Supabase SQL Editor após confirmar o registro em private.admin_users.
-- Somente a conta autorizada por private.is_admin() acessará as 8 tabelas.
-- Não habilita cadastro público; isso exigirá uma etapa específica.
BEGIN;
-- RPC invocadora: sem SECURITY DEFINER no schema público.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = ''
AS $$ SELECT private.is_admin(); $$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;

DO $$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY[
   'agendamentos','avaliacoes','clientes','imagens-catalogo',
   'imagens_catalogo','perfil_emocional','profissionais','servicos'
 ] LOOP
   EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
   EXECUTE format('REVOKE ALL PRIVILEGES ON public.%I FROM PUBLIC, anon',t);
   EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated',t);
   EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I','acesso_somente_administrador',t);
   EXECUTE format(
     'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()))',
     'acesso_somente_administrador', t
   );
 END LOOP;
END $$;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
COMMIT;

-- Verificação (separada):
-- SELECT tablename, policyname, roles, cmd FROM pg_policies WHERE schemaname='public';
