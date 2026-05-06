-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 17 — Sistema de Artigos
-- Cria tabela de artigos para publicação editorial com SEO e prerender.
-- Execute este arquivo no SQL Editor do Supabase.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Criar tabela articles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    body TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado')),
    meta_title TEXT,
    meta_description TEXT,
    cover_image_url TEXT,
    featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- ── 2. Criar índice para busca por status e published_at ───────────────────
CREATE INDEX IF NOT EXISTS idx_articles_status_published
    ON public.articles(status, published_at DESC);

-- ── 3. Row Level Security (RLS) ────────────────────────────────────────────
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can read published articles
CREATE POLICY "Public can read published articles"
    ON public.articles FOR SELECT
    USING (status = 'publicado');

-- Policy: only admins can do everything
CREATE POLICY "Admins can do everything"
    ON public.articles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND (raw_app_meta_data->>'role') = 'admin'
        )
    );

-- ── Verificação ────────────────────────────────────────────────────────────
-- Execute após aplicar para confirmar:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'articles'
-- ORDER BY ordinal_position;

-- ── 4. Deploy Hook URL (para rebuild automático na Vercel) ───────────────
-- A API /api/publish-article usará esta variável server-side.
-- Configure VERCEL_DEPLOY_HOOK_URL nas Environment Variables do projeto.
-- Valor esperado: https://api.vercel.com/v1/integrations/deploy/prj_xxx/hook_xxx