const supabase = window.sbClient;

const clientesList = document.getElementById("clientesList");
const clienteForm = document.getElementById("clienteForm");
const deleteBtn = document.getElementById("deleteBtn");

async function loadClientes() {
    const { data, error } = await supabase.from("clientes").select("*");
    if (error) {
        alert("Erro ao carregar clientes");
        return;
    }
    clientesList.innerHTML = "";
    data.forEach(cliente => {
        const option = document.createElement("option");
        option.value = cliente.id;
        option.textContent = cliente.nome;
        clientesList.appendChild(option);
    });
}

clientesList.addEventListener("change", async () => {
    const id = clientesList.value;
    const { data } = await supabase.from("clientes").select("*").eq("id", id).single();
    document.getElementById("clienteId").value = data.id;
    document.getElementById("nome").value = data.nome;
    document.getElementById("telefone").value = data.telefone;
    document.getElementById("email").value = data.email;
    deleteBtn.style.display = "inline-block";
});

clienteForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("clienteId").value;
    const nome = document.getElementById("nome").value;
    const telefone = document.getElementById("telefone").value;
    const email = document.getElementById("email").value;

    if (id) {
        await supabase.from("clientes").update({ nome, telefone, email }).eq("id", id);
        alert("Cliente atualizado com sucesso!");
    } else {
        await supabase.from("clientes").insert([{ nome, telefone, email }]);
        alert("Cliente cadastrado com sucesso!");
    }
    loadClientes();
    clienteForm.reset();
});

deleteBtn.addEventListener("click", async () => {
    const id = document.getElementById("clienteId").value;
    await supabase.from("clientes").delete().eq("id", id);
    alert("Cliente excluído com sucesso!");
    loadClientes();
    clienteForm.reset();
    deleteBtn.style.display = "none";
});


document.getElementById("refreshBtn").addEventListener("click", loadClientes);

loadClientes();
