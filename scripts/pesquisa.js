document.addEventListener('DOMContentLoaded', function() {
    // 1. VERIFICAÇÃO INICIAL
    if (!window.supabase) {
        console.error('Supabase não está disponível');
        alert('Erro de configuração. Recarregue a página.');
        return;
    }

    // 2. ELEMENTOS DO FORMULÁRIO
    const formCliente = document.getElementById('form-cliente');
    const btnAgendar = document.getElementById('btn-agendar');
    const telefoneInput = document.getElementById('agendamento-telefone');
    const dataNascInput = document.getElementById('agendamento-data-nascimento');
    const cpfInput = document.getElementById('agendamento-cpf');
    const cpfStatusDiv = document.getElementById('cpf-status');

    // 3. MÁSCARAS DOS CAMPOS
    if (cpfInput) {
        IMask(cpfInput, { mask: '000.000.000-00' });
    }
    IMask(telefoneInput, { mask: '(00) 00000-0000' });
    IMask(dataNascInput, { mask: '00/00/0000' });

    // 4. VARIÁVEL PARA ARMAZENAR DADOS DO CLIENTE EXISTENTE
    let clienteExistente = null;

    // 5. FUNÇÃO PARA VERIFICAR CPF
    async function verificarCPF(cpf) {
        if (cpf.length !== 11) return null;
        
        try {
            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .eq('cpf', cpf)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Erro ao verificar CPF:', error);
            return null;
        }
    }

    // 6. EVENTO DE BLUR NO CPF
    cpfInput.addEventListener('blur', async function() {
        const cpf = cpfInput.value.replace(/\D/g, '');
        cpfStatusDiv.textContent = 'Verificando CPF...';
        cpfStatusDiv.style.color = '#666';

        if (cpf.length === 11) {
            clienteExistente = await verificarCPF(cpf);
            
            if (clienteExistente) {
                cpfStatusDiv.textContent = 'Cliente já cadastrado. Você pode atualizar os dados ou prosseguir para agendamento.';
                cpfStatusDiv.style.color = 'green';
                preencherDadosCliente(clienteExistente);
            } else {
                cpfStatusDiv.textContent = 'CPF não cadastrado. Preencha os dados para novo cadastro.';
                cpfStatusDiv.style.color = '#666';
            }
        } else if (cpf.length > 0) {
            cpfStatusDiv.textContent = 'CPF incompleto. Digite os 11 dígitos.';
            cpfStatusDiv.style.color = 'orange';
        } else {
            cpfStatusDiv.textContent = '';
        }
    });

    // 7. FUNÇÃO PARA PREENCHER DADOS DO CLIENTE
    function preencherDadosCliente(cliente) {
        formCliente.querySelector('input[name="nome"]').value = cliente.nome || '';
        formCliente.querySelector('input[name="endereco"]').value = cliente.endereco || '';
        telefoneInput.value = cliente.telefone || '';
        
        if (cliente.nascimento) {
            const [ano, mes, dia] = cliente.nascimento.split('-');
            dataNascInput.value = `${dia}/${mes}/${ano}`;
        }
        
        if (cliente.tipo_cabelo) {
            const radio = formCliente.querySelector(`input[name="tipo_cabelo"][value="${cliente.tipo_cabelo}"]`);
            if (radio) radio.checked = true;
        }
        
        if (cliente.estado_cabelo) {
            formCliente.querySelector('select[name="estado_cabelo"]').value = cliente.estado_cabelo;
        }
    }

    // 8. FUNÇÃO PARA OBTER DADOS DO FORMULÁRIO
    function obterDadosFormulario() {
        return {
            nome: formCliente.querySelector('input[name="nome"]').value.trim(),
            cpf: cpfInput.value.replace(/\D/g, '') || null,
            endereco: formCliente.querySelector('input[name="endereco"]').value.trim(),
            telefone: telefoneInput.value.replace(/\D/g, ''),
            nascimento: formatarDataParaISO(dataNascInput.value.trim()),
            tipo_cabelo: formCliente.querySelector('input[name="tipo_cabelo"]:checked')?.value,
            estado_cabelo: formCliente.querySelector('select[name="estado_cabelo"]').value,
            // ... outros campos
        };
    }

    // 9. FUNÇÃO PARA FORMATAR DATA
    function formatarDataParaISO(dataString) {
        if (!dataString) return null;
        const partes = dataString.split('/');
        if (partes.length === 3) {
            return `${partes[2]}-${partes[1]}-${partes[0]}`;
        }
        return null;
    }

    // 10. FUNÇÃO PARA SALVAR CLIENTE
    async function salvarCliente(dados) {
        try {
            // Se cliente já existe, retorna os dados existentes
            if (clienteExistente) {
                return { data: [clienteExistente], error: null };
            }
            
            // Se não existe, cria novo cadastro
            const { data, error } = await supabase
                .from('clientes')
                .insert([dados])
                .select();

            if (error) throw error;
            return { data, error };
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            throw error;
        }
    }

    // 11. EVENTO DE SUBMIT DO FORMULÁRIO
    formCliente.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const dados = obterDadosFormulario();
        const submitBtn = formCliente.querySelector('[type="submit"]');
        
        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Salvando...';
            
            const { data } = await salvarCliente(dados);
            
            if (data && data[0]) {
                sessionStorage.setItem('dadosClienteParaAgendamento', JSON.stringify({
                    id: data[0].id,
                    nome: data[0].nome,
                    telefone: data[0].telefone
                }));
                
                alert(clienteExistente 
                    ? 'Dados atualizados com sucesso!' 
                    : 'Cliente cadastrado com sucesso!');
                
                if (document.getElementById('agendamento-realizado').value === 'true') {
                    window.location.href = '../paginas/agendamentos.html';
                } else {
                    formCliente.reset();
                }
            }
        } catch (error) {
            alert(`Erro: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar';
        }
    });

    // 12. EVENTO DE AGENDAMENTO
    btnAgendar.addEventListener('click', async function(e) {
        e.preventDefault();
        document.getElementById('agendamento-realizado').value = 'true';
        formCliente.dispatchEvent(new Event('submit'));
    });
});;