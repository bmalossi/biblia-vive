## Parent

https://github.com/bmalossi/biblia-vive/issues/9

## What to build

Criar componente Carrossel de Artigos na HomePage que exibe artigos em destaque ou recentes.

## Acceptance criteria

- [ ] Componente CarrosselArtigos.tsx criado em src/components/
- [ ] Prioriza artigos com featured=true
- [ ] Ordenado por published_at desc
- [ ] Limite de 6 itens
- [ ] Fallback: se nenhum artigo em destaque, mostra os 6 mais recentes
- [ ] Exibe título e Imagem de Capa de cada artigo
- [ ] Cada card é link para /artigos/[slug]
- [ ] Integrado na HomePage.tsx

## Blocked by

- https://github.com/bmalossi/biblia-vive/issues/12 (Criar tabela articles no Supabase)