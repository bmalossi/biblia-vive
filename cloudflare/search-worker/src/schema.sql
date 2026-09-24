-- ─────────────────────────────────────────────────────────────────────────────
-- Schema FTS5 para Cloudflare D1
-- Banco de Dados: biblia-vive-search
-- ─────────────────────────────────────────────────────────────────────────────

-- Tabela Virtual FTS5 de Busca Bíblica de Alta Performance
-- O tokenizer 'unicode61 remove_diacritics 2' normaliza acentos automaticamente
-- na indexação e na consulta ("exortacao" encontra "exortação").
CREATE VIRTUAL TABLE IF NOT EXISTS bible_search_fts USING fts5(
  version,
  book_id,
  book_name,
  testament,
  chapter,
  verse,
  text,
  tokenize = 'unicode61 remove_diacritics 2'
);
