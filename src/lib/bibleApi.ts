// ─────────────────────────────────────────────────────────────────────────────
// bibleApi.ts — Bíblia Vive
//
// Orquestrador da cadeia de fallback de capítulos (ADR-0004).
// Preserva a interface pública anterior; toda lógica de fetch vive em
// chapterAdapters.ts e toda resolução de slug vive em bookResolver.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { findBookGlobally } from "@/lib/books";
import { getVersionLangPath } from "@/lib/themes";
import { resolveBook, getLocalId } from "@/lib/bookResolver";
import {
  localAdapter,
  apiAdapter,
  githubAdapter,
  originalLanguageAdapter,
  type ChapterSourceAdapter,
} from "@/lib/chapterAdapters";

// ─── Public types (unchanged) ─────────────────────────────────────────────────

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

// ─── API version IDs (only used for searchVerses — scripture.api.bible) ───────
export const VERSION_IDS: Record<string, string> = {
  acf: "bc70ef1b3b4ee1f3-01",
  arc: "a6a28cf2a6c7f48e-01",
  nvi: "5091c557b5b4c3e5-01",
  kjv: "de4e12af7f28f599-02",
};

// ─── Fallback chain selection (ADR-0004) ──────────────────────────────────────

function selectChain(version: string): ChapterSourceAdapter[] {
  if (version === "org") {
    return [originalLanguageAdapter];
  }
  return [localAdapter, apiAdapter, githubAdapter];
}

// ─── fetchChapter ─────────────────────────────────────────────────────────────

/**
 * Fetch a chapter using the fallback chain defined in ADR-0004.
 * Chain for "org": [originalLanguage]
 * Chain for all other versions: [local → api → github]
 */
export async function fetchChapter(
  version: string,
  bookId: string,
  chapter: string
): Promise<Chapter> {
  const book = findBookGlobally(bookId);
  const slug = book ? book.slug : bookId.toLowerCase();
  const chain = selectChain(version);

  for (const adapter of chain) {
    let result: Chapter | null = null;
    try {
      result = await adapter.fetch(slug, version, chapter);
    } catch {
      // Transient failure on this adapter — try next
      continue;
    }
    if (result !== null) {
      return { ...result, source: adapter.name === "original-language" ? "local" : adapter.name as any };
    }
  }

  throw {
    message: "Could not load this chapter from any available source.",
  };
}

// ─── checkVerseExists ─────────────────────────────────────────────────────────

/**
 * Verify if a specific verse exists in the local data.
 */
export async function checkVerseExists(
  version: string,
  bookSlug: string,
  chapter: number,
  verse?: number
): Promise<boolean> {
  try {
    const result = await localAdapter.fetch(bookSlug, version, String(chapter));
    if (!result) return false;

    if (verse !== undefined) {
      return verse > 0 && verse <= result.verses.length;
    }
    return true;
  } catch {
    return false;
  }
}

// ─── searchLocalBible ─────────────────────────────────────────────────────────

const stripHtml = (content: string) =>
  content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export async function searchLocalBible(
  version: string,
  query: string,
  limit = 50,
  signal?: AbortSignal
): Promise<{ verses: Verse[]; total: number }> {
  const normalizedQuery = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (!normalizedQuery) return { verses: [], total: 0 };

  let scopeBookSlug: string | undefined;
  let searchTerm = normalizedQuery;

  const scopeMatch = normalizedQuery.match(/^(.+?)\s+(?:em|in|en)\s+([a-z0-9]+)$/);
  if (scopeMatch) {
    searchTerm = scopeMatch[1].trim();
    scopeBookSlug = scopeMatch[2].trim();
  }

  const langPath = getVersionLangPath(version as any);
  const allResults: Verse[] = [];

  const booksToSearch = scopeBookSlug
    ? [findBookGlobally(getLocalId(scopeBookSlug))?.slug || scopeBookSlug]
    : (await import("@/data/books.json")).default.old_testament
      .concat((await import("@/data/books.json")).default.new_testament)
      .map((b: any) => b.slug);

  for (const bookSlug of booksToSearch) {
    if (signal?.aborted) break;

    try {
      const chapter = await localAdapter.fetch(bookSlug, version, "1");
      if (!chapter) continue;

      // We need to scan all chapters — fetch book index directly
      const localId = getLocalId(bookSlug);
      const url = `/bible/${langPath}/${version}/${localId}/${localId}.json`;
      const res = await fetch(url);
      if (!res.ok) continue;

      const bookData = await res.json() as { name: string; chapters: string[][] };

      bookData.chapters.forEach((chapterVerses, cIndex) => {
        const chapterNum = cIndex + 1;
        chapterVerses.forEach((content, vIndex) => {
          const verseNum = vIndex + 1;
          const plainText = stripHtml(content)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

          if (plainText.includes(searchTerm)) {
            allResults.push({
              id: `${bookSlug}.${chapterNum}.${verseNum}`,
              orgId: "local-search",
              bookId: bookSlug,
              chapterId: `${bookSlug}.${chapterNum}`,
              content,
              reference: `${bookData.name} ${chapterNum}:${verseNum}`,
              number: verseNum,
              text: stripHtml(content),
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
    total: allResults.length,
  };
}

export async function searchVerses(
  version: string,
  query: string,
  limit = 100,
  signal?: AbortSignal
): Promise<Verse[]> {
  // NOTE: scripture.api.bible search is bypassed — local scan covers all 66 books faithfully.
  const localResult = await searchLocalBible(version, query, limit, signal);
  return localResult.verses;
}

export async function searchBible(
  version: string,
  query: string,
  limit = 20,
  signal?: AbortSignal
): Promise<Verse[]> {
  return searchVerses(version, query, limit, signal);
}

export function getFriendlyApiError(error: unknown): string {
  if (
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof (error as any).message === "string"
  ) {
    return (error as any).message;
  }
  return "A temporary error occurred while loading the data. Please try again.";
}

// ─── Re-export helpers (for tests / backward compat) ─────────────────────────
export { stripHtml };
export { resolveBook };