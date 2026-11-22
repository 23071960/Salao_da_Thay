document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const areaCadastro = $('cadastro-rapido-container');
  const areaCliente = document.querySelector('.dados-cliente');
  const formAgenda = $('form-agendamento');
  const areaHorarios = $('horarios-disponiveis');
  const lista = $('lista-horarios');
  const botaoCadastro = $('btn-buscar-cliente');
  const aviso = $('aviso-agendamento');
  const avisoResultado = $('aviso-resultado-agendamento');
  // A validação é exibida no próprio formulário, inclusive quando o navegador
  // bloquearia o evento submit por um campo obrigatório não selecionado.
  formAgenda.noValidate = true;
  let sessao = null;
  let servicos = [];
  let pedidoHorarios = 0;

  function mensagem(texto, erro = false) {
    for (const elemento of [aviso, avisoResultado]) {
      if (!elemento) continue;
      elemento.textContent = texto || '';
      elemento.hidden = !texto;
      elemento.setAttribute('role', erro ? 'alert' : 'status');
      elemento.style.cssText = texto
        ? `display:block !important; visibility:visible; opacity:1; color:${erro ? '#ffe4e4' : '#e1ffeb'}; background:${erro ? '#681e28' : '#165532'}; border:1px solid ${erro ? '#f6a3a3' : '#a4f3bf'}; border-radius:8px; padding:12px; margin:12px 0; white-space:normal;`
        : 'display:none !important';
    }
  }

  function mostrarCliente(cliente) {
    if (!cliente || !cliente.token || !cliente.id) return false;
    sessao = cliente;
    $('cliente_id').value = cliente.id;
    $('cliente-cpf').textContent = cliente.cpf || '(identificador não informado)';
    $('cliente-nome').textContent = cliente.nome || '';
    $('cliente-telefone').textContent = cliente.telefone || '';
    $('cliente-nascimento').textContent = '';
    areaCadastro.hidden = true;
    areaCadastro.style.display = 'none';
    areaCliente.style.display = 'block';
    formAgenda.style.display = 'block';
    botaoCadastro.textContent = 'Cadastrar outro cliente';
    carregarServicos();
    carregarProfissionais();
    mensagem('Cadastro identificado. Escolha um serviço, uma data e um horário disponível.');
    return true;
  }

  async function carregarServicos() {
    try {
      const { data, error } = await window.supabase.rpc('listar_servicos_publicos');
      if (error) throw error;
      servicos = Array.isArray(data) ? data : [];
      $('servico_id').replaceChildren(new Option('Selecione um serviço', ''));
      servicos.forEach(s => $('servico_id').add(new Option(`${s.servico} — R$ ${Number(s.valor).toFixed(2)}`, String(s.id))));
      if (!servicos.length) mensagem('Nenhum serviço ativo está disponível para agendamento.', true);
    } catch (e) { mensagem('Falha ao consultar serviços: ' + e.message, true); }
  }

  async function carregarProfissionais() {
    try {
      const { data, error } = await window.supabase.rpc('listar_profissionais_publicos');
      if (error) throw error;
      const select = $('profissional_id');
      select.replaceChildren(new Option('Selecione um profissional', ''));
      for (const item of (Array.isArray(data) ? data : [])) {
        select.add(new Option(item.pnome, String(item.id)));
      }
      if (select.options.length === 2) {
        select.selectedIndex = 1;
        carregarHorarios();
      }
      if (select.options.length === 1) mensagem('Nenhum profissional ativo disponível.', true);
    } catch (err) { mensagem('Falha ao consultar profissionais: ' + err.message, true); }
  }

  async function carregarHorarios() {
    const pedido = ++pedidoHorarios;
    lista.replaceChildren();
    $('hora_inicio').value = '';
    areaHorarios.style.display = 'none';
    const servico = $('servico_id').value;
    const dia = $('data_consulta').value;
    const profissional = $('profissional_id').value;
    const item = servicos.find(s => String(s.id) === servico);
    $('valor_cobrado').value = item ? Number(item.valor).toFixed(2) : '';
    if (!servico || !dia || !profissional) return;
    areaHorarios.style.display = 'block';
    lista.textContent = 'Consultando horários...';
    mensagem('');
    try {
      const { data, error } = await window.supabase.rpc('horarios_publicos', {
        p_servico_id: Number(servico), p_data: dia, p_profissional_id: Number(profissional)
      });
      if (pedido !== pedidoHorarios) return;
      if (error) throw error;
      const horarios = Array.isArray(data) ? data : [];
      lista.replaceChildren();
      if (!horarios.length) {
        lista.textContent = 'Nenhum horário disponível nessa data. Experimente outra data ou serviço.';
        mensagem('A consulta retornou zero horários. Isso não significa que você precisa se cadastrar novamente.', true);
        return;
      }
      horarios.forEach(hora => {
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'btn-horario'; btn.textContent = hora;
        btn.addEventListener('click', () => {
          lista.querySelectorAll('.btn-horario').forEach(b => b.classList.remove('selecionado'));
          btn.classList.add('selecionado');
          $('hora_inicio').value = hora;
          mensagem(`Horário ${hora} selecionado. Você pode confirmar o agendamento.`);
        });
        lista.appendChild(btn);
      });
    } catch (e) {
      if (pedido !== pedidoHorarios) return;
      lista.textContent = 'Não foi possível consultar os horários.';
      mensagem('Erro do Supabase ao consultar horários: ' + e.message, true);
    }
  }

  botaoCadastro.addEventListener('click', () => {
    areaCadastro.hidden = false;
    areaCadastro.style.display = 'block';
    if (sessao) mensagem('O cadastro atual continuará ativo até você concluir um novo cadastro.');
    else mensagem('Preencha um cadastro fictício para continuar.');
    if ($('busca-cpf').value) $('cadastro-cpf').value = $('busca-cpf').value;
  });
  $('form-cadastro-rapido').addEventListener('submit', async e => {
    e.preventDefault();
    const dados = {
      cpf: $('cadastro-cpf').value, nome: $('cadastro-nome').value,
      telefone: $('cadastro-telefone').value,
      data_nascimento: $('cadastro-nascimento').value,
      endereco: $('cadastro-endereco').value
    };
    const botao = $('btn-cadastrar'); botao.disabled = true;
    try {
      const { data, error } = await window.supabase.rpc('cadastrar_cliente_ficticio', { p_dados: dados });
      if (error) throw error;
      if (!data?.token || !data?.id) throw new Error('Cadastro salvo, mas a função não retornou identificação de agendamento.');
      sessionStorage.setItem('salao_cliente_demo', JSON.stringify(data));
      mostrarCliente(data);
    } catch (err) { mensagem('Erro ao cadastrar: ' + err.message, true); }
    finally { botao.disabled = false; }
  });
  $('btn-cancelar-cadastro').addEventListener('click', () => {
    areaCadastro.style.display = 'none';
    areaCadastro.hidden = true;
  });
  $('servico_id').addEventListener('change', carregarHorarios);
  $('profissional_id').addEventListener('change', carregarHorarios);
  $('data_consulta').addEventListener('change', carregarHorarios);

  formAgenda.addEventListener('submit', async e => {
    console.info('[Agendamento público] Tentativa de confirmação recebida');
    e.preventDefault();
    if (!sessao?.token) { mensagem('Não foi identificada uma sessão de cadastro fictício. Cadastre-se para continuar.', true); return; }
    if (!$('servico_id').value) { mensagem('Selecione um serviço.', true); return; }
    if (!$('data_consulta').value) { mensagem('Selecione uma data.', true); return; }
    if (!$('profissional_id').value) { mensagem('Selecione um profissional.', true); return; }
    if (!$('hora_inicio').value) { mensagem('Selecione um dos horários disponíveis. Se não houver horários, experimente outra data ou serviço.', true); return; }
    if (!$('forma_pagamento').value) { mensagem('Escolha uma forma de pagamento fictícia.', true); return; }
    const enviar = formAgenda.querySelector('[type="submit"]'); enviar.disabled = true;
    mensagem('Enviando agendamento ao Supabase...');
    try {
      const { data, error } = await window.supabase.rpc('agendar_ficticio', {
        p_token: sessao.token,
        p_servico_id: Number($('servico_id').value),
        p_profissional_id: Number($('profissional_id').value),
        p_data: $('data_consulta').value,
        p_hora: $('hora_inicio').value,
        p_pagamento: $('forma_pagamento').value,
        p_observacoes: $('observacoes').value
      });
      if (error) throw error;
      console.info('[Agendamento público] Resposta da função agendar_ficticio:', data);
      if (!data || !data.id) throw new Error('O servidor não confirmou o número do agendamento. Verifique no painel antes de tentar novamente.');
      mensagem(`Agendamento fictício nº ${data.id} registrado com sucesso!`);
      formAgenda.reset();
      lista.replaceChildren();
      areaHorarios.style.display = 'none';
      // O cliente permanece identificado para futuros agendamentos nesta aba.
    } catch (err) {
      // Não recarregar os horários aqui: carregarHorarios() limparia esta mensagem.
      // Preservar o estado do formulário para que o usuário veja o erro e decida o próximo passo.
      console.error('[Agendamento público] Falha ao salvar:', err);
      mensagem('Agendamento NÃO registrado: ' + (err?.message || String(err)) + '. Confira os dados e tente novamente.', true);
    } finally { enviar.disabled = false; }
  });

  areaCadastro.style.display = 'none'; areaCadastro.hidden = true;
  areaCliente.style.display = 'none';
  formAgenda.style.display = 'none'; areaHorarios.style.display = 'none';
  const label = $('busca-cliente-container').querySelector('label');
  label.textContent = 'Cadastro para agendamento fictício:';
  $('busca-cpf').style.display = 'none';
  botaoCadastro.textContent = 'Fazer cadastro fictício';
  const hoje = new Date();
  $('data_consulta').min = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}`;
  try {
    const salvo = JSON.parse(sessionStorage.getItem('salao_cliente_demo') || 'null');
    if (!mostrarCliente(salvo)) mensagem('Para agendar, faça primeiro um cadastro fictício.');
  } catch { mensagem('Para agendar, faça primeiro um cadastro fictício.'); }
});
