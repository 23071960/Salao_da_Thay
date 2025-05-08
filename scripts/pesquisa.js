document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verificação Inicial
  if (!window.supabase) {
    console.error('Erro: Supabase não foi inicializado');
    alert('Sistema não está pronto. Recarregue a página.');
    return;
  }

  // 2. Aplicar máscaras
  aplicarMascaras();

  // 3. Restaurar pesquisa se voltou do agendamento
  const pesquisaSalva = sessionStorage.getItem('pesquisaParcial');
  if (pesquisaSalva) {
    const { dadosFormulario, ultimoCampo } = JSON.parse(pesquisaSalva);
    preencherFormulario(dadosFormulario);
    if (ultimoCampo) {
      const campo = document.getElementById(ultimoCampo);
      if (campo) campo.focus();
    }
    sessionStorage.removeItem('pesquisaParcial');
  }

  // 4. Configurar Eventos dos Botões
  document.getElementById('btn-salvar-continuar')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await salvarCliente(false); // false = não redirecionar para agendamento
  });

  document.getElementById('btn-agendar')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await salvarCliente(true); // true = redirecionar para agendamento
  });

  // Função para obter todos os dados do formulário
  function obterDadosFormulario() {
    const form = document.getElementById('form-cliente');
    const formData = new FormData(form);
    const dados = {};
    
    for (const [key, value] of formData.entries()) {
      // Para checkboxes/radios com mesmo name
      if (dados[key] !== undefined) {
        if (!Array.isArray(dados[key])) {
          dados[key] = [dados[key]];
        }
        dados[key].push(value);
      } else {
        dados[key] = value;
      }
    }
    
    return dados;
  }

  // Função para preencher o formulário com dados salvos
  function preencherFormulario(dados) {
    for (const [name, value] of Object.entries(dados)) {
      const elements = document.querySelectorAll(`[name="${name}"]`);
      
      elements.forEach(element => {
        if (element.type === 'checkbox' || element.type === 'radio') {
          if (Array.isArray(value)) {
            element.checked = value.includes(element.value);
          } else {
            element.checked = (element.value === value);
          }
        } else {
          element.value = value;
        }
      });
    }
  }

  // Função principal para salvar cliente
  async function salvarCliente(redirecionarParaAgendamento) {
    try {
      // 1. Obter e validar dados básicos
      const nome = document.querySelector('[name="nome"]')?.value.trim();
      const telefone = document.getElementById('agendamento-telefone')?.value;
      const telefoneNumeros = telefone?.replace(/\D/g, '') || '';

      if (!nome) throw new Error('Por favor, informe o nome completo');
      if (telefoneNumeros.length < 10 || telefoneNumeros.length > 11) {
        throw new Error('Informe um telefone válido com DDD (10 ou 11 dígitos)');
      }

      // 2. Obter todos os dados do formulário
      const dadosFormulario = obterDadosFormulario();
      
      // 3. Preparar dados para o Supabase
      const dadosCliente = {
        nome,
        telefone: telefoneNumeros,
        nascimento: dadosFormulario['agendamento-data-nascimento']?.split('/').reverse().join('-'),
        data_cadastro: new Date().toISOString(),
        //pesquisa_data: dadosFormulario // Salva todos os dados da pesquisa
      };

      // 4. Verificar se cliente já existe
      const { data: clienteExistente, error: erroBusca } = await supabase
        .from('clientes')
        .select('id, nome, telefone')
        .eq('telefone', telefoneNumeros)
        .maybeSingle();

      if (erroBusca) throw new Error('Erro ao verificar cliente existente');

      // 5. Salvar no Supabase
      let resultado;
      if (clienteExistente) {
        const { data, error } = await supabase
          .from('clientes')
          .update(dadosCliente)
          .eq('id', clienteExistente.id)
          .select()
          .single();
        
        if (error) throw error;
        resultado = data;
      } else {
        const { data, error } = await supabase
          .from('clientes')
          .insert(dadosCliente)
          .select()
          .single();
        
        if (error) throw error;
        resultado = data;
      }

      if (redirecionarParaAgendamento) {
        // 6. Salvar estado atual da pesquisa
        const activeElement = document.activeElement;
        sessionStorage.setItem('pesquisaParcial', JSON.stringify({
          dadosFormulario,
          ultimoCampo: activeElement?.id || null
        }));

        // 7. Redirecionar para agendamento
        sessionStorage.setItem('dadosClienteParaAgendamento', JSON.stringify({
          id: resultado.id,
          nome: resultado.nome,
          telefone: resultado.telefone,
          cliente_id: resultado.id
        }));

        window.location.href = 'agendamentos.html';
      } else {
        alert('Dados salvos com sucesso! Continue sua pesquisa.');
      }

    } catch (error) {
      console.error('Erro no processamento:', error);
      alert(error.message || 'Erro ao processar os dados');
    }
  }

  // Função para aplicar máscaras (mantida igual)
  function aplicarMascaras() {
    // ... (código existente da função aplicarMascaras)
  }
});