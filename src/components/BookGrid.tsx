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
    <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(100px,1fr))]">
      {books.map((book) => (
        <Tooltip key={book.id}>
          <TooltipTrigger asChild>
            <Link
              className="relative rounded-lg border border-border bg-app-raised px-2 py-2 transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-gold hover:bg-gold-bg hover:shadow-sm"
              to={`/${version}/${book.slug}`}
            >
              {currentReading?.slug === book.slug && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold" />}
              <p className="truncate font-sans text-[0.72rem] font-medium text-app-text">{book.name}</p>
              <p className="mt-1 font-sans text-[0.6rem] text-app-text-muted">{t("reading.chaptersCount", { count: book.chapters })}</p>
            </Link>
          </TooltipTrigger>
          {currentReading?.slug === book.slug && (
            <TooltipContent>{t("reading.currentlyAt", { book: book.name, chapter: currentReading.chapter })}</TooltipContent>
          )}
        </Tooltip>
      ))}
    </div>
  );
}