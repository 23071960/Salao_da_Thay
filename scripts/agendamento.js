// pesquisa.js
document.addEventListener('DOMContentLoaded', async () => {
  // Verifica se o Supabase está disponível
  if (!window.supabase) {
    console.error('Supabase não está disponível');
    alert('Erro de conexão com o banco de dados. Recarregue a página.');
    return;
  }

  // 1. Carrega dados do cliente da sessionStorage
  const dadosCliente = JSON.parse(sessionStorage.getItem('dadosClienteParaAgendamento'));
  
  if (!dadosCliente || !dadosCliente.id) {
    alert('Dados do cliente não encontrados! Retorne ao formulário de pesquisa.');
    window.location.href = 'pesquisa.html';
    return;
  }

  // 2. Exibe dados do cliente na página
  //document.getElementById('cliente-id').value = dadosCliente.id;
  document.getElementById('cliente-nome').textContent = dadosCliente.nome || 'Não informado';
  document.getElementById('cliente-telefone').textContent = dadosCliente.telefone;

  // 3. Carrega serviços do Supabase
  await carregarServicos();

  // 4. Configura eventos do formulário
  document.getElementById('data_consulta').addEventListener('change', async function() {
    if (this.value) await carregarHorariosDisponiveis(this.value);
  });

  document.getElementById('form-agendamento').addEventListener('submit', async function(e) {
    e.preventDefault();
    await processarAgendamento();
  });

  // Funções auxiliares
  function formatarTelefone(telefone) {
    if (!telefone) return 'Não informado';
    const nums = telefone.replace(/\D/g, '');
    if (nums.length === 10) {
      return nums.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (nums.length === 11) {
      return nums.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $5-$6');
    }
    return telefone;
  }

  async function carregarServicos() {
    try {
      const { data: servicos, error } = await supabase
        .from('servicos')
        .select('*')
        .order('servico', { ascending: true });

      if (error) throw error;

      const select = document.getElementById('servico_id');
      select.innerHTML = '<option value="">Selecione um serviço</option>';
      
      servicos.forEach(servico => {
        const option = new Option(
          `${servico.servico} - R$ ${servico.valor.toFixed(2)}`, 
          servico.id
        );
        option.dataset.valor = servico.valor;
        option.dataset.duracao = servico.duracao_minutos || 60;
        select.add(option);
      });

      select.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        document.getElementById('valor_cobrado').value = 
          selectedOption.value ? selectedOption.dataset.valor : '';
      });

    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      alert('Não foi possível carregar os serviços. Recarregue a página.');
    }
  }

  async function carregarHorariosDisponiveis(data) {
    try {
      const container = document.getElementById('horarios-disponiveis');
      const lista = document.getElementById('lista-horarios');
      
      container.style.display = 'none';
      lista.innerHTML = '<p>Carregando horários...</p>';

      // Consulta horários já agendados para esta data
      const { data: agendamentos, error } = await supabase
        .from('agendamentos')
        .select('data_hora_inicio, data_hora_fim')
        .eq('data_consulta', data);

      if (error) throw error;

      // Gera horários disponíveis (simplificado - implemente sua lógica real)
      const horariosDisponiveis = gerarHorariosDisponiveis(data, agendamentos);
      
      lista.innerHTML = '';
      if (horariosDisponiveis.length === 0) {
        lista.innerHTML = '<p>Nenhum horário disponível nesta data</p>';
        container.style.display = 'block';
        return;
      }

      horariosDisponiveis.forEach(horario => {
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'horario-btn';
        botao.textContent = horario;
        botao.onclick = () => selecionarHorario(horario);
        lista.appendChild(botao);
      });

      container.style.display = 'block';
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      alert('Erro ao carregar horários disponíveis.');
    }
  }

  function selecionarHorario(horario) {
    document.getElementById('hora_inicio').value = horario;
    document.querySelectorAll('.horario-btn').forEach(btn => {
      btn.classList.remove('selecionado');
    });
    event.target.classList.add('selecionado');
  }

  async function processarAgendamento() {
    try {
      const form = document.getElementById('form-agendamento');
      const servicoSelect = document.getElementById('servico_id');
      const selectedOption = servicoSelect.options[servicoSelect.selectedIndex];
      
      // Validação básica
      if (!form.servico_id.value) throw new Error('Selecione um serviço');
      if (!form.data_consulta.value) throw new Error('Selecione uma data');
      if (!form.hora_inicio.value) throw new Error('Selecione um horário');

      // Calcula horário de término
      const duracaoMinutos = parseInt(selectedOption.dataset.duracao) || 60;
      const dataHoraInicio = new Date(`${form.data_consulta.value}T${form.hora_inicio.value}`);
      const dataHoraFim = new Date(dataHoraInicio.getTime() + duracaoMinutos * 60000);

      // Prepara dados para inserção
      const agendamentoData = {
        cliente_id: dadosCliente.id,
        servico_id: form.servico_id.value,
        data_consulta: form.data_consulta.value,
        data_hora_inicio: dataHoraInicio.toISOString(),
        data_hora_fim: dataHoraFim.toISOString(),
        valor_cobrado: parseFloat(selectedOption.dataset.valor),
        forma_pagamento: form.forma_pagamento.value,
        observacoes: form.observacoes.value || null,
        status: 'agendado'
      };

      // Insere no Supabase
      const { data, error } = await supabase
        .from('agendamentos')
        .insert([agendamentoData])
        .select();

      if (error) throw error;

      // Redireciona para página de confirmação
      sessionStorage.setItem('ultimoAgendamento', JSON.stringify(data[0]));
      window.location.href = 'confirmacao.html';

    } catch (error) {
      console.error('Erro no agendamento:', error);
      alert(`Erro: ${error.message}`);
    }
  }

  // Função de exemplo para gerar horários - implemente sua lógica real
  function gerarHorariosDisponiveis(data, agendamentos) {
    // Esta é uma implementação simplificada
    // Você deve substituir por sua lógica real de horários disponíveis
    return ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
  }
});