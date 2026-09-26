-- ─────────────────────────────────────────────────────────────────────────────
-- schema.sql — Bíblia Vive · Projeto Logos
-- Cloudflare D1 Database Schema para Repositório Homilético (ADR-0015)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sermons (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  inspiration_note_id TEXT,
  title TEXT NOT NULL,
  book_id TEXT,
  book_name TEXT,
  chapter INTEGER,
  verse INTEGER,
  version TEXT DEFAULT 'acf',
  spark_text TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  desfecho_tipo TEXT,
  desfecho_texto TEXT,
  bloco_1_exegese TEXT,
  bloco_1_intencao_original TEXT,
  bloco_2_topicos TEXT,
  bloco_3_aplicacao TEXT,
  introducao TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sermons_user_id ON sermons(user_id);
CREATE INDEX IF NOT EXISTS idx_sermons_updated_at ON sermons(updated_at DESC);

CREATE TABLE IF NOT EXISTS preaching_logs (
  id TEXT PRIMARY KEY,
  sermon_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  church_name TEXT NOT NULL,
  city TEXT NOT NULL,
  preached_at TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (sermon_id) REFERENCES sermons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_preaching_logs_user_church ON preaching_logs(user_id, church_name);
