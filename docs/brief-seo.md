# Brief: SEO e visibilidade para buscadores e IA

## Problema
O Bíblia Vive é um SPA puro (React + Vite). Crawlers do Google e de IA
recebem index.html vazio — sem conteúdo de versículos, sem meta tags 
dinâmicas por rota, sem texto indexável. O site não aparece em buscas
relevantes nem em respostas de IAs.

## Impacto
- Páginas de versículos e planos não aparecem no Google
- Buscas como "plano de leitura bíblica 30 dias" não retornam o site
- IAs como ChatGPT e Perplexity não citam o conteúdo

## Restrição
- Manter React 18 + Vite (sem migrar para Next.js)
- Deploy na Vercel (sem servidor próprio)
- Não quebrar autenticação Supabase nem Stripe existentes

## Hipótese de solução
Prerendering estático das rotas públicas + meta tags dinâmicas por rota