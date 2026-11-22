# Ajustes de agendamento público e caixas de seleção

## O que mudou
- `styles/dark-theme.css`: fundo de seta SVG passa a ter `background-repeat: no-repeat`, posição e tamanho definidos.
- `styles/agendamentos.css` e `styles/pesquisa.css`: ajustes de seleção, tamanho da seta e espaço para o texto.
- `paginas/agendamentos.html`: confirmação com painel de resultado abaixo do botão, e validação em JS (novalidate) para impedir que o navegador bloqueie silenciosamente o evento `submit`.
- `scripts/agendamento.js`: avisos no topo e abaixo do botão, logs de envio e resposta no console, e validação por campo.

## Testar
1. Abra a aplicação no Preview do VS Code; recarregue com Ctrl+Shift+R.
2. Escolha um cliente fictício já cadastrado, serviço, data, horário e pagamento.
3. Clique em Confirmar Agendamento. O aviso deve aparecer imediatamente, inclusive quando falta algum campo.
4. Veja F12 > Console: deve aparecer `[Agendamento público] Tentativa de confirmação recebida`.
5. Se surgir erro, copie a mensagem integral. Não repita o envio sem conferir a tabela de agendamentos.

## Banco de dados
O script existente interpretava `duracao::text::interval` quando `servicos.duracao` é um inteiro em **minutos**. Isso não interpreta corretamente 60 como 60 minutos. O arquivo `sql/05_corrigir_duracao_agendamento.sql` substitui o cálculo por `make_interval(mins => duracao)` em `horarios_publicos` e `agendar_ficticio`, preservando as validações e permissões. Faça backup e verifique o conteúdo antes de aplicar no SQL Editor. Não é necessário desativar RLS.

Não foram testadas requisições no seu banco real. O pacote é para validação local antes de publicar.
