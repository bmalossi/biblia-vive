import { Button } from "@/components/ui/button";
import { findBookById } from "@/lib/books";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { memo, useMemo } from "react";

interface SearchResultCardProps {
  route: string;
  query: string;
  verse: {
    bookId: string;
    chapterId: string;
    content: string;
    id: string;
    reference: string;
  };
}

const cleanText = (content: string) => content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlightText = (text: string, query: string) => {
  const term = query.trim();
  if (!term) return text;

  const regex = new RegExp(`(${escapeRegex(term)})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark className="rounded-sm bg-gold-bg px-0.5 text-app-text" key={`${part}-${index}`}>
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
};


function SearchResultCardComponent({ verse, query, route }: SearchResultCardProps) {
  const cleanedContent = useMemo(() => cleanText(verse.content), [verse.content]);
  const [bookId, chapterId] = (verse.chapterId || "").split(".");
  const verseNumber = verse.reference.match(/:(\d+)/)?.[1] ?? "1";
  const chapterNumber = chapterId || "1";
  const matchedBook = findBookById(bookId || verse.bookId);

  return (
    <Link
      to={route}
      className="group block w-full rounded-xl border border-border bg-app-surface p-4 text-left transition-colors hover:border-gold hover:bg-app-raised cursor-pointer"
    >
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.08em] text-gold">
        {matchedBook?.name ?? verse.reference.split(" ")[0]} {chapterNumber} · versículo {verseNumber}
      </p>
      <p className="mt-2 font-serif text-base leading-relaxed text-app-text">{highlightText(cleanedContent, query)}</p>
      <div className="mt-3 flex justify-end">
        <div className="inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium text-app-text hover:bg-accent hover:text-accent-foreground">
          Ler capítulo <ArrowRight className="ml-2 h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
}

const SearchResultCard = memo(SearchResultCardComponent);

export default SearchResultCard;