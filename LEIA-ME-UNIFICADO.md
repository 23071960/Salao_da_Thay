# Salão da Thay — aplicação unificada (Etapa 1)

## Estrutura

- `index.html` / `paginas/` / `scripts/` / `styles/`: site público original, com caminhos relativos corrigidos.
- `admin/login.html`: autenticação do administrador.
- `admin/index.html`: dashboard administrativo.
- `admin/paginas/`: gerenciamento administrativo.
- `admin/scripts/auth-loader.js`: verifica sessão e `public.is_admin()` antes de carregar os scripts administrativos.

## Como testar

1. Extraia o ZIP, abra a pasta `salao_da_thay_unificado` no VS Code e execute com Live Server/Preview HTTP (não por `file:///`).
2. Abra a página `index.html`, clique em **Acesso Administrativo**.
3. Faça login e confira os indicadores no dashboard e todas as páginas administrativas.
4. Teste em janela anônima: abra diretamente `/admin/index.html` e `/admin/paginas/clientes.html`; devem encaminhar ao login.
5. Ao publicar, use um repositório/branch de teste. O endereço do Pages será `https://23071960.github.io/NOME_DO_REPOSITORIO/`.

## IMPORTANTE: etapa 2 ainda necessária

O projeto público original usa consultas e gravações diretamente nas tabelas `clientes`, `agendamentos` e `servicos`. As políticas RLS seguras atuais negam operações para `anon`.
Por isso **cadastros, pesquisas por CPF e agendamentos públicos ainda não funcionarão** até implementar funções públicas no backend com validação, limitação de requisições e proteção contra sobreposição de horários. Não revogue RLS e não conceda `SELECT/UPDATE/DELETE` irrestrito a `anon`.

O login administrativo existente e a RPC `public.is_admin()` são preservados. Nenhuma alteração foi feita no Supabase e não há credenciais privadas no pacote. A chave pública/anon do Supabase é intencionalmente visível no frontend; nunca publique `sb_secret`/`service_role`.

**Acesso ao código HTML/JS não é controle de segurança**: a autorização real depende do Supabase RLS e das permissões server-side.

## Observações

- A aplicação administrativa usa os mesmos nomes e scripts da versão previamente testada. Alteração apenas de localização sob `/admin/` e links para navegação pública.
- Foram corrigidos links absolutos da página pública para rodar em subpastas e localmente.
- O arquivo `admin/sql/01_autorizacao_dashboard.sql` é documentação histórica; não execute novamente sem revisar.
- A aparência depende de recursos CDN externos, que exigem conexão com internet.
