-- Permite que admins autenticados leiam métricas de push no painel (client-side Supabase)
CREATE POLICY "Admins can read push_tokens"
    ON public.push_tokens FOR SELECT
    TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can read push_token_removals"
    ON public.push_token_removals FOR SELECT
    TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
