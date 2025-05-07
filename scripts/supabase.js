// supabase.js
const SUPABASE_URL = "https://hufrtioqiywncqghboal.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZnJ0aW9xaXl3bmNxZ2hib2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxODE3MTksImV4cCI6MjA2MDc1NzcxOX0.SNwH57bVGYwspmsDkRi5kwvZcTiwPba0NOobT-kFko8";

window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
