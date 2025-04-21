// ==========================================
// 1. VERIFICAÇÃO INICIAL DO SDK SUPABASE
// ==========================================
if (typeof supabase === 'undefined') {
  document.body.innerHTML = `
    <div style="
      color: red;
      padding: 2rem;
      margin: 2rem;
      border: 2px solid red;
      font-family: monospace;
      white-space: pre;
    ">
      ERRO CRÍTICO: SDK do Supabase não carregado!\n\n
      Adicione isto ANTES deste script no HTML:
      <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    </div>
  `;
  throw new Error('SDK Supabase não carregado');
}

// ==========================================
// 2. CONFIGURAÇÃO DO CLIENTE SUPABASE
// ==========================================
const supabaseClient = supabase.createClient(
  'https://hufrtioqiywncqghboal.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZnJ0aW9xaXl3bmNxZ2hib2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxODE3MTksImV4cCI6MjA2MDc1NzcxOX0.SNwH57bVGYwspmsDkRi5kwvZcTiwPba0NOobT-kFko8'
);

// ==========================================
// 3. CONTROLE DO FORMULÁRIO (COM COLETA AUTOMÁTICA)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-cliente');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    
    try {
      // Ativa estado de loading
      btn.disabled = true;
      btn.innerHTML = '⏳ Enviando...';

      // COLETA AUTOMÁTICA DE TODOS OS CAMPOS
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      
      // Conversões especiais para campos específicos
      data.estilo = Array.from(formData.getAll('estilo')).join(', ');
      data.aparencia = parseInt(data.aparencia) || null;
      data.autoestima = parseInt(data.autoestima) || null;
      
      console.log('📤 Dados coletados:', data);

      // Envio para o Supabase
      const { error } = await supabaseClient
        .from('clientes')
        .insert([data])
        .select();

      if (error) throw error;
      
      // Feedback visual
      form.reset();
      showMessage('✅ Dados salvos com sucesso!', 'success');
      window.location.href = "../index.html"; // ou use window.location.replace("/home")
      

    } catch (error) {
      console.error('Erro:', error);
      showMessage(`❌ Erro: ${error.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });
});

// ==========================================
// FUNÇÃO AUXILIAR (MENSAGENS)
// ==========================================
function showMessage(text, type = 'success') {
  const messageBox = document.createElement('div');
  messageBox.textContent = text;
  messageBox.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    border-radius: 4px;
    color: white;
    background-color: ${type === 'success' ? '#4CAF50' : '#F44336'};
    z-index: 1000;
    animation: fadeIn 0.3s;
  `;
  
  document.body.appendChild(messageBox);
  setTimeout(() => messageBox.remove(), 5000);
}

