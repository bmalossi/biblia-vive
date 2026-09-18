import React, { useMemo } from "react";
import { Scroll } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemorialEntry, MemorialCategory } from "@/lib/noteStore";
import { groupEntriesByTime, hasBibleReference, type TimeGroup } from "@/lib/memorialUtils";

export interface MemorialTimelineProps {
  entries: MemorialEntry[];
  featuredEntryId?: string | null;
  renderCard?: (entry: MemorialEntry, index: number, isFeatured?: boolean) => React.ReactNode;
  emptyState?: React.ReactNode;
  className?: string;
}

export const MemorialTimeline: React.FC<MemorialTimelineProps> = ({
  entries,
  featuredEntryId,
  renderCard,
  emptyState,
  className = "",
}) => {
  // Ordena os registros do mais recente para o mais antigo
  const sortedEntries = useMemo(() => {
    return [...entries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [entries]);

  // Agrupamento temporal para marcos e selos (Ebenézer)
  const timeGroups = useMemo(() => groupEntriesByTime(sortedEntries), [sortedEntries]);

  if (sortedEntries.length === 0) {
    if (emptyState) return <>{emptyState}</>;

    return (
      <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-[#382f23] space-y-3 bg-[#161412] max-w-xl mx-auto">
        <Scroll className="h-10 w-10 text-[#8f8272]/40 mx-auto" />
        <p className="text-[0.95rem] font-serif text-[#f4efea]">Nenhuma marca encontrada</p>
        <p className="text-[0.8rem] text-[#9b8e7e] max-w-sm mx-auto">
          Grave suas orações, reflexões, testemunhos ou propósitos para erguer seu Altar de Memória diante do Senhor.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn("relative w-full py-4", className)}
      data-testid="sacred-timeline-axis"
    >
      {/* Eixo Vertical Sagrado:
          Mobile (< md): alinhado à esquerda na posição left-5 (20px).
          Desktop (md:): centralizado em md:left-1/2.
      */}
      <div
        aria-hidden="true"
        className="absolute top-0 bottom-0 left-5 md:left-1/2 w-0.5 -translate-x-1/2 bg-gradient-to-b from-[#e5b869]/40 via-[#e5b869]/20 to-[#e5b869]/40 pointer-events-none"
      />

      <div className="space-y-10">
        {timeGroups.map((group, groupIndex) => {
          return (
            <div key={group.key} className="relative space-y-8">
              {/* Selo / Marco Temporal no Eixo (Milestone Badge) */}
              <div className="relative flex items-center justify-start md:justify-center pl-1 md:pl-0">
                <div
                  data-testid="timeline-milestone"
                  className="z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-[#c69a50]/50 bg-[#161412] text-[#e5b869] text-[0.68rem] font-mono uppercase tracking-wider shadow-md backdrop-blur-xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e5b869] animate-pulse" />
                  <span>{group.label}</span>
                </div>
              </div>

              {/* Lista de Registros dentro do Grupo */}
              <div className="space-y-8 md:space-y-10">
                {group.entries.map((entry) => {
                  // O índice global determina a alternância cronológica esquerda/direita no desktop
                  const globalIndex = sortedEntries.findIndex((e) => e.id === entry.id);
                  const isLeft = globalIndex % 2 === 0;

                  return (
                    <div
                      key={entry.id}
                      data-testid="timeline-item"
                      data-side={isLeft ? "left" : "right"}
                      className={cn(
                        "relative flex flex-col md:flex-row items-start group",
                        // No desktop, alterna lado esquerdo e direito
                        isLeft
                          ? "md:justify-start"
                          : "md:justify-end"
                      )}
                    >
                      {/* Nó Sagrado Geométrico no Eixo Central:
                          Mobile (< md): left-5
                          Desktop (md:): left-1/2
                      */}
                      <div
                        className="absolute left-5 md:left-1/2 -translate-x-1/2 top-6 z-20 flex items-center justify-center pointer-events-none"
                        aria-hidden="true"
                      >
                        {renderTimelineNode(entry)}
                      </div>

                      {/* Conector Horizontal sutil entre o nó e o card */}
                      <div
                        aria-hidden="true"
                        className={cn(
                          "hidden md:block absolute top-7 h-px bg-gold/25 pointer-events-none transition-colors group-hover:bg-gold/50",
                          isLeft
                            ? "right-1/2 w-8"
                            : "left-1/2 w-8"
                        )}
                      />

                      {/* Card de Memória:
                          Mobile: deslocado para a direita da linha com pl-12 (48px)
                          Desktop: ocupa largura balanceada de md:w-[calc(50%-2rem)] com md:pr-8 / md:pl-8
                      */}
                      <div
                        className={cn(
                          "w-full pl-12 md:pl-0",
                          isLeft
                            ? "md:w-[calc(50%-2rem)] md:mr-auto md:pr-8"
                            : "md:w-[calc(50%-2rem)] md:ml-auto md:pl-8"
                        )}
                      >
                        {renderCard ? renderCard(entry, globalIndex, entry.id === featuredEntryId) : (
                          <div className="p-4 rounded-2xl border border-[#382f23] bg-[#161412] text-[#f4efea] text-sm">
                            <h4 className="font-serif font-semibold">{entry.title || (hasBibleReference(entry) ? entry.bookName : "")}</h4>
                            <p className="text-xs text-[#9b8e7e] mt-1">{entry.content}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Renderiza o nó geométrico com base no tipo de marco:
 * - Testemunho: Losango dourado preenchido
 * - Oração: Círculo prata / dourado
 * - Reflexão / Propósito: Diamante bronze estilizado
 */
function renderTimelineNode(entry: MemorialEntry) {
  const type = entry.type as MemorialCategory;

  if (type === "testimony") {
    return (
      <div
        data-testid="timeline-node-testimony"
        className="h-3.5 w-3.5 rotate-45 bg-gold border border-gold/90 shadow-sm transition-transform duration-200 group-hover:scale-125"
        title="Testemunho"
      />
    );
  }

  if (type === "prayer") {
    const isAnswered = Boolean(entry.answeredAt);
    return (
      <div
        data-testid="timeline-node-prayer"
        className={cn(
          "h-3.5 w-3.5 rounded-full border-2 transition-transform duration-200 group-hover:scale-125 shadow-xs",
          isAnswered
            ? "border-gold bg-gold"
            : "border-slate-300 dark:border-slate-400 bg-app-surface"
        )}
        title={isAnswered ? "Oração Respondida" : "Oração em Espera"}
      />
    );
  }

  // Reflexão ou Propósito / Jejum
  return (
    <div
      data-testid="timeline-node-reflection"
      className="h-3 w-3 rotate-45 border-2 border-gold/70 bg-app-surface shadow-xs transition-transform duration-200 group-hover:scale-125"
      title="Reflexão / Meditação"
    />
  );
}

export default MemorialTimeline;
