## Parent

## What to build

Adicionar 10 placeholders SEO como comentários HTML no `<head>` do `index.html`. Os placeholders são: `META_TITLE`, `META_DESCRIPTION`, `CANONICAL_URL`, `OG_URL`, `OG_TYPE`, `OG_TITLE`, `OG_DESCRIPTION`, `OG_IMAGE`, `TWITTER_CARD`, `JSON_LD`.

O `usePageMeta` continua inalterado - os placeholders são substituídos apenas pelo script de prerender, não afetando usuários reais no browser.

## Acceptance criteria

- [ ] Os 10 placeholders estão posicionados corretamente no `<head>` do `index.html`
- [ ] Os placeholders são comentários HTML (`<!--META_TITLE-->`) para não quebrar o HTML
- [ ] O `usePageMeta` continua funcionando semmodificações para usuários reais
- [ ] O template `dist/index.html` após build contém os placeholders intactos

## Blocked by

None - can start immediately