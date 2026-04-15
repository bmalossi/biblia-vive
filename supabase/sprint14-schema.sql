-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 14 — Painel de Estudo: correções de schema + expansão de highlights
-- Execute este arquivo no SQL Editor do Supabase
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Garantir colunas opcionais em user_notes (podem não existir se a tabela
--    foi criada antes do sprint7-schema ser aplicado corretamente) ───────────
ALTER TABLE public.user_notes
  ADD COLUMN IF NOT EXISTS book_name  text,
  ADD COLUMN IF NOT EXISTS version    text,
  ADD COLUMN IF NOT EXISTS verse_text text;

-- ── Garantir constraint única em user_notes (necessária para upsert seguro) ─
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.user_notes'::regclass
      AND contype = 'u'
      AND conname = 'user_notes_user_id_book_id_chapter_verse_key'
  ) THEN
    ALTER TABLE public.user_notes
      ADD CONSTRAINT user_notes_user_id_book_id_chapter_verse_key
      UNIQUE (user_id, book_id, chapter, verse);
  END IF;
END $$;

-- ── Expandir user_highlights com colunas de contexto ─────────────────────────
ALTER TABLE public.user_highlights
  ADD COLUMN IF NOT EXISTS book_name  text,
  ADD COLUMN IF NOT EXISTS version    text,
  ADD COLUMN IF NOT EXISTS verse_text text;

-- ── Garantir constraint única em user_highlights ──────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.user_highlights'::regclass
      AND contype = 'u'
      AND conname = 'user_highlights_user_id_book_id_chapter_verse_key'
  ) THEN
    ALTER TABLE public.user_highlights
      ADD CONSTRAINT user_highlights_user_id_book_id_chapter_verse_key
      UNIQUE (user_id, book_id, chapter, verse);
  END IF;
END $$;

-- ── Índice para consulta global de highlights por usuário ─────────────────────
CREATE INDEX IF NOT EXISTS idx_highlights_global
  ON public.user_highlights (user_id, created_at DESC);

-- ── Índice para consulta global de notas por usuário ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_notes_global
  ON public.user_notes (user_id, updated_at DESC);
