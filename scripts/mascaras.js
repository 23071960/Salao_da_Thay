document.addEventListener('DOMContentLoaded', () => {
  // Máscara para o campo de telefone
  IMask(document.getElementById('agendamento-telefone'), {
    mask: '(00) 00000-0000'
  });

  // Máscara para o campo de data de nascimento
  IMask(document.getElementById('agendamento-data-nascimento'), {
    mask: '00/00/0000'
  });
});


