import { Book } from "@/lib/books";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { useTranslation } from "@/i18n";

interface BookGridProps {
  books: Book[];
  currentReading?: { chapter: number; slug: string } | null;
  version: string;
}

export default function BookGrid({ books, version, currentReading }: BookGridProps) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {books.map((book) => {
        const isCurrent = currentReading?.slug === book.slug;
        return (
          <Tooltip key={book.id}>
            <TooltipTrigger asChild>
              <Link
                className="group relative flex min-h-[48px] flex-col justify-between rounded-lg border border-border bg-app-surface px-3 py-2.5 transition-all duration-150 ease-out btn-puffed hover:border-gold hover:bg-gold"
                to={`/${version}/${book.slug}`}
              >
                {isCurrent && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold group-hover:bg-primary-foreground" />
                )}
                <p className="font-sans text-xs sm:text-[0.78rem] font-medium leading-snug text-app-text break-words text-balance group-hover:text-primary-foreground pr-3">
                  {book.name}
                </p>
                <p className="mt-1 font-sans text-[0.65rem] text-app-text-muted group-hover:text-primary-foreground/80">
                  {t("reading.chaptersCount", { count: book.chapters })}
                </p>
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