-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 31 — Palavras-chave Primárias e Secundárias para Artigos (SEO & GEO)
-- Adiciona suporte a palavra-chave foco e palavras-chave secundárias (entidades)
-- para enriquecer Schema.org JSON-LD, relevância semântica e IA Generativa (GEO).
-- Execute este arquivo no SQL Editor do Supabase.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Adicionar colunas primary_keyword e secondary_keywords na tabela articles
ALTER TABLE public.articles
    ADD COLUMN IF NOT EXISTS primary_keyword TEXT,
    ADD COLUMN IF NOT EXISTS secondary_keywords TEXT[] DEFAULT '{}';

-- 2. Criar índices para busca e filtros rápidos por palavras-chave
CREATE INDEX IF NOT EXISTS idx_articles_primary_keyword 
    ON public.articles(primary_keyword);

CREATE INDEX IF NOT EXISTS idx_articles_secondary_keywords 
    ON public.articles USING GIN (secondary_keywords);

-- Comentários descritivos nas colunas
COMMENT ON COLUMN public.articles.primary_keyword IS 'Palavra-chave foco / termo principal de busca (SEO & GEO)';
COMMENT ON COLUMN public.articles.secondary_keywords IS 'Palavras-chave secundárias, variações semânticas e entidades relacionadas';
