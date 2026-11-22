function adaptTableForMobile() {
    const table = document.getElementById('clientesTable');
    const container = document.querySelector('.clientes-table-container');
    
    if (window.innerWidth < 768) {
      // Cria container para lista mobile se não existir
      let listContainer = container.querySelector('.clientes-list-mobile');
      
      if (!listContainer) {
        listContainer = document.createElement('div');
        listContainer.className = 'clientes-list-mobile';
        container.appendChild(listContainer);
      }
      
      // Limpa lista existente
      listContainer.innerHTML = '';
      
      // Converte cada linha da tabela em um item de lista
      const rows = table.querySelectorAll('tbody tr');
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const clienteId = row.querySelector('.edit-btn')?.dataset.id;
        
        const item = document.createElement('div');
        item.className = 'cliente-item';
        
        let html = `
          <div class="cliente-info">
            <span class="cliente-label">Nome:</span>
            <span>${cells[0].textContent}</span>
          </div>
          <div class="cliente-info">
            <span class="cliente-label">Telefone:</span>
            <span>${cells[1].textContent}</span>
          </div>
        `;
        
        // Adiciona email se existir na tabela
        if (cells[2]) {
          html += `
            <div class="cliente-info">
              <span class="cliente-label">Email:</span>
              <span>${cells[2].textContent}</span>
            </div>
          `;
        }
        
        // Botões de ação
        html += `
          <div class="cliente-actions">
            <button class="btn-icon edit-btn" data-id="${clienteId}" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon delete-btn" data-id="${clienteId}" title="Excluir">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        `;
        
        item.innerHTML = html;
        listContainer.appendChild(item);
      });
    }
  }
  
  // Executa na carga e ao redimensionar a janela
  window.addEventListener('load', adaptTableForMobile);
  window.addEventListener('resize', adaptTableForMobile);