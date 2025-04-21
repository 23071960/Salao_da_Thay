document.getElementById('clientPhone').addEventListener('input', function (e) {
    let input = e.target;
    let value = input.value.replace(/\D/g, ''); // Remove tudo que não for dígito

    // Aplica a máscara (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 10) {
      input.value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length > 6) {
      input.value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (value.length > 2) {
      input.value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    } else {
      input.value = value.replace(/(\d{0,2})/, '($1');
    }
  });