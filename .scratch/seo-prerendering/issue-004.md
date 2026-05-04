## Parent

## What to build

Adicionar geração de `sitemap.xml` ao script de prerender. O sitemap deve listar todas as URLs canônicas da Bíblia + páginas estáticas.

## Acceptance criteria

- [ ] Gera `dist/sitemap.xml` válido
- [ ] Inclui todas as 1.189 URLs de capítulos (`/acf/{slug}/{N}`)
- [ ] Inclui URL da página de Planos (`/planos`)
- [ ] Inclui URL da home (`/`)
- [ ] Usa schema padrão de sitemap com lastmod, changefreq, priority
- [ ] O sitemap é submetível ao Google Search Console

## Blocked by

- #4 (JSON-based Prerender Script)