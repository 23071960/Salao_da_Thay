# Mapa dos estilos e referências — Salão da Thay

- `index.html` carrega `styles.css` da raiz e `estilos/graficos.css`.
- `paginas/agenda.html` carrega `../estilos/agenda.css`, que importa `botão_dash.css`.
- `paginas/clientes.html` carrega `../estilos/clientes.css`, que importa `botão_dash.css`.
- `paginas/profis.html` carrega `../estilos/profis.css` e `../estilos/botão_dash.css`.
- `paginas/servicos.html` carrega `../estilos/serviços.css` e `../estilos/botão_dash.css`.

O CSS `styles.css` **não importa** os outros arquivos: o vínculo é feito por elementos `<link>` das páginas. O gráfico usa a cascata combinada de `styles.css` + `estilos/graficos.css`.

Para GitHub Pages mantenha nomes e acentos exatamente como estão no ZIP. Não renomeie `serviços.css` para `servicos.css` sem alterar a referência HTML. O navegador distingue maiúsculas, acentos e caminhos.

Testes: confira no DevTools > Network se todas as requisições CSS retornam 200, atualize com Ctrl+Shift+R, e valide desktop e celular.

Esta revisão não mexe no Supabase, na autenticação ou nas permissões RLS. Não reexecute scripts SQL antigos de limpeza.
