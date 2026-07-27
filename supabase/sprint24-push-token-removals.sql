-- Auditoria de tokens removidos por invalidação no envio FCM
CREATE TABLE IF NOT EXISTS public.push_token_removals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    count INTEGER NOT NULL CHECK (count > 0),
    reason TEXT NOT NULL DEFAULT 'invalid_token',
    removed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_token_removals_removed_at
    ON public.push_token_removals(removed_at DESC);

ALTER TABLE public.push_token_removals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage push_token_removals"
    ON public.push_token_removals FOR ALL
    USING (true)
    WITH CHECK (true);
