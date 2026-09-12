-- =============================================================================
-- Sprint 29 — Publication Pipeline, Idempotency & Observability
-- Execute no SQL Editor do Supabase Dashboard
-- =============================================================================

-- 1. Adiciona coluna updated_at na tabela articles caso nao exista
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Garante funcao set_updated_at() reutilizavel
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. Trigger condicional: so atualiza updated_at se houver alteracao real de conteudo
-- Evita que saves no-op alterem updated_at e criem lastmod artificial
DROP TRIGGER IF EXISTS trg_articles_updated_at ON public.articles;
CREATE TRIGGER trg_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.set_updated_at();

-- 4. Tabela de observabilidade e idempotencia: publication_events
CREATE TABLE IF NOT EXISTS public.publication_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id      UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,
  status          TEXT NOT NULL,
  attempt         INT NOT NULL DEFAULT 1,
  idempotency_key TEXT,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

-- Indices para consultas eficientes de idempotencia e auditoria
CREATE INDEX IF NOT EXISTS idx_publication_events_article ON public.publication_events(article_id);
CREATE INDEX IF NOT EXISTS idx_publication_events_idempotency ON public.publication_events(idempotency_key, status);
CREATE INDEX IF NOT EXISTS idx_publication_events_created ON public.publication_events(created_at DESC);

-- 5. Row Level Security para publication_events
ALTER TABLE public.publication_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and service role manage publication_events" ON public.publication_events;
CREATE POLICY "Admins and service role manage publication_events"
  ON public.publication_events FOR ALL
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR auth.role() = 'service_role'
  );
