// Configurações
const SPREADSHEET_ID = '1oONTghcFATt2sRBUkBiNRjymq_m8c4VXt2aHpJxfasU';
const SHEET_NAME = 'Respostas';

// Elementos DOM
const clientDataDisplay = document.getElementById('clientDataDisplay');
const clientModal = document.getElementById('clientModal');
const clientDetails = document.getElementById('clientDetails');
const closeModal = document.querySelector('.close');

// Mapeamento de campos para exibição
const FIELD_MAP = {
  'Qual seu nome completo?': 'Nome Completo',
  'Qual seu telefone?': 'Telefone',
  'Qual seu endereço?': 'Endereço',
  'Qual sua data de nascimento?': 'Data de Nascimento',
  'Como você descreve sua autoimagem?': 'Autoimagem',
  'Como você avalia sua autoestima atualmente?': 'Autoestima',
  'Quais são suas maiores inseguranças em relação à sua aparência?': 'Inseguranças',
  'Qual seu tipo de cabelo?': 'Tipo de Cabelo',
  'Qual a cor do seu cabelo?': 'Cor do Cabelo',
  'Qual o comprimento do seu cabelo?': 'Comprimento do Cabelo',
  'Quais procedimentos capilares você já realizou?': 'Procedimentos já realizados',
  'Qual sua rotina de cuidados com o cabelo?': 'Rotina de cuidados',
  'Quais produtos você usa atualmente?': 'Produtos usados',
  'Você tem alguma alergia a produtos capilares?': 'Alergias',
  'Quais são suas expectativas para o serviço no salão?': 'Expectativas',
  'Você tem alguma preferência ou aversão específica?': 'Preferências',
  'Alguma observação adicional que gostaria de compartilhar?': 'Observações',
  'Timestamp': 'Data de Registro'
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  fetchClientData();
  setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
  closeModal.addEventListener('click', () => {
    clientModal.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target === clientModal) {
      clientModal.style.display = 'none';
    }
  });
}

// Fetch Data
async function fetchClientData() {
  showLoadingState();

  try {
    const url = `https://opensheet.elk.sh/${SPREADSHEET_ID}/${SHEET_NAME}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      showEmptyState();
      return;
    }

    window.clientData = data;
    renderClientCards(data);
    
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    showErrorState(error);
  }
}

// Renderização
function renderClientCards(data) {
  clientDataDisplay.innerHTML = '';

  data.forEach((client, index) => {
    const card = document.createElement('div');
    card.className = 'client-card';
    card.innerHTML = `
      <div class="client-header">
        <h4>${client['Qual seu nome completo?'] || 'Nome não informado'}</h4>
        <span class="register-date">${formatDate(client.Timestamp)}</span>
      </div>
      <div class="client-summary">
        <p><strong>Telefone:</strong> ${client['Qual seu telefone?'] || 'Não informado'}</p>
        <p><strong>Endereço:</strong> ${client['Qual seu endereço?'] || 'Não informado'}</p>
        <button class="view-details" data-index="${index}">
          Ver detalhes <i class="fas fa-arrow-right"></i>
        </button>
      </div>
    `;
    clientDataDisplay.appendChild(card);
  });

  // Adiciona event listeners aos botões
  document.querySelectorAll('.view-details').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = e.target.getAttribute('data-index');
      showClientDetails(index);
    });
  });
}

// Mostrar detalhes do cliente
function showClientDetails(index) {
  const client = window.clientData[index];
  
  let detailsHTML = '';
  for (const [key, label] of Object.entries(FIELD_MAP)) {
    if (client[key]) {
      detailsHTML += `
        <div class="detail-section">
          <h4>${label}</h4>
          <p>${client[key]}</p>
        </div>
      `;
    }
  }

  clientDetails.innerHTML = detailsHTML;
  clientModal.style.display = 'block';
}

// Estados de UI
function showLoadingState() {
  clientDataDisplay.innerHTML = `
    <div class="loading-state">
      <i class="fas fa-spinner"></i>
      <p>Carregando dados dos clientes...</p>
    </div>
  `;
}

function showEmptyState() {
  clientDataDisplay.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-user-slash"></i>
      <p>Nenhum cliente cadastrado ainda.</p>
    </div>
  `;
}

function showErrorState(error) {
  clientDataDisplay.innerHTML = `
    <div class="error-state">
      <i class="fas fa-exclamation-triangle"></i>
      <h3>Erro ao carregar dados</h3>
      <p>${error.message}</p>
      <button onclick="window.location.reload()">Tentar novamente</button>
    </div>
  `;
}

// Utilitários
function formatDate(timestamp) {
  if (!timestamp) return 'Data desconhecida';
  return timestamp.split(' ')[0].split('-').reverse().join('/');
}