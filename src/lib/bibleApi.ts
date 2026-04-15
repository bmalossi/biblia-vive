import { findBookById, OLD_TESTAMENT } from "@/lib/books";
import { getVersionLangPath } from "@/lib/themes";

const API_BASE = "https://api.scripture.api.bible/v1";
const GITHUB_BASE = "https://raw.githubusercontent.com/MaatheusGois/bible/main";
const API_KEY = import.meta.env.VITE_BIBLE_API_KEY;

// API IDs only used for text search (searchVerses) — chapter reads use local data
export const VERSION_IDS: Record<string, string> = {
  acf: "bc70ef1b3b4ee1f3-01",
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
  acf: "acf", arc: "arc", nvi: "nvi",
  aa: "aa", kja: "kja", kjv: "kjv", bbe: "bbe", rvr: "rvr",
};

const GITHUB_LANG_PATHS: Record<string, string> = {
  acf: "pt-br", arc: "pt-br", nvi: "pt-br",
  aa: "pt-br", kja: "pt-br",
  kjv: "en", bbe: "en",
  rvr: "es",
};

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

const githubVersionIndexCache = new Map<string, Promise<LocalBook[]>>();
const githubBookCache = new Map<string, Promise<LocalBook>>();

// ─── Original Language (Hebrew OT / Greek NT) ───────────────────────
type OrigLangVerse = { verse: number; text: string };
type OrigLangChapter = { chapter: number; verses: OrigLangVerse[] };
type OrigLangBook = { book: string; chapters: OrigLangChapter[] };

let hebrewData: OrigLangBook[] | null = null;
let greekData: OrigLangBook[] | null = null;

async function getOriginalLangData(testament: "old" | "new"): Promise<OrigLangBook[]> {
  if (testament === "old") {
    if (!hebrewData) {
      const res = await fetch("/bible/antigo_testamento_hebraico.json");
      if (!res.ok) throw { message: "Could not load Hebrew data." } satisfies BibleApiError;
      hebrewData = await res.json() as OrigLangBook[];
    }
    return hebrewData;
  } else {
    if (!greekData) {
      const res = await fetch("/bible/novo_testamento_grego.json");
      if (!res.ok) throw { message: "Could not load Greek data." } satisfies BibleApiError;
      greekData = await res.json() as OrigLangBook[];
    }
    return greekData;
  }
}

// Map of English book names (as in the JSON) to our slugs
const ORIG_LANG_NAME_MAP: Record<string, string> = {
  Genesis: "gn", Exodus: "ex", Leviticus: "lv", Numbers: "nm", Deuteronomy: "dt",
  Joshua: "js", Judges: "jz", Ruth: "rt", "1 Samuel": "1sm", "2 Samuel": "2sm",
  "1 Kings": "1rs", "2 Kings": "2rs", "1 Chronicles": "1cr", "2 Chronicles": "2cr",
  Ezra: "ed", Nehemiah: "ne", Esther: "et", Job: "jo", Psalms: "sl",
  Proverbs: "pv", Ecclesiastes: "ec", "Song of Solomon": "ct", Isaiah: "is",
  Jeremiah: "jr", Lamentations: "lm", Ezekiel: "ez", Daniel: "dn",
  Hosea: "os", Joel: "jl", Amos: "am", Obadiah: "ob", Jonah: "jn",
  Micah: "mq", Nahum: "na", Habakkuk: "hc", Zephaniah: "sf", Haggai: "ag",
  Zechariah: "zc", Malachi: "ml",
  Matthew: "mt", Mark: "mc", Luke: "lc", John: "joa", Acts: "atos",
  Romans: "rm", "1 Corinthians": "1co", "2 Corinthians": "2co",
  Galatians: "gl", Ephesians: "ef", Philippians: "fp", Colossians: "cl",
  "1 Thessalonians": "1ts", "2 Thessalonians": "2ts",
  "1 Timothy": "1tm", "2 Timothy": "2tm",
  Titus: "tt", Philemon: "fm", Hebrews: "hb", James: "tg",
  "1 Peter": "1pe", "2 Peter": "2pe",
  "1 John": "1jo", "2 John": "2jo", "3 John": "3jo",
  Jude: "jd", Revelation: "ap",
};

async function fetchChapterFromOriginalLanguage(bookId: string, chapter: string): Promise<Chapter> {
  const book = findBookById(bookId);
  const slug = book?.slug ?? bookId.toLowerCase();
  const bookName = book?.name ?? slug;
  const isOT = OLD_TESTAMENT.some((b) => b.id === bookId);
  const testament: "old" | "new" = isOT ? "old" : "new";
  const data = await getOriginalLangData(testament);

  // Find the matching book entry
  const bookEntry =
    data.find((b) => ORIG_LANG_NAME_MAP[b.book] === slug) ??
    data.find((b) => b.book.toLowerCase().includes(slug.toLowerCase()));

  if (!bookEntry) {
    throw { message: `Book "${bookId}" not found in original language data.` } satisfies BibleApiError;
  }

  const chapterNum = Number(chapter);
  const chapterEntry = bookEntry.chapters.find((c) => c.chapter === chapterNum);

  if (!chapterEntry) {
    throw { message: `Chapter ${chapter} not found in original language data.` } satisfies BibleApiError;
  }

  const langLabel = isOT ? "Hebraico" : "Grego";

  return {
    id: `${slug}.${chapter}`,
    bookId: slug,
    number: chapter,
    reference: `${bookName} ${chapter} (${langLabel})`,
    source: "local" as const,
    verses: chapterEntry.verses.map((v) => ({
      id: `${slug}.${chapter}.${v.verse}`,
      orgId: "original-lang",
      bookId: slug,
      chapterId: `${slug}.${chapter}`,
      content: v.text,
      reference: `${bookName} ${chapter}:${v.verse}`,
      number: v.verse,
      text: v.text,
    })),
  };
}

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

/**
 * Fetch a chapter with fallback chain: Original Language → Local → API → GitHub
 */
export async function fetchChapter(version: string, bookId: string, chapter: string): Promise<Chapter> {
  // Special case: 'org' version fetches from Hebrew/Greek original language JSONs
  if (version === "org") {
    return fetchChapterFromOriginalLanguage(bookId, chapter);
  }

  const book = findBookById(bookId);
  const bookSlug = book ? book.slug : bookId.toLowerCase();

  try {
    return await fetchChapterFromLocal(version, bookSlug, chapter);
  } catch {
    // Local failed
  }

  const bibleId = VERSION_IDS[version];
  if (API_KEY && bibleId) {
    try {
      const chapterId = `${bookId}.${chapter}`;
      const payload = await requestApi<{ data: Chapter }>(
        `/bibles/${bibleId}/chapters/${chapterId}?content-type=json&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`,
      );
      return normalizeChapter({ ...payload.data, source: "api" });
    } catch {
      // API failed
    }
  }

  try {
    return await fetchChapterFromGithub(version, bookSlug, chapter);
  } catch {
    throw {
      message: "Could not load this chapter from any available source.",
    } satisfies BibleApiError;
  }
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Verify if a specific verse exists in the local data
 */
export async function checkVerseExists(version: string, bookSlug: string, chapter: number, verse?: number): Promise<boolean> {
  try {
    const localId = getLocalBookId(bookSlug);
    const book = await fetchLocalBook(version, localId);

    const chapterIndex = chapter - 1;
    if (chapterIndex < 0 || chapterIndex >= book.chapters.length) return false;

    if (verse !== undefined) {
      const versesInChapter = book.chapters[chapterIndex];
      return verse > 0 && verse <= versesInChapter.length;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Search terms in local Bible data
 */
export async function searchLocalBible(
  version: string,
  query: string,
  limit = 50,
  signal?: AbortSignal
): Promise<{ verses: Verse[]; total: number }> {
  const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  if (!normalizedQuery) return { verses: [], total: 0 };

  // 1. Check for scope (e.g., "amor em sl" or "faith in gn")
  let scopeBookSlug: string | undefined;
  let searchTerm = normalizedQuery;

  const scopeMatch = normalizedQuery.match(/^(.+?)\s+(?:em|in|en)\s+([a-z0-9]+)$/);
  if (scopeMatch) {
    searchTerm = scopeMatch[1].trim();
    const rawScope = scopeMatch[2].trim();
    // Try to find book by slug/abbrev
    const book = findBookById(undefined) || { slug: rawScope }; // Minimal fallback
    // We actually need the books list to resolve aliases accurately, but for now we'll use the raw scope
    scopeBookSlug = rawScope;
  }

  const langPath = getVersionLangPath(version as any);
  const allResults: Verse[] = [];

  // 2. Identify books to search
  const booksToSearch = scopeBookSlug
    ? [findBookById(getLocalBookId(scopeBookSlug))?.slug || scopeBookSlug]
    : (await import("@/data/books.json")).default.old_testament.concat((await import("@/data/books.json")).default.new_testament).map((b: any) => b.slug);

  for (const bookSlug of booksToSearch) {
    if (signal?.aborted) break;

    try {
      const localId = getLocalBookId(bookSlug);
      const bookData = await fetchLocalBook(version, localId);

      bookData.chapters.forEach((chapterVerses, cIndex) => {
        const chapterNum = cIndex + 1;
        chapterVerses.forEach((content, vIndex) => {
          const verseNum = vIndex + 1;
          const plainText = stripHtml(content).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

          if (plainText.includes(searchTerm)) {
            allResults.push({
              id: `${bookSlug}.${chapterNum}.${verseNum}`,
              orgId: "local-search",
              bookId: bookSlug,
              chapterId: `${bookSlug}.${chapterNum}`,
              content: content,
              reference: `${bookData.name} ${chapterNum}:${verseNum}`,
              number: verseNum,
              text: stripHtml(content)
            });
          }
        });
      });
    } catch (e) {
      console.warn(`Search failed for book ${bookSlug}:`, e);
    }
  }

  return {
    verses: allResults.slice(0, limit),
    total: allResults.length
  };
}

export async function searchVerses(version: string, query: string, limit = 100, signal?: AbortSignal): Promise<Verse[]> {
  // NOTE: the external scripture.api.bible search is intentionally bypassed here.
  // That API returns incomplete/biased results (e.g. only Matthew for "Jesus") and
  // succeeds (HTTP 200), causing the local fallback to never run.
  // The local scan covers all 66 books faithfully — it is the correct source.
  const localResult = await searchLocalBible(version, query, limit, signal);
  return localResult.verses;
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