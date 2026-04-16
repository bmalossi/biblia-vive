-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 15 — Reading Plan Sync: Adiciona coluna read_refs à user_plan_progress
-- Execute este arquivo no SQL Editor do Supabase
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Adiciona a coluna read_refs (rastreamento individual de capítulos) ───
-- A sprint12 criou a tabela sem essa coluna. Sem ela, o progresso por capítulo
-- nunca é salvo em banco, fazendo com que o restore após logout/login falhe.

ALTER TABLE public.user_plan_progress
  ADD COLUMN IF NOT EXISTS read_refs TEXT[] NOT NULL DEFAULT '{}';

-- ── 2. Garante a constraint única (segurança para upserts) ────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.user_plan_progress'::regclass
      AND contype = 'u'
      AND conname = 'uq_user_plan'
  ) THEN
    ALTER TABLE public.user_plan_progress
      ADD CONSTRAINT uq_user_plan UNIQUE (user_id, plan_id);
  END IF;
END $$;

-- ── 3. Garante trigger de updated_at automático ───────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_plan_progress_updated_at ON public.user_plan_progress;
CREATE TRIGGER trg_plan_progress_updated_at
  BEFORE UPDATE ON public.user_plan_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 4. Garante RLS ────────────────────────────────────────────────────────────
ALTER TABLE public.user_plan_progress ENABLE ROW LEVEL SECURITY;

-- Recria a policy de forma idempotente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_plan_progress'
      AND policyname = 'Users manage their own plan progress'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users manage their own plan progress"
        ON public.user_plan_progress
        FOR ALL
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    $policy$;
  END IF;
END $$;

-- ── 5. Índices para performance ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_plan_progress_user
  ON public.user_plan_progress (user_id);

CREATE INDEX IF NOT EXISTS idx_plan_progress_updated
  ON public.user_plan_progress (user_id, updated_at DESC);

-- ── Verificação final ─────────────────────────────────────────────────────────
-- Execute esta query para confirmar que a coluna existe:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'user_plan_progress'
-- ORDER BY ordinal_position;
