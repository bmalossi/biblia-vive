import booksDataPtBR from "@/data/books.json";
import booksDataEN from "@/data/books-en.json";
import booksDataES from "@/data/books-es.json";
import type { Locale } from "@/i18n";

export interface Book {
  id: string;
  slug: string;
  name: string;
  chapters: number;
  abbrev: string;
}

interface BooksData {
  old_testament: Book[];
  new_testament: Book[];
}

const booksByLocale: Record<Locale, BooksData> = {
  "pt-BR": booksDataPtBR as BooksData,
  en: booksDataEN as BooksData,
  es: booksDataES as BooksData,
};

// Default (pt-BR) for backward compat
const defaultBooks = booksByLocale["pt-BR"];

export const OLD_TESTAMENT = defaultBooks.old_testament;
export const NEW_TESTAMENT = defaultBooks.new_testament;
export const ALL_BOOKS = [...OLD_TESTAMENT, ...NEW_TESTAMENT];

export function getBooksForLocale(locale: Locale) {
  const data = booksByLocale[locale] ?? defaultBooks;
  return {
    oldTestament: data.old_testament,
    newTestament: data.new_testament,
    allBooks: [...data.old_testament, ...data.new_testament],
  };
}

export function findBookBySlug(slug?: string, locale?: Locale) {
  const books = locale ? getBooksForLocale(locale).allBooks : ALL_BOOKS;
  return books.find((book) => book.slug.toLowerCase() === slug?.toLowerCase());
}

export function findBookById(id?: string, locale?: Locale) {
  const books = locale ? getBooksForLocale(locale).allBooks : ALL_BOOKS;
  return books.find((book) => book.id.toLowerCase() === id?.toLowerCase());
}

export function getTestament(book?: Book) {
  if (!book) return "";
  return OLD_TESTAMENT.some((item) => item.id === book.id) ? "old" : "new";
}

export function findBookGlobally(value?: string, locale?: Locale) {
  if (!value) return undefined;
  const books = locale ? getBooksForLocale(locale).allBooks : ALL_BOOKS;
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  return books.find((book) =>
    book.id.toLowerCase() === normalized ||
    book.slug.toLowerCase() === normalized ||
    book.abbrev.toLowerCase() === normalized ||
    book.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === normalized ||
    // common aliases from edge cases
    (normalized === "jm" && book.id === "jam") ||
    (normalized === "jud" && book.id === "jdg") ||
    (normalized === "joa" && book.id === "joh")
  );
}