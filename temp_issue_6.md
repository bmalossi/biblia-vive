## Parent

https://github.com/bmalossi/biblia-vive/issues/9

## What to build

Criar página pública de Artigo (/artigos/[slug]) que renderiza o Corpo do Artigo via react-markdown, com meta tags SEO dinâmicos e Imagem de Capa.

## Acceptance criteria

- [ ] Nova página ArtigoPage.tsx em src/pages/
- [ ] Rota /artigos/:slug configurada no App.tsx
- [ ] Renderiza body via react-markdown
- [ ] Meta tags dinâmicos (meta_title, meta_description) injetados no head
- [ ] Exibe Imagem de Capa se cover_image_url presente
- [ ] Trata 404 para Slugs inexistentes ou rascunhos
- [ ] Acesso público (Visitantes e Leitores)

## Blocked by

- https://github.com/bmalossi/biblia-vive/issues/12 (Criar tabela articles no Supabase)
- https://github.com/bmalossi/biblia-vive/issues/13 (Criar utilitário de geração de Slug)