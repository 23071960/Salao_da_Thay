document.addEventListener('DOMContentLoaded', function() {
    // 1. VERIFICAÇÃO INICIAL DO SUPABASE
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
    if (telefoneInput) {
        IMask(telefoneInput, { mask: '(00) 00000-0000' });
    }
    if (dataNascInput) {
        IMask(dataNascInput, { mask: '00/00/0000' });
    }

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
    if (cpfInput && cpfStatusDiv) {
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
    }

    // 7. FUNÇÃO PARA PREENCHER DADOS DO CLIENTE
    function preencherDadosCliente(cliente) {
        if (!cliente || !formCliente) return;

        const campos = {
            nome: formCliente.querySelector('input[name="nome"]'),
            endereco: formCliente.querySelector('input[name="endereco"]'),
            estado_cabelo: formCliente.querySelector('select[name="estado_cabelo"]')
        };

        if (campos.nome) campos.nome.value = cliente.nome || '';
        if (campos.endereco) campos.endereco.value = cliente.endereco || '';
        if (telefoneInput) telefoneInput.value = cliente.telefone || '';
        
        if (cliente.nascimento && dataNascInput) {
            const [ano, mes, dia] = cliente.nascimento.split('-');
            dataNascInput.value = `${dia}/${mes}/${ano}`;
        }
        
        if (cliente.tipo_cabelo) {
            const radio = formCliente.querySelector(`input[name="tipo_cabelo"][value="${cliente.tipo_cabelo}"]`);
            if (radio) radio.checked = true;
        }
        
        if (campos.estado_cabelo && cliente.estado_cabelo) {
            campos.estado_cabelo.value = cliente.estado_cabelo;
        }
    }

    // 8. FUNÇÃO PARA OBTER DADOS DO FORMULÁRIO
    function obterDadosFormulario() {
        if (!formCliente) return null;

        return {
            nome: formCliente.querySelector('input[name="nome"]')?.value.trim(),
            cpf: cpfInput?.value.replace(/\D/g, '') || null,
            endereco: formCliente.querySelector('input[name="endereco"]')?.value.trim(),
            telefone: telefoneInput?.value.replace(/\D/g, ''),
            nascimento: formatarDataParaISO(dataNascInput?.value.trim()),
            tipo_cabelo: formCliente.querySelector('input[name="tipo_cabelo"]:checked')?.value,
            estado_cabelo: formCliente.querySelector('select[name="estado_cabelo"]')?.value,
            // ... outros campos conforme necessário
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
        if (!dados) return { data: null, error: new Error('Dados inválidos') };
        
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
    if (formCliente) {
        formCliente.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const dados = obterDadosFormulario();
            const submitBtn = formCliente.querySelector('[type="submit"]');
            
            try {
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Salvando...';
                }
                
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
                    
                    if (document.getElementById('agendamento-realizado')?.value === 'true') {
                        window.location.href = '../paginas/agendamentos.html';
                    } else {
                        formCliente.reset();
                    }
                }
            } catch (error) {
                alert(`Erro: ${error.message}`);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Enviar';
                }
            }
        });
    }

    // 12. EVENTO DE AGENDAMENTO
    if (btnAgendar) {
        btnAgendar.addEventListener('click', async function(e) {
            e.preventDefault();
            const agendamentoRealizado = document.getElementById('agendamento-realizado');
            if (agendamentoRealizado) {
                agendamentoRealizado.value = 'true';
            }
            if (formCliente) {
                formCliente.dispatchEvent(new Event('submit'));
            }
        });
    }

    // 13. CONTROLE DO TEMA ESCURO - VERSÃO COMPLETA E SEGURA
    const themeToggle = document.getElementById('toggle-theme');
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    const darkThemeCSS = document.getElementById('dark-theme');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            if (darkThemeCSS) darkThemeCSS.disabled = false;
            if (themeIcon) themeIcon.textContent = '☀️';
            if (themeText) themeText.textContent = 'Modo Claro';
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            if (darkThemeCSS) darkThemeCSS.disabled = true;
            if (themeIcon) themeIcon.textContent = '🌙';
            if (themeText) themeText.textContent = 'Modo Escuro';
            localStorage.setItem('theme', 'light');
        }
    }

    // Verificar preferência inicial
    const currentTheme = localStorage.getItem('theme') || 
                        (prefersDarkScheme.matches ? 'dark' : 'light');
    applyTheme(currentTheme);

    // Configurar alternador de tema se existir na página
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' 
                            ? 'light' 
                            : 'dark';
            applyTheme(newTheme);
        });
    }

    // Verificação final de elementos
    console.log('Elementos verificados:', {
        formCliente,
        btnAgendar,
        themeToggle,
        darkThemeCSS
    });
});