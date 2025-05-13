// scripts/dark-mode.js
function initializeDarkMode() {
  const themeToggle = document.getElementById('toggle-theme');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

  // Verificar preferência salva ou do sistema
  const currentTheme = localStorage.getItem('theme') || 
                      (prefersDarkScheme.matches ? 'dark' : 'light');
  
  // Aplicar tema inicial
  applyTheme(currentTheme);

  // Configurar botão se existir na página
  if (themeToggle) {
    updateToggleButton(currentTheme);
    
    themeToggle.addEventListener('click', () => {
      const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    updateToggleButton(theme);
  }

  function updateToggleButton(theme) {
    if (!themeToggle) return;
    
    if (theme === 'dark') {
      themeToggle.innerHTML = '☀️ Modo Claro';
    } else {
      themeToggle.innerHTML = '🌙 Modo Escuro';
    }
  }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initializeDarkMode);