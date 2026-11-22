// charts/perfil_emocional.js - Versão Final

let perfilEmocionalChart = null;

async function carregarPerfilEmocional() {
    console.log("📊 Carregando perfil emocional dos clientes...");
    
    try {
        // 1. Configuração do canvas
        const canvas = document.getElementById('perfilEmocionalChart');
        if (!canvas) {
            console.error("❌ Canvas não encontrado");
            return;
        }
        
        // 2. Limpa gráfico existente
        if (perfilEmocionalChart) {
            perfilEmocionalChart.destroy();
        }

        // 3. Busca dados
        const { data, error } = await supabase
            .from('clientes')
            .select('felicidade, autoestima, motivacao');
            
        console.log("🔍 Dados brutos:", data); // DEBUG
        
        if (error) throw error;
        if (!data || data.length === 0) {
            console.warn("⚠️ Nenhum dado disponível");
            return;
        }

        // 4. Processamento robusto dos dados
        const medias = {
            Felicidade: calcularMedia(data, 'felicidade'),
            Autoestima: calcularMedia(data, 'autoestima'),
            Motivação: calcularMedia(data, 'motivacao')
        };
        
        console.log("📊 Médias calculadas:", medias);

        // 5. Criação do gráfico
        if (Object.values(medias).some(v => v > 0)) {
            criarGrafico(canvas, medias);
        } else {
            console.warn("⚠️ Valores zerados - verificando estrutura dos dados...");
            // Debug adicional
            data.forEach((cliente, i) => {
                console.log(`Cliente ${i+1}:`, {
                    felicidade: cliente.felicidade, 
                    autoestima: cliente.autoestima, 
                    motivacao: cliente.motivacao
                });
            });
        }

    } catch (error) {
        console.error("❌ Erro no perfil emocional:", error);
    }
}

function calcularMedia(data, campo) {
    // Extrai e filtra valores válidos
    const valoresValidos = data
        .map(item => {
            const valor = item[campo];
            
            // Caso especial para valores booleanos
            if (typeof valor === 'boolean') {
                return valor ? 1 : 0;
            }
            
            // Converte para número
            const num = Number(valor);
            
            // Verifica se é um número válido entre 0 e 10
            return isNaN(num) ? null : Math.min(Math.max(num, 0), 10);
        })
        .filter(valor => valor !== null);
    
    // Retorna 0 se não houver valores válidos
    if (valoresValidos.length === 0) return 0;
    
    // Calcula a média
    const soma = valoresValidos.reduce((a, b) => a + b, 0);
    return parseFloat((soma / valoresValidos.length).toFixed(1));
}

function criarGrafico(canvas, medias) {
    try {
        perfilEmocionalChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: Object.keys(medias),
                datasets: [{
                    label: 'Média (0-10)',
                    data: Object.values(medias),
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 159, 64, 0.7)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 10,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    } catch (error) {
        console.error("❌ Erro ao criar gráfico:", error);
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', carregarPerfilEmocional);