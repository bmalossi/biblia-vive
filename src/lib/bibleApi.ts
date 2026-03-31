import { findBookById } from "@/lib/books";
import { getVersionLangPath } from "@/lib/themes";

const API_BASE = "https://api.scripture.api.bible/v1";
const GITHUB_BASE = "https://raw.githubusercontent.com/MaatheusGois/bible/main";
const API_KEY = import.meta.env.VITE_BIBLE_API_KEY;

// API IDs only used for text search (searchVerses) — chapter reads use local data
export const VERSION_IDS: Record<string, string> = {
  acf: "bc70ef1b3b4ee1f3-01",
  ara: "39a3b4f2c05d6650-01",
  arc: "a6a28cf2a6c7f48e-01",
  nvi: "5091c557b5b4c3e5-01",
  kjv: "de4e12af7f28f599-02",
};

export interface Verse {
  id: string;
  orgId: string;
  bookId: string;
  chapterId: string;
  content: string;
  reference: string;
  number?: number;
  text?: string;
}

export interface Chapter {
  id: string;
  bookId: string;
  number: string;
  reference: string;
  verses: Verse[];
  source?: "local" | "api" | "github";
}

interface BibleApiError {
  message: string;
  status?: number;
}

interface LocalBook {
  id: string;
  name: string;
  chapters: string[][];
}

const stripHtml = (content: string) => content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const extractVerseNumber = (reference: string, fallback: number) => {
  const match = reference.match(/:(\d+)$/);
  return match ? Number(match[1]) : fallback;
};

const normalizeChapter = (chapter: Chapter): Chapter => ({
  ...chapter,
  verses: [...(chapter.verses ?? [])]
    .map((verse, index) => {
      const number = extractVerseNumber(verse.reference, index + 1);
      return {
        ...verse,
        number,
        text: stripHtml(verse.content),
      };
    })
    .sort((a, b) => (a.number ?? 0) - (b.number ?? 0)),
});

// ─── Local Data (primary source) ────────────────────────────────────
const localBookCache = new Map<string, Promise<LocalBook>>();

// Map from book slug (used in routes) to bible-main book ID
// The slugs in books.json already match bible-main IDs in most cases
const SLUG_TO_LOCAL_ID: Record<string, string> = {
  // These differ between our books.json slugs and bible-main directory names
  jz: "jud",     // Juízes — bible-main uses "jud" folder
  jo: "job",     // Jó — bible-main uses "job" folder
  joa: "jo",     // João — bible-main uses "jo" folder
  atos: "act",   // Atos — bible-main uses "act" folder
  "1rs": "1kgs", // 1 Reis — bible-main uses "1kgs" folder
  "2rs": "2kgs", // 2 Reis — bible-main uses "2kgs" folder
  "1cr": "1ch",  // 1 Crônicas — bible-main uses "1ch" folder
  "2cr": "2ch",  // 2 Crônicas — bible-main uses "2ch" folder
  sl: "ps",      // Salmos — bible-main uses "ps" folder
  pv: "prv",     // Provérbios — bible-main uses "prv" folder
  ct: "so",      // Cânticos — bible-main uses "so" folder
  os: "ho",      // Oséias — bible-main uses "ho" folder
  mq: "mi",      // Miquéias — bible-main uses "mi" folder
  hc: "hk",      // Habacuque — bible-main uses "hk" folder
  sf: "zp",      // Sofonias — bible-main uses "zp" folder
  ag: "hg",      // Ageu — bible-main uses "hg" folder
  mc: "mk",      // Marcos — bible-main uses "mk" folder
  lc: "lk",      // Lucas — bible-main uses "lk" folder
  ef: "eph",     // Efésios — bible-main uses "eph" folder
  fp: "ph",      // Filipenses — bible-main uses "ph" folder
  tg: "jm",      // Tiago — bible-main uses "jm" folder
  hb: "hb",      // Hebreus — same
  ap: "re",      // Apocalipse — bible-main uses "re" folder
  ed: "ezr",     // Esdras — bible-main uses "ezr" folder
  fm: "phm",     // Filemom — bible-main uses "phm" folder
};

function getLocalBookId(slug: string): string {
  return SLUG_TO_LOCAL_ID[slug] ?? slug;
}

async function fetchLocalBook(version: string, bookSlug: string): Promise<LocalBook> {
  const langPath = getVersionLangPath(version as any);
  const localId = getLocalBookId(bookSlug);
  const cacheKey = `local:${langPath}:${version}:${localId}`;

  if (!localBookCache.has(cacheKey)) {
    const loader = (async () => {
      const url = `/bible/${langPath}/${version}/${localId}/${localId}.json`;
      const response = await fetch(url);
      if (!response.ok) {
        throw { message: "Local data not available.", status: response.status } satisfies BibleApiError;
      }
      return response.json() as Promise<LocalBook>;
    })();
    localBookCache.set(cacheKey, loader);
  }

  return localBookCache.get(cacheKey)!;
}

async function fetchChapterFromLocal(version: string, bookSlug: string, chapter: string): Promise<Chapter> {
  const localBook = await fetchLocalBook(version, bookSlug);
  const chapterIndex = Number(chapter) - 1;

  if (Number.isNaN(chapterIndex) || chapterIndex < 0 || chapterIndex >= localBook.chapters.length) {
    throw { message: "Chapter not found in local data." } satisfies BibleApiError;
  }

  const versesText = localBook.chapters[chapterIndex] ?? [];
  const bookInfo = findBookById(undefined) ?? { name: localBook.name };
  const bookName = localBook.name;

  return normalizeChapter({
    id: `${bookSlug}.${chapter}`,
    bookId: bookSlug,
    number: chapter,
    reference: `${bookName} ${chapter}`,
    source: "local",
    verses: versesText.map((content, index) => ({
      id: `${bookSlug}.${chapter}.${index + 1}`,
      orgId: "local",
      bookId: bookSlug,
      chapterId: `${bookSlug}.${chapter}`,
      content,
      reference: `${bookName} ${chapter}:${index + 1}`,
      number: index + 1,
      text: stripHtml(content),
    })),
  });
}

// ─── API (secondary source, for text search) ────────────────────────
async function requestApi<T>(path: string, signal?: AbortSignal): Promise<T> {
  if (!API_KEY) {
    throw { message: "API key not configured." } satisfies BibleApiError;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "api-key": API_KEY },
    signal,
  });

  if (!response.ok) {
    throw {
      message: "Could not load content from the API.",
      status: response.status,
    } satisfies BibleApiError;
  }

  return response.json();
}

// ─── GitHub (tertiary fallback) ─────────────────────────────────────
const GITHUB_VERSION_SLUGS: Record<string, string> = {
  acf: "acf", ara: "ara", arc: "arc", nvi: "nvi",
  aa: "aa", kja: "kja", kjv: "kjv", bbe: "bbe", rvr: "rvr",
};

const GITHUB_LANG_PATHS: Record<string, string> = {
  acf: "pt-br", ara: "pt-br", arc: "pt-br", nvi: "pt-br",
  aa: "pt-br", kja: "pt-br",
  kjv: "en", bbe: "en",
  rvr: "es",
};

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

const githubVersionIndexCache = new Map<string, Promise<LocalBook[]>>();
const githubBookCache = new Map<string, Promise<LocalBook>>();

async function requestGithub<T>(path: string): Promise<T> {
  const response = await fetch(`${GITHUB_BASE}${path}`);
  if (!response.ok) {
    throw { message: "Could not load content from GitHub.", status: response.status } satisfies BibleApiError;
  }
  return response.json();
}

async function getGithubVersionIndex(version: string): Promise<LocalBook[]> {
  const versionSlug = GITHUB_VERSION_SLUGS[version] ?? "acf";
  const langPath = GITHUB_LANG_PATHS[version] ?? "pt-br";
  const cacheKey = `index:${langPath}:${versionSlug}`;

  if (!githubVersionIndexCache.has(cacheKey)) {
    githubVersionIndexCache.set(cacheKey, requestGithub<LocalBook[]>(`/versions/${langPath}/${versionSlug}.json`));
  }

  return githubVersionIndexCache.get(cacheKey)!;
}

async function getGithubBook(version: string, bookSlug: string): Promise<LocalBook> {
  const versionSlug = GITHUB_VERSION_SLUGS[version] ?? "acf";
  const langPath = GITHUB_LANG_PATHS[version] ?? "pt-br";
  const localId = getLocalBookId(bookSlug);
  const cacheKey = `book:${langPath}:${versionSlug}:${localId}`;

  if (!githubBookCache.has(cacheKey)) {
    const loader = (async () => {
      const localBook = findBookById(undefined);
      const indexBooks = await getGithubVersionIndex(version);

      const fallbackIds = [bookSlug, localId].map((v) => normalize(String(v)));

      const matchedBook =
        indexBooks.find((book) => fallbackIds.includes(normalize(book.id))) ??
        indexBooks.find((book) => normalize(book.name) === normalize(localBook?.name ?? ""));

      if (!matchedBook) {
        throw { message: "Book not found in GitHub." } satisfies BibleApiError;
      }

      return requestGithub<LocalBook>(`/versions/${langPath}/${versionSlug}/${matchedBook.id}/${matchedBook.id}.json`);
    })();

    githubBookCache.set(cacheKey, loader);
  }

  return githubBookCache.get(cacheKey)!;
}

async function fetchChapterFromGithub(version: string, bookSlug: string, chapter: string): Promise<Chapter> {
  const githubBook = await getGithubBook(version, bookSlug);
  const chapterIndex = Number(chapter) - 1;

  if (Number.isNaN(chapterIndex) || chapterIndex < 0 || chapterIndex >= githubBook.chapters.length) {
    throw { message: "Chapter not found in GitHub." } satisfies BibleApiError;
  }

  const versesText = githubBook.chapters[chapterIndex] ?? [];
  const bookName = githubBook.name;

  return normalizeChapter({
    id: `${bookSlug}.${chapter}`,
    bookId: bookSlug,
    number: chapter,
    reference: `${bookName} ${chapter}`,
    source: "github",
    verses: versesText.map((content, index) => ({
      id: `${bookSlug}.${chapter}.${index + 1}`,
      orgId: "github-fallback",
      bookId: bookSlug,
      chapterId: `${bookSlug}.${chapter}`,
      content,
      reference: `${bookName} ${chapter}:${index + 1}`,
      number: index + 1,
      text: stripHtml(content),
    })),
  });
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Fetch a chapter with fallback chain: Local → API → GitHub
 */
export async function fetchChapter(version: string, bookId: string, chapter: string): Promise<Chapter> {
  // bookId here is the ID from the API (e.g., "GEN", "EXO")
  const book = findBookById(bookId);
  const bookSlug = book ? book.slug : bookId.toLowerCase();

  // 1. Try local data first (always available)
  try {
    return await fetchChapterFromLocal(version, bookSlug, chapter);
  } catch {
    // Local failed, try next source
  }

  // 2. Try API (only if key is configured and version has an API ID)
  const bibleId = VERSION_IDS[version];
  if (API_KEY && bibleId) {
    try {
      // The API uses book IDs like "GEN", but the chapter ID format is "{bookId}.{chapter}"
      const chapterId = `${bookId}.${chapter}`;
      const payload = await requestApi<{ data: Chapter }>(
        `/bibles/${bibleId}/chapters/${chapterId}?content-type=json&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`,
      );
      return normalizeChapter({ ...payload.data, source: "api" });
    } catch {
      // API failed, try next source
    }
  }

  // 3. Try GitHub as last resort
  try {
    return await fetchChapterFromGithub(version, bookSlug, chapter);
  } catch {
    throw {
      message: "Could not load this chapter from any available source.",
    } satisfies BibleApiError;
  }
}

export async function searchVerses(version: string, query: string, limit = 20, signal?: AbortSignal): Promise<Verse[]> {
  if (!API_KEY) {
    throw {
      message:
        "Text search is currently unavailable. Chapter reading is available offline.",
    } satisfies BibleApiError;
  }

  const bibleId = VERSION_IDS[version] ?? VERSION_IDS.acf;

  try {
    const payload = await requestApi<{ data?: { verses?: Verse[] } }>(
      `/bibles/${bibleId}/search?query=${encodeURIComponent(query)}&limit=${limit}&sort=relevance`,
      signal,
    );

    return payload.data?.verses ?? [];
  } catch {
    throw {
      message: "Text search is temporarily unavailable.",
    } satisfies BibleApiError;
  }
}

export async function searchBible(version: string, query: string, limit = 20, signal?: AbortSignal): Promise<Verse[]> {
  return searchVerses(version, query, limit, signal);
}

export function getFriendlyApiError(error: unknown) {
  if (typeof error === "object" && error && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "A temporary error occurred while loading the data. Please try again.";
}

// Export helpers for testing
export { stripHtml, extractVerseNumber, normalizeChapter, getLocalBookId };