-- =============================================================================
-- Sprint 32 — Estúdio Homilético: Persistência na Conta do Usuário (Supabase)
-- Execute este arquivo no SQL Editor do Supabase Dashboard para sincronizar
-- sermões e histórico de pregação entre Web, Mobile (App) e outros dispositivos.
-- =============================================================================

-- 1. Tabela de Sermões (Estudo Homilético 3x4)
CREATE TABLE IF NOT EXISTS public.sermons (
  id                        TEXT PRIMARY KEY,
  user_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inspiration_note_id       TEXT,
  title                     TEXT NOT NULL,
  book_id                   TEXT,
  book_name                 TEXT,
  chapter                   INTEGER,
  verse                     INTEGER,
  version                   TEXT DEFAULT 'acf',
  spark_text                TEXT,
  status                    TEXT NOT NULL DEFAULT 'draft',
  desfecho_tipo             TEXT,
  desfecho_texto            TEXT,
  bloco_1_exegese           TEXT,
  bloco_1_intencao_original TEXT,
  bloco_2_topicos           JSONB DEFAULT '[]'::jsonb,
  bloco_3_aplicacao         TEXT,
  introducao                TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Índices de Otimização
CREATE INDEX IF NOT EXISTS idx_sermons_user_id ON public.sermons(user_id);
CREATE INDEX IF NOT EXISTS idx_sermons_updated_at ON public.sermons(updated_at DESC);

-- 3. Row Level Security (RLS) para Sermões
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sermons" ON public.sermons;
CREATE POLICY "Users can view own sermons"
  ON public.sermons FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sermons" ON public.sermons;
CREATE POLICY "Users can insert own sermons"
  ON public.sermons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sermons" ON public.sermons;
CREATE POLICY "Users can update own sermons"
  ON public.sermons FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sermons" ON public.sermons;
CREATE POLICY "Users can delete own sermons"
  ON public.sermons FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Tabela de Histórico de Pós-Pregação
CREATE TABLE IF NOT EXISTS public.preaching_logs (
  id            TEXT PRIMARY KEY,
  sermon_id     TEXT NOT NULL REFERENCES public.sermons(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  church_name   TEXT NOT NULL,
  city          TEXT NOT NULL,
  preached_at   TIMESTAMPTZ NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Índices para Histórico de Pregação
CREATE INDEX IF NOT EXISTS idx_preaching_logs_user_id ON public.preaching_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_preaching_logs_sermon_id ON public.preaching_logs(sermon_id);

-- 6. Row Level Security (RLS) para Preaching Logs
ALTER TABLE public.preaching_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preaching logs" ON public.preaching_logs;
CREATE POLICY "Users can view own preaching logs"
  ON public.preaching_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preaching logs" ON public.preaching_logs;
CREATE POLICY "Users can insert own preaching logs"
  ON public.preaching_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preaching logs" ON public.preaching_logs;
CREATE POLICY "Users can update own preaching logs"
  ON public.preaching_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own preaching logs" ON public.preaching_logs;
CREATE POLICY "Users can delete own preaching logs"
  ON public.preaching_logs FOR DELETE
  USING (auth.uid() = user_id);
