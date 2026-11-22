// Exemplo de função de backup automático
async function backupServicos() {
  const { data } = await supabase.from("servicos").select("*");
  localStorage.setItem('backup', JSON.stringify(data));
}