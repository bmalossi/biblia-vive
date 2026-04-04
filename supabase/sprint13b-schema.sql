-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 13b — Schema: AI Study Cache
-- Run in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Cache para respostas da IA (teologia, comentários, etc.)
-- Usado pela api/commentary.ts para evitar chamadas repetidas à OpenAI
CREATE TABLE IF NOT EXISTS public.ai_study_cache (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  verse_id      TEXT NOT NULL,              -- Ex: "JHN.3.16"
  question_type TEXT NOT NULL,              -- 'explain' | 'history' | 'application' | 'commentary'
  response      TEXT NOT NULL,             -- JSON string ou texto da resposta
  created_at    TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_cache UNIQUE (verse_id, question_type)
);

-- Row Level Security
ALTER TABLE public.ai_study_cache ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode ler o cache (economiza chamadas à API)
CREATE POLICY "Authenticated users can read cache"
  ON public.ai_study_cache
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Apenas service_role (Vercel backend) pode inserir/atualizar o cache
-- (service_role bypassa RLS automaticamente — nenhuma policy necessária para isso)

-- Index para consultas rápidas por versículo + tipo
CREATE INDEX IF NOT EXISTS idx_ai_cache_lookup
  ON public.ai_study_cache (verse_id, question_type);
