// Cliente público do Supabase. Nunca coloque service_role/sb_secret aqui.
(function () {
  if (window.sbClient) return;
  const factory = window.supabase; // biblioteca UMD carregada antes deste arquivo
  if (!factory || typeof factory.createClient !== 'function') {
    throw new Error('Biblioteca Supabase JS indisponível');
  }
  const url = 'https://hufrtioqiywncqghboal.supabase.co';
  const publishableKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZnJ0aW9xaXl3bmNxZ2hib2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxODE3MTksImV4cCI6MjA2MDc1NzcxOX0.SNwH57bVGYwspmsDkRi5kwvZcTiwPba0NOobT-kFko8';
  window.sbClient = factory.createClient(url, publishableKey);
  // Compatibilidade com os scripts preexistentes.
  window.supabase = window.sbClient;
  window.dispatchEvent(new Event('supabaseReady'));
})();
