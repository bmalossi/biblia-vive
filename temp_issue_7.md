## Parent

https://github.com/bmalossi/biblia-vive/issues/9

## What to build

Criar página pública de listagem de artigos (/artigos) que exibe todos os Artigos Publicados em formato de cards, ordenados por published_at desc.

## Acceptance criteria

- [ ] Nova página ArtigosIndexPage.tsx em src/pages/
- [ ] Rota /artigos configurada no App.tsx (sem slug)
- [ ] Lista todos os artigos com status='publicado'
- [ ] Ordenado por published_at desc
- [ ] Exibe cards com title, description/extract, cover_image (se disponível)
- [ ] Cada card é link para /artigos/[slug]
- [ ] Linkada no footer ou menu de navegação

## Blocked by

- https://github.com/bmalossi/biblia-vive/issues/12 (Criar tabela articles no Supabase)