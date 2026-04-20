-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 16 — Stripe → Supabase PRO Sync
-- Adiciona colunas necessárias para rastrear o plano e cancelamento agendado.
-- Execute este arquivo no SQL Editor do Supabase.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Adiciona plan_type (identifica o plano: 'pro', 'templo', 'none') ──────
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'none';

-- ── 2. Adiciona cancel_at_period_end (assinatura agendada para cancelar) ─────
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false;

-- ── 3. Garante que linhas existentes com status=active sejam marcadas como pro
--      (Útil se houver registros criados antes desta migração)
UPDATE public.user_subscriptions
  SET plan_type = 'pro'
  WHERE status IN ('active', 'trialing')
    AND plan_type = 'none';

-- ── Verificação ───────────────────────────────────────────────────────────────
-- Execute após aplicar para confirmar:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'user_subscriptions'
-- ORDER BY ordinal_position;
