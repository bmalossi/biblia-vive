import { findBookById } from "@/lib/books";
import { BOOK_ALIASES, normalizeBookAlias } from "@/lib/bookAliases";

export interface ParsedReference {
  bookId: string;
  chapter: number;
  verse?: number;
  slug: string;
}

const REFERENCE_REGEX = /^([1-3]?[a-z]+(?:\s+[a-z]+)?)\s+(\d+)(?:\s*[:.]\s*(\d+))?$/i;
const COMPACT_REGEX = /^([1-3]?[a-z]+)(\d+)(?:[:.](\d+))?$/i;

const normalizeInput = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const resolveBook = (rawBook: string) => {
  const compact = normalizeBookAlias(rawBook.replace(/\s+/g, ""));
  if (BOOK_ALIASES[compact]) return BOOK_ALIASES[compact];

  const spaced = normalizeBookAlias(rawBook.replace(/\s+/g, ""));
  return BOOK_ALIASES[spaced] ?? null;
};

export function parseReference(input: string): ParsedReference | null {
  const normalized = normalizeInput(input);
  if (!normalized) return null;

  const match = normalized.match(REFERENCE_REGEX) ?? normalized.match(COMPACT_REGEX);
  if (!match) return null;

  const rawBook = match[1];
  const chapter = Number(match[2]);
  const verse = match[3] ? Number(match[3]) : undefined;

  if (!rawBook || Number.isNaN(chapter) || chapter < 1 || (verse !== undefined && (Number.isNaN(verse) || verse < 1))) {
    return null;
  }

  const bookId = resolveBook(rawBook);
  if (!bookId) return null;

  const book = findBookById(bookId);
  if (!book) return null;

  if (chapter > book.chapters) return null;

  return {
    bookId,
    chapter,
    verse,
    slug: book.slug,
  };
}

export function formatParsedReferenceLabel(parsed: ParsedReference) {
  const book = findBookById(parsed.bookId);
  if (!book) return "";
  return `${book.name} ${parsed.chapter}${parsed.verse ? `:${parsed.verse}` : ""}`;
}