-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 13 — Schema: Monetization & ElevenLabs Cache
-- Run in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. user_subscriptions ──────────────────────────────────────────────────
-- Identifies which users have the "Bíblia Viva Pro" subscription
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  stripe_customer_id     TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status                 TEXT NOT NULL, -- e.g., 'active', 'canceled', 'past_due'
  current_period_end     TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own subscription status
CREATE POLICY "Users can view own subscription"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Note: No INSERT/UPDATE policies for standard users. 
-- Only Vercel with the SERVICE_ROLE_KEY can modify subscriptions via Webhooks.

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER trg_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ── 2. Storage: audio_cache ──────────────────────────────────────────────────
-- Creates a public bucket for storing ElevenLabs audio cache to save extreme API costs

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('audio_cache', 'audio_cache', true, 5242880, ARRAY['audio/mpeg'])
ON CONFLICT (id) DO NOTHING;

-- Allows anyone to fetch/download the voice audios
CREATE POLICY "Public Read Access for Audio Cache"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'audio_cache');

-- Note: Vercel with SERVICE_ROLE_KEY bypasses this and will be the only one able to upload .mp3 files.
