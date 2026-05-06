# ADR 0007 — Deploy Hook para publicação de Artigos

**Status:** Aceito  
**Data:** 2026-05-04

## Contexto

O Bíblia Vive é um SPA estático (Vite + React) com prerendering gerado no build. Para que uma página de Artigo seja indexável pelo Google, o HTML estático precisa existir antes da visita do crawler — o que exige um novo build a cada Artigo publicado.

## Decisão

Ao publicar um Artigo, o Admin de Artigos chama a serverless function `/api/publish-article`, que:
1. Persiste o Artigo no Supabase (`status = 'publicado'`)
2. Faz POST no Deploy Hook da Vercel (`VERCEL_DEPLOY_HOOK_URL`)

Isso dispara um novo build (~2 min) que executa o `prerender.mjs` atualizado, gerando o HTML estático da nova rota `/artigos/[slug]`.

## Alternativas consideradas

| Alternativa | Motivo de rejeição |
|---|---|
| Deploy manual pelo admin | Depende de ação humana fora do painel; propenso a esquecimento |
| ISR (Incremental Static Regeneration) | Não suportado pelo Vite SPA; exigiria migração de framework |
| Script separado de prerender | Aumenta complexidade de manutenção sem benefício real |

## Consequências

- **Positivo:** Publicação totalmente automatizada sem intervenção fora do painel
- **Positivo:** Consistente com a infraestrutura Vercel já existente
- **Negativo:** ~2 min de lag entre publicação e disponibilidade pública do HTML estático
- **Atenção:** A URL do Deploy Hook é segreta (server-side only). Nunca expor no frontend ou commitar no repositório.
