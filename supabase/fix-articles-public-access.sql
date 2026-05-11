-- ─────────────────────────────────────────────────────────────────────────────
-- Fix: Acesso público de leitura à tabela articles
--
-- Execute no SQL Editor do Supabase Dashboard.
--
-- Problema: a policy SELECT existente não incluía explicitamente a role `anon`
-- (usuários não autenticados), bloqueando visitantes sem conta.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Remover policy antiga (se existir)
DROP POLICY IF EXISTS "Public can read published articles" ON public.articles;

-- 2. Garantir que a role anon tenha SELECT na tabela
GRANT SELECT ON public.articles TO anon;
GRANT SELECT ON public.articles TO authenticated;

-- 3. Recriar a policy explicitando as roles anon e authenticated
CREATE POLICY "Public can read published articles"
    ON public.articles
    FOR SELECT
    TO anon, authenticated
    USING (status = 'publicado');

-- ── Verificação ────────────────────────────────────────────────────────────
-- Após rodar, execute para confirmar a policy:
-- SELECT policyname, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'articles';
