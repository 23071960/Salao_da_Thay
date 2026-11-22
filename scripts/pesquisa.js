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

    // Cadastro público: não consultar registros de clientes por CPF.
    // Um identificador repetido deve ser tratado pela função SQL, sem revelar dados alheios.
    let clienteExistente = null;
    if (cpfInput && cpfStatusDiv) cpfInput.addEventListener('blur', () => {
        const cpf = cpfInput.value.replace(/\D/g, '');
        cpfStatusDiv.textContent = cpf && cpf.length !== 11 ? 'Informe 11 dígitos fictícios.' : 'Use apenas dados fictícios; não há busca pública de clientes.';
    });

    function obterDadosFormulario() {
    if (!formCliente) return null;

    const getRadioValue = (name) => {
        const selected = formCliente.querySelector(`input[name="${name}"]:checked`);
        return selected ? selected.value : null;
    };

    const getCheckboxValues = (name) => {
        const checkboxes = formCliente.querySelectorAll(`input[name="${name}"]:checked`);
        return Array.from(checkboxes).map(cb => cb.value).join(', ');
    };

    const getRangeValue = (name) => {
        const range = formCliente.querySelector(`input[name="${name}"]`);
        return range ? parseInt(range.value) : null;
    };

    return {
        nome: formCliente.querySelector('input[name="nome"]')?.value.trim(),
        cpf: cpfInput?.value.replace(/\D/g, '') || null,
        endereco: formCliente.querySelector('input[name="endereco"]')?.value.trim(),
        telefone: telefoneInput?.value.replace(/\D/g, ''),
        nascimento: formatarDataParaISO(dataNascInput?.value.trim()),
        tipo_cabelo: getRadioValue('tipo_cabelo'),
        estado_cabelo: formCliente.querySelector('select[name="estado_cabelo"]')?.value,
        mudar_cor: getRadioValue('mudar_cor'),
        oleosidade: formCliente.querySelector('select[name="oleosidade"]')?.value,
        textura: formCliente.querySelector('select[name="textura"]')?.value,
        procedimento: formCliente.querySelector('select[name="procedimento"]')?.value,
        aparencia: getRangeValue('aparencia'),
        motivacao: getRadioValue('motivacao'),
        autoestima: getRangeValue('autoestima'),
        tempo_autocuidado: formCliente.querySelector('select[name="tempo_autocuidado"]')?.value,
        estilo: getCheckboxValues('estilo'),
        felicidade: formCliente.querySelector('select[name="felicidade"]')?.value,
        gostos: formCliente.querySelector('textarea[name="gostos"]')?.value.trim(),
        exercicios: formCliente.querySelector('select[name="exercicios"]')?.value,
        tem_filhos: getRadioValue('tem_filhos'),
        alergia: getRadioValue('alergia'),
        descricao_alergia: formCliente.querySelector('input[name="descricao_alergia"]')?.value.trim(),
        frequencia_salao: formCliente.querySelector('select[name="frequencia_salao"]')?.value,
        expectativa: formCliente.querySelector('textarea[name="expectativa"]')?.value.trim()
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
    const { data, error } = await window.supabase.rpc('cadastrar_cliente_ficticio', { p_dados: dados });
    if (error) throw error;
    sessionStorage.setItem('salao_cliente_demo', JSON.stringify(data));
    return { data: [data], error: null };
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
                    
                    alert('Cadastro fictício realizado com sucesso!');
                    
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