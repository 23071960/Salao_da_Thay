# Salão da Thay — Login administrativo

## Instalação
1. Faça backup do repositório e do Supabase.
2. Confirme que `private.admin_users` já contém o administrador e `private.is_admin()` foi criada.
3. Execute `sql/01_autorizacao_dashboard.sql` no SQL Editor **somente depois de revisar o conteúdo**. Se o script anterior de política administrativa já foi aplicado, este SQL substitui a política do mesmo nome.
4. Copie os arquivos desta pasta para um branch de teste do GitHub Pages. Preserve os diretórios e nomes, inclusive `serviços.js`.
5. Abra `login.html`, entre com a conta administradora, teste páginas internas e botão Sair. Em aba anônima, confirme que o dashboard exige login. Teste também uma conta Auth não administradora.

## Segurança
- Nenhuma chave `service_role` ou `sb_secret_...` deve ser publicada. A chave existente é `anon` (pública).
- A URL do HTML nunca é secreta; a proteção real é no PostgreSQL com RLS.
- A página pública de visitantes continua sem acesso às tabelas. É necessária uma implementação específica para cadastro/agendamento público seguro, preferencialmente por funções controladas com rate limit/CAPTCHA.
- Revise funções RPC existentes, views, permissões do Storage e políticas adicionais antes da publicação definitiva.
- Não cole senha de administrador no GitHub.

## Limitações dos arquivos fornecidos
- CSS adicionais referenciados (`estilos/agenda.css`, `clientes.css`, `profis.css`, `serviços.css`, `botão_dash.css`, `graficos.css`) **não foram enviados**. Copie os originais de seu repositório.
- `profis.js` ainda usa dados simulados: a persistência no Supabase é uma tarefa separada.
- O painel original usa mais de uma implementação de gráfico com nomes duplicados; foram mantidas para reduzir mudanças, mas merecem refatoração.
- Dependendo da configuração do Supabase, `GRANT` de sequência pode precisar de ajuste às sequências realmente usadas.
- Os testes de login remoto e o deployment no Pages não foram executados aqui.
