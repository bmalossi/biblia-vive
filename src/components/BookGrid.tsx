import { Book } from "@/lib/books";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookGridProps {
  books?: Book[];
  oldTestament?: Book[];
  newTestament?: Book[];
  currentReading?: { chapter: number; slug: string } | null;
  version: string;
}

export default function BookGrid({
  books,
  oldTestament,
  newTestament,
  version,
  currentReading,
}: BookGridProps) {
  const { t } = useTranslation();

  // Se oldTestament e newTestament forem fornecidos, exibe o layout lado a lado com 3 colunas cada
  const hasBothTestaments = Boolean(oldTestament && newTestament);

  if (hasBothTestaments && oldTestament && newTestament) {
    // Divisão do Antigo Testamento (39 livros) em 3 colunas de 13 livros
    const oldCol1 = oldTestament.slice(0, 13);
    const oldCol2 = oldTestament.slice(13, 26);
    const oldCol3 = oldTestament.slice(26, 39);

    // Divisão do Novo Testamento (27 livros) em 3 colunas de 9 livros
    const newCol1 = newTestament.slice(0, 9);
    const newCol2 = newTestament.slice(9, 18);
    const newCol3 = newTestament.slice(18, 27);

    const renderBookLink = (book: Book) => {
      const isCurrent = currentReading?.slug === book.slug;
      return (
        <Tooltip key={book.id}>
          <TooltipTrigger asChild>
            <Link
              to={`/${version}/${book.slug}`}
              className={cn(
                "group flex items-center py-1 sm:py-1.5 text-xs sm:text-[0.84rem] transition-all duration-150 truncate cursor-pointer rounded-xs outline-hidden focus-visible:ring-1 focus-visible:ring-gold",
                isCurrent
                  ? "text-gold font-semibold"
                  : "text-app-text/90 hover:text-gold"
              )}
            >
              {isCurrent && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold mr-1.5" />
              )}
              <span className="truncate group-hover:translate-x-0.5 transition-transform duration-150">
                {book.name}
              </span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top">
            {isCurrent
              ? t("reading.currentlyAt", { book: book.name, chapter: currentReading.chapter })
              : `${book.name} · ${t("reading.chaptersCount", { count: book.chapters })}`}
          </TooltipContent>
        </Tooltip>
      );
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* ── CARD 1: ANTIGO TESTAMENTO ── */}
        <div className="rounded-2xl border border-border/80 bg-app-surface/60 p-5 sm:p-6 lg:p-7 shadow-xs hover:border-[#382f23] transition-all">
          <div className="flex items-center justify-between mb-3.5 sm:mb-4 pb-2 border-b border-border/40">
            <h3 className="font-serif text-lg sm:text-xl font-medium text-gold">
              {t("home.oldTestament")}
            </h3>
            <span className="font-mono text-[0.68rem] text-app-text-muted uppercase tracking-wider">
              39 livros
            </span>
          </div>

          <div className="grid grid-cols-3 gap-x-2 sm:gap-x-4 md:gap-x-6">
            <div className="flex flex-col space-y-0.5 sm:space-y-1 min-w-0">
              {oldCol1.map(renderBookLink)}
            </div>
            <div className="flex flex-col space-y-0.5 sm:space-y-1 min-w-0">
              {oldCol2.map(renderBookLink)}
            </div>
            <div className="flex flex-col space-y-0.5 sm:space-y-1 min-w-0">
              {oldCol3.map(renderBookLink)}
            </div>
          </div>
        </div>

        {/* ── CARD 2: NOVO TESTAMENTO ── */}
        <div className="rounded-2xl border border-border/80 bg-app-surface/60 p-5 sm:p-6 lg:p-7 shadow-xs hover:border-[#382f23] transition-all">
          <div className="flex items-center justify-between mb-3.5 sm:mb-4 pb-2 border-b border-border/40">
            <h3 className="font-serif text-lg sm:text-xl font-medium text-gold">
              {t("home.newTestament")}
            </h3>
            <span className="font-mono text-[0.68rem] text-app-text-muted uppercase tracking-wider">
              27 livros
            </span>
          </div>

          <div className="grid grid-cols-3 gap-x-2 sm:gap-x-4 md:gap-x-6">
            <div className="flex flex-col space-y-0.5 sm:space-y-1 min-w-0">
              {newCol1.map(renderBookLink)}
            </div>
            <div className="flex flex-col space-y-0.5 sm:space-y-1 min-w-0">
              {newCol2.map(renderBookLink)}
            </div>
            <div className="flex flex-col space-y-0.5 sm:space-y-1 min-w-0">
              {newCol3.map(renderBookLink)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: Grade padrão com books avulsos
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
      {(books ?? []).map((book) => {
        const isCurrent = currentReading?.slug === book.slug;
        return (
          <Tooltip key={book.id}>
            <TooltipTrigger asChild>
              <Link
                to={`/${version}/${book.slug}`}
                className="group relative flex items-center justify-between rounded-xl border border-border/70 bg-app-surface/60 px-3 py-2.5 sm:px-3.5 sm:py-2.5 transition-all duration-150 ease-out hover:border-gold/50 hover:bg-app-raised hover:shadow-xs active:scale-[0.99]"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    {isCurrent && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    )}
                    <p className="font-sans text-xs sm:text-[0.78rem] font-semibold text-app-text group-hover:text-gold transition-colors truncate leading-tight">
                      {book.name}
                    </p>
                  </div>
                  <p className="mt-0.5 font-sans text-[0.65rem] text-app-text-muted transition-colors">
                    {t("reading.chaptersCount", { count: book.chapters })}
                  </p>
                </div>
                <ChevronRight className="h-3 w-3 shrink-0 text-app-text-muted/50 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-gold" />
              </Link>
            </TooltipTrigger>
            {isCurrent && (
              <TooltipContent>
                {t("reading.currentlyAt", { book: book.name, chapter: currentReading.chapter })}
              </TooltipContent>
            )}
          </Tooltip>
        );
      })}
    </div>
  );
}