// serviços.js - Versão Completa Revisada
document.addEventListener('DOMContentLoaded', function() {
    // Função para verificar se o Supabase está pronto
    const waitForSupabase = () => {
        return new Promise((resolve) => {
            const checkSupabase = () => {
                if (window.supabase) {
                    resolve(window.supabase);
                    return;
                }
                
                const listener = (e) => {
                    document.removeEventListener('supabaseReady', listener);
                    resolve(e.detail?.supabase || window.supabase);
                };
                
                document.addEventListener('supabaseReady', listener);
            };
            
            checkSupabase();
        });
    };

    // Inicialização segura da aplicação
    waitForSupabase().then((supabaseClient) => {
        try {
            const app = new ServicosApp(supabaseClient);
            app.init();
        } catch (error) {
            console.error("Falha crítica na inicialização:", error);
            alert("Erro ao iniciar o sistema. Por favor, recarregue a página.");
        }
    });
});

class ServicosApp {
    constructor(supabaseClient) {
        // Verificação segura do Supabase
        if (!supabaseClient) {
            throw new Error("Cliente Supabase não fornecido");
        }

        this.supabase = supabaseClient;
        this.services = [];
        this.currentServiceId = null;
        this.elements = {};
    }

    init() {
        this.initElements();
        this.setupEventListeners();
        this.loadServicesWithRetry();
    }

    initElements() {
        // Cache de elementos com verificação
        const elements = {
            servicesList: document.querySelector("#servicesList tbody"),
            serviceForm: document.getElementById("serviceForm"),
            serviceId: document.getElementById("serviceId"),
            servico: document.getElementById("servico"),
            valor: document.getElementById("valor"),
            duracao: document.getElementById("duracao"),
            descricao: document.getElementById("descricao"),
            ativo: document.getElementById("ativo"),
            saveBtn: document.getElementById("saveBtn"),
            newBtn: document.getElementById("newBtn"),
            deleteBtn: document.getElementById("deleteBtn"),
            refreshBtn: document.getElementById("refreshBtn"),
            loading: document.getElementById("loading")
        };

        // Verifica se todos elementos existem
        for (const [key, element] of Object.entries(elements)) {
            if (!element) {
                throw new Error(`Elemento não encontrado: ${key}`);
            }
        }

        this.elements = elements;
    }

    setupEventListeners() {
        // Eventos principais com arrow functions para manter o contexto
        this.elements.refreshBtn.addEventListener("click", () => this.loadServicesWithRetry());
        this.elements.newBtn.addEventListener("click", () => this.resetForm());
        this.elements.deleteBtn.addEventListener("click", () => this.deleteService());
        this.elements.serviceForm.addEventListener("submit", (e) => this.handleSubmit(e));
        
        // Formatação monetária
        this.elements.valor.addEventListener('input', (e) => this.formatCurrency(e));
        this.elements.valor.addEventListener('blur', (e) => this.finalizeCurrencyFormat(e));
    }

    async loadServicesWithRetry(retries = 3, delay = 1000) {
        try {
            this.showLoading(true);
            const { data, error } = await this.supabase
                .from("servicos")
                .select("*")
                .order("servico", { ascending: true });

            if (error) throw error;

            this.services = data || [];
            this.renderServices();
        } catch (error) {
            console.error("Erro ao carregar serviços:", error);
            
            if (retries > 0) {
                console.log(`Tentando novamente... (${retries} tentativas restantes)`);
                setTimeout(() => this.loadServicesWithRetry(retries - 1, delay * 2), delay);
            } else {
                this.showError("Falha ao carregar serviços. Verifique sua conexão.");
                this.elements.servicesList.innerHTML = 
                    `<tr><td colspan="4" class="error">Erro ao carregar dados</td></tr>`;
            }
        } finally {
            this.showLoading(false);
        }
    }

    renderServices() {
        const tbody = this.elements.servicesList;
        tbody.innerHTML = '';

        if (this.services.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4">Nenhum serviço cadastrado</td></tr>`;
            return;
        }

        this.services.forEach(service => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${service.servico}</td>
                <td>${this.formatCurrencyValue(service.valor)}</td>
                <td>${this.formatDurationMinutes(service.duracao)} min</td>
                <td>${service.ativo ? 'Ativo' : 'Inativo'}</td>
            `;
            tr.addEventListener("click", (e) => this.loadServiceForEdit(service, e));
            tbody.appendChild(tr);
        });
    }

    // PostgreSQL retorna interval como HH:MM:SS (ou "N days HH:MM:SS").
    // Exibir minutos no formulário, sem perder o valor do intervalo.
    formatDurationMinutes(value) {
        if (value == null || value === '') return '';
        if (typeof value === 'number') return value; // compatibilidade de leitura
        const str = String(value).trim();
        const match = str.match(/^(?:(-?\d+)\s+days?\s+)?(\d+):(\d{2}):(\d{2}(?:\.\d+)?)$/i);
        if (!match) return '';
        const minutes = (Number(match[1] || 0) * 1440) + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 60;
        return Number.isInteger(minutes) ? minutes : Number(minutes.toFixed(2));
    }

    formatCurrency(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = (value / 100).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        e.target.value = value ? 'R$ ' + value : '';
    }

    finalizeCurrencyFormat(e) {
        if (!e.target.value.includes('R$') && e.target.value) {
            let value = parseFloat(e.target.value.replace(',', '.')).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            e.target.value = 'R$ ' + value;
        }
    }

    formatCurrencyValue(value) {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    loadServiceForEdit(service, event) {
        this.currentServiceId = service.id;
        this.elements.serviceId.value = service.id;
        this.elements.servico.value = service.servico;
        this.elements.valor.value = this.formatCurrencyValue(service.valor);
        this.elements.duracao.value = this.formatDurationMinutes(service.duracao);
        this.elements.descricao.value = service.descricao || '';
        this.elements.ativo.value = service.ativo ? 'true' : 'false';

        // Destacar linha selecionada
        document.querySelectorAll('#servicesList tr').forEach(tr => {
            tr.classList.remove('selected');
        });
        event.currentTarget.classList.add('selected');
    }

    validateForm() {
        if (!this.elements.servico.value.trim()) {
            this.showError("O nome do serviço é obrigatório");
            return false;
        }

        const rawValue = this.elements.valor.value
            .replace('R$', '')
            .replace(/\./g, '')
            .replace(',', '.')
            .trim();

        if (!rawValue || isNaN(rawValue)) {
            this.showError("Informe um valor válido");
            return false;
        }

        const minutes = Number(this.elements.duracao.value);
        if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) {
            this.showError('Informe a duração em minutos inteiros, entre 1 e 240.');
            return false;
        }
        return true;
    }

    prepareServiceData() {
        const rawValue = this.elements.valor.value
            .replace('R$', '')
            .replace(/\./g, '')
            .replace(',', '.')
            .trim();

        return {
            servico: this.elements.servico.value.trim(),
            valor: parseFloat(rawValue),
            // A coluna do banco é interval; "60 minutes" evita gravar 60 segundos.
            duracao: `${Number(this.elements.duracao.value)} minutes`,
            descricao: this.elements.descricao.value.trim(),
            ativo: this.elements.ativo.value === 'true'
        };
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) return;

        try {
            this.showLoading(true);
            const serviceData = this.prepareServiceData();

            if (this.currentServiceId) {
                const { data, error } = await this.supabase
                    .from("servicos")
                    .update(serviceData)
                    .eq('id', this.currentServiceId)
                    .select('id');
                if (error) throw error;
                if (!data || data.length !== 1) throw new Error('Nenhum serviço atualizado. Verifique sua autorização.');
            } else {
                const { data, error } = await this.supabase
                    .from("servicos")
                    .insert(serviceData)
                    .select('id');
                if (error) throw error;
                if (!data || data.length !== 1) throw new Error('Serviço não inserido. Verifique sua autorização.');
            }

            await this.loadServicesWithRetry();
            this.resetForm();
            this.showSuccess("Serviço salvo com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar serviço:", error);
            this.showError("Erro ao salvar serviço: " + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async deleteService() {
        if (!this.currentServiceId || !confirm('Tem certeza que deseja excluir este serviço?')) {
            return;
        }

        try {
            this.showLoading(true);
            const { data, error } = await this.supabase
                .from("servicos")
                .delete()
                .eq('id', this.currentServiceId)
                .select('id');
            if (error) throw error;
            if (!data || data.length !== 1) throw new Error('Serviço não excluído. Verifique a autorização ou os vínculos existentes.');

            await this.loadServicesWithRetry();
            this.resetForm();
            this.showSuccess("Serviço excluído com sucesso!");
        } catch (error) {
            console.error("Erro ao excluir serviço:", error);
            this.showError("Erro ao excluir serviço: " + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    resetForm() {
        this.currentServiceId = null;
        this.elements.serviceForm.reset();
        this.elements.serviceId.value = '';
        document.querySelectorAll('#servicesList tr').forEach(tr => {
            tr.classList.remove('selected');
        });
    }

    showLoading(show) {
        this.elements.loading.style.display = show ? "block" : "none";
    }

    showError(message) {
        alert(message);
    }

    showSuccess(message) {
        alert(message);
    }
}