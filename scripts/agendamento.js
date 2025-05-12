document.addEventListener('DOMContentLoaded', async () => {
  // 1. CONFIGURAÇÃO INICIAL
  if (!window.supabase) {
    console.error('Supabase não está disponível');
    alert('Erro de conexão com o banco de dados. Recarregue a página.');
    return;
  }

  // 2. CARREGAMENTO DE DADOS DO CLIENTE
  let dadosCliente = await carregarDadosCliente();
  if (!dadosCliente) {
    alert('Dados do cliente não encontrados! Retorne ao formulário de pesquisa.');
    window.location.href = 'pesquisa.html';
    return;
  }

  // 3. EXIBIÇÃO DOS DADOS DO CLIENTE
  exibirDadosCliente(dadosCliente);

  // 4. CARREGAMENTO DE SERVIÇOS
  await carregarServicos();

  // 5. CONFIGURAÇÃO DE EVENTOS
  configurarEventos(dadosCliente);

  // FUNÇÕES PRINCIPAIS
  async function carregarDadosCliente() {
    try {
      // Primeiro tenta pegar da sessionStorage
      let dados = JSON.parse(sessionStorage.getItem('dadosClienteParaAgendamento'));
      console.log('Dados da sessionStorage:', dados);
      
      // Se não encontrou na sessionStorage, tenta pegar da URL
      if (!dados?.id) {
        const urlParams = new URLSearchParams(window.location.search);
        const clienteId = urlParams.get('cliente_id');
        console.log('ID do cliente da URL:', clienteId);
        
        if (clienteId) {
          const { data, error } = await supabase
            .from('clientes')
            .select('id, nome, telefone')
            .eq('id', clienteId)
            .single();
            
          if (error) throw error;
          dados = data;
          console.log('Dados do Supabase:', dados);
        }
      }
      
      // Se ainda não tem dados válidos, retorna null (será tratado no fluxo principal)
      if (!dados?.id) {
        console.log('Nenhum dado válido encontrado');
        return null;
      }
      
      return dados;
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
      return null;
    }
  }

  function exibirDadosCliente(cliente) {
    const dadosClienteContainer = document.querySelector('.dados-cliente');
    if (!dadosClienteContainer) {
      console.error('Container de dados do cliente não encontrado');
      return;
    }

    const clienteNome = document.getElementById('cliente-nome');
    const clienteTelefone = document.getElementById('cliente-telefone');
    
    if (clienteNome) {
      clienteNome.textContent = cliente.nome || 'Não informado';
    } else {
      console.error('Elemento cliente-nome não encontrado');
    }
    
    if (clienteTelefone) {
      clienteTelefone.textContent = formatarTelefone(cliente.telefone);
    } else {
      console.error('Elemento cliente-telefone não encontrado');
    }
    
    // Adiciona botão para novo cliente (se não existir)
    if (!document.querySelector('.btn-novo-cliente')) {
      const btnNovoCliente = document.createElement('button');
      btnNovoCliente.textContent = 'Cadastrar Novo Cliente';
      btnNovoCliente.className = 'btn-novo-cliente';
      btnNovoCliente.onclick = () => {
        sessionStorage.removeItem('dadosClienteParaAgendamento');
        window.location.href = 'pesquisa.html';
      };
      dadosClienteContainer.appendChild(btnNovoCliente);
    }
  }

  function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  async function carregarServicos() {
    try {
      const servicosContainer = document.getElementById('servico_id');
      if (!servicosContainer) {
        console.error('Elemento de serviços não encontrado');
        return;
      }

      servicosContainer.innerHTML = '<option value="" disabled selected>Carregando serviços...</option>';
      
      const { data: servicos, error } = await supabase
        .from('servicos')
        .select('*')
        .order('servico', { ascending: true });

      if (error) throw error;

      servicosContainer.innerHTML = '<option value="" disabled selected>Selecione um serviço</option>';
      
      servicos.forEach(servico => {
        const option = document.createElement('option');
        option.value = servico.id;
        option.textContent = `${servico.servico} - ${formatarMoeda(servico.valor)}`;
        option.dataset.valor = servico.valor;
        option.dataset.duracao = servico.duracao_minutos || 60;
        servicosContainer.appendChild(option);
      });

      servicosContainer.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const valorInput = document.getElementById('valor_cobrado');
        
        if (valorInput && selectedOption.dataset.valor) {
          valorInput.value = formatarMoeda(selectedOption.dataset.valor);
        }
      });

    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      const servicosContainer = document.getElementById('servico_id');
      if (servicosContainer) {
        servicosContainer.innerHTML = '<option value="" disabled selected>Erro ao carregar serviços</option>';
      }
      alert('Não foi possível carregar os serviços. Recarregue a página.');
    }
  }

  function configurarEventos(cliente) {
    const dataConsulta = document.getElementById('data_consulta');
    if (dataConsulta) {
      dataConsulta.addEventListener('change', async function() {
        if (this.value) await carregarHorariosDisponiveis(this.value);
      });
    }

    const formAgendamento = document.getElementById('form-agendamento');
    if (formAgendamento) {
      formAgendamento.addEventListener('submit', async function(e) {
        e.preventDefault();
        await processarAgendamento(cliente);
      });
    }
  }

  function formatarTelefone(telefone) {
    if (!telefone) return 'Não informado';
    const nums = telefone.replace(/\D/g, '');
    if (nums.length === 10) {
      return nums.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (nums.length === 11) {
      return nums.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  }

  async function carregarHorariosDisponiveis(data) {
    try {
      const container = document.getElementById('horarios-disponiveis');
      const lista = document.getElementById('lista-horarios');
      
      if (!container || !lista) {
        console.error('Elementos de horários não encontrados');
        return;
      }

      container.style.display = 'none';
      lista.innerHTML = '<p>Carregando horários...</p>';

      const { data: agendamentos, error } = await supabase
        .from('agendamentos')
        .select('data_hora_inicio, data_hora_fim')
        .eq('data_consulta', data)
        .eq('status', 'agendado');

      if (error) throw error;

      const horariosDisponiveis = gerarHorariosDisponiveis(data, agendamentos);
      
      lista.innerHTML = '';
      if (horariosDisponiveis.length === 0) {
        lista.innerHTML = '<p>Nenhum horário disponível nesta data</p>';
      } else {
        horariosDisponiveis.forEach(horario => {
          const botao = document.createElement('button');
          botao.type = 'button';
          botao.className = 'horario-btn';
          botao.textContent = horario;
          botao.onclick = () => selecionarHorario(horario);
          lista.appendChild(botao);
        });
      }

      container.style.display = 'block';
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      const lista = document.getElementById('lista-horarios');
      if (lista) {
        lista.innerHTML = '<p>Erro ao carregar horários disponíveis</p>';
      }
    }
  }

  function selecionarHorario(horario) {
    const horaInicioInput = document.getElementById('hora_inicio');
    if (horaInicioInput) {
      horaInicioInput.value = horario;
    }
    
    document.querySelectorAll('.horario-btn').forEach(btn => {
      btn.classList.remove('selecionado');
    });
    
    event.target.classList.add('selecionado');
  }

  async function processarAgendamento(cliente) {
    const form = document.getElementById('form-agendamento');
    const submitBtn = form?.querySelector('button[type="submit"]');
    
    if (!form || !submitBtn) {
      console.error('Elementos do formulário não encontrados');
      return;
    }

    try {
      const servicoSelect = document.getElementById('servico_id');
      const selectedOption = servicoSelect?.options[servicoSelect.selectedIndex];
      
      if (!servicoSelect?.value) throw new Error('Selecione um serviço');
      if (!form.data_consulta?.value) throw new Error('Selecione uma data');
      if (!form.hora_inicio?.value) throw new Error('Selecione um horário');

      submitBtn.disabled = true;
      submitBtn.textContent = 'Agendando...';

      const duracaoMinutos = parseInt(selectedOption?.dataset.duracao) || 60;
      const dataHoraInicio = new Date(`${form.data_consulta.value}T${form.hora_inicio.value}`);
      const dataHoraFim = new Date(dataHoraInicio.getTime() + duracaoMinutos * 60000);

      const valorNumerico = parseFloat(selectedOption?.dataset.valor || 0);

      const agendamentoData = {
        cliente_id: cliente.id,
        servico_id: servicoSelect.value,
        data_consulta: form.data_consulta.value,
        data_hora_inicio: dataHoraInicio.toISOString(),
        data_hora_fim: dataHoraFim.toISOString(),
        valor_cobrado: valorNumerico,
        forma_pagamento: form.forma_pagamento?.value || 'Não especificado',
        observacoes: form.observacoes?.value || null,
        status: 'agendado'
      };

      const { data, error } = await supabase
        .from('agendamentos')
        .insert([agendamentoData])
        .select();

      if (error) throw error;

      sessionStorage.setItem('ultimoAgendamento', JSON.stringify({
        ...data[0],
        cliente_nome: cliente.nome,
        cliente_telefone: cliente.telefone,
        servico_nome: selectedOption.textContent.split(' - ')[0],
        valor_formatado: formatarMoeda(valorNumerico)
      }));
      
      window.location.href = 'confirmacao.html';

    } catch (error) {
      console.error('Erro no agendamento:', error);
      alert(`Erro: ${error.message}`);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirmar Agendamento';
      }
    }
  }

  function gerarHorariosDisponiveis(data, agendamentos) {
    const horarioAbertura = 8;
    const horarioFechamento = 18;
    
    const horariosOcupados = agendamentos.map(ag => {
      const date = new Date(ag.data_hora_inicio);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    });
    
    const todosHorarios = [];
    for (let hora = horarioAbertura; hora < horarioFechamento; hora++) {
      todosHorarios.push(`${hora.toString().padStart(2, '0')}:00`);
    }
    
    return todosHorarios.filter(horario => !horariosOcupados.includes(horario));
  }
});