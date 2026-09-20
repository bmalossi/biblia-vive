-- =============================================================================
-- Sprint 30 — Fio da Escritura (ScriptureThread) & Configurações Globais
-- Execute no SQL Editor do Supabase Dashboard
-- =============================================================================

-- 1. Tabela de configurações globais chave-valor JSONB
CREATE TABLE IF NOT EXISTS public.app_config (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS trg_app_config_updated_at ON public.app_config;
CREATE TRIGGER trg_app_config_updated_at
  BEFORE UPDATE ON public.app_config
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 3. Row Level Security (RLS)
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Leitura pública (Visitantes, Leitores e Edge Functions)
DROP POLICY IF EXISTS "Public read app_config" ON public.app_config;
CREATE POLICY "Public read app_config"
  ON public.app_config FOR SELECT
  USING (true);

-- Escrita restrita a administradores e service_role
DROP POLICY IF EXISTS "Admins and service_role manage app_config" ON public.app_config;
CREATE POLICY "Admins and service_role manage app_config"
  ON public.app_config FOR ALL
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR auth.role() = 'service_role'
  );

-- 4. Inserção dos parâmetros padrão do Fio da Escritura (idempotente)
INSERT INTO public.app_config (key, value) VALUES
  ('scripture_thread_enabled',      'true'::jsonb),
  ('scripture_thread_granularity',  '"chapter"'::jsonb),
  ('scripture_thread_max_notes',    '30'::jsonb),
  ('scripture_thread_require_pro',  'false'::jsonb)
ON CONFLICT (key) DO NOTHING;
