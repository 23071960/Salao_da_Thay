document.addEventListener('DOMContentLoaded', function() {
    // Elementos do formulário
    const form = document.getElementById('profissionalForm');
    const nomeInput = document.getElementById('pnome');
    const especialidadesInput = document.getElementById('especialidadesInput');
    const especialidadesTags = document.getElementById('especialidadesTags');
    const telefoneInput = document.getElementById('telefone');
    const emailInput = document.getElementById('email');
    const statusSelect = document.getElementById('ativo');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const newBtn = document.getElementById('newBtn');
    const searchInput = document.getElementById('searchInput');
    
    // Elementos da tabela
    const tableBody = document.getElementById('profissionaisTableBody');
    
    // Estado da aplicação
    let profissionais = [];
    let especialidades = [];
    let modoEdicao = false;
    let profissionalEditando = null;
    
    // Inicialização
    init();
    
    async function init() {
        showLoading();
        await carregarProfissionais();
        await carregarEspecialidades();
        setupEventListeners();
        hideLoading();
    }
    
    function setupEventListeners() {
        // Formulário
        form.addEventListener('submit', salvarProfissional);
        newBtn.addEventListener('click', novoProfissional);
        cancelBtn.addEventListener('click', cancelarEdicao);
        
        // Especialidades (tags)
        especialidadesInput.addEventListener('keydown', handleEspecialidadeInput);
        
        // Pesquisa
        searchInput.addEventListener('input', filtrarProfissionais);
        
        // Filtros de status
        document.querySelectorAll('.btn-filter').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                filtrarProfissionais();
            });
        });
    }
    
    async function carregarProfissionais() {
        try {
            // Substitua por sua chamada real ao Supabase
            // const { data, error } = await supabase.from('profissionais').select('*');
            // profissionais = data;
            
            // Mock de dados para exemplo
            profissionais = [
                {
                    id: 1,
                    nome: "Maria Silva",
                    especialidades: ["Corte", "Coloração"],
                    telefone: "(11) 99999-8888",
                    email: "maria@example.com",
                    ativo: true,
                    data_cadastro: "2023-01-15"
                },
                {
                    id: 2,
                    nome: "João Santos",
                    especialidades: ["Barba", "Massagem"],
                    telefone: "(11) 98888-7777",
                    email: "joao@example.com",
                    ativo: false,
                    data_cadastro: "2023-02-20"
                }
            ];
            
            renderizarTabela();
        } catch (error) {
            console.error("Erro ao carregar profissionais:", error);
            alert("Erro ao carregar profissionais");
        }
    }
    
    async function carregarEspecialidades() {
        try {
            // Substitua por sua chamada real ao Supabase
            // const { data, error } = await supabase.from('especialidades').select('*');
            // especialidades = data.map(e => e.nome);
            
            // Mock de dados para exemplo
            especialidades = ["Corte", "Coloração", "Barba", "Massagem", "Manicure", "Pedicure", "Maquiagem"];
        } catch (error) {
            console.error("Erro ao carregar especialidades:", error);
        }
    }
    
    function renderizarTabela() {
        tableBody.innerHTML = '';
        
        profissionais.forEach(profissional => {
            const row = document.createElement('tr');
            
            // Status class
            const statusClass = profissional.ativo ? 'status-active' : 'status-inactive';
            const statusText = profissional.ativo ? 'Ativo' : 'Inativo';
            
            // Formatar data
            const dataCadastro = new Date(profissional.data_cadastro).toLocaleDateString('pt-BR');
            
            row.innerHTML = `
                <td>${profissional.nome}</td>
                <td>${profissional.especialidades.join(', ')}</td>
                <td>
                    <div>${profissional.telefone}</div>
                    <div class="text-muted">${profissional.email}</div>
                </td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${dataCadastro}</td>
                <td class="actions">
                    <button class="btn-action btn-edit" data-id="${profissional.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete" data-id="${profissional.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Adicionar eventos aos botões de ação
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => editarProfissional(btn.dataset.id));
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => confirmarExclusao(btn.dataset.id));
        });
    }
    
    function filtrarProfissionais() {
        const termo = searchInput.value.toLowerCase();
        const statusFilter = document.querySelector('.btn-filter.active').dataset.status;
        
        const filtrados = profissionais.filter(profissional => {
            const matchTermo = 
                profissional.nome.toLowerCase().includes(termo) ||
                profissional.especialidades.some(e => e.toLowerCase().includes(termo));
            
            const matchStatus = 
                statusFilter === 'all' || 
                (statusFilter === 'true' && profissional.ativo) || 
                (statusFilter === 'false' && !profissional.ativo);
            
            return matchTermo && matchStatus;
        });
        
        // Atualizar a tabela com os resultados filtrados
        tableBody.innerHTML = '';
        
        filtrados.forEach(profissional => {
            const row = document.createElement('tr');
            // ... (mesmo conteúdo da função renderizarTabela)
            tableBody.appendChild(row);
        });
    }
    
    function novoProfissional() {
        modoEdicao = false;
        profissionalEditando = null;
        
        form.reset();
        especialidadesTags.innerHTML = '';
        document.getElementById('profissionalId').value = '';
        
        form.scrollIntoView({ behavior: 'smooth' });
    }
    
    function editarProfissional(id) {
        modoEdicao = true;
        profissionalEditando = profissionais.find(p => p.id == id);
        
        if (!profissionalEditando) return;
        
        // Preencher formulário
        document.getElementById('profissionalId').value = profissionalEditando.id;
        nomeInput.value = profissionalEditando.nome;
        statusSelect.value = profissionalEditando.ativo;
        telefoneInput.value = profissionalEditando.telefone || '';
        emailInput.value = profissionalEditando.email || '';
        
        // Preencher especialidades (tags)
        especialidadesTags.innerHTML = '';
        profissionalEditando.especialidades.forEach(especialidade => {
            addEspecialidadeTag(especialidade);
        });
        
        form.scrollIntoView({ behavior: 'smooth' });
    }
    
    async function salvarProfissional(e) {
        e.preventDefault();
        showLoading();
        
        try {
            const profissionalData = {
                nome: nomeInput.value.trim(),
                especialidades: Array.from(especialidadesTags.querySelectorAll('.tag')).map(tag => tag.textContent.replace('×', '').trim()),
                telefone: telefoneInput.value.trim(),
                email: emailInput.value.trim(),
                ativo: statusSelect.value === 'true'
            };
            
            if (modoEdicao) {
                // Atualizar profissional existente
                profissionalData.id = profissionalEditando.id;
                // await supabase.from('profissionais').update(profissionalData).eq('id', profissionalData.id);
                
                // Atualizar localmente para demonstração
                const index = profissionais.findIndex(p => p.id == profissionalData.id);
                if (index !== -1) {
                    profissionais[index] = { ...profissionais[index], ...profissionalData };
                }
            } else {
                // Criar novo profissional
                // const { data, error } = await supabase.from('profissionais').insert([profissionalData]).select();
                // if (data) profissionais.push(data[0]);
                
                // Adicionar localmente para demonstração
                profissionalData.id = profissionais.length > 0 ? Math.max(...profissionais.map(p => p.id)) + 1 : 1;
                profissionalData.data_cadastro = new Date().toISOString();
                profissionais.push(profissionalData);
            }
            
            renderizarTabela();
            novoProfissional();
            hideLoading();
            alert('Profissional salvo com sucesso!');
        } catch (error) {
            console.error("Erro ao salvar profissional:", error);
            hideLoading();
            alert("Erro ao salvar profissional");
        }
    }
    
    function cancelarEdicao() {
        novoProfissional();
    }
    
    function confirmarExclusao(id) {
        const modal = document.getElementById('confirmModal');
        modal.style.display = 'flex';
        
        document.getElementById('confirmYes').onclick = async function() {
            await excluirProfissional(id);
            modal.style.display = 'none';
        };
        
        document.getElementById('confirmNo').onclick = function() {
            modal.style.display = 'none';
        };
    }
    
    async function excluirProfissional(id) {
        showLoading();
        
        try {
            // await supabase.from('profissionais').delete().eq('id', id);
            
            // Remover localmente para demonstração
            profissionais = profissionais.filter(p => p.id != id);
            renderizarTabela();
            hideLoading();
            alert('Profissional excluído com sucesso!');
        } catch (error) {
            console.error("Erro ao excluir profissional:", error);
            hideLoading();
            alert("Erro ao excluir profissional");
        }
    }
    
    // Funções para gerenciar tags de especialidades
    function handleEspecialidadeInput(e) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const value = especialidadesInput.value.trim();
            if (value) {
                addEspecialidadeTag(value);
                especialidadesInput.value = '';
            }
        }
    }
    
    function addEspecialidadeTag(value) {
        if (!value) return;
        
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.innerHTML = `
            ${value}
            <span class="remove-tag">&times;</span>
        `;
        
        tag.querySelector('.remove-tag').addEventListener('click', () => {
            tag.remove();
        });
        
        especialidadesTags.appendChild(tag);
    }
    
    function showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }
    
    function hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    // Adicionar ao final do seu script existente
    window.addEventListener('resize', function() {
    // Ajustar a tabela em telas pequenas
    if (window.innerWidth < 768) {
        document.querySelectorAll('.table-responsive').forEach(table => {
            table.style.overflowX = 'auto';
        });
    }

    // Adicione isso ao seu JavaScript existente
    function adaptTableForMobile() {
    if (window.innerWidth < 480) {
        document.querySelectorAll('#profissionaisTable thead th').forEach((th, index) => {
            document.querySelectorAll('#profissionaisTable tbody td:nth-child('+(index+1)+')').forEach(td => {
                td.setAttribute('data-label', th.textContent);
            });
        });
    }
}

// Execute na carga e no redimensionamento
window.addEventListener('load', adaptTableForMobile);
window.addEventListener('resize', adaptTableForMobile);

    
});

// Chamada inicial para verificar o tamanho da tela
window.dispatchEvent(new Event('resize'));
});