// Inicializa aplicações administrativas SOMENTE após sessão e autorização RPC.
(() => {
  const loginUrl = location.pathname.includes('/paginas/') ? '../login.html' : 'login.html';
  const scripts = location.pathname.endsWith('/clientes.html')
    ? ['../scripts/clientes.js']
    : location.pathname.endsWith('/agenda.html')
    ? ['../scripts/agenda.js']
    : location.pathname.endsWith('/profis.html')
    ? ['../scripts/profis.js']
    : location.pathname.endsWith('/servicos.html')
    ? ['../scripts/serviços.js']
    : ['charts/metricas.js', 'charts/agendamentos.js', 'charts/servicos.js',
       'charts/perfil_emocional.js', 'scripts/main.js'];

  function loadScript(src, isModule = false) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      if (isModule) script.type = 'module';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Falha ao carregar '+src));
      document.body.appendChild(script);
    });
  }

  async function start() {
    try {
      const client = window.sbClient;
      if (!client) throw new Error('Cliente Supabase não iniciado.');
      const {data: {user}, error: authError} = await client.auth.getUser();
      if (authError || !user) { location.replace(loginUrl); return; }
      const {data: isAdmin, error: roleError} = await client.rpc('is_admin');
      if (roleError) throw roleError;
      if (isAdmin !== true) {
        await client.auth.signOut();
        location.replace(loginUrl + '?erro=permissao');
        return;
      }
      const header = document.querySelector('.user-profile');
      if (header) {
        const logout = document.createElement('button');
        logout.textContent = 'Sair';
        logout.type = 'button';
        logout.style.cssText = 'margin-left:12px;padding:8px 14px;cursor:pointer;border-radius:8px;border:1px solid #999';
        logout.addEventListener('click', async () => {
          await client.auth.signOut(); location.replace(loginUrl);
        });
        header.append(logout);
      }
      // Primeiro carrega scripts legados, depois dispara seu evento de inicialização.
      for (const file of scripts) await loadScript(file, file.endsWith('/clientes.js'));
      document.documentElement.style.visibility = 'visible';
      document.dispatchEvent(new Event('DOMContentLoaded'));
    } catch (error) {
      console.error('Falha na proteção administrativa:', error);
      document.body.textContent = 'Não foi possível verificar a autorização administrativa. Confira a função public.is_admin no Supabase e a conexão.';
      document.documentElement.style.visibility = 'visible';
    }
  }
  document.addEventListener('DOMContentLoaded', start, {once:true});
})();
