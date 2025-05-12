// agendamento_redirect.js
document.querySelectorAll('.btn-agendar').forEach(btn => {
  btn.addEventListener('click', () => {
    const nome = btn.dataset.nome;
    const telefone = btn.dataset.telefone;

    sessionStorage.setItem('dadosClienteParaAgendamento', JSON.stringify({ nome, telefone }));
    window.location.href = '/agendamentos.html';
  });
});
