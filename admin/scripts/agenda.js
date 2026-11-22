// Cliente global autenticado já inicializado por supabase.js e auth-loader.js

class AgendamentosDashboard {
    constructor() {
        this.initElements();
        this.initData();
    }

    async init() {
        try {
            // Espera o Supabase ficar pronto
            if (!window.supabase) {
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Timeout ao carregar Supabase'));
                    }, 5000);
                    
                    window.addEventListener('supabaseReady', () => {
                        clearTimeout(timeout);
                        resolve();
                    }, { once: true });
                });
            }

            this.supabase = window.supabase;
            
            // Verifica conexão
            const { error } = await this.supabase.from('agendamentos').select('*').limit(1);
            if (error) throw error;
                
            await this.loadDadosIniciais();
            await this.loadAgendamentos();
            this.setupEventListeners();
            
            // Configura data atual como padrão
            const today = new Date().toISOString().split('T')[0];
            this.dataConsultaInput.value = today;
            this.filterData.value = today;
        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.showError('Falha ao conectar com o banco de dados. Por favor, recarregue a página.');
        }
    }

    initElements() {
        // Elementos do formulário
        this.agendamentoForm = document.getElementById('agendamentoForm');
        this.agendamentoIdInput = document.getElementById('agendamentoId');
        this.clienteSelect = document.getElementById('cliente_id');
        this.servicoSelect = document.getElementById('servico_id');
        this.profissionalSelect = document.getElementById('profissional_id');
        this.dataConsultaInput = document.getElementById('data_consulta');
        this.horaInicioInput = document.getElementById('hora_inicio');
        this.horaFimInput = document.getElementById('hora_fim');
        this.valorCobradoInput = document.getElementById('valor_cobrado');
        this.pagoSelect = document.getElementById('pago');
        this.statusSelect = document.getElementById('status');
        this.formaPagamentoSelect = document.getElementById('forma_pagamento');
        this.observacoesTextarea = document.getElementById('observacoes');
        
        // Elementos de filtro
        this.filterData = document.getElementById('filterData');
        this.filterProfissional = document.getElementById('filterProfissional');
        this.filterStatus = document.getElementById('filterStatus');
        this.filterBtn = document.getElementById('filterBtn');
        
        // Botões
        this.saveBtn = document.getElementById('saveBtn');
        this.clearBtn = document.getElementById('clearBtn');
        
        // Tabela
        this.agendamentosTable = document.querySelector('#agendamentosTable tbody');
        
        // Overlay de loading
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    initData() {
        this.clientes = [];
        this.servicos = [];
        this.profissionais = [];
        this.agendamentos = [];
    }

    async loadDadosIniciais() {
        this.showLoading(true);
        try {
            // Carrega clientes, serviços e profissionais em paralelo
            const [clientesResult, servicosResult, profissionaisResult] = await Promise.all([
                this.supabase.from('clientes').select('*').order('nome', { ascending: true }),
                this.supabase.from('servicos').select('*').order('servico', { ascending: true }),
                this.supabase.from('profissionais').select('*').order('pnome', { ascending: true })
            ]);

            if (clientesResult.error) throw clientesResult.error;
            if (servicosResult.error) throw servicosResult.error;
            if (profissionaisResult.error) throw profissionaisResult.error;

            this.clientes = clientesResult.data;
            this.servicos = servicosResult.data;
            this.profissionais = profissionaisResult.data;
            
            // Preenche selects
            this.fillSelect(this.clienteSelect, this.clientes, 'nome', 'Selecione um cliente');
            this.fillSelect(this.servicoSelect, this.servicos, 'servico', 'Selecione um serviço');
            this.fillSelect(this.profissionalSelect, this.profissionais, 'pnome', 'Selecione um profissional');
            this.fillSelect(this.filterProfissional, [{id: '', pnome: 'Todos'}, ...this.profissionais], 'pnome', 'Todos');
            
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
            this.showError('Erro ao carregar dados iniciais');
        } finally {
            this.showLoading(false);
        }
    }

    fillSelect(select, data, textField, defaultOption) {
        select.innerHTML = `<option value="">${defaultOption}</option>`;
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item[textField];
            select.appendChild(option);
        });
    }

    async loadAgendamentos(filters = {}) {
        this.showLoading(true);
        try {
            let query = this.supabase
                .from('agendamentos')
                .select(`
                    id,
                    cliente_id,
                    servico_id,
                    profissional_id,
                    data_consulta,
                    data_hora_inicio,
                    data_hora_fim,
                    valor_cobrado,
                    pago,
                    status,
                    forma_pagamento,
                    observacoes,
                    clientes ( nome ),
                    servicos ( servico ),
                    profissionais ( pnome )
                `)
                .order('data_hora_inicio', { ascending: true });

            // Aplica filtros
            if (filters.data_consulta) {
                query = query.eq('data_consulta', filters.data_consulta);
            }
            
            if (filters.profissional_id) {
                query = query.eq('profissional_id', filters.profissional_id);
            }
            
            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            const { data, error } = await query;

            if (error) throw error;

            this.agendamentos = data || [];
            this.renderAgendamentos();
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            this.showError('Erro ao carregar agendamentos');
        } finally {
            this.showLoading(false);
        }
    }

    renderAgendamentos() {
        this.agendamentosTable.innerHTML = '';
        
        if (!this.agendamentos || this.agendamentos.length === 0) {
            this.agendamentosTable.innerHTML = '<tr><td colspan="5">Nenhum agendamento encontrado</td></tr>';
            return;
        }
        
        this.agendamentos.forEach(agendamento => {
            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            
            // Formata data/hora
            const dataHoraInicio = new Date(agendamento.data_hora_inicio);
            const dataFormatada = dataHoraInicio.toLocaleDateString('pt-BR');
            const horaFormatada = dataHoraInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            // Trata dados que podem ser nulos
            const clienteNome = agendamento.clientes?.nome || 'Cliente não encontrado';
            const servicoNome = agendamento.servicos?.servico || 'Serviço não encontrado';
            const profissionalNome = agendamento.profissionais?.pnome || 'Profissional não encontrado';
            
            tr.innerHTML = `
                <td>${clienteNome}</td>
                <td>${servicoNome}</td>
                <td>${dataFormatada} ${horaFormatada}</td>
                <td><span class="status-badge status-${agendamento.status}">${this.formatStatus(agendamento.status)}</span></td>
                <td class="action-buttons">
                    <button class="action-btn edit-btn" data-id="${agendamento.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </td>
            `;
            
            // Adiciona evento de clique na linha inteira
            tr.addEventListener('click', (e) => {
                // Evita que o clique nos botões dispare o evento da linha
                if (!e.target.closest('.action-btn')) {
                    this.editAgendamento(agendamento.id);
                }
            });
            
            this.agendamentosTable.appendChild(tr);
        });
        
        // Adiciona eventos aos botões de edição
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita que o evento de clique na linha seja disparado
                this.editAgendamento(btn.dataset.id);
            });
        });
    }

    formatStatus(status) {
        const statusMap = {
            'agendado': 'Agendado',
            'confirmado': 'Confirmado',
            'cancelado': 'Cancelado',
            'concluido': 'Concluído',
            'nao_compareceu': 'Não Compareceu'
        };
        return statusMap[status] || status;
    }

    async saveAgendamento(e) {
        e.preventDefault();
        
        // Prepara os dados
        const dataConsulta = this.dataConsultaInput.value;
        const horaInicio = this.horaInicioInput.value;
        const horaFim = this.horaFimInput.value;
        
        const agendamentoData = {
            cliente_id: this.clienteSelect.value,
            servico_id: this.servicoSelect.value,
            profissional_id: this.profissionalSelect.value,
            data_consulta: dataConsulta,
            data_hora_inicio: `${dataConsulta}T${horaInicio}:00`,
            data_hora_fim: `${dataConsulta}T${horaFim}:00`,
            valor_cobrado: parseFloat(this.valorCobradoInput.value) || 0,
            pago: this.pagoSelect.value === 'true',
            status: this.statusSelect.value,
            forma_pagamento: this.formaPagamentoSelect.value || null,
            observacoes: this.observacoesTextarea.value || null
        };
        
        // Validação
        if (!agendamentoData.cliente_id || !agendamentoData.servico_id || !agendamentoData.profissional_id || 
            !agendamentoData.data_consulta || !horaInicio || !horaFim) {
            this.showError('Preencha todos os campos obrigatórios');
            return;
        }
        
        try {
            this.showLoading(true);
            
            if (this.agendamentoIdInput.value) {
                // Atualização
                const { error } = await this.supabase
                    .from('agendamentos')
                    .update(agendamentoData)
                    .eq('id', this.agendamentoIdInput.value);
                
                if (error) throw error;
                this.showMessage('Agendamento atualizado com sucesso!');
            } else {
                // Criação
                const { error } = await this.supabase
                    .from('agendamentos')
                    .insert([agendamentoData]);
                
                if (error) throw error;
                this.showMessage('Agendamento criado com sucesso!');
            }
            
            await this.loadAgendamentos();
            this.resetForm();
        } catch (error) {
            console.error('Erro ao salvar agendamento:', error);
            this.showError('Erro ao salvar agendamento: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async editAgendamento(id) {
        const agendamento = this.agendamentos.find(a => a.id == id);
        if (!agendamento) return;
        
        // Preenche o formulário
        this.agendamentoIdInput.value = agendamento.id;
        this.clienteSelect.value = agendamento.cliente_id;
        this.servicoSelect.value = agendamento.servico_id;
        this.profissionalSelect.value = agendamento.profissional_id;
        
        // Formata data/hora
        const dataHoraInicio = new Date(agendamento.data_hora_inicio);
        this.dataConsultaInput.value = dataHoraInicio.toISOString().split('T')[0];
        this.horaInicioInput.value = dataHoraInicio.toTimeString().substring(0, 5);
        
        const dataHoraFim = new Date(agendamento.data_hora_fim);
        this.horaFimInput.value = dataHoraFim.toTimeString().substring(0, 5);
        
        this.valorCobradoInput.value = agendamento.valor_cobrado || '';
        this.pagoSelect.value = agendamento.pago ? 'true' : 'false';
        this.statusSelect.value = agendamento.status;
        this.formaPagamentoSelect.value = agendamento.forma_pagamento || '';
        this.observacoesTextarea.value = agendamento.observacoes || '';
        
        this.saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
        
        // Rola para o topo do formulário
        document.querySelector('.form-panel').scrollTo({ top: 0, behavior: 'smooth' });
    }

    resetForm() {
        this.agendamentoForm.reset();
        this.agendamentoIdInput.value = '';
        this.saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Agendamento';
        
        // Configura data atual como padrão
        const today = new Date().toISOString().split('T')[0];
        this.dataConsultaInput.value = today;
    }

    applyFilters() {
        const filters = {};
        
        if (this.filterData.value) {
            filters.data_consulta = this.filterData.value;
        }
        
        if (this.filterProfissional.value) {
            filters.profissional_id = this.filterProfissional.value;
        }
        
        if (this.filterStatus.value) {
            filters.status = this.filterStatus.value;
        }
        
        this.loadAgendamentos(filters);
    }

    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    showMessage(message) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'alert-message success';
        msgDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        document.body.appendChild(msgDiv);
        
        setTimeout(() => {
            msgDiv.remove();
        }, 3000);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert-message error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    setupEventListeners() {
        this.agendamentoForm.addEventListener('submit', (e) => this.saveAgendamento(e));
        this.clearBtn.addEventListener('click', () => this.resetForm());
        this.filterBtn.addEventListener('click', () => this.applyFilters());
    }
}

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', async () => {
    const app = new AgendamentosDashboard();
    await app.init();
    
    // Configura atualização em tempo real
    const subscription = window.supabase
        .channel('agendamentos-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos' }, () => {
            console.log('Mudança detectada - atualizando lista...');
            app.loadAgendamentos();
        })
        .subscribe();
});