# Correção da interface de agendamentos — etapa de diagnóstico

## O que foi corrigido
- O cadastro identificado é reutilizado na mesma aba, via `sessionStorage.salao_cliente_demo`.
- O botão de novo cadastro é opcional, não exige cadastrar-se outra vez.
- A mensagem genérica foi substituída por mensagens específicas de serviço, data, horário e pagamento.
- Quando a função `horarios_publicos` retornar `[]`, a interface informa que se deve tentar outra data ou serviço.
- Evita respostas antigas de disponibilidade sobrescreverem as mais recentes.
- Mantidos o dashboard, o banco, RLS e as funções RPC existentes.

## Como testar
1. Faça cópia do projeto anterior.
2. Extraia este ZIP e abra a pasta no VS Code com um servidor HTTP (Preview/Live Server).
3. Abra a ficha pública, cadastre um identificador fictício novo (se necessário), e navegue até Agendamentos **na mesma aba**.
4. A ficha do cliente deve aparecer e o botão deve dizer 'Cadastrar outro cliente'.
5. Selecione um serviço e uma data futura. Se não houver horários, experimente o dia seguinte e outro serviço.
6. Se continuar sem horários, execute somente o SQL `sql/04_diagnostico_horarios_somente_leitura.sql`, substituindo a data do exemplo pela data testada.

## Por que o botão de confirmar falhava?
O código anterior usava um único aviso para falta de sessão, serviço, data ou horário. A imagem mostrava o cliente já identificado, mas zero horários. Sem selecionar um horário, a confirmação deve ser bloqueada. Isso não significa que precise se cadastrar novamente.

## Atenção
Esta atualização **não altera a função SQL de horários**. Se o RPC retornar zero vagas por duração, expediente, data ou ocupação, o problema deve ser investigado com o diagnóstico. Evite editar a duração dos serviços ou as políticas de acesso sem confirmar o resultado.
Não publique tokens de cadastro, CPF ou chaves secretas em capturas e mensagens.
