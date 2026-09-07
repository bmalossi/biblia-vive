-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 28 — Última Visualização por Capítulo
-- Execute este arquivo no SQL Editor do Supabase
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Tabela chapter_views ───────────────────────────────────────────────────
-- Uma linha por (user_id, book_id, chapter) → última visualização.
-- UPSERT atualiza viewed_at; não armazena histórico, apenas a data mais recente.

CREATE TABLE IF NOT EXISTS public.chapter_views (
  user_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id   TEXT        NOT NULL,
  chapter   INTEGER     NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, book_id, chapter)
);

ALTER TABLE public.chapter_views ENABLE ROW LEVEL SECURITY;

-- RLS: cada usuário lê/grava apenas suas próprias linhas
DROP POLICY IF EXISTS "Users manage own chapter views" ON public.chapter_views;
CREATE POLICY "Users manage own chapter views"
  ON public.chapter_views FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índice para buscar todas as visualizações de um livro de um usuário
CREATE INDEX IF NOT EXISTS idx_chapter_views_user_book
  ON public.chapter_views (user_id, book_id);
