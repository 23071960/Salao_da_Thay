# Página pública: integração ainda não ativada

Os arquivos enviados abrangem o DASHBOARD administrativo, não a página pública de clientes/agendamentos. Por segurança **não executamos GRANT INSERT TO anon**, não abrimos tabela `clientes` para SELECT e não criamos políticas `USING(true)` sobre dados pessoais.

Para liberar cadastro público sem expor os registros, a proposta é criar duas operações limitadas no servidor (Supabase Edge Functions ou RPC rigorosamente restrita): `cadastrar_cliente_teste` e `solicitar_agendamento_teste`. O servidor deve validar campos, serviços/profissionais, disponibilidade, período, limites e desafio anti-robô; nunca aceitar `pago`, `valor_cobrado`, `status`, `cliente_id` arbitrário ou IDs administrativos enviados pelo visitante sem validação. Recomenda-se manter os privilégios SELECT/UPDATE/DELETE de `anon` revogados.

Execute `sql/02_diagnostico_publico_somente_leitura.sql` e forneça o HTML e JavaScript da página pública. Sem a estrutura completa de colunas e restrições, publicar uma função de inserção seria inseguro ou falharia.
