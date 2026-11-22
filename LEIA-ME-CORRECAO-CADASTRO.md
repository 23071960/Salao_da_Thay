# Correção dos cadastros públicos — etapa SQL RPC

1. Faça backup do banco e dos arquivos atuais.
2. No Supabase correto, abra SQL Editor e execute **sql/03_funcoes_publicas_seguras.sql**. Não execute os antigos scripts de concessão de acesso anônimo às tabelas.
3. Aguarde recarga de schema (já solicitada no SQL). Atualize a aplicação pelo Live Server/Preview.
4. Faça teste com CPF **fictício e novo** de 11 dígitos; o banco tem UNIQUE(cpf), portanto repetições não são permitidas.
5. Na ficha, salve; depois abra Agendamentos na mesma aba/origem. O código de cadastro é mantido em sessionStorage, não é uma conta de usuário.
6. Escolha serviço, data e horário e confirme. Teste em outra aba anônima que não há leitura direta de clientes nem agendamentos.

## Limitações deliberadas

- A busca pública por CPF e a edição de cliente por CPF/ID foram DESABILITADAS, pois revelavam dados alheios. Para editar um cadastro existente, use o painel administrativo.
- Os RPCs são públicos, limitam campos e ações, mas o controle de volume global não substitui CAPTCHA/Turnstile e rate limiting por IP; para publicação aberta e adversarial, adicione Edge Functions com proteção contra robôs.
- Como há apenas 1 profissional cadastrado, o cálculo de horários considera um único recurso (não permite agendamentos simultâneos, independentemente do serviço). Se houver mais profissionais, adaptar a função de disponibilidade e as regras de conflito.
- A verificação de conflito é serializada entre chamadas públicas, mas lançamentos administrativos feitos por outra conexão não participam do mesmo bloqueio. Para garantia forte sob concorrência, criar uma restrição de exclusão no PostgreSQL, após avaliar eventuais sobreposições existentes.
- O SQL não foi executado em seu Supabase; as páginas somente funcionarão após a instalação.
- O dashboard administrativo permanece sem alterações.
- Somente a tabela clientes aceita campos extras que realmente existem nela; `id`, `pago`, `status` e dados de controle não podem ser definidos pelo visitante.
- Este projeto destina-se a dados simulados: não utilize CPF, endereço ou dados de saúde reais.
