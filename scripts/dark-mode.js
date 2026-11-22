// dark-mode.js atualizado

// Funções principais
function aplicarTema(modoEscuro) {
    const body = document.body;
    const temaCSS = document.getElementById('tema-escuro');
    
    if (modoEscuro) {
        body.classList.add('modo-escuro');
        body.classList.remove('modo-claro');
        if (temaCSS) temaCSS.disabled = false;
        localStorage.setItem('modoEscuro', 'true');
    } else {
        body.classList.add('modo-claro');
        body.classList.remove('modo-escuro');
        if (temaCSS) temaCSS.disabled = true;
        localStorage.setItem('modoEscuro', 'false');
    }
    atualizarElementosTema(modoEscuro);
}

function configurarTemaInicial() {
    const temaSalvo = localStorage.getItem('modoEscuro');
    const prefereEscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const modoEscuro = temaSalvo !== null ? temaSalvo === 'true' : prefereEscuro;
    aplicarTema(modoEscuro);
}

function alternarTema(e) {
    if (e) e.preventDefault();
    const estaEscuro = document.body.classList.contains('modo-escuro');
    aplicarTema(!estaEscuro);
}

function atualizarElementosTema(modoEscuro) {
    const botao = document.getElementById('toggle-theme');
    if (botao) {
        const icone = botao.querySelector('#theme-icon') || botao;
        const texto = botao.querySelector('#theme-text');
        
        if (modoEscuro) {
            if (icone) icone.textContent = '☀️';
            if (texto) texto.textContent = 'Modo Claro';
        } else {
            if (icone) icone.textContent = '🌙';
            if (texto) texto.textContent = 'Modo Escuro';
        }
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    configurarTemaInicial();
    
    const botaoTema = document.getElementById('toggle-theme');
    if (botaoTema) {
        botaoTema.addEventListener('click', alternarTema);
    }
    
    window.matchMedia('(prefers-color-scheme: dark)').addListener((e) => {
        if (localStorage.getItem('modoEscuro') === null) {
            aplicarTema(e.matches);
        }
    });
});

// Exporte as funções para acesso global (opcional)
window.aplicarTema = aplicarTema;
window.alternarTema = alternarTema;