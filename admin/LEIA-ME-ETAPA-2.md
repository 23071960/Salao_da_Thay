# Salão da Thay — etapa 2 (pacote de testes)

**O que foi ajustado**: CSS originais restaurados (fornecidos posteriormente) em `estilos/`, preservando cores, componentes e responsividade; caminhos CSS absolutos convertidos para relativos nas páginas internas; funções de gráficos duplicadas removidas de `charts/metricas.js` (utiliza as versões especializadas de `agendamentos.js`, `servicos.js`, `perfil_emocional.js`); correção na ordenação das datas no gráfico. Autenticação administrativa e acesso ao Supabase permanecem com a versão testada.

**CSS original**: agora a pasta `estilos/` contém os arquivos reais fornecidos. Foram aplicados pequenos ajustes para evitar conflito de altura dos gráficos e melhorar telas estreitas. Ainda requer teste visual no navegador.

**NÃO execute** `sql/01_autorizacao_dashboard.sql` de novo sem necessidade; ele já foi aplicado na configuração anterior. O arquivo `sql/02_diagnostico_publico_somente_leitura.sql` só consulta estrutura.

**Cadastro público**: não foi ativado, pois não recebemos HTML/JS da página pública nem esquema completo das tabelas. Alterar permissões cegamente arriscaria a segurança já obtida. Veja PUBLICO-README.md.

**Deploy**: copie a estrutura completa preservando as subpastas para um branch de teste no GitHub Pages. Confirme CSS e testes, então faça o merge.
