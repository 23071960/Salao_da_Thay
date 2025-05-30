// pesquisa.js
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Verifica se o Supabase está disponível
    if (!window.supabase) {
      throw new Error('Supabase não está disponível');
    }

    // 2. Configura máscaras e datepicker
    configurarMascaras();

    // 3. Verifica se há um ID de cliente na URL
    const urlParams = new URLSearchParams(window.location.search);
    const clienteId = urlParams.get('id');

    if (clienteId) {
      // 4. Carrega dados do cliente
      await carregarDadosCliente(clienteId);
    } else {
      console.log('Nenhum ID de cliente fornecido - modo de novo cadastro');
    }

    // 5. Configura o envio do formulário
    document.getElementById('form-cliente').addEventListener('submit', async (e) => {
      e.preventDefault();
      await salvarCliente(clienteId);
    });

  } catch (error) {
    console.error('Erro inicial:', error);
    alert(`Erro ao carregar a página: ${error.message}`);
  }

  // Função para configurar máscaras
  function configurarMascaras() {
    // Máscara para telefone
    IMask(document.getElementById('agendamento-telefone'), {
      mask: '(00) 00000-0000'
    });

    // Máscara para data de nascimento
    IMask(document.getElementById('agendamento-data-nascimento'), {
      mask: '00/00/0000'
    });

    // Flatpickr para data de nascimento
    flatpickr("#agendamento-data-nascimento", {
      dateFormat: "d/m/Y",
      allowInput: true,
      locale: "pt"
    });
  }

  // Função para carregar dados do cliente
  async function carregarDadosCliente(id) {
    try {
      const { data: cliente, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!cliente) throw new Error('Cliente não encontrado');

      // Preenche o formulário com os dados do cliente
      preencherFormulario(cliente);

    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
      throw new Error('Não foi possível carregar os dados do cliente');
    }
  }

  // Função para preencher o formulário com os dados do cliente
  function preencherFormulario(cliente) {
    try {
      // Dados pessoais
      document.querySelector('input[name="nome"]').value = cliente.nome || '';
      document.querySelector('input[name="endereco"]').value = cliente.endereco || '';
      document.getElementById('agendamento-telefone').value = cliente.telefone || '';
      document.getElementById('agendamento-data-nascimento').value = cliente.data_nascimento || '';

      // Cabelo
      if (cliente.tipo_cabelo) {
        document.querySelector(`input[name="tipo_cabelo"][value="${cliente.tipo_cabelo}"]`).checked = true;
      }
      document.querySelector('select[name="estado_cabelo"]').value = cliente.estado_cabelo || 'Natural';
      if (cliente.mudar_cor) {
        document.querySelector(`input[name="mudar_cor"][value="${cliente.mudar_cor}"]`).checked = true;
      }
      document.querySelector('select[name="oleosidade"]').value = cliente.oleosidade || 'Normal';
      document.querySelector('select[name="textura"]').value = cliente.textura || 'Média';
      document.querySelector('select[name="procedimento"]').value = cliente.procedimento || 'Corte';

      // Autoestima
      document.querySelector('input[name="aparencia"]').value = cliente.aparencia || 3;
      if (cliente.motivacao) {
        document.querySelector(`input[name="motivacao"][value="${cliente.motivacao}"]`).checked = true;
      }
      document.querySelector('input[name="autoestima"]').value = cliente.autoestima || 3;
      document.querySelector('select[name="tempo_autocuidado"]').value = cliente.tempo_autocuidado || 'Último mês';

      // Estilo
      if (cliente.estilo) {
        const estilos = cliente.estilo.split(',');
        estilos.forEach(estilo => {
          const checkbox = document.querySelector(`input[name="estilo"][value="${estilo.trim()}"]`);
          if (checkbox) checkbox.checked = true;
        });
      }
      document.querySelector('select[name="felicidade"]').value = cliente.felicidade || 'Casa';
      document.querySelector('textarea[name="gostos"]').value = cliente.gostos || '';

      // Saúde
      document.querySelector('select[name="exercicios"]').value = cliente.exercicios || 'Às vezes';
      if (cliente.tem_filhos) {
        document.querySelector(`input[name="tem_filhos"][value="${cliente.tem_filhos}"]`).checked = true;
      }
      if (cliente.alergia) {
        document.querySelector(`input[name="alergia"][value="${cliente.alergia}"]`).checked = true;
        document.querySelector('input[name="descricao_alergia"]').value = cliente.descricao_alergia || '';
      }
      document.querySelector('select[name="frequencia_salao"]').value = cliente.frequencia_salao || 'Mensal';

      // Expectativas
      document.querySelector('textarea[name="expectativa"]').value = cliente.expectativa || '';

    } catch (error) {
      console.error('Erro ao preencher formulário:', error);
      throw new Error('Erro ao carregar dados do formulário');
    }
  }

  // Função para salvar/atualizar cliente
  async function salvarCliente(clienteId) {
    try {
      const form = document.getElementById('form-cliente');
      const formData = new FormData(form);

      // Prepara os dados para envio
      const clienteData = {
        nome: formData.get('nome'),
        endereco: formData.get('endereco'),
        telefone: document.getElementById('agendamento-telefone').value,
        data_nascimento: document.getElementById('agendamento-data-nascimento').value,
        tipo_cabelo: formData.get('tipo_cabelo'),
        estado_cabelo: formData.get('estado_cabelo'),
        mudar_cor: formData.get('mudar_cor'),
        oleosidade: formData.get('oleosidade'),
        textura: formData.get('textura'),
        procedimento: formData.get('procedimento'),
        aparencia: parseInt(formData.get('aparencia')),
        motivacao: formData.get('motivacao'),
        autoestima: parseInt(formData.get('autoestima')),
        tempo_autocuidado: formData.get('tempo_autocuidado'),
        estilo: Array.from(document.querySelectorAll('input[name="estilo"]:checked')).map(el => el.value).join(', '),
        felicidade: formData.get('felicidade'),
        gostos: formData.get('gostos'),
        exercicios: formData.get('exercicios'),
        tem_filhos: formData.get('tem_filhos'),
        alergia: formData.get('alergia'),
        descricao_alergia: formData.get('alergia') === 'Sim' ? formData.get('descricao_alergia') : null,
        frequencia_salao: formData.get('frequencia_salao'),
        expectativa: formData.get('expectativa'),
        atualizado_em: new Date().toISOString()
      };

      let result;
      if (clienteId) {
        // Atualiza cliente existente
        const { data, error } = await supabase
          .from('clientes')
          .update(clienteData)
          .eq('id', clienteId)
          .select();

        if (error) throw error;
        result = data;
      } else {
        // Cria novo cliente
        const { data, error } = await supabase
          .from('clientes')
          .insert([clienteData])
          .select();

        if (error) throw error;
        result = data;
      }

      // Feedback para o usuário
      alert(clienteId ? 'Dados atualizados com sucesso!' : 'Cliente cadastrado com sucesso!');
      
      // Redireciona ou atualiza a página conforme necessário
      if (!clienteId) {
        window.location.href = `pesquisa.html?id=${result[0].id}`;
      }

    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      alert(`Erro: ${error.message}`);
    }
  }
});