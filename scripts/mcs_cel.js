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
  function formatarData(input) {
    // Remove tudo que não é dígito
    let valor = input.value.replace(/\D/g, '');
    
    // Aplica a máscara: dd/mm/aaaa
    if (valor.length > 4) {
      valor = valor.replace(/^(\d{2})(\d{2})(\d{0,4})/, '$1/$2/$3');
    } else if (valor.length > 2) {
      valor = valor.replace(/^(\d{2})(\d{0,2})/, '$1/$2');
    }
    
    input.value = valor;
  }

  // Validação ao enviar o formulário
  document.querySelector("form").addEventListener("submit", function(e) {
    const dataInput = document.querySelector("input[name='nascimento']");
    const regexData = /^\d{2}\/\d{2}\/\d{4}$/;
    
    if (!regexData.test(dataInput.value)) {
      alert("Data inválida! Use o formato dd/mm/aaaa.");
      e.preventDefault(); // Impede o envio
      dataInput.focus();
    }
  });

 
  
  // Modifique o listener do formulário:
  document.querySelector("form").addEventListener("submit", function(e) {
    const dataInput = document.querySelector("input[name='nascimento']");
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dataInput.value) || 
        !validarDataReal(dataInput.value)) {
      alert("Data inválida ou inexistente!");
      e.preventDefault();
    }
  });
  

  
