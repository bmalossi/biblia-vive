/**
 * bibleSearchClient.ts — Bíblia Vive
 *
 * Cliente de busca de alta performance conectado diretamente à borda da Cloudflare
 * (Cloudflare Worker + D1 com FTS5).
 *
 * Bypassa integralmente as Serverless Functions da Vercel (zero consumo de requisições Vercel)
 * e o banco de dados Supabase (zero armazenamento adicional).
 */

export interface SearchVerseResult {
  id: string;
  version: string;
  bookId: string;
  bookName: string;
  testament: string;
  chapter: number;
  verse: number;
  reference: string;
  text: string;
  rank?: number;
}

export interface BibleSearchResponse {
  verses: SearchVerseResult[];
  total: number;
  limit: number;
  offset: number;
  sanitizedQuery?: string;
  query: string;
  version: string;
  error?: string;
}

export interface BibleSearchOptions {
  query: string;
  version?: string; // "all", "acf", "nvi", "arc", "kja", "aa"
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
}

// URL do Worker na Cloudflare
// Pode ser configurada via VITE_SEARCH_WORKER_URL no .env ou fallback para domínio da aplicação
const DEFAULT_WORKER_URL =
  import.meta.env.VITE_SEARCH_WORKER_URL ||
  (import.meta.env.DEV ? "http://localhost:8787" : "https://busca.bibliavive.com.br");

/**
 * Consulta o Cloudflare Worker de Busca diretamente na borda.
 */
export async function searchBibleWorker(
  options: BibleSearchOptions
): Promise<BibleSearchResponse> {
  const { query, version = "all", limit = 20, offset = 0, signal } = options;
  const trimmed = query.trim();

  if (!trimmed) {
    return {
      verses: [],
      total: 0,
      limit,
      offset,
      query: "",
      version,
    };
  }

  const endpoint = new URL(DEFAULT_WORKER_URL);
  endpoint.searchParams.set("q", trimmed);
  endpoint.searchParams.set("v", version);
  endpoint.searchParams.set("limit", String(limit));
  endpoint.searchParams.set("offset", String(offset));

  const response = await fetch(endpoint.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Erro na busca (${response.status}): ${response.statusText}`);
  }

  const data: BibleSearchResponse = await response.json();
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Multitoken & Accent-Tolerant Highlighting Helpers
// ─────────────────────────────────────────────────────────────────────────────

const ACCENT_MAP: Record<string, string> = {
  a: "[aáàãâäAÁÀÃÂÄ]",
  e: "[eéèêëEÉÈÊË]",
  i: "[iíìîïIÍÌÎÏ]",
  o: "[oóòõôöOÓÒÕÔÖ]",
  u: "[uúùûüUÚÙÛÜ]",
  c: "[cçCÇ]",
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Converte um caractere para seu grupo de variantes acentuadas em regex.
 */
function charToAccentRegex(char: string): string {
  const lower = char.toLowerCase();
  if (ACCENT_MAP[lower]) {
    return ACCENT_MAP[lower];
  }
  return escapeRegex(char);
}

/**
 * Extrai tokens de uma busca, tratando frases entre aspas ou palavras separadas.
 */
export function extractSearchTokens(rawQuery: string): string[] {
  const query = rawQuery.trim();
  if (!query) return [];

  // Se for frase exata entre aspas
  const exactMatch = query.match(/^"([^"]+)"$/);
  if (exactMatch) {
    const phrase = exactMatch[1].trim();
    return phrase ? [phrase] : [];
  }

  // Divide por espaços e remove caracteres especiais
  return query
    .split(/\s+/)
    .map((t) => t.replace(/[^\p{L}\p{N}]/gu, "").trim())
    .filter((t) => t.length > 0);
}

/**
 * Constrói uma Regex que combina todos os tokens com tolerância a acentos.
 */
export function buildHighlightRegex(tokens: string[]): RegExp | null {
  if (!tokens.length) return null;

  const patterns = tokens.map((token) => {
    // Converte cada letra do token para permitir acentos correspondentes
    const accentPattern = Array.from(token).map(charToAccentRegex).join("");
    // Permite correspondência com prefixo/continuação da palavra (ex: "jubil" -> "júbilo", "jubilou")
    return `(?<=^|[\\s\\p{P}])${accentPattern}[\\p{L}]*`;
  });

  try {
    return new RegExp(`(${patterns.join("|")})`, "gui");
  } catch {
    return null;
  }
}
