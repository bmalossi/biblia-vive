-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 19 — Schema: Caderno do Capítulo (Chapter Notebook)
-- Execute este script no SQL Editor do Supabase para criar a tabela
-- e as permissões RLS correspondentes.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Criar a tabela caso ainda não exista
CREATE TABLE IF NOT EXISTS public.chapter_notebooks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title               TEXT,                         -- título personalizado (nullable)
  content             TEXT NOT NULL,                -- conteúdo anotado
  book_id             TEXT NOT NULL,                -- slug/ID do livro ex: 'GEN' ou 'romanos'
  chapter             INTEGER NOT NULL,             -- número do capítulo
  version             TEXT NOT NULL,                -- versão bíblica ex: 'acf' ou 'nvi'
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.chapter_notebooks ENABLE ROW LEVEL SECURITY;

-- 3. Remover policies antigas para recriar de forma limpa
DROP POLICY IF EXISTS "Users manage own notebooks" ON public.chapter_notebooks;

-- 4. Criar policy para gerenciar próprios cadernos (Permite select, insert, update, delete pelo dono)
CREATE POLICY "Users manage own notebooks"
  ON public.chapter_notebooks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Criar índices para otimização de buscas
CREATE INDEX IF NOT EXISTS idx_notebooks_lookup
  ON public.chapter_notebooks (user_id, book_id, chapter);

CREATE INDEX IF NOT EXISTS idx_notebooks_date
  ON public.chapter_notebooks (user_id, updated_at DESC);

-- 6. Associar o trigger de updated_at automático
-- Nota: A função public.set_updated_at() já foi criada na Sprint 7.
DROP TRIGGER IF EXISTS trg_notebooks_updated_at ON public.chapter_notebooks;
CREATE TRIGGER trg_notebooks_updated_at
  BEFORE UPDATE ON public.chapter_notebooks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. Conceder permissões para a role correspondente
GRANT ALL ON public.chapter_notebooks TO authenticated;
