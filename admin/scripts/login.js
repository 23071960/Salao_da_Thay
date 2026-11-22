const form = document.getElementById('loginForm');
const message = document.getElementById('message');
if (new URLSearchParams(location.search).get('erro') === 'permissao') {
  message.textContent = 'Esta conta não possui autorização administrativa.';
}
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = document.getElementById('enter');
  button.disabled = true; message.textContent = '';
  try {
    const {error} = await window.sbClient.auth.signInWithPassword({
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value
    });
    if (error) throw error;
    const {data: allowed, error: checkError} = await window.sbClient.rpc('is_admin');
    if (checkError) throw checkError;
    if (allowed !== true) {
      await window.sbClient.auth.signOut();
      throw new Error('Conta sem autorização administrativa.');
    }
    location.replace('index.html');
  } catch (err) {
    message.textContent = err.message || 'Falha no login.';
  } finally {button.disabled = false;}
});
