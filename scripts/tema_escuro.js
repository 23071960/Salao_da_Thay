document.getElementById('toggle-theme').addEventListener('click', function () {
    document.body.classList.toggle('dark-theme');
    this.textContent = document.body.classList.contains('dark-theme')
      ? '☀️ Modo Claro'
      : '🌙 Modo Escuro';
  });
  