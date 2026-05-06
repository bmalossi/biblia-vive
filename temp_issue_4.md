## Parent

https://github.com/bmalossi/biblia-vive/issues/9

## What to build

Criar página Admin de Artigos (/admin/artigos) com CRUD completo: listagem de artigos, criação, edição com preview Markdown ao vivo, publicação, toggle featured, e exclusão.

## Acceptance criteria

- [ ] Nova página AdminArtigosPage.tsx em src/pages/
- [ ] Rota /admin/artigos configurada no App.tsx
- [ ] Listagem de artigos com status (rascunho/publicado), featured toggle
- [ ] Formulário de criação com campos: title, slug (auto-gerado editável), body (Markdown), meta_title, meta_description, cover_image_url, featured
- [ ] Preview Markdown ao vivo no formulário
- [ ] Botão Publicar que atualiza status para 'publicado'
- [ ] Botão Excluir com confirmação
- [ ] Protegida por guard de admin existente

## Blocked by

- https://github.com/bmalossi/biblia-vive/issues/12 (Criar tabela articles no Supabase)
- https://github.com/bmalossi/biblia-vive/issues/13 (Criar utilitário de geração de Slug)
- https://github.com/bmalossi/biblia-vive/issues/14 (Expandir Admin Hub com links)