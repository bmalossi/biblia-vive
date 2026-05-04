## Parent

## What to build

Criar `scripts/prerender.mjs` que:
1. Lê `dist/index.html` como template base
2. Lê `src/data/books.json` para obter os 66 livros (slugs, nomes, contagem de capítulos)
3. Para cada livro, lê o JSON local em `public/bible/pt-br/acf/{slug}/{slug}.json`
4. Gera `dist/acf/{slug}/{N}/index.html` para cada capítulo (≈1.189 arquivos)
5. Substitui todos os 10 placeholders SEO por valores dinâmicos por capítulo
6. Imprime relatório ao final com contagem de arquivos gerados

## Acceptance criteria

- [ ] Script executa via `node scripts/prerender.mjs` sem argumentos obrigatórios
- [ ] Gera exatamente 1.189 arquivos HTML (66 livros × capítulos)
- [ ] Cada HTML gerado contém `<title>` formatado como "{BookName} {N} — ACF | Biblia Vive"
- [ ] Cada HTML contém `<meta name="description">` com texto do capítulo
- [ ] Cada HTML contém `<link rel="canonical">` apontando para URL canônica absoluta
- [ ] Relatório final打印a contagem de capítulos gerados

## Blocked by

- #3 (SEO Placeholders em index.html)