// charts/config.js

export const CONFIG = {
  cores: {
    primaria: 'rgba(106, 76, 147, 1)',
    secundaria: 'rgba(75, 192, 192, 1)',
    erro: 'rgba(244, 67, 54, 1)',
  },
  tentativasMaximas: 3,
  intervaloVerificacao: 100
};

/**
 * Verifica se um elemento existe no DOM
 * @param {string} id - ID do elemento
 * @returns {boolean} - True se o elemento existe
 */
export function elementoExiste(id) {
  const elemento = document.getElementById(id);
  if (!elemento) {
    console.error(`Elemento não encontrado: ${id}`);
    return false;
  }
  return true;
}

/**
 * Exibe mensagem de erro em um gráfico
 * @param {string} id - ID do canvas do gráfico
 * @param {string} mensagem - Mensagem de erro
 */
export function mostrarErroGrafico(id, mensagem) {
  const wrapper = document.getElementById(id)?.closest('.chart-wrapper');
  if (wrapper) {
    wrapper.classList.add('erro');
    const errorElement = document.createElement('div');
    errorElement.className = 'mensagem-erro';
    errorElement.textContent = mensagem;
    wrapper.appendChild(errorElement);
  }
}
