import { findBookById, findBookBySlug, findBookGlobally } from "@/lib/books";
import { ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { memo } from "react";
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
    const isMatch = regex.test(part);
    regex.lastIndex = 0;

    return isMatch ? (
      <mark
        key={`${part}-${index}`}
        className="rounded-xs bg-[#4a3b22]/90 text-[#f6d997] px-1.5 py-0.5 font-medium transition-colors"
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
  const [rawBookId, chapterId] = (verse.chapterId || "").split(".");
  const verseNumber = verse.reference.match(/:(\d+)/)?.[1] ?? "1";
  const chapterNumber = chapterId || "1";

  // Extrai nome do livro a partir da referência (ex: "1 Crônicas 15:28" -> "1 Crônicas")
  const refBookName = verse.reference.replace(/\s+\d+:\d+.*$/, "").trim();
  const candidateBook = rawBookId || verse.bookId;

  const matchedBook =
    findBookGlobally(refBookName) ||
    findBookById(candidateBook) ||
    findBookBySlug(candidateBook) ||
    findBookGlobally(candidateBook);

  const bookName = matchedBook?.name || refBookName || "Capítulo";
  const versionLabel = (verse.version || "kja").toUpperCase();

  return (
    <article
      data-testid="search-result-row"
      className="border-b border-border/40 py-7 sm:py-8 first:pt-4 transition-colors hover:bg-gold/[0.015]"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6">
        {/* ── 1. Referência & Versão (Coluna Esquerda) ── */}
        <div className="w-full sm:w-44 md:w-52 shrink-0">
          <h3 className="font-serif text-xl sm:text-2xl text-[#F4EFEA] font-normal leading-tight">
            {bookName} {chapterNumber}:{verseNumber}
          </h3>
          <span className="font-mono text-[11px] text-app-text-muted/70 uppercase tracking-wider block mt-1">
            {versionLabel}
          </span>
        </div>

        {/* ── 2. Texto do Versículo com Destaque Dourado (Coluna Central) ── */}
        <div className="flex-1 min-w-0 pr-0 sm:pr-6 md:pr-8">
          <p className="font-serif text-base sm:text-[1.08rem] leading-[1.8] text-[#D6D2CA]">
            “{highlightText(rawText, query)}”
          </p>
        </div>

        {/* ── 3. Ação Abrir Capítulo com Ícone de Livro (Coluna Direita) ── */}
        <div className="shrink-0 pt-2 sm:pt-1 sm:pl-6 md:pl-8 sm:border-l sm:border-border/40 flex items-center">
          <Link
            to={route}
            aria-label={`Abrir ${bookName} ${chapterNumber}`}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-gold hover:text-gold-light transition-colors whitespace-nowrap group"
          >
            <BookOpen className="h-4 w-4 text-gold/80 group-hover:text-gold transition-colors shrink-0" />
            <span>
              Abrir {bookName} {chapterNumber}
            </span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </Link>
        </div>
      </div>
    </article>
  );
}

const SearchResultCard = memo(SearchResultCardComponent);

export default SearchResultCard;