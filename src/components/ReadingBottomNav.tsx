import React from "react";
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { BibleVersion, VERSION_CATALOG } from "@/lib/themes";
import { useReadingTheme } from "@/hooks/useReadingTheme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface PlanNavInfo {
  planName: string;
  day: number;
  step: number;
  totalSteps: number;
  nextChapterName?: string;
  isLastStep: boolean;
  onAdvanceNextReading?: () => void;
  onCompleteDayAndFinish?: () => void;
}

export interface ReadingBottomNavProps {
  currentVersion: BibleVersion;
  onVersionChange: (version: BibleVersion) => void;
  prevChapterInfo: {
    book: { name: string; slug: string };
    chapter: number;
  } | null;
  nextChapterInfo: {
    book: { name: string; slug: string };
    chapter: number;
  } | null;
  onNavigate: (chapter: number, bookSlug?: string) => void;
  onFinish?: () => void;
  className?: string;
  onOpenVersionModal?: () => void;
  planNavInfo?: PlanNavInfo | null;
}

/**
 * ReadingBottomNav
 *
 * Barra inferior de navegação no rodapé da coluna de leitura bíblica.
 * Adaptativo para os modos Dark, Sépia e Light.
 */
export const ReadingBottomNav: React.FC<ReadingBottomNavProps> = ({
  currentVersion,
  onVersionChange,
  prevChapterInfo,
  nextChapterInfo,
  onNavigate,
  onFinish,
  className,
  onOpenVersionModal,
  planNavInfo,
}) => {
  const { isDark, isSepia } = useReadingTheme();

  const borderNavClass = isDark
    ? "border-[#382f23]/60"
    : isSepia
      ? "border-[#d8c8b0]"
      : "border-neutral-200";

  const versionPillClass = isDark
    ? "border-[#382f23]/80 bg-[#1c1916]/80 hover:bg-[#25211d] text-[#ded9ce] hover:border-gold/60 hover:text-gold"
    : isSepia
      ? "border-[#d8c8b0] bg-[#ede4d4] hover:bg-[#e4d8c5] text-[#4a3a2d] hover:border-gold hover:text-gold"
      : "border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 hover:border-neutral-400 hover:text-neutral-950";

  const prevBtnClass = isDark
    ? "border-[#382f23]/80 bg-[#1c1916]/80 hover:bg-[#25211d] text-[#ded9ce] hover:border-neutral-500 hover:text-white"
    : isSepia
      ? "border-[#d8c8b0] bg-[#ede4d4] hover:bg-[#e4d8c5] text-[#4a3a2d] hover:border-[#b8a795] hover:text-[#1c140e]"
      : "border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 hover:border-neutral-400 hover:text-neutral-950";

  const disabledPrevBtnClass = isDark
    ? "border-[#382f23]/30 bg-[#1c1916]/30 text-[#6b6255]"
    : isSepia
      ? "border-[#d8c8b0]/40 bg-[#ede4d4]/40 text-[#a89885]"
      : "border-neutral-200 bg-neutral-100/50 text-neutral-400";

  const nextBtnClass = isDark
    ? "bg-[#e5b869] hover:bg-[#d9a855] text-neutral-950 font-bold shadow-md shadow-[#e5b869]/20"
    : isSepia
      ? "bg-[#c4973b] hover:bg-[#b5872a] text-[#1c140e] font-bold shadow-md shadow-[#c4973b]/25"
      : "bg-[#d4a034] hover:bg-[#c29029] text-neutral-950 font-bold shadow-md shadow-[#d4a034]/20";

  const dropdownClass = isDark
    ? "border-[#382f23] bg-[#161412] text-[#ded9ce]"
    : isSepia
      ? "border-[#d8c8b0] bg-[#f7f2e8] text-[#3d2e24]"
      : "border-neutral-200 bg-white text-neutral-800";

  return (
    <nav
      aria-label="Navegação de capítulos e versão"
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 pb-4 w-full border-t mt-10 transition-colors duration-300",
        borderNavClass,
        className
      )}
    >
      {/* Version Selector Pill */}
      {onOpenVersionModal ? (
        <button
          type="button"
          onClick={onOpenVersionModal}
          className={cn(
            "group flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm",
            versionPillClass
          )}
          aria-label={`Versão bíblica atual: ${currentVersion.toUpperCase()}. Clique para alterar.`}
        >
          <BookOpen className="h-3.5 w-3.5 text-gold group-hover:scale-110 transition-transform" />
          <span>{currentVersion.toUpperCase()}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-gold transition-colors" />
        </button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "group flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm",
                versionPillClass
              )}
              aria-label={`Versão bíblica atual: ${currentVersion.toUpperCase()}. Clique para alterar.`}
            >
              <BookOpen className="h-3.5 w-3.5 text-gold group-hover:scale-110 transition-transform" />
              <span>{currentVersion.toUpperCase()}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-gold transition-colors" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className={cn("w-64 max-h-80 overflow-y-auto custom-scrollbar rounded-xl border p-1 shadow-2xl", dropdownClass)}
          >
            {VERSION_CATALOG.map((v) => {
              const isSelected = v.id === currentVersion;
              return (
                <DropdownMenuItem
                  key={v.id}
                  onClick={() => onVersionChange(v.id)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 text-xs rounded-lg cursor-pointer transition-colors",
                    isSelected
                      ? "bg-gold/15 text-gold font-semibold"
                      : isDark
                        ? "text-[#ded9ce] hover:bg-[#241f1b] hover:text-white"
                        : isSepia
                          ? "text-[#4a3a2d] hover:bg-[#ede4d4] hover:text-[#1c140e]"
                          : "text-neutral-800 hover:bg-neutral-100 hover:text-neutral-950"
                  )}
                >
                  <div className="flex flex-col">
                    <span className="font-bold tracking-wider">{v.id.toUpperCase()}</span>
                    <span className="text-[0.7rem] text-muted-foreground font-normal">{v.name}</span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-gold shrink-0 ml-2" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Navigation Buttons Pill */}
      <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-end">
        {prevChapterInfo ? (
          <button
            type="button"
            onClick={() => onNavigate(prevChapterInfo.chapter, prevChapterInfo.book.slug)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer",
              prevBtnClass
            )}
            aria-label={`Ir para capítulo anterior: ${prevChapterInfo.book.name} ${prevChapterInfo.chapter}`}
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            <span>Capítulo anterior</span>
          </button>
        ) : (
          <button
            type="button"
            disabled
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-medium cursor-not-allowed opacity-50",
              disabledPrevBtnClass
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Capítulo anterior</span>
          </button>
        )}

        {planNavInfo ? (
          !planNavInfo.isLastStep ? (
            <button
              type="button"
              onClick={planNavInfo.onAdvanceNextReading}
              className={cn(
                "flex items-center gap-2 rounded-full px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]",
                nextBtnClass
              )}
              aria-label={`Avançar para a próxima leitura do plano: ${planNavInfo.nextChapterName}`}
            >
              <span>Avançar para {planNavInfo.nextChapterName ?? "próxima leitura"}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={planNavInfo.onCompleteDayAndFinish}
              className={cn(
                "flex items-center gap-2 rounded-full px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]",
                nextBtnClass
              )}
              aria-label="Concluir leituras de hoje"
            >
              <span>Concluir leituras de hoje</span>
              <Check className="h-4 w-4" />
            </button>
          )
        ) : nextChapterInfo ? (
          <button
            type="button"
            onClick={() => onNavigate(nextChapterInfo.chapter, nextChapterInfo.book.slug)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-5 sm:px-6 py-2.5 text-xs sm:text-sm transition-all duration-200 cursor-pointer",
              nextBtnClass
            )}
            aria-label={`Ir para próximo capítulo: ${nextChapterInfo.book.name} ${nextChapterInfo.chapter}`}
          >
            <span>Próximo capítulo</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onFinish}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-5 sm:px-6 py-2.5 text-xs sm:text-sm transition-all duration-200 cursor-pointer",
              nextBtnClass
            )}
            aria-label="Concluir leitura"
          >
            <span>Concluir Leitura</span>
            <Check className="h-4 w-4" />
          </button>
        )}
      </div>
    </nav>
  );
};

export default ReadingBottomNav;
