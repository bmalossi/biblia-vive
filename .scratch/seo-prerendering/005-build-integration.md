## Parent

## What to build

Integrar o script de prerender ao pipeline de build e gerar página de Planos.

1. Atualizar `package.json`:
   - `build: "vite build && node scripts/prerender.mjs"`
   - Adicionar `prerender: "node scripts/prerender.mjs"` para desenvolvimento isolado

2. Gerar `dist/planos/index.html` com meta tags estáticas da página de Planos de Leitura

3. Não modificar `vercel.json` - Vercel serve arquivos estáticos com prioridade sobre rewrites automaticamente

## Acceptance criteria

- [ ] `npm run build` executa Vite build + prerender script
- [ ] `npm run prerender` executa apenas o script (sem build)
- [ ] `dist/planos/index.html` contém meta tags preenchidas para Planos
- [ ] deploy no Vercel serve os HTMLs estáticos corretamente

## Blocked by

- #2 (Script de Prerender JSON-based)