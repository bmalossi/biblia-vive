-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 22 — Arquitetura Editorial: Capítulo de Hoje
-- Execute este arquivo no SQL Editor do Supabase (Dashboard → SQL Editor)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Criar tabela de capítulos editoriais ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.editorial_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_name TEXT NOT NULL,
    series_order INT NOT NULL DEFAULT 1,
    chapter_number INT NOT NULL,
    title TEXT NOT NULL,
    intro_text TEXT NOT NULL,
    book_slug TEXT NOT NULL,
    book_name TEXT NOT NULL,
    chapter INT NOT NULL,
    verse_start INT,
    verse_end INT,
    publish_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garantir que a coluna series_order existe em tabelas existentes
ALTER TABLE public.editorial_chapters 
    ADD COLUMN IF NOT EXISTS series_order INT NOT NULL DEFAULT 1;

-- Índices para otimização de busca de publicação e ordenação
CREATE INDEX IF NOT EXISTS idx_editorial_chapters_lookup 
    ON public.editorial_chapters (status, series_order ASC, chapter_number ASC, publish_date DESC);

-- ── 2. Habilitar RLS e criar políticas de acesso ─────────────────────────────
ALTER TABLE public.editorial_chapters ENABLE ROW LEVEL SECURITY;

-- Leitura pública para capítulos publicados
DROP POLICY IF EXISTS "Public can read published editorial chapters" ON public.editorial_chapters;
CREATE POLICY "Public can read published editorial chapters"
    ON public.editorial_chapters FOR SELECT
    USING (status = 'publicado');

-- Controle total (ALL) restrito aos administradores
DROP POLICY IF EXISTS "Admins can manage editorial chapters" ON public.editorial_chapters;
CREATE POLICY "Admins can manage editorial chapters"
    ON public.editorial_chapters FOR ALL
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    )
    WITH CHECK (
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );
