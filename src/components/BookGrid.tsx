import { Book } from "@/lib/books";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { ChevronRight } from "lucide-react";

interface BookGridProps {
  books: Book[];
  currentReading?: { chapter: number; slug: string } | null;
  version: string;
}

export default function BookGrid({ books, version, currentReading }: BookGridProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
      {books.map((book) => {
        const isCurrent = currentReading?.slug === book.slug;
        return (
          <Tooltip key={book.id}>
            <TooltipTrigger asChild>
              <Link
                to={`/${version}/${book.slug}`}
                className="group relative flex items-center justify-between rounded-xl border border-border/70 bg-app-surface/60 px-3 py-2.5 sm:px-3.5 sm:py-2.5 transition-all duration-150 ease-out hover:border-gold/50 hover:bg-app-raised hover:shadow-xs active:scale-[0.99]"
              >
                {/* Lado Esquerdo: Nome do Livro e Capítulos */}
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

                {/* Lado Direito: Chevron Indicador */}
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