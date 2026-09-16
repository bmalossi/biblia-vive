import React, { useEffect, useRef } from "react";
import { LayoutGrid } from "lucide-react";
import { useReadingTheme } from "@/hooks/useReadingTheme";
import { cn } from "@/lib/utils";

export interface ReadingChapterGridCardProps {
  totalChapters: number;
  currentChapter: number;
  onSelectChapter: (chapter: number) => void;
  className?: string;
  headerSlot?: React.ReactNode;
}

/**
 * ReadingChapterGridCard
 *
 * Card flutuante lateral de seleção de capítulos da Bíblia.
 * Adaptativo para os modos Dark (marrom escuro/dourado), Sépia (pergaminho/ouro velho) e Light (branco/âmbar):
 * - Fundo translúcido com borda suave harmônica com o tema
 * - Grade exatamente de 4 colunas com círculos numerados
 * - Capítulo ativo destacado com auto-scroll suave
 */
export const ReadingChapterGridCard: React.FC<ReadingChapterGridCardProps> = ({
  totalChapters,
  currentChapter,
  onSelectChapter,
  className,
  headerSlot,
}) => {
  const { isDark, isSepia } = useReadingTheme();
  const activeChapterRef = useRef<HTMLButtonElement | null>(null);

  // Faz auto-scroll suave para manter o capítulo ativo visível ao carregar
  useEffect(() => {
    if (activeChapterRef.current && typeof activeChapterRef.current.scrollIntoView === "function") {
      activeChapterRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [currentChapter]);

  const chapters = Array.from({ length: totalChapters }, (_, i) => i + 1);

  // Theme-specific styles
  const cardContainerClass = isDark
    ? "border-[#382f23]/80 bg-[#161412]/90 shadow-2xl text-[#ded9ce]"
    : isSepia
      ? "border-[#d8c8b0] bg-[#ede4d4]/90 shadow-xl text-[#3d2e24]"
      : "border-neutral-200 bg-white/95 shadow-xl text-neutral-800";

  const headerBorderClass = isDark
    ? "border-[#382f23]/50"
    : isSepia
      ? "border-[#d8c8b0]/70"
      : "border-neutral-200";

  const titleClass = isDark
    ? "text-[#f5f5f0]"
    : isSepia
      ? "text-[#2e241d]"
      : "text-neutral-900";

  const badgeClass = isDark
    ? "bg-[#241f1b] text-[#a89f91] border-[#382f23]/40"
    : isSepia
      ? "bg-[#dfd3c0] text-[#5c4a3b] border-[#c8b89e]"
      : "bg-neutral-100 text-neutral-600 border-neutral-200";

  const iconContainerClass = isDark
    ? "bg-[#241f1b]/80 text-[#a89f91]"
    : isSepia
      ? "bg-[#dfd3c0]/80 text-[#5c4a3b]"
      : "bg-neutral-100 text-neutral-600";

  const activeBtnClass = isDark
    ? "bg-[#e5b869] text-neutral-950 font-bold shadow-lg shadow-[#e5b869]/30 border-[#e5b869]"
    : isSepia
      ? "bg-[#c4973b] text-[#1c140e] font-bold shadow-md shadow-[#c4973b]/30 border-[#c4973b]"
      : "bg-[#d4a034] text-neutral-950 font-bold shadow-md shadow-[#d4a034]/25 border-[#d4a034]";

  const inactiveBtnClass = isDark
    ? "bg-[#221e1a]/70 text-[#ded9ce] hover:bg-[#2c2621] hover:text-white border-[#382f23]/50"
    : isSepia
      ? "bg-[#f7f2e8] text-[#4a3a2d] hover:bg-[#e4d8c5] hover:text-[#1f1610] border-[#d8c8b0]"
      : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 border-neutral-200";

  const activeDotClass = isDark
    ? "bg-[#e5b869] shadow-[#e5b869]"
    : isSepia
      ? "bg-[#c4973b] shadow-[#c4973b]"
      : "bg-[#d4a034] shadow-[#d4a034]";

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border backdrop-blur-md p-5 w-full transition-colors duration-300",
        cardContainerClass,
        className
      )}
    >
      {/* Top Header */}
      <div className={cn("flex items-center justify-between pb-3.5 mb-2 border-b", headerBorderClass)}>
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-semibold tracking-wide", titleClass)}>
            Capítulos
          </span>
          <span className={cn("text-[0.68rem] px-2 py-0.5 rounded-full font-mono border", badgeClass)}>
            {totalChapters}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {headerSlot}
          <div className={cn("p-1.5 rounded-lg", iconContainerClass)}>
            <LayoutGrid className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* 4-column Circle Buttons Grid */}
      <div className="max-h-[460px] overflow-y-auto custom-scrollbar pr-1.5 py-1">
        <div className="grid grid-cols-4 gap-2.5 justify-items-center">
          {chapters.map((ch) => {
            const isActive = ch === currentChapter;
            return (
              <button
                key={ch}
                ref={isActive ? activeChapterRef : null}
                type="button"
                onClick={() => onSelectChapter(ch)}
                aria-current={isActive ? "page" : undefined}
                aria-label={`Capítulo ${ch}`}
                className={cn(
                  "relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold border",
                  isActive
                    ? `${activeBtnClass} scale-105`
                    : inactiveBtnClass
                )}
              >
                {ch}
                {isActive && (
                  <span
                    className={cn("absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full shadow-sm", activeDotClass)}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReadingChapterGridCard;
