document.addEventListener('DOMContentLoaded', function() {
    // Verifica se o Supabase está disponível
    if (!window.supabase) {
        console.error('Supabase não está disponível');
        alert('Erro de configuração. Recarregue a página.');
        return;
    }

    // Elementos do formulário com verificações
    const formCliente = document.getElementById('form-cliente');
    if (!formCliente) {
        console.error('Formulário não encontrado');
        return;
    }

    const btnAgendar = document.getElementById('btn-agendar');
    const telefoneInput = document.getElementById('agendamento-telefone');
    const dataNascInput = document.getElementById('agendamento-data-nascimento');

    // Verifica elementos críticos
    if (!btnAgendar || !telefoneInput || !dataNascInput) {
        console.error('Elementos do formulário não encontrados');
        return;
    }

    // Função para formatar a data no padrão ISO (YYYY-MM-DD)
    function formatarDataParaISO(dataString) {
        if (!dataString) return null;
        
        const partes = dataString.split('/');
        if (partes.length === 3) {
            return `${partes[2]}-${partes[1]}-${partes[0]}`; // YYYY-MM-DD
        }
        return null;
    }

    // Função para validar formulário
    function validarFormulario() {
        const nomeInput = formCliente.querySelector('input[name="nome"]');
        if (!nomeInput?.value.trim()) {
            alert('Por favor, preencha o nome completo.');
            return false;
        }
        
        const telefone = telefoneInput.value.replace(/\D/g, '');
        if (telefone.length < 11) {
            alert('Por favor, insira um telefone válido com DDD.');
            return false;
        }
        
        return true;
    }

    // Função para obter dados do formulário de forma segura
    function obterDadosFormulario() {
        const dados = {
            nome: formCliente.querySelector('input[name="nome"]')?.value.trim() || '',
            endereco: formCliente.querySelector('input[name="endereco"]')?.value.trim() || '',
            telefone: telefoneInput.value.trim(),
            nascimento: formatarDataParaISO(dataNascInput.value.trim()),
            tipo_cabelo: formCliente.querySelector('input[name="tipo_cabelo"]:checked')?.value,
            estado_cabelo: formCliente.querySelector('select[name="estado_cabelo"]')?.value,
            // Adicione outros campos conforme necessário
        };
        
        return dados;
    }

    // Função para enviar dados para o Supabase
    async function enviarDados(dados) {
        try {
            const { data, error } = await window.supabase
                .from('clientes')
                .insert([dados])
                .select(); // Adicionado .select() para retornar os dados inseridos
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao enviar dados:', error);
            throw error;
        }
    }

    // Evento do botão Agendar - CORRIGIDO para salvar em sessionStorage
    btnAgendar.addEventListener('click', async function(e) {
        e.preventDefault();
        
        if (!validarFormulario()) return;
        
        const dados = obterDadosFormulario();
        console.log('Dados a serem enviados:', dados);
        
        try {
            btnAgendar.disabled = true;
            btnAgendar.textContent = 'Salvando...';
            
            // Envia dados para o Supabase e recebe a resposta com o ID gerado
            const resultado = await enviarDados(dados);
            
            if (resultado && resultado[0]) {
                // Persiste os dados do cliente na sessionStorage
                sessionStorage.setItem('dadosClienteParaAgendamento', JSON.stringify({
                    id: resultado[0].id, // ID gerado pelo Supabase
                    nome: dados.nome,
                    telefone: dados.telefone,
                    // Outros campos relevantes para o agendamento
                }));
                
                // Redireciona para a página de agendamentos
                window.location.href = '../paginas/agendamentos.html';
            } else {
                throw new Error('Não foi possível obter o ID do cliente após o cadastro');
            }
        } catch (error) {
            alert(`Erro ao salvar: ${error.message}`);
        } finally {
            btnAgendar.disabled = false;
            btnAgendar.textContent = '📅 Salvar e Agendar';
        }
    });

    // Evento de submit do formulário
    formCliente.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validarFormulario()) return;
        
        const dados = obterDadosFormulario();
        const submitBtn = formCliente.querySelector('[type="submit"]');
        
        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Salvando...';
            
            await enviarDados(dados);
            alert('Dados salvos com sucesso!');
            formCliente.reset();
        } catch (error) {
            alert(`Erro ao salvar: ${error.message}`);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Enviar';
            }
        }
    });
});