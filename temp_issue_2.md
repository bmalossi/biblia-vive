## Parent

https://github.com/bmalossi/biblia-vive/issues/9

## What to build

Criar utilitário TypeScript que converte título em Slug: lowercase, replace spaces with hyphens, remove special chars. Deve ser usado tanto pelo Admin de Artigos quanto pelo script de prerender.

## Acceptance criteria

- [ ] Função utilitária criada em src/lib/utils/slug.ts
- [ ] Função exportada como `generateSlug(title: string): string`
- [ ] Coversão correta: "Como orar todos os dias" → "como-orar-todos-os-dias"
- [ ] Remove acentos e caracteres especiais
- [ ] Testes unitários básicos (opcional)

## Blocked by

None - can start immediately