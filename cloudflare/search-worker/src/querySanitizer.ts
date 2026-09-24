/**
 * Motor de Busca Bíblica — Cloudflare D1 + FTS5
 * querySanitizer.ts
 *
 * Módulo puro responsável por sanitizar e transformar os termos digitados
 * pelo Leitor em expressões de busca seguras e de alta relevância para o SQLite FTS5.
 */

/**
 * Normaliza caracteres e remove acentos diacríticos (ex.: "é" -> "e", "ç" -> "c")
 */
export function removeDiacritics(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Sanitiza a consulta digitada para o dialeto do SQLite FTS5.
 *
 * - Frases entre aspas (ex.: `"no princípio criou Deus"`) são preservadas como busca de frase contígua.
 * - Múltiplas palavras separadas (ex.: `há júbilo`) são transformadas em conjunção de prefixos (`"ha"* AND "jubilo"*`),
 *   permitindo encontrar versículos que contenham ambos os termos mesmo que intercalados (ex.: "há grande júbilo").
 * - Remove caracteres e operadores reservados que poderiam quebrar a sintaxe SQL do FTS5 (*, ^, :, (, ), etc.).
 */
export function sanitizeFtsQuery(rawQuery: string): string {
  if (!rawQuery || typeof rawQuery !== "string") return "";

  const trimmed = rawQuery.trim();
  if (!trimmed) return "";

  // 1. Checa se o usuário colocou a consulta inteira entre aspas para frase exata
  const exactMatch = trimmed.match(/^"([^"]+)"$/);
  if (exactMatch) {
    const phraseContent = removeDiacritics(exactMatch[1])
      .replace(/["*^:{}()+~]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return phraseContent ? `"${phraseContent}"` : "";
  }

  // 2. Remove operadores booleanos reservados do FTS5 e pontuações especiais
  // SQLite FTS5 reserva palavras como AND, OR, NOT e NEAR em maiúsculas
  const strippedOperators = trimmed
    .replace(/\b(AND|OR|NOT|NEAR)\b/g, " ")
    .replace(/[*^:{}()+~[\]"']/g, " ");

  const clean = removeDiacritics(strippedOperators);
  if (!clean) return "";

  // 3. Quebra em tokens alfanuméricos
  const tokens = clean
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && /[a-zA-Z0-9]/.test(t));

  if (tokens.length === 0) return "";

  // 4. Concatena com AND e sufixo wildcard (*) para cada token
  // Exemplo: ["ha", "jubilo"] -> '"ha"* AND "jubilo"*'
  return tokens.map((t) => `"${t}"*`).join(" AND ");
}

export interface FtsQueryParams {
  rawQuery: string;
  version?: string;
  limit?: number;
  offset?: number;
}

export interface FtsQuerySqlResult {
  sql: string;
  countSql: string;
  params: (string | number)[];
  countParams: (string | number)[];
  sanitizedQuery: string;
}

/**
 * Constrói a declaração SQL parametrizada para consulta e contagem na tabela virtual FTS5.
 */
export function buildFtsSearchSql(params: FtsQueryParams): FtsQuerySqlResult {
  const { rawQuery, version = "all", limit = 20, offset = 0 } = params;
  const sanitized = sanitizeFtsQuery(rawQuery);

  const isAllVersions = !version || version.toLowerCase() === "all";
  const cleanVersion = version?.toLowerCase().trim();

  let sql = `
    SELECT
      version,
      book_id,
      book_name,
      testament,
      chapter,
      verse,
      text,
      rank
    FROM bible_search_fts
    WHERE bible_search_fts MATCH ?
  `;

  let countSql = `
    SELECT COUNT(*) AS total
    FROM bible_search_fts
    WHERE bible_search_fts MATCH ?
  `;

  const queryParams: (string | number)[] = [sanitized];
  const countParams: (string | number)[] = [sanitized];

  if (!isAllVersions) {
    sql += ` AND version = ?`;
    countSql += ` AND version = ?`;
    queryParams.push(cleanVersion);
    countParams.push(cleanVersion);
  }

  sql += `
    ORDER BY rank
    LIMIT ? OFFSET ?
  `.trim();

  queryParams.push(limit, offset);

  return {
    sql: sql.replace(/\s+/g, " ").trim(),
    countSql: countSql.replace(/\s+/g, " ").trim(),
    params: queryParams,
    countParams,
    sanitizedQuery: sanitized,
  };
}
