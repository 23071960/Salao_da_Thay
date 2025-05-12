// supabase.js - Versão global sem módulos
document.addEventListener('DOMContentLoaded', function() {
    // Configuração do Supabase
    const supabaseUrl = 'https://hufrtioqiywncqghboal.supabase.co'; // Substitua pela sua URL
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZnJ0aW9xaXl3bmNxZ2hib2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxODE3MTksImV4cCI6MjA2MDc1NzcxOX0.SNwH57bVGYwspmsDkRi5kwvZcTiwPba0NOobT-kFko8'; // Substitua pela sua chave
    
    // Cria a instância global do Supabase
    window.supabase = supabase.createClient(supabaseUrl, supabaseKey);
    console.log('Supabase configurado com sucesso!');
});