document.addEventListener('DOMContentLoaded', async () => {
    console.log("🔄 Iniciando carregamento dos dados...");

    try {
        // Primeiro carrega as métricas principais
        await carregarMetricasPrincipais();
        
        // Depois carrega os gráficos
        await carregarGraficoAgendamentos();
        await carregarGraficoServicos();
        await carregarPerfilEmocional();
        
        console.log("✅ Todos os dados foram carregados com sucesso!");
    } catch (error) {
        console.error("❌ Erro ao carregar os dados:", error.message);
    }
});

// =================== MÉTRICAS PRINCIPAIS ===================
async function carregarMetricasPrincipais() {
    console.log("📊 Carregando métricas principais...");
    
    try {
        // 1. Clientes Hoje
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const { data: clientesData, error: clientesError } = await window.supabase
            .from('clientes')
            .select('*', { count: 'exact' })
            .gte('data_cadastro', hoje.toISOString());
        
        if (clientesError) throw clientesError;
        document.getElementById('clientesHoje').textContent = clientesData.length || 0;
        console.log(`👥 Clientes hoje: ${clientesData.length}`);

        // 2. Agendamentos Hoje
        const { data: agendamentosData, error: agendamentosError } = await window.supabase
            .from('agendamentos')
            .select('*', { count: 'exact' })
            .gte('data_consulta', hoje.toISOString())
            .lte('data_consulta', new Date(hoje.getTime() + 86400000).toISOString());
        
        if (agendamentosError) throw agendamentosError;
        document.getElementById('totalAgendamentos').textContent = agendamentosData.length || 0;
        console.log(`📅 Agendamentos hoje: ${agendamentosData.length}`);

        // 3. Faturamento Mensal (com campo valor_cobrado e pago como booleano)
        try {
            const dataAtual = new Date();
            const primeiroDiaMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
            const ultimoDiaMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0);
            
            console.log("📅 Período do mês:", primeiroDiaMes.toISOString(), "até", ultimoDiaMes.toISOString());
            
            const { data: faturamentoData, error: faturamentoError } = await window.supabase
                .from('agendamentos')
                .select('valor_cobrado')
                .eq('pago', true) // pago é booleano (true/false)
                .gte('data_consulta', primeiroDiaMes.toISOString())
                .lte('data_consulta', ultimoDiaMes.toISOString());
            
            console.log("💰 Dados de faturamento:", faturamentoData);
            
            if (faturamentoError) throw faturamentoError;
            
            const faturamentoTotal = faturamentoData.reduce((sum, item) => {
                const valor = parseFloat(item.valor_cobrado) || 0;
                return sum + valor;
            }, 0);
            
            console.log("💰 Total calculado:", faturamentoTotal);
            
            document.getElementById('faturamentoMensal').textContent = 
                `R$ ${faturamentoTotal.toFixed(2).replace('.', ',')}`;
            
        } catch (e) {
            console.error("⚠️ Erro ao carregar faturamento mensal:", e);
            document.getElementById('faturamentoMensal').textContent = "R$ 0,00";
        }

        // 4. Avaliação Média (como não tem tabela, vamos definir como 0)
        document.getElementById('avaliacaoMedia').textContent = "0.0";
        console.log("⭐ Avaliação média: 0.0 (tabela não implementada)");

    } catch (error) {
        console.error("❌ Erro ao carregar métricas principais:", error);
        throw error;
    }
}

