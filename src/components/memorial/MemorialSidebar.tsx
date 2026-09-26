import React, { useMemo } from "react";
import { Sparkles, Feather, ArrowRight, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemorialEntry, MemorialCategory } from "@/lib/noteStore";
import { selectBestEcho } from "@/lib/noteStore";
import { MEMORIAL_CATEGORY_CONFIG, hasBibleReference, formatBibleReference } from "@/lib/memorialUtils";

export interface MemorialSidebarProps {
  entries: MemorialEntry[];
  totalEntries: number;
  onNewEntry: () => void;
  onOpenEntry: (entry: MemorialEntry) => void;
  className?: string;
}

export default function MemorialSidebar({
  entries,
  totalEntries,
  onNewEntry,
  onOpenEntry,
  className,
}: MemorialSidebarProps) {
  // Seleciona de forma inteligente uma memória do passado para recordar
  const echoMemory = useMemo(() => {
    if (!entries || entries.length === 0) return null;
    return selectBestEcho(entries) || entries[entries.length - 1];
  }, [entries]);

  // Cálculo da distância em dias desde o registro
  const daysAgo = useMemo(() => {
    if (!echoMemory) return 0;
    const diffMs = Date.now() - new Date(echoMemory.createdAt).getTime();
    return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }, [echoMemory]);

  const echoCategory = echoMemory ? (echoMemory.type as MemorialCategory) : null;
  const catInfo = echoCategory ? MEMORIAL_CATEGORY_CONFIG[echoCategory] : null;

  return (
    <aside
      aria-label="Resumo e utilitários do Memorial"
      className={cn("space-y-6 sticky top-24", className)}
    >
      {/* Widget 1: Marcos de Fé — Apenas a métrica 'X marcos de fé preservados' (conforme solicitado) */}
      <div className="rounded-2xl border border-border/80 bg-app-surface p-5 sm:p-6 space-y-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gold">
            {/* Ícone de Altar / Ebenézer */}
            <div className="w-7 h-7 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 fill-none stroke-current"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 20h16M7 16h10M9 12h6M11 8h2" />
              </svg>
            </div>
            <h3 className="font-serif text-sm font-medium text-app-text">
              Marcos de fé
            </h3>
          </div>
          <p className="font-mono text-[0.62rem] uppercase tracking-wider text-app-text-muted pl-9">
            RESUMO DA SUA JORNADA
          </p>
        </div>

        {/* Card Destaque: '16 marcos de fé preservados' */}
        <div className="p-4 rounded-xl bg-app-raised/80 border border-border space-y-1.5">
          <p className="font-serif text-lg sm:text-xl font-normal text-app-text leading-tight">
            <span className="text-gold font-medium">{totalEntries}</span>{" "}
            {totalEntries === 1 ? "marco de fé preservado" : "marcos de fé preservados"}
          </p>
          <p className="font-serif italic text-xs text-app-text-muted">
            "Até aqui nos ajudou o Senhor." — 1 Samuel 7:12
          </p>
        </div>
      </div>

      {/* Widget 2: 'Para recordar... Há tantos dias você registrou...' */}
      <div className="rounded-2xl border border-border/80 bg-app-surface p-5 sm:p-6 space-y-4 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-gold">
            <div className="w-7 h-7 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-gold" />
            </div>
            <h3 className="font-serif text-sm font-medium text-app-text">
              Para recordar...
            </h3>
          </div>
          <span className="font-mono text-[0.62rem] uppercase tracking-wider text-app-text-muted">
            ECO DO MEMORIAL
          </span>
        </div>

        {echoMemory ? (
          <div className="space-y-3">
            <p className="font-sans text-xs text-app-text-muted">
              Há <span className="text-gold font-medium">{daysAgo} {daysAgo === 1 ? "dia" : "dias"}</span> você registrou:
            </p>

            <div className="p-3.5 rounded-xl bg-app-raised border border-border space-y-2">
              <div className="flex items-center gap-2">
                {catInfo && (
                  <span className="px-2 py-0.5 rounded-full bg-app-surface border border-border text-[0.62rem] font-mono uppercase tracking-wider text-gold">
                    {catInfo.label}
                  </span>
                )}
                {hasBibleReference(echoMemory) && (
                  <span className="text-[0.68rem] font-sans text-app-text-muted">
                    {formatBibleReference(echoMemory)}
                  </span>
                )}
              </div>

              {echoMemory.title && (
                <h4 className="font-serif text-sm text-app-text font-medium leading-snug">
                  {echoMemory.title}
                </h4>
              )}

              <p className="font-sans text-xs text-app-text-muted leading-relaxed line-clamp-2">
                "{echoMemory.content}"
              </p>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => onOpenEntry(echoMemory)}
                  className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline cursor-pointer font-medium"
                >
                  <span>Revisitar marco</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="font-sans text-xs text-app-text-muted leading-relaxed">
            Ao registrar suas orações e reflexões, o Memorial trará suas lembranças no momento certo para fortalecer sua fé.
          </p>
        )}
      </div>

      {/* Widget 3: Palavra de Firmeza / Citação Bíblica */}
      <div className="rounded-2xl border border-border/80 bg-app-surface p-5 sm:p-6 space-y-2.5 shadow-lg">
        <div className="flex items-center gap-2 text-gold/80">
          <Quote className="w-4 h-4 rotate-180" />
          <span className="font-mono text-[0.62rem] uppercase tracking-wider text-app-text-muted">
            PALAVRA DE FIRMEZA
          </span>
        </div>

        <blockquote className="font-serif italic text-xs sm:text-[0.82rem] text-app-text leading-relaxed pl-2 border-l border-gold/40">
          “Porque Ele não é Deus de mortos, mas de vivos.”
        </blockquote>

        <p className="font-mono text-[0.68rem] text-app-text-muted pl-2">
          — Mateus 22:32
        </p>
      </div>

      {/* Widget 4: Registre uma nova memória (CTA) */}
      <div className="rounded-2xl border border-border/80 bg-app-surface p-5 sm:p-6 space-y-3.5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold shrink-0">
            <Feather className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-serif text-sm font-medium text-app-text leading-snug">
              Registre uma nova memória
            </h4>
            <p className="font-sans text-[0.72rem] text-app-text-muted">
              Guarde o que Deus está fazendo na sua vida.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNewEntry}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-gold hover:bg-gold/90 text-primary-foreground text-xs font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <span>Nova memória</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
