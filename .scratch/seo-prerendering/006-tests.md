## Parent

## What to build

Adicionar testes unitários para o script de prerender usando Vitest. Os testes validam comportamento externo (HTML gerado), não detalhes de implementação.

## Acceptance criteria

- [ ] Dado JSON mockado de livro (ex: 2 capítulos), o script gera exatamente 2 arquivos HTML
- [ ] HTML gerado contém `<title>` com formato "{BookName} {N} — ACF | Bíblia Vive"
- [ ] HTML gerado contém `<link rel="canonical">` com URL canônica absoluta
- [ ] HTML gerado contém `<script type="application/ld+json">` com @type: "Chapter", position e text corretos
- [ ] `sitemap.xml` gerado contém todas as URLs canônicas esperadas

## Blocked by

- #2 (Script de Prerender JSON-based)