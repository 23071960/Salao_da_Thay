// ==========================
// 🚀 Gráfico de Serviços Populares
// ==========================
async function carregarGraficoServicos() {
    try {
        const { data, error } = await supabase
            .from('agendamentos')
            .select('id, servico_id');

        if (error) throw error;

        if (data.length === 0) {
            console.warn('Nenhum serviço encontrado nos agendamentos.');
            return;
        }

        // Consulta os nomes dos serviços
        const servicoIds = data.map(item => item.servico_id);
        const { data: servicosData, error: servicosError } = await supabase
            .from('servicos')
            .select('id, nome')
            .in('id', servicoIds);

        if (servicosError) throw servicosError;

        // Mapeia os nomes dos serviços e conta a frequência
        const servicosContagem = {};
        data.forEach((agendamento) => {
            const servico = servicosData.find(s => s.id === agendamento.servico_id);
            if (servico) {
                servicosContagem[servico.nome] = (servicosContagem[servico.nome] || 0) + 1;
            }
        });

        // Ordena por popularidade e pega os top 5
        const servicosOrdenados = Object.entries(servicosContagem)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const labels = servicosOrdenados.map(item => item[0]);
        const valores = servicosOrdenados.map(item => item[1]);

        const ctx = document.getElementById('servicosChart').getContext('2d');

        if (window.servicosChart instanceof Chart) {
            window.servicosChart.destroy();
        }

        window.servicosChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    label: 'Serviços Populares',
                    data: valores,
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Top 5 Serviços Mais Agendados'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } catch (err) {
        console.error('Erro ao carregar gráfico de serviços:', err.message);
    }
}
