-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 21 — Reforço de E-E-A-T: Cadastro de Autores e Revisão Pastoral
-- Execute este arquivo no SQL Editor do Supabase (Dashboard → SQL Editor)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Criar tabela de autores ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.article_authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    bio TEXT NOT NULL DEFAULT '',
    church TEXT,
    city TEXT,
    role TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Habilitar RLS e criar políticas de acesso ──────────────────────────
ALTER TABLE public.article_authors ENABLE ROW LEVEL SECURITY;

-- Leitura pública para todos (Visitantes e Leitores)
DROP POLICY IF EXISTS "Public can read article authors" ON public.article_authors;
CREATE POLICY "Public can read article authors"
    ON public.article_authors FOR SELECT
    USING (true);

-- Controle total apenas para administradores
DROP POLICY IF EXISTS "Admins can manage article authors" ON public.article_authors;
CREATE POLICY "Admins can manage article authors"
    ON public.article_authors FOR ALL
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    )
    WITH CHECK (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

-- ── 3. Relacionamento e Revisão na tabela de artigos ─────────────────────────
ALTER TABLE public.articles
    ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.article_authors(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reviewed_by TEXT;

CREATE INDEX IF NOT EXISTS idx_articles_author_id ON public.articles(author_id);
