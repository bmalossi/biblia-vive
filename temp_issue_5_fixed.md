## Parent

https://github.com/bmalossi/biblia-vive/issues/9

## What to build

Criar serverless function /api/publish-article que persiste o Artigo no Supabase e dispara POST no Deploy Hook da Vercel para rebuild automático.

## Acceptance criteria

- [ ] Endpoint /api/publish-article criado em api/publish-article.ts
- [ ] Recebe dados do artigo e salva/atualiza no Supabase
- [ ] Faz POST para VERCEL_DEPLOY_HOOK_URL após persistência
- [ ] Retorna erro 500 se deploy hook falhar (mas salva artigo)
- [ ] Variável VERCEL_DEPLOY_HOOK_URL configurada no Vercel

## Blocked by

- https://github.com/bmalossi/biblia-vive/issues/12 (Criar tabela articles no Supabase)