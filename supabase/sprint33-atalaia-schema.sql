-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 33 — Atalaia: Sistema de Cuidado Pastoral Silencioso
-- ADR 0001 (Telemetria Cega), ADR 0003 (Tabela Dedicada), ADR 0004 (Auditoria Mínima)
-- Execute este arquivo no SQL Editor do Supabase
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Tabela pastoral_contacts (ADR 0003) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pastoral_contacts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name               text NOT NULL,
  email              text NOT NULL,
  role               text NOT NULL DEFAULT 'pastor',
  requester_name     text NOT NULL,
  status             text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'active', 'revoked', 'rejected')),
  confirmation_token text UNIQUE,
  verified_at        timestamptz,
  revoked_at         timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Garantir no máximo 1 contato com status 'active' por Leitor
CREATE UNIQUE INDEX IF NOT EXISTS idx_pastoral_contacts_user_active
  ON public.pastoral_contacts (user_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_pastoral_contacts_user_status
  ON public.pastoral_contacts (user_id, status);

CREATE INDEX IF NOT EXISTS idx_pastoral_contacts_token
  ON public.pastoral_contacts (confirmation_token)
  WHERE confirmation_token IS NOT NULL;


-- ── 2. Tabela pastoral_alerts (ADR 0004) ─────────────────────────────────────
-- Invariante: zero texto, zero título, zero reflexão, zero score.

CREATE TABLE IF NOT EXISTS public.pastoral_alerts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id      uuid NOT NULL REFERENCES public.pastoral_contacts(id) ON DELETE CASCADE,
  trigger_type    text NOT NULL CHECK (trigger_type IN ('care_signal', 'explicit_help')),
  note_id         uuid REFERENCES public.user_notes(id) ON DELETE SET NULL,
  sent_at         timestamptz NOT NULL DEFAULT now(),
  delivery_status text NOT NULL DEFAULT 'delivered'
                  CHECK (delivery_status IN ('delivered', 'failed', 'rate_limited', 'pending')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pastoral_alerts_user_sent
  ON public.pastoral_alerts (user_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_pastoral_alerts_note
  ON public.pastoral_alerts (note_id, sent_at DESC)
  WHERE note_id IS NOT NULL;


-- ── 3. Tabela care_telemetry_events (ADR 0001) ──────────────────────────────
-- Invariante: nenhum user_id, nenhum e-mail, nenhum hash de usuário.

CREATE TABLE IF NOT EXISTS public.care_telemetry_events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  has_care_contact boolean NOT NULL DEFAULT false,
  platform         text NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_care_telemetry_created
  ON public.care_telemetry_events (created_at DESC);


-- ── 4. Políticas de Segurança (Row Level Security - RLS) ─────────────────────

ALTER TABLE public.pastoral_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pastoral_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_telemetry_events ENABLE ROW LEVEL SECURITY;

-- pastoral_contacts: Leitor só gerencia seus próprios contatos
CREATE POLICY "Leitor visualiza seus próprios contatos pastorais"
  ON public.pastoral_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Leitor insere seus próprios contatos pastorais"
  ON public.pastoral_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Leitor atualiza seus próprios contatos pastorais"
  ON public.pastoral_contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Leitor remove seus próprios contatos pastorais"
  ON public.pastoral_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- pastoral_alerts: Leitor só visualiza metadados dos seus próprios alertas
CREATE POLICY "Leitor visualiza seus próprios alertas"
  ON public.pastoral_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Leitor insere alertas para si próprio"
  ON public.pastoral_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- care_telemetry_events: Qualquer usuário autenticado pode emitir evento cego
CREATE POLICY "Inserção cega de telemetria permitida para autenticados"
  ON public.care_telemetry_events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Leitura de telemetria apenas para service_role (não exposta a leitores)


-- ── 5. Permissões ───────────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pastoral_contacts TO authenticated;
GRANT SELECT, INSERT ON public.pastoral_alerts TO authenticated;
GRANT INSERT ON public.care_telemetry_events TO authenticated;

GRANT ALL ON public.pastoral_contacts TO service_role;
GRANT ALL ON public.pastoral_alerts TO service_role;
GRANT ALL ON public.care_telemetry_events TO service_role;

-- ── 6. Funções RPC de Confirmação por Token Web (ADR 0002) ───────────────────

ALTER TABLE public.pastoral_contacts
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz;

CREATE OR REPLACE FUNCTION public.get_pastoral_invitation_info(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact public.pastoral_contacts%ROWTYPE;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 10 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'invalid_token');
  END IF;

  SELECT * INTO v_contact
  FROM public.pastoral_contacts
  WHERE confirmation_token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'not_found');
  END IF;

  IF v_contact.status != 'pending' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'already_processed',
      'status', v_contact.status
    );
  END IF;

  IF v_contact.token_expires_at IS NOT NULL AND v_contact.token_expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'expired');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'contact_name', v_contact.name,
    'requester_name', v_contact.requester_name,
    'role', v_contact.role
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_pastoral_contact_by_token(
  p_token text,
  p_action text -- 'accept' ou 'decline'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact public.pastoral_contacts%ROWTYPE;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 10 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_token',
      'message', 'Token de confirmação inválido ou ausente.'
    );
  END IF;

  SELECT * INTO v_contact
  FROM public.pastoral_contacts
  WHERE confirmation_token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_token',
      'message', 'Token de confirmação inválido ou já utilizado.'
    );
  END IF;

  IF v_contact.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_processed',
      'message', 'Este convite já foi processado anteriormente.'
    );
  END IF;

  IF v_contact.token_expires_at IS NOT NULL AND v_contact.token_expires_at < now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'expired',
      'message', 'Este convite expirou (validade máxima de 48 horas).'
    );
  END IF;

  IF p_action = 'accept' THEN
    UPDATE public.pastoral_contacts
    SET status = 'revoked',
        revoked_at = now(),
        updated_at = now()
    WHERE user_id = v_contact.user_id
      AND id != v_contact.id
      AND status = 'active';

    UPDATE public.pastoral_contacts
    SET status = 'active',
        verified_at = now(),
        confirmation_token = NULL,
        updated_at = now()
    WHERE id = v_contact.id;

    RETURN jsonb_build_object(
      'success', true,
      'status', 'active',
      'requester_name', v_contact.requester_name,
      'role', v_contact.role
    );
  ELSIF p_action = 'decline' OR p_action = 'reject' THEN
    UPDATE public.pastoral_contacts
    SET status = 'rejected',
        confirmation_token = NULL,
        updated_at = now()
    WHERE id = v_contact.id;

    RETURN jsonb_build_object(
      'success', true,
      'status', 'rejected',
      'requester_name', v_contact.requester_name
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_action',
      'message', 'Ação inválida. Utilize accept ou decline.'
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pastoral_invitation_info(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.confirm_pastoral_contact_by_token(text, text) TO anon, authenticated, service_role;

