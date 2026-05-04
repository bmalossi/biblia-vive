# Stack: Vite + React + Supabase + Vercel

O produto é uma SPA (Single Page Application) construída com Vite + React + TypeScript, hospedada na Vercel, com Supabase como backend (autenticação, banco de dados PostgreSQL, Edge Functions e Realtime). Stripe é integrado via Edge Functions do Supabase para pagamentos.

Essa combinação foi escolhida por permitir entrega rápida sem operação de infraestrutura própria: Vercel gerencia o deploy e CDN, Supabase substitui um backend completo. A decisão implica lock-in em ambas as plataformas — migrar banco ou hosting seria custoso.

## Considered Options

- Next.js no lugar de Vite: descartado por adicionar complexidade de SSR desnecessária para o caso de uso (conteúdo bíblico está no bundle local, não precisa de SSR para SEO do texto).
- Backend próprio no lugar de Supabase: descartado por custo operacional e velocidade de entrega.
