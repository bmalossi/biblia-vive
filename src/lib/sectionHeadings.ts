// ─────────────────────────────────────────────────────────────────────────────
// sectionHeadings.ts — Bíblia Vive
//
// Módulo de dados para subtítulos de seção bíblica.
// Carrega nvi-pt-br.json uma única vez (singleton) e expõe
// getHeadingsForChapter() como interface pública principal.
//
// Regras:
//   - Retorna [] para qualquer langCode que não comece com "pt"
//   - Retorna [] silenciosamente em caso de falha de fetch
//   - Cache singleton em memória — zero fetch duplicado
// ─────────────────────────────────────────────────────────────────────────────

export interface SectionHeading {
  before_verse: number;
  text: string;
}

// Estrutura do JSON: { [bookSlug]: { [chapter]: SectionHeading[] } }
type HeadingsData = Record<string, Record<string, SectionHeading[]>>;

// ─── Cache singleton ──────────────────────────────────────────────────────────

let _cache: HeadingsData | null = null;
let _loadPromise: Promise<HeadingsData | null> | null = null;

async function loadHeadingsData(): Promise<HeadingsData | null> {
  if (_cache !== null) return _cache;
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    try {
      const res = await fetch("/bible/subtitles/nvi-pt-br.json");
      if (!res.ok) return null;
      const data = (await res.json()) as HeadingsData;
      _cache = data;
      return data;
    } catch {
      // Falha silenciosa — offline, erro de rede, etc.
      return null;
    }
  })();

  return _loadPromise;
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Retorna os subtítulos de seção para um capítulo específico.
 *
 * @param bookSlug - slug interno do livro (ex: "gn", "mt", "re")
 * @param chapter  - número do capítulo (ex: 1, 22)
 * @param langCode - código de idioma da versão (ex: "pt-BR", "en", "es")
 * @returns Array de SectionHeading ordenado por before_verse, ou [] se não houver
 */
export async function getHeadingsForChapter(
  bookSlug: string,
  chapter: number,
  langCode: string
): Promise<SectionHeading[]> {
  // Apenas versões pt-* recebem subtítulos por enquanto
  if (!langCode.toLowerCase().startsWith("pt")) return [];

  const data = await loadHeadingsData();
  if (!data) return [];

  const chapterKey = String(chapter);
  return data[bookSlug]?.[chapterKey] ?? [];
}

/**
 * Versão síncrona: retorna os headings já carregados (do cache).
 * Retorna [] se os dados ainda não foram carregados.
 * Útil para componentes que já garantiram o pré-carregamento via hook.
 */
export function getHeadingsForChapterSync(
  bookSlug: string,
  chapter: number,
  langCode: string
): SectionHeading[] {
  if (!langCode.toLowerCase().startsWith("pt")) return [];
  if (!_cache) return [];

  const chapterKey = String(chapter);
  return _cache[bookSlug]?.[chapterKey] ?? [];
}

// ─── Utilitário de filtro (usado pelo hook) ───────────────────────────────────

/**
 * Filtra os headings que devem aparecer antes de um versículo específico.
 *
 * @param headings   - lista de headings do capítulo
 * @param verseNumber - número do versículo atual
 */
export function getHeadingsBeforeVerse(
  headings: SectionHeading[],
  verseNumber: number
): SectionHeading[] {
  return headings.filter((h) => h.before_verse === verseNumber);
}

// ─── Reset para testes ────────────────────────────────────────────────────────

/** @internal — Apenas para testes. Limpa o cache singleton. */
export function _resetHeadingsCache(): void {
  _cache = null;
  _loadPromise = null;
}
