-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 20 — Painel Admin: Gestão de Usuários
-- Execute este arquivo no SQL Editor do Supabase (Dashboard → SQL Editor)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Policy RLS: admin pode ler todas as assinaturas ───────────────────────
DROP POLICY IF EXISTS "Admin can read all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admin can read all subscriptions"
  ON public.user_subscriptions
  FOR SELECT
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ── 2. Policy RLS: admin pode inserir assinaturas manualmente ────────────────
DROP POLICY IF EXISTS "Admin can insert subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admin can insert subscriptions"
  ON public.user_subscriptions
  FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ── 3. Policy RLS: admin pode atualizar qualquer assinatura ──────────────────
DROP POLICY IF EXISTS "Admin can update subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admin can update subscriptions"
  ON public.user_subscriptions
  FOR UPDATE
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ── 4. Policy RLS: admin pode deletar assinaturas ────────────────────────────
DROP POLICY IF EXISTS "Admin can delete subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admin can delete subscriptions"
  ON public.user_subscriptions
  FOR DELETE
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ── 5. Função RPC: admin_list_users ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_list_users(
  p_search   TEXT    DEFAULT '',
  p_limit    INTEGER DEFAULT 50,
  p_offset   INTEGER DEFAULT 0
)
RETURNS TABLE (
  user_id              UUID,
  email                TEXT,
  created_at           TIMESTAMPTZ,
  last_sign_in_at      TIMESTAMPTZ,
  plan_type            TEXT,
  sub_status           TEXT,
  current_period_end   TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN,
  stripe_customer_id   TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') <> 'admin' THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem chamar esta função.';
  END IF;

  RETURN QUERY
  SELECT
    u.id                                      AS user_id,
    u.email                                   AS email,
    u.created_at                              AS created_at,
    u.last_sign_in_at                         AS last_sign_in_at,
    COALESCE(s.plan_type, 'none')             AS plan_type,
    COALESCE(s.status, 'none')                AS sub_status,
    s.current_period_end                      AS current_period_end,
    COALESCE(s.cancel_at_period_end, false)   AS cancel_at_period_end,
    s.stripe_customer_id                      AS stripe_customer_id
  FROM auth.users u
  LEFT JOIN public.user_subscriptions s ON s.user_id = u.id
  WHERE p_search = '' OR u.email ILIKE ('%' || p_search || '%')
  ORDER BY u.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_users FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_list_users TO authenticated;

-- ── 6. Contagem total para paginação ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_count_users(
  p_search TEXT DEFAULT ''
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count INTEGER;
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') <> 'admin' THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem chamar esta função.';
  END IF;
  SELECT COUNT(*)::INTEGER INTO v_count FROM auth.users u
  WHERE p_search = '' OR u.email ILIKE ('%' || p_search || '%');
  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_count_users FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_count_users TO authenticated;
