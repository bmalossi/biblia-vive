import { Button } from "@/components/ui/button";
import { findBookById } from "@/lib/books";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { memo, useMemo } from "react";
import { extractSearchTokens, buildHighlightRegex } from "@/lib/bibleSearchClient";

interface SearchResultCardProps {
  route: string;
  query: string;
  verse: {
    bookId: string;
    chapterId?: string;
    content?: string;
    text?: string;
    id: string;
    reference: string;
    version?: string;
  };
}

const cleanText = (content: string) => content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const highlightText = (text: string, query: string) => {
  const tokens = extractSearchTokens(query);
  if (!tokens.length) return text;

  const regex = buildHighlightRegex(tokens);
  if (!regex) return text;

  const parts = text.split(regex);

  return parts.map((part, index) => {
    // Check if this part matches any of the tokens
    const isMatch = regex.test(part);
    // Reset regex lastIndex because /g flag maintains state
    regex.lastIndex = 0;

    return isMatch ? (
      <mark
        className="rounded bg-gold/20 font-medium text-gold-dark dark:text-gold px-0.5 transition-colors"
        key={`${part}-${index}`}
      >
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    );
  });
};

function SearchResultCardComponent({ verse, query, route }: SearchResultCardProps) {
  const rawText = verse.text || (verse.content ? cleanText(verse.content) : "");
  const [bookId, chapterId] = (verse.chapterId || "").split(".");
  const verseNumber = verse.reference.match(/:(\d+)/)?.[1] ?? "1";
  const chapterNumber = chapterId || "1";
  const matchedBook = findBookById(bookId || verse.bookId);

  return (
    <Link
      to={route}
      className="group block w-full rounded-xl border border-border bg-app-surface p-4 text-left transition-colors hover:border-gold hover:bg-app-raised cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.08em] text-gold">
          {matchedBook?.name ?? verse.reference.split(" ")[0]} {chapterNumber} · versículo {verseNumber}
        </p>
        {verse.version && (
          <span className="rounded bg-app-raised border border-border px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider text-app-text-muted">
            {verse.version}
          </span>
        )}
      </div>
      <p className="mt-2 font-serif text-base leading-relaxed text-app-text">
        {highlightText(rawText, query)}
      </p>
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