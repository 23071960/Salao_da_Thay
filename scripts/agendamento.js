document.addEventListener('DOMContentLoaded', () => {
  const buscaCpfInput = document.getElementById('busca-cpf');
  const btnBuscarCliente = document.getElementById('btn-buscar-cliente');
  const cadastroRapidoContainer = document.getElementById('cadastro-rapido-container');
  const formCadastroRapido = document.getElementById('form-cadastro-rapido');
  const dadosClienteDiv = document.querySelector('.dados-cliente');
  const clienteCpfSpan = document.getElementById('cliente-cpf');
  const clienteNomeSpan = document.getElementById('cliente-nome');
  const clienteTelefoneSpan = document.getElementById('cliente-telefone');
  const clienteNascimentoSpan = document.getElementById('cliente-nascimento');
  const formAgendamento = document.getElementById('form-agendamento');
  const servicoSelect = document.getElementById('servico_id');
  const dataConsultaInput = document.getElementById('data_consulta');
  const listaHorariosDiv = document.getElementById('lista-horarios');
  const horariosDisponiveisDiv = document.getElementById('horarios-disponiveis');
  const horaInicioInput = document.getElementById('hora_inicio');
  const valorCobradoInput = document.getElementById('valor_cobrado');

  // Inicia escondendo as áreas:
  cadastroRapidoContainer.style.display = 'none';
  dadosClienteDiv.style.display = 'none';
  formAgendamento.style.display = 'none';
  horariosDisponiveisDiv.style.display = 'none';

  let clienteAtual = null; // guarda cliente buscado/cadastrado
  let servicosCache = [];

  // Função para limpar dados cliente na tela
  function limparDadosCliente() {
    clienteCpfSpan.textContent = '';
    clienteNomeSpan.textContent = '';
    clienteTelefoneSpan.textContent = '';
    clienteNascimentoSpan.textContent = '';
  }

  // Função para preencher dados cliente na tela
  function preencherDadosCliente(cliente) {
    clienteCpfSpan.textContent = cliente.cpf || '';
    clienteNomeSpan.textContent = cliente.nome || '';
    clienteTelefoneSpan.textContent = cliente.telefone || '';
    clienteNascimentoSpan.textContent = cliente.data_nascimento ? new Date(cliente.data_nascimento).toLocaleDateString() : '';
  }

  // Buscar cliente pelo CPF no Supabase
  async function buscarClientePorCPF(cpf) {
    try {
      // Ajuste o nome da tabela e dos campos conforme seu DB
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('cpf', cpf)
        .single();
      if (error && error.code !== 'PGRST116') { // 116 = not found
        throw error;
      }
      return data || null;
    } catch (err) {
      alert('Erro ao buscar cliente: ' + err.message);
      return null;
    }
  }

  // Carregar serviços no select
  async function carregarServicos() {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('ativo', true)
        .order('servico');
      if (error) throw error;

      servicosCache = data;

      servicoSelect.innerHTML = '<option value="" disabled selected>Selecione um serviço</option>';
      data.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.servico} — R$ ${Number(s.valor).toFixed(2)}`;
        servicoSelect.appendChild(opt);
      });
    } catch (err) {
      alert('Erro ao carregar serviços: ' + err.message);
    }
  }

  // Buscar horários disponíveis para serviço e data
  async function carregarHorariosDisponiveis(servicoId, dataConsulta) {
    try {
      listaHorariosDiv.innerHTML = '';
      horariosDisponiveisDiv.style.display = 'none';
      horaInicioInput.value = '';

      if (!servicoId || !dataConsulta) return;

      // Buscar duração do serviço para calcular horários possíveis
      const servico = servicosCache.find(s => s.id == servicoId);
      if (!servico) return;

      const duracaoMs = parseDurationToMs(servico.duracao);

      // Horário de funcionamento fixo, por exemplo: 09:00 às 18:00 (ajuste conforme seu caso)
      const abertura = new Date(dataConsulta + 'T09:00:00');
      const fechamento = new Date(dataConsulta + 'T18:00:00');

      // Buscar agendamentos já marcados nesse dia e serviço
      const { data: agendamentos, error } = await supabase
        .from('agendamentos')
        .select('data_hora_inicio,data_hora_fim')
        .eq('servico_id', servicoId)
        .gte('data_hora_inicio', abertura.toISOString())
        .lt('data_hora_inicio', fechamento.toISOString());

      if (error) throw error;

      // Calcular todos os slots possíveis entre abertura e fechamento, pulando duração do serviço
      let slots = [];
      for (let current = abertura.getTime(); current + duracaoMs <= fechamento.getTime(); current += duracaoMs) {
        slots.push(new Date(current));
      }

      // Filtrar slots livres (que não colidam com agendamentos já marcados)
      const slotsLivres = slots.filter(slot => {
        const slotStart = slot.getTime();
        const slotEnd = slotStart + duracaoMs;
        // Verifica se tem colisão com algum agendamento
        return !agendamentos.some(a => {
          const agStart = new Date(a.data_hora_inicio).getTime();
          const agEnd = new Date(a.data_hora_fim).getTime();
          return (slotStart < agEnd) && (slotEnd > agStart);
        });
      });

      if (slotsLivres.length === 0) {
        listaHorariosDiv.textContent = 'Nenhum horário disponível para essa data e serviço.';
      } else {
        // Mostrar botões para os horários disponíveis
        slotsLivres.forEach(slot => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          btn.className = 'btn-horario';
          btn.addEventListener('click', () => {
            // Remove seleção antiga
            document.querySelectorAll('.btn-horario.selecionado').forEach(b => b.classList.remove('selecionado'));
            // Marca este botão
            btn.classList.add('selecionado');
            // Atualiza campo oculto para envio
            horaInicioInput.value = slot.toISOString();
          });
          listaHorariosDiv.appendChild(btn);
        });
      }

      horariosDisponiveisDiv.style.display = 'block';

      // Atualiza valor cobrado para o serviço selecionado
      valorCobradoInput.value = servico ? Number(servico.valor).toFixed(2) : '';
    } catch (err) {
      alert('Erro ao carregar horários: ' + err.message);
    }
  }

  // Helper: parse interval "01:00:00" ou "00:30:00" para milissegundos
  function parseDurationToMs(interval) {
    if (!interval) return 3600000; // 1 hora padrão
    // Exemplo intervalo pode vir no formato ISO 8601 ou "HH:MM:SS"
    // Supondo "HH:MM:SS"
    const parts = interval.split(':');
    if (parts.length !== 3) return 3600000;
    const [h, m, s] = parts.map(Number);
    return ((h * 3600) + (m * 60) + s) * 1000;
  }

  // Evento botão buscar cliente
  btnBuscarCliente.addEventListener('click', async () => {
    const cpf = buscaCpfInput.value.trim();
    if (!cpf) {
      alert('Digite um CPF para buscar');
      return;
    }
    // Busca cliente
    const cliente = await buscarClientePorCPF(cpf);
    if (cliente) {
      clienteAtual = cliente;
      preencherDadosCliente(cliente);
      dadosClienteDiv.style.display = 'block';
      cadastroRapidoContainer.style.display = 'none';
      formAgendamento.style.display = 'block';
      document.getElementById('cliente_id').value = cliente.id;
      await carregarServicos();
    } else {
      // Cliente não existe, mostra cadastro rápido
      clienteAtual = null;
      limparDadosCliente();
      dadosClienteDiv.style.display = 'none';
      cadastroRapidoContainer.style.display = 'block';
      formAgendamento.style.display = 'none';
      // Preenche CPF no cadastro rápido para não precisar digitar de novo
      document.getElementById('cadastro-cpf').value = cpf;
    }
  });

  // Evento formulário cadastro rápido
  formCadastroRapido.addEventListener('submit', async e => {
    e.preventDefault();
    const cpf = document.getElementById('cadastro-cpf').value.trim();
    const nome = document.getElementById('cadastro-nome').value.trim();
    const telefone = document.getElementById('cadastro-telefone').value.trim();
    const nascimento = document.getElementById('cadastro-nascimento').value;
    const endereco = document.getElementById('cadastro-endereco').value.trim();

    if (!cpf || !nome || !telefone || !nascimento) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([{ cpf, nome, telefone, data_nascimento: nascimento, endereco }])
        .select()
        .single();

      if (error) throw error;

      clienteAtual = data;
      preencherDadosCliente(data);
      dadosClienteDiv.style.display = 'block';
      cadastroRapidoContainer.style.display = 'none';
      formAgendamento.style.display = 'block';
      document.getElementById('cliente_id').value = data.id;

      await carregarServicos();
    } catch (err) {
      alert('Erro ao cadastrar cliente: ' + err.message);
    }
  });

  // Botão cancelar cadastro rápido
  document.getElementById('btn-cancelar-cadastro').addEventListener('click', () => {
    cadastroRapidoContainer.style.display = 'none';
  });

  // Quando mudar serviço ou data, recarrega horários
  servicoSelect.addEventListener('change', () => {
    carregarHorariosDisponiveis(servicoSelect.value, dataConsultaInput.value);
  });
  dataConsultaInput.addEventListener('change', () => {
    carregarHorariosDisponiveis(servicoSelect.value, dataConsultaInput.value);
  });

  // Envio formulário agendamento
  formAgendamento.addEventListener('submit', async e => {
    e.preventDefault();

    const cliente_id = document.getElementById('cliente_id').value;
    const servico_id = servicoSelect.value;
    const data_consulta = dataConsultaInput.value;
    const hora_inicio = horaInicioInput.value;
    const forma_pagamento = document.getElementById('forma_pagamento').value;
    const observacoes = document.getElementById('observacoes').value;

    if (!cliente_id || !servico_id || !data_consulta || !hora_inicio || !forma_pagamento) {
      alert('Preencha todos os campos obrigatórios e selecione um horário.');
      return;
    }

    try {
      const duracao = servicosCache.find(s => s.id == servico_id)?.duracao || "01:00:00";
      const dtInicio = new Date(hora_inicio);
      const duracaoMs = parseDurationToMs(duracao);
      const dtFim = new Date(dtInicio.getTime() + duracaoMs);

      // Inserir agendamento
      const { data, error } = await supabase.from('agendamentos').insert([{
        cliente_id,
        servico_id,
        data_hora_inicio: dtInicio.toISOString(),
        data_hora_fim: dtFim.toISOString(),
        forma_pagamento,
        observacoes,
        valor_cobrado: Number(valorCobradoInput.value)
      }]);

      if (error) throw error;

      alert('Agendamento confirmado!');
      // Limpar formulários e tela para novo agendamento
      formAgendamento.reset();
      dadosClienteDiv.style.display = 'none';
      formAgendamento.style.display = 'none';
      horariosDisponiveisDiv.style.display = 'none';
      limparDadosCliente();
      clienteAtual = null;
      buscaCpfInput.value = '';
    } catch (err) {
      alert('Erro ao agendar: ' + err.message);
    }
  });
});
