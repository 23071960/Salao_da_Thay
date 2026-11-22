# Opção B — múltiplos profissionais sem sobreposição individual

## Antes de instalar

1. Faça backup do Supabase e teste numa cópia do banco, se possível.
2. Execute `sql/09B_PRE_VERIFICACAO.sql` e confira os números **e a lista de reservas sem profissional**. O diagnóstico anterior com zero conflitos globais NÃO garante que todas as reservas tenham profissional.
3. Se houver reservas ativas com `profissional_id IS NULL`, atribua manualmente o profissional correto pelo painel/SQL com base nos registros. **Não atribua um ID fixo a todos por suposição.** Reexecute o diagnóstico.
4. Exija: 0 reservas ativas sem profissional, 0 com fim inválido e 0 conflitos por mesmo profissional. Tenha ao menos um profissional ativo.
5. Execute `sql/10B_ATIVAR_REGRA_POR_PROFISSIONAL.sql`. Se falhar, **não publique a nova interface**: a transação faz rollback.
6. Confirme a criação da restrição e teste no Preview com os novos arquivos `paginas/agendamentos.html` e `scripts/agendamento.js`.

## Mudanças

- Catálogo público de profissionais ativos (somente `id` e `pnome`).
- RPC `horarios_publicos(p_servico_id, p_data, p_profissional_id)` considera apenas a agenda do profissional escolhido.
- RPC `agendar_ficticio(p_token, p_servico_id, p_data, p_hora, p_profissional_id, p_pagamento, p_observacoes)` grava `profissional_id`.
- Restrição `EXCLUDE USING gist` evita sobreposição de intervalos de reservas não canceladas para o **mesmo** profissional, inclusive sob concorrência. Profissionais diferentes podem atender ao mesmo tempo.
- Permissões de EXECUTE das assinaturas antigas (sem profissional) são revogadas de `anon` e `authenticated`.
- Reservas ativas sem profissional ou sem fim válido são recusadas no banco.

## Testes

1. Selecione serviço, profissional e data. Os cartões de horários devem aparecer.
2. Registre uma reserva e confirme no administrativo que `profissional_id` foi preenchido.
3. Com o mesmo profissional, tente reservar a mesma janela de tempo; deve falhar.
4. Com outro profissional ativo, reserve o mesmo horário; deve funcionar se não houver outros conflitos.
5. Faça novo teste de acesso direto com papel `anon`: SELECT/UPDATE/DELETE nas tabelas devem permanecer negados.
6. Teste atualização/cancelamento pelo painel administrativo: a constraint vale para o admin também.

**Atenção:** o código existente utiliza token de cadastro como credencial de portador de 14 dias. Essa etapa implementa a regra B, não resolve todos os riscos de abuso; antes de divulgação ampla ainda é necessário rate limit e desafio anti-bot no servidor. Não insira chave secreta no GitHub Pages.
