-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 26 — Memorial da Caminhada (Evolução do Caderno)
-- Execute este arquivo no SQL Editor do Supabase
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Ajustar restrições e colunas da tabela user_notes ─────────────────────

-- Remover a restrição de unicidade por versículo (permite múltiplos registros e registros em nível de capítulo)
ALTER TABLE public.user_notes
  DROP CONSTRAINT IF EXISTS user_notes_user_id_book_id_chapter_verse_key;

-- Permitir versículo ser opcional (NULL = nota/registro de capítulo)
ALTER TABLE public.user_notes
  ALTER COLUMN verse DROP NOT NULL;

-- ── 2. Adicionar novas colunas para o Memorial ────────────────────────────────

ALTER TABLE public.user_notes
  ADD COLUMN IF NOT EXISTS type          text        NOT NULL DEFAULT 'reflection'
                                                     CHECK (type IN ('reflection', 'prayer', 'testimony', 'fasting')),
  ADD COLUMN IF NOT EXISTS title         text,
  ADD COLUMN IF NOT EXISTS status        text,
  ADD COLUMN IF NOT EXISTS favorite      boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS answered_at   timestamptz,
  ADD COLUMN IF NOT EXISTS answered_note text,
  ADD COLUMN IF NOT EXISTS tags          text[]      NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS metadata      jsonb       NOT NULL DEFAULT '{}'::jsonb;

-- ── 3. Migrar registros antigos para tipo 'reflection' ───────────────────────

UPDATE public.user_notes
SET type = 'reflection'
WHERE type IS NULL;

-- ── 4. Índices para otimização de busca e filtros no Memorial ────────────────

CREATE INDEX IF NOT EXISTS idx_user_notes_user_type
  ON public.user_notes (user_id, type, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_notes_user_favorite
  ON public.user_notes (user_id, favorite)
  WHERE favorite = true;

CREATE INDEX IF NOT EXISTS idx_user_notes_type
  ON public.user_notes (type);
