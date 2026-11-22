// /charts/agendamentos.js
async function carregarGraficoAgendamentos() {
    try {
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

        const { data, error } = await supabase
            .from('agendamentos')
            .select('data_hora_inicio')
            .gte('data_hora_inicio', trintaDiasAtras.toISOString());

        if (error) throw error;

        const agendamentosPorDia = {};
        data.forEach((agendamento) => {
            const date = new Date(agendamento.data_hora_inicio);
            const dataFormatada = date.toLocaleDateString('pt-BR');
            agendamentosPorDia[dataFormatada] = (agendamentosPorDia[dataFormatada] || 0) + 1;
        });

        const labels = Object.keys(agendamentosPorDia).sort((a, b) => {
            const [da, ma, ya] = a.split('/').map(Number);
            const [db, mb, yb] = b.split('/').map(Number);
            return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
        });
        const valores = labels.map(label => agendamentosPorDia[label]);

        const ctx = document.getElementById('agendamentosChart').getContext('2d');

        if (window.agendamentosChart instanceof Chart) {
            window.agendamentosChart.destroy();
        }

        window.agendamentosChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Agendamentos por dia',
                    data: valores,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Agendamentos nos últimos 30 dias'
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    } catch (err) {
        console.error("Erro ao carregar gráfico de agendamentos:", err.message);
    }
}
