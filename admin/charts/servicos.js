async function carregarGraficoServicos() {
  try {
    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        servico_id,
        servico:servico_id(servico)
      `);

    if (error) throw error;

    if (!data || data.length === 0) {
      console.warn("Nenhum agendamento encontrado");
      return;
    }

    // Contagem dos serviços
    const contagemServicos = {};
    data.forEach(item => {
      const nomeServico = item.servico?.servico;
      if (nomeServico) {
        contagemServicos[nomeServico] = (contagemServicos[nomeServico] || 0) + 1;
      }
    });

    const labels = Object.keys(contagemServicos);
    const valores = Object.values(contagemServicos);

    if (labels.length === 0) {
      console.warn("Nenhum serviço para mostrar no gráfico");
      return;
    }

    // Cores dinâmicas para o gráfico
    const cores = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FFCD56', '#4BC0C0', '#36A2EB', '#FF6384'
    ];

    const ctx = document.getElementById('servicosChart')?.getContext('2d');
    if (!ctx) {
      console.error("Canvas 'servicosChart' não encontrado");
      return;
    }

    if (window.servicosChart instanceof Chart) {
      window.servicosChart.destroy();
    }

    window.servicosChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          label: 'Serviços Populares',
          data: valores,
          backgroundColor: cores.slice(0, labels.length),
          borderColor: cores.slice(0, labels.length),
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false // Esconde a legenda padrão do Chart.js
          }
        }
      }
    });

    // Preenchendo a legenda manualmente
    const legendContainer = document.getElementById('servicosLegend');
    legendContainer.innerHTML = '';

    labels.forEach((label, index) => {
      const legendItem = document.createElement('div');
      legendItem.classList.add('legend-item');
      legendItem.innerHTML = `
        <span class="legend-color" style="background-color: ${cores[index]}"></span>
        ${label} (${valores[index]})
      `;
      legendContainer.appendChild(legendItem);
    });

  } catch (err) {
    console.error("Erro ao carregar gráfico de serviços:", err.message);
  }
}
