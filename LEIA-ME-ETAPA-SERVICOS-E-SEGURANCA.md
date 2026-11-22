# Correção administrativa e prevenção de conflito

## O que já foi corrigido no código
- `admin/scripts/serviços.js`: converte a duração retornada pelo PostgreSQL (`HH:MM:SS`) para minutos no formulário e na tabela.
- Ao salvar, envia `"N minutes"` para a coluna `interval`, evitando o erro de segundos.
- Verifica erros e quantidade de linhas retornadas de INSERT, UPDATE e DELETE, sem declarar sucesso falso.
- `admin/paginas/servicos.html`: duração obrigatória entre 1 e 240 minutos.
- Nenhum RLS, login ou função RPC foi alterado.

## Instalação recomendada
1. Faça backup da versão GitHub Pages e do banco.
2. Teste o ZIP usando o Preview do VS Code com login administrativo.
3. No formulário administrativo de serviços, abra um serviço de 60 minutos: o campo deverá exibir **60**, não `01:00:00`.
4. Salve sem alterar o tempo e confirme com o SQL `SELECT id, servico, duracao FROM public.servicos WHERE id = 3;` que permaneceu `01:00:00`.
5. Teste um serviço de demonstração criado com duração de 45 minutos e verifique a gravação, preferencialmente em ambiente de teste. Evite exclusões de serviços vinculados à agenda.

## Conflitos na agenda: duas etapas
1. Execute `sql/07_diagnostico_reservas_somente_leitura.sql`. Se houver linhas, NÃO execute 08: resolva antes os agendamentos inconsistentes.
2. Apenas se o diagnóstico retornar **zero linhas em AMBAS as consultas**, se o seu salão opera **um atendimento de cada vez**, e após backup, execute `sql/08_proteger_conflitos_APENAS_APOS_DIAGNOSTICO.sql`.

O banco então recusará qualquer INSERT/UPDATE de reservas sobrepostas, inclusive pelo painel administrativo e em acessos simultâneos. Se desejar múltiplos profissionais em paralelo, uma restrição por profissional exige `profissional_id` obrigatório e reserva pública associada a profissional; NÃO use a regra global sem decidir isso.

## Auditoria final sugerida
- Janela anônima: entrar em `admin/index.html` redireciona para login.
- Com chave anônima: SELECT, UPDATE e DELETE em `clientes` e `agendamentos` não devem funcionar.
- Cadastro pela RPC pública deve funcionar com dados fictícios.
- Agendamento pela RPC deve criar registro visível no painel.
- Repetir o mesmo intervalo deve ser recusado (não teste inserções simultâneas de carga em produção).
- Conferir permissões de RPCs, views, Storage e limites de requisições. Token de cadastro local não substitui autenticação real.
