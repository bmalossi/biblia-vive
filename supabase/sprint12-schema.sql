-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 12 — Schema: Reading Plan Cloud Sync & Daily Verses
-- Run in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. user_plan_progress ─────────────────────────────────────────────────────
-- Stores each authenticated user's active reading plan progress
CREATE TABLE IF NOT EXISTS public.user_plan_progress (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id        TEXT        NOT NULL,
  start_date     BIGINT      NOT NULL,  -- Unix timestamp in ms
  completed_days INTEGER[]   NOT NULL DEFAULT '{}',
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_plan UNIQUE (user_id, plan_id)
);

-- Row Level Security: users can only access their own data
ALTER TABLE public.user_plan_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own plan progress"
  ON public.user_plan_progress
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_plan_progress_user ON public.user_plan_progress (user_id);


-- ── 2. daily_verses ──────────────────────────────────────────────────────────
-- Curated verse of the day scheduled up to 30 days in advance
-- Only admin role can INSERT/UPDATE; all authenticated users can read
CREATE TABLE IF NOT EXISTS public.daily_verses (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  verse_date       DATE        NOT NULL UNIQUE,  -- The day this verse is shown
  verse_id         TEXT,                          -- e.g. "JHN.3.16" (Optional)
  verse_text       TEXT        NOT NULL,
  verse_reference  TEXT        NOT NULL,          -- e.g. "João 3:16 (ACF)"
  reflection_text  TEXT,                          -- Optional editorial reflection
  created_by       UUID        REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE public.daily_verses ENABLE ROW LEVEL SECURITY;

-- Anyone can read the daily verse (even anonymous users)
CREATE POLICY "Public read access for daily verses"
  ON public.daily_verses
  FOR SELECT
  USING (true);

-- Only admins (identified by app_metadata->>'role' = 'admin') can manage verses
CREATE POLICY "Admins manage daily verses"
  ON public.daily_verses
  FOR ALL
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Index for the most common query: "get today's verse"
CREATE INDEX IF NOT EXISTS idx_daily_verse_date ON public.daily_verses (verse_date DESC);
