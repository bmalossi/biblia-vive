-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 7 — Notas & Destaques Pessoais
-- Execute este arquivo no SQL Editor do Supabase
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Destaques por versículo ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_highlights (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id    text        NOT NULL,
  chapter    integer     NOT NULL,
  verse      integer     NOT NULL,
  color      text        NOT NULL CHECK (color IN ('yellow','blue','green','pink','purple')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id, chapter, verse)
);

ALTER TABLE public.user_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own highlights"
  ON public.user_highlights
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_highlights_lookup
  ON public.user_highlights (user_id, book_id, chapter);

-- ── Notas por versículo ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_notes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id    text        NOT NULL,
  chapter    integer     NOT NULL,
  verse      integer     NOT NULL,
  content    text        NOT NULL,
  book_name  text,                         -- nome exibível ex: "João"
  version    text,                         -- versão bíblica ex: "acf"
  verse_text text,                         -- trecho do versículo para exibir na lista
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id, chapter, verse)
);

ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notes"
  ON public.user_notes
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notes_lookup
  ON public.user_notes (user_id, book_id, chapter);

CREATE INDEX IF NOT EXISTS idx_notes_date
  ON public.user_notes (user_id, updated_at DESC);

-- ── Trigger para atualizar updated_at automaticamente ────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notes_updated_at ON public.user_notes;
CREATE TRIGGER trg_notes_updated_at
  BEFORE UPDATE ON public.user_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
