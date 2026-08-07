-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 27 — Eco do Memorial (Fase 1)
-- Execute este arquivo no SQL Editor do Supabase
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Adicionar user_id à tabela push_tokens e políticas de RLS ─────────────

ALTER TABLE public.push_tokens
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id
  ON public.push_tokens(user_id);

-- Atualizar RLS para permitir que leitores gerenciem seus próprios tokens de push
CREATE POLICY "Users can insert their own push_token"
  ON public.push_tokens FOR INSERT
  WITH CHECK (auth.uid() IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can update their own push_token"
  ON public.push_tokens FOR UPDATE
  USING (auth.uid() IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can delete their own push_token"
  ON public.push_tokens FOR DELETE
  USING (auth.uid() IS NULL OR auth.uid() = user_id);

-- ── 2. Adicionar trava anti-repetição (last_echo_at) na tabela user_notes ─────

ALTER TABLE public.user_notes
  ADD COLUMN IF NOT EXISTS last_echo_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_user_notes_last_echo_at
  ON public.user_notes(user_id, last_echo_at DESC);

-- ── 3. Criar/atualizar tabela de perfis de usuário ─────────────────────────────
-- A tabela profiles pode não existir no banco. Criamos com CREATE TABLE IF NOT EXISTS
-- e depois adicionamos as colunas do Eco do Memorial de forma idempotente.

CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS na tabela
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (DROP IF EXISTS garante idempotência sem DO $$)
DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Colunas de contexto de leitura recente (para o algoritmo de seleção do Eco)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_read_book_id TEXT,
  ADD COLUMN IF NOT EXISTS last_read_chapter  INTEGER,
  ADD COLUMN IF NOT EXISTS last_read_at       TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_last_read_at
  ON public.profiles(last_read_at DESC);

-- Backfill: cria perfil para usuários já existentes que ainda não têm linha em profiles
INSERT INTO public.profiles (id, created_at, updated_at)
SELECT id, created_at, NOW()
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Trigger: cria automaticamente um perfil para cada novo usuário registrado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── 4. Agendar o Eco do Memorial no Supabase (Integrations → Cron Jobs) ───────
--
-- O pg_cron já está habilitado na extensão. A forma mais segura no Supabase é:
-- 1. Vá em Integrations → Cron Jobs no Supabase Dashboard
-- 2. Crie um novo Cron Job com os dados:
--    - Name: eco-memorial-daily
--    - Schedule: 0 11 * * * (08:00 BRT / 11:00 UTC)
--    - HTTP Request:
--        Method: POST
--        URL: https://<PROJECT_REF>.supabase.co/functions/v1/eco-memorial
--        Headers: {"Content-Type": "application/json", "x-cron-secret": "<SEU_CRON_SECRET>"}
