import { Link } from "react-router-dom";
import { useEditorialChapter } from "@/hooks/useEditorialChapter";
import { getEditorialChapterLink } from "@/types/editorialChapter";
import { Bookmark, Calendar } from "lucide-react";

interface HomeQuickActionsProps {
  lastRead: {
    capitulo: number;
    livro: string;
    versao: string;
  } | null;
  lastReadBookName?: string;
  version: string;
}

export default function HomeQuickActions({
  lastRead,
  lastReadBookName,
  version,
}: HomeQuickActionsProps) {
  const { chapter } = useEditorialChapter();

  const continueText = lastRead && lastReadBookName
    ? `Continuar: ${lastReadBookName} ${lastRead.capitulo}`
    : "Começar: Gênesis 1";

  const continueUrl = lastRead
    ? `/${lastRead.versao}/${lastRead.livro}/${lastRead.capitulo}`
    : `/${version}/genesis/1`;

  const todayUrl = chapter
    ? getEditorialChapterLink(chapter, version)
    : `/${version}/salmos/23`;

  return (
    <nav
      aria-label="Atalhos rápidos de leitura"
      className="mb-4 grid h-12 w-full grid-cols-2 gap-2.5"
    >
      <Link
        to={continueUrl}
        className="group relative flex h-full items-center justify-center gap-2 rounded-lg border border-border bg-app-surface px-3 text-xs font-medium text-app-text transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-gold hover:bg-gold hover:shadow-sm"
      >
        <Bookmark className="h-3.5 w-3.5 shrink-0 text-gold transition-all duration-150 group-hover:text-primary-foreground" />
        <span className="truncate font-sans font-medium text-app-text transition-colors duration-150 group-hover:text-primary-foreground">
          {continueText}
        </span>
      </Link>

      <Link
        to={todayUrl}
        className="group relative flex h-full items-center justify-center gap-2 rounded-lg border border-border bg-app-surface px-3 text-xs font-medium text-app-text transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-gold hover:bg-gold hover:shadow-sm"
      >
        <Calendar className="h-3.5 w-3.5 shrink-0 text-gold transition-all duration-150 group-hover:text-primary-foreground" />
        <span className="truncate font-sans font-medium text-app-text transition-colors duration-150 group-hover:text-primary-foreground">
          Capítulo de hoje
        </span>
      </Link>
    </nav>
  );
}
