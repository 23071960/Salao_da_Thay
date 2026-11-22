# Revisão inicial — Site público Salão da Thay

## Alterações feitas
- Corrigidos caminhos de arquivos CSS e JS no HTML para caminhos relativos, compatíveis com GitHub Pages e Preview local.
- Removido caractere `>` solto na inclusão do CSS de tema escuro no `index.html`.
- Corrigidas tags `</a>` ausentes nos dois links do menu principal.
- Incluído arquivo SQL apenas de leitura para identificação de colunas, políticas, permissões e relacionamentos.

## Não foi alterado
- Scripts de cadastro, pesquisa e agendamento; eles ainda acessam tabelas diretamente e terão erros com RLS restritiva.
- Banco Supabase, autenticação administrativa, chaves e políticas RLS.

## Segurança: pendências antes de publicar como funcional
1. Não liberar `SELECT *` anônimo em `clientes`: consulta por CPF expõe dados pessoais sem autenticação.
2. Não liberar `UPDATE` anônimo na tabela `clientes`.
3. Não liberar `SELECT` anônimo em `agendamentos`, mesmo filtrando horários. Usar endpoint que retorne apenas horários livres.
4. Não confiar em `valor_cobrado`, `cliente_id`, horários ou status enviados pelo navegador. Validar no servidor e prevenir conflitos concorrentes.
5. Definir proteção contra spam/cadastros em massa (rate limit e CAPTCHA, conforme cenário).
6. Preferir dados inteiramente fictícios; o formulário atual solicita CPF, nascimento, alergias e outros dados pessoais.
7. Ajustar mensagens da interface quando endpoints de cadastro/consulta forem implementados.

## Próximo passo
Executar `sql/DIAGNOSTICO-SOMENTE-LEITURA.sql` no SQL Editor, compartilhar a estrutura retornada, e implementar Edge Functions + controles de acesso por operação. Evitar executar GRANT amplo para `anon`.
