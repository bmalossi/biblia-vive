## Parent

https://github.com/bmalossi/biblia-vive/issues/9

## What to build

Estender o script prerender.mjs existente para iterar sobre Artigos Publicados no Supabase e gerar HTML estático para cada rota /artigos/[slug].

## Acceptance criteria

- [ ] Script faz fetch na tabela articles filtrando por status='publicado'
- [ ] Gera HTML estático em dist/artigos/[slug]/index.html para cada artigo
- [ ] Usa meta_title e meta_description do artigo para SEO tags
- [ ] Fallback graceful: se query falhar, log warning mas continua prerendering de capítulos
- [ ] Inclui artigos no sitemap.xml gerado

## Blocked by

- https://github.com/bmalossi/biblia-vive/issues/12 (Criar tabela articles no Supabase)