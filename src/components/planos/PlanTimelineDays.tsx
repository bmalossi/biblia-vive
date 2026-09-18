import React from "react";
import { Lock, Check, Play, BookOpen, Clock, ArrowRight } from "lucide-react";
import type { ReadingPlan, ReadingPlanDay } from "@/lib/readingPlanTypes";
import { findBookBySlug } from "@/lib/books";

interface PlanTimelineDaysProps {
  plan: ReadingPlan;
  todayDayIndex: number;
  completedDays: number[];
  readRefs: string[];
  onStartDayReading: (dayNumber: number, firstRef: string) => void;
}

/**
 * Deriva uma tag de categoria canônica a partir do livro bíblico
 */
function deriveCategoryTag(firstRef?: string): string {
  if (!firstRef) return "LIVROS";
  const slug = firstRef.split("/")[0]?.toLowerCase();
  if (["mt", "mc", "lc", "joa"].includes(slug)) return "EVANGELHOS";
  if (["rm", "1co", "2co", "gl", "ef", "fp", "cl", "1ts", "2ts", "1tm", "2tm", "tt", "fm"].includes(slug)) return "PAULINAS";
  if (["sl", "pv", "ec", "ct"].includes(slug)) return "SABEDORIA";
  if (["gn", "ex", "lv", "nm", "dt"].includes(slug)) return "PENTATEUCO";
  if (["is", "jr", "lm", "ez", "dn", "os", "jl", "am", "ob", "jn", "mq", "na", "hc", "sf", "ag", "zc", "ml"].includes(slug)) return "PROFETAS";
  if (["hb", "tg", "1pe", "2pe", "1jo", "2jo", "3jo", "jd", "ap"].includes(slug)) return "EPÍSTOLAS";
  return "LIVROS";
}

/**
 * Sintetiza referências consecutivas do mesmo livro de forma elegante:
 * - ["sl/1", "sl/2", "sl/3", "sl/4", "sl/5"] -> "Salmos 1, 2, 3, 4 e 5"
 * - ["mt/1", "mt/2", "mt/3"] -> "Mateus 1, 2 e 3"
 * - ["rm/1", "rm/2"] -> "Romanos 1 e 2"
 * - ["mt/1", "lc/2"] -> "Mateus 1 • Lucas 2"
 */
export function formatSynthesizedChapterTitle(refs: string[]): string {
  if (!refs || refs.length === 0) return "";

  const groups: { bookName: string; chapters: number[] }[] = [];

  for (const ref of refs) {
    const [slug, chapStr] = ref.split("/");
    const chapter = parseInt(chapStr, 10);
    const book = findBookBySlug(slug);
    const bookName = book?.name ?? slug.toUpperCase();

    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.bookName === bookName) {
      lastGroup.chapters.push(chapter);
    } else {
      groups.push({ bookName, chapters: [chapter] });
    }
  }

  return groups
    .map(({ bookName, chapters }) => {
      if (chapters.length === 1) {
        return `${bookName} ${chapters[0]}`;
      }
      if (chapters.length === 2) {
        return `${bookName} ${chapters[0]} e ${chapters[1]}`;
      }
      const allExceptLast = chapters.slice(0, -1).join(", ");
      const last = chapters[chapters.length - 1];
      return `${bookName} ${allExceptLast} e ${last}`;
    })
    .join(" • ");
}

export const PlanTimelineDays: React.FC<PlanTimelineDaysProps> = ({
  plan,
  todayDayIndex,
  completedDays,
  readRefs,
  onStartDayReading,
}) => {
  return (
    <div className="relative w-full max-w-5xl mx-auto py-4">
      {/* Eixo Vertical Conector Contínuo */}
      <div
        className="absolute left-[27px] sm:left-[31px] top-8 bottom-8 w-[2px] bg-gradient-to-b from-[#e5b869]/40 via-[#382f23] to-[#261f18]"
        aria-hidden="true"
      />

      <div className="space-y-6">
        {plan.days.map((dayItem: ReadingPlanDay) => {
          const isCompleted = completedDays.includes(dayItem.day);
          const isActive = dayItem.day === todayDayIndex && !isCompleted;
          const isLocked = dayItem.day > todayDayIndex && !isCompleted;

          const categoryTag = dayItem.categoryTag || deriveCategoryTag(dayItem.refs[0]);
          const chapterTitle = dayItem.title || formatSynthesizedChapterTitle(dayItem.refs);
          const subtitle = dayItem.subtitle || "A Palavra de Deus viva e eficaz para o seu coração.";
          const totalReadings = dayItem.refs.length;
          const estimatedMin = dayItem.estimatedMinutes || totalReadings * 6;
          const firstRef = dayItem.refs[0] || "mt/1";

          return (
            <div
              key={dayItem.day}
              data-testid={`day-row-${dayItem.day}`}
              className="relative flex items-center gap-4 sm:gap-6 group"
            >
              {/* Emblema Circular do Dia na Linha do Tempo */}
              <div
                className={`relative flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 flex-col items-center justify-center rounded-full transition-all duration-300 z-10 select-none ${
                  isActive
                    ? "border-2 border-[#e5b869] bg-[#1c1814] shadow-[0_0_18px_rgba(229,184,105,0.3)] ring-4 ring-[#e5b869]/10"
                    : isCompleted
                      ? "border border-emerald-600/70 bg-[#131c15] text-emerald-400"
                      : "border border-[#382f23]/80 bg-[#161412] text-[#6b6154]"
                }`}
              >
                <span
                  className={`font-mono text-[0.62rem] sm:text-[0.68rem] uppercase tracking-widest leading-none ${
                    isActive
                      ? "text-[#e5b869] font-semibold"
                      : isCompleted
                        ? "text-emerald-400 font-medium"
                        : "text-[#6b6154]"
                  }`}
                >
                  DIA
                </span>
                <span
                  className={`font-serif text-base sm:text-lg font-bold leading-tight mt-0.5 ${
                    isActive
                      ? "text-[#f4efea]"
                      : isCompleted
                        ? "text-emerald-300"
                        : "text-[#8f8272]"
                  }`}
                >
                  {dayItem.day}
                </span>
              </div>

              {/* Card do Dia */}
              <div
                className={`flex-1 rounded-2xl border p-5 sm:p-7 transition-all duration-300 ${
                  isActive
                    ? "border-[#e5b869]/40 bg-[#191613] shadow-2xl ring-1 ring-[#e5b869]/20"
                    : isCompleted
                      ? "border-[#382f23]/60 bg-[#161412]/90 hover:border-[#382f23]"
                      : "border-[#2b241d]/70 bg-[#151311]/80 opacity-75"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  {/* Informações da Leitura */}
                  <div className="space-y-2 max-w-xl">
                    {/* Pílula de Categoria */}
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-[#3e3223] bg-[#241e18] px-2.5 py-0.5 font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-[#e5b869]">
                        {categoryTag}
                      </span>
                    </div>

                    {/* Título dos Capítulos */}
                    <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#f4efea] tracking-tight">
                      {chapterTitle}
                    </h3>

                    {/* Descrição / Tema Espiritual */}
                    <p className="font-serif text-xs sm:text-sm text-[#8f8272] leading-relaxed">
                      {subtitle}
                    </p>

                    {/* Metadados: Leituras e Tempo Estimado */}
                    <div className="flex items-center gap-2 pt-1 font-mono text-xs text-[#8f8272]">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-[#e5b869]/70" />
                        {totalReadings} {totalReadings === 1 ? "leitura" : "leituras"}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#e5b869]/70" />
                        ~ {estimatedMin} min
                      </span>
                    </div>
                  </div>

                  {/* Botão de Ação do Dia */}
                  <div className="flex shrink-0 items-center justify-start md:justify-end pt-2 md:pt-0">
                    {isActive ? (
                      <button
                        type="button"
                        onClick={() => onStartDayReading(dayItem.day, firstRef)}
                        className="group/btn inline-flex items-center gap-2 rounded-full bg-[#e5b869] px-6 py-2.5 font-sans text-xs sm:text-sm font-bold text-[#161412] shadow-lg shadow-[#e5b869]/20 hover:bg-[#d8a855] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <Play className="h-3.5 w-3.5 fill-current text-[#161412]" />
                        <span>Ler hoje</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </button>
                    ) : isCompleted ? (
                      <button
                        type="button"
                        onClick={() => onStartDayReading(dayItem.day, firstRef)}
                        className="group/btn inline-flex items-center gap-2 rounded-full border border-emerald-700/50 bg-emerald-950/20 px-5 py-2 font-mono text-xs font-medium text-emerald-400 hover:bg-emerald-950/40 hover:border-emerald-600 transition-all cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Concluído</span>
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-2 rounded-full border border-[#2b241d] bg-[#1a1715] px-5 py-2 font-mono text-xs text-[#665d52] cursor-not-allowed select-none">
                        <Lock className="h-3.5 w-3.5 text-[#665d52]" />
                        <span>Bloqueado</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlanTimelineDays;
