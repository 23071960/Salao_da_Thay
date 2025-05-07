function aplicarMascaraTelefone() {
  const inputTelefone = document.getElementById('agendamento-telefone');
  if (!inputTelefone) return;

  inputTelefone.addEventListener('input', function(e) {
    let valor = e.target.value.replace(/\D/g, '');
    
    // Limita a 11 dígitos (DDD + 9 dígitos)
    if (valor.length > 11) {
      valor = valor.substring(0, 11);
    }
    
    // Aplica a máscara conforme o tamanho
    if (valor.length > 0) {
      if (valor.length <= 10) {
        // Formato para telefone fixo: (XX) XXXX-XXXX
        valor = valor.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
      } else {
        // Formato para celular: (XX) XXXXX-XXXX
        valor = valor.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
      }
    }
    
    e.target.value = valor;
  });
}

// Aplica a máscara quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  aplicarMascaraTelefone();
});