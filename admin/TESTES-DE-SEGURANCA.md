# Testes finais — sem destruir registros

1. Em janela anônima, `index.html` e páginas `paginas/` devem redirecionar para `login.html`.
2. Com administrador, confirmar listagem de clientes/serviços/agendamentos e gráficos (controle do navegador Console/Network).
3. Em SQL Editor, executar as consultas de `02_diagnostico_publico_somente_leitura.sql` e confirmar que não surgiu política ALL para `anon`/`public`.
4. Verificar `has_table_privilege('anon','public.clientes','SELECT')`, idem UPDATE/DELETE em todas as tabelas.
5. Testar usuário autenticado não cadastrado em `private.admin_users`: RPC `public.is_admin()` deve retornar false; tabelas administrativas devem não disponibilizar registros.
6. Revisar `Database > Security Advisor`, funções `SECURITY DEFINER`, views, publicações de dados e Storage buckets.
7. Confirmar que nenhuma chave `sb_secret` ou `service_role` foi colocada em HTML, JS, repositório ou histórico de commit.
8. Publicar primeiro em branch de teste; revisar 404 de CSS, scripts e console.

AVISO: O teste das permissões feito até agora verifica alguns GRANTs e navegação, não é uma auditoria de segurança exaustiva.
