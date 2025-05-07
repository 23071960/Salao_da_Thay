document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verificar inicialização do Supabase
  if (!window.supabase) {
    console.error('Supabase não inicializado');
    alert('Sistema não está pronto. Recarregue a página.');
    return;
  }

  // 2. Recuperar e exibir dados do cliente
  const dadosCliente = JSON.parse(sessionStorage.getItem('dadosClienteParaAgendamento'));
  if (!dadosCliente || !dadosCliente.id) {
    alert('Dados do cliente não encontrados! Retorne ao formulário.');
    window.location.href = 'pesquisa.html';
    return;
  }

  // 3. Exibir dados do cliente na página
  exibirDadosCliente(dadosCliente);

  // 4. Configurar envio do formulário
  document.getElementById('form-agendamento').addEventListener('submit', async (e) => {
    e.preventDefault();
    await processarAgendamento(dadosCliente.id);
  });

  // 5. Carregar serviços disponíveis
  await carregarServicos();

  // Função para exibir dados do cliente
  function exibirDadosCliente(cliente) {
    const clienteInfoDiv = document.getElementById('cliente-info');
    if (clienteInfoDiv) {
      clienteInfoDiv.innerHTML = `
        <h3>Dados do Cliente</h3>
        <p><strong>Nome:</strong> ${cliente.nome}</p>
        <p><strong>Telefone:</strong> ${formatarTelefone(cliente.telefone)}</p>
      `;
    }

    // Alternativa: preencher campos ocultos no formulário
    document.getElementById('cliente_id').value = cliente.id;
  }

  // Função para formatar telefone
  function formatarTelefone(telefone) {
    if (!telefone) return '';
    const nums = telefone.replace(/\D/g, '');
    if (nums.length === 10) {
      return nums.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (nums.length === 11) {
      return nums.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $5-$6');
    }
    return telefone;
  }

  // Função para processar agendamento
  async function processarAgendamento(clienteId) {
    try {
      const servicoId = parseInt(document.getElementById('servico_id').value);
      if (isNaN(servicoId)) throw new Error('Selecione um serviço válido');

      const dataConsulta = document.getElementById('data_consulta').value;
      const horaInicio = document.getElementById('hora_inicio').value;
      if (!dataConsulta || !horaInicio) throw new Error('Data e hora são obrigatórias');

      const dados = {
        cliente_id: clienteId,
        servico_id: servicoId,
        data_consulta: dataConsulta,
        data_hora_inicio: new Date(`${dataConsulta}T${horaInicio}:00`).toISOString(),
        data_hora_fim: new Date(new Date(`${dataConsulta}T${horaInicio}:00`).getTime() + 3600000).toISOString(),
        valor_cobrado: parseFloat(document.getElementById('valor_cobrado').value) || 0,
        forma_pagamento: document.getElementById('forma_pagamento').value,
        observacoes: document.getElementById('observacoes').value,
        status: 'agendado',
        pago: false
      };

      const { error } = await supabase.from('agendamentos').insert(dados);
      if (error) throw error;

      sessionStorage.removeItem('dadosClienteParaAgendamento');
      window.location.href = 'confirmacao.html';
    } catch (error) {
      console.error('Erro no agendamento:', error);
      alert(`Erro: ${error.message}`);
    }
  }

  // Função para carregar serviços
  async function carregarServicos() {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('id, nome, valor')
        .order('nome');

      if (error) throw error;

      const select = document.getElementById('servico_id');
      if (select) {
        select.innerHTML = '<option value="">Selecione um serviço</option>' +
          data.map(s => `<option value="${s.id}" data-valor="${s.valor}">${s.nome} - R$ ${s.valor.toFixed(2)}</option>`).join('');
        
        // Atualizar valor quando selecionar serviço
        select.addEventListener('change', function() {
          const selectedOption = this.options[this.selectedIndex];
          if (selectedOption.value) {
            document.getElementById('valor_cobrado').value = selectedOption.getAttribute('data-valor');
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  }
});