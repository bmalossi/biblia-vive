## Parent

https://github.com/bmalossi/biblia-vive/issues/9

## What to build

Criar a tabela `articles` no Supabase com todos os campos necessários para persistência de artigos: id (uuid), title, slug (unique), body (Markdown), status (rascunho/publicado), meta_title, meta_description, cover_image_url (nullable), featured (boolean), created_at, published_at.

## Acceptance criteria

- [ ] Tabela `articles` criada no Supabase com os campos especificados
- [ ] Slug configurado como unique constraint
- [ ] Status com constraint de enum (rascunho | publicado)
- [ ] Row Level Security configurada (admin pode fazer tudo, usuários públicos podem ler apenas publicados)

## Blocked by

None - can start immediately