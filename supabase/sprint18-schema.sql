-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 18 — Schema: Comentários Teológicos Manuais (Corrigido)
-- Execute este script no SQL Editor do Supabase para criar/corrigir a tabela
-- e as permissões RLS sem causar "permission denied for table users".
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Criar a tabela caso ainda não exista
CREATE TABLE IF NOT EXISTS public.manual_commentaries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verse_id        TEXT NOT NULL,    -- 'JHN.3.16' ou 'JHN.3.ALL' (sem sufixo de lang)
  question_type   TEXT NOT NULL CHECK (question_type IN ('commentary', 'chapter_commentary')),
  language        TEXT NOT NULL CHECK (language IN ('pt', 'en', 'es')),
  author          TEXT NOT NULL,
  era             TEXT,
  tradition       TEXT,
  work            TEXT,
  year            TEXT,
  original_language TEXT,
  text            TEXT NOT NULL,
  source_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID REFERENCES auth.users(id)
);

-- 2. Criar índice para buscas otimizadas
CREATE INDEX IF NOT EXISTS idx_manual_commentaries_lookup
  ON public.manual_commentaries(verse_id, question_type, language);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.manual_commentaries ENABLE ROW LEVEL SECURITY;

-- 4. Remover policies antigas para recriar de forma limpa
DROP POLICY IF EXISTS "Public can read manual commentaries" ON public.manual_commentaries;
DROP POLICY IF EXISTS "Admins can manage manual commentaries" ON public.manual_commentaries;

-- 5. Criar policy de Leitura Pública (Permite anon e authenticated lerem)
CREATE POLICY "Public can read manual commentaries"
  ON public.manual_commentaries
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 6. Criar policy de Gerenciamento do Admin (Corrigida para usar auth.jwt())
-- Evita a consulta direta à tabela auth.users, que causa erro de permissão.
CREATE POLICY "Admins can manage manual commentaries"
  ON public.manual_commentaries
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 7. Conceder permissões explícitas de tabelas para as roles correspondentes
GRANT SELECT ON public.manual_commentaries TO anon, authenticated;
GRANT ALL ON public.manual_commentaries TO authenticated;
