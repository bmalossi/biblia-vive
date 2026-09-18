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
      <div className="rounded-2xl border border-[#382f23]/80 bg-[#161412] p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#e5b869]">
            {/* Ícone de Altar / Ebenézer */}
            <div className="w-7 h-7 rounded-lg bg-[#e5b869]/10 border border-[#e5b869]/20 flex items-center justify-center shrink-0">
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
            <h3 className="font-serif text-sm font-medium text-[#f4efea]">
              Marcos de fé
            </h3>
          </div>
          <p className="font-mono text-[0.62rem] uppercase tracking-wider text-[#8f8272] pl-9">
            RESUMO DA SUA JORNADA
          </p>
        </div>

        {/* Card Destaque: '16 marcos de fé preservados' */}
        <div className="p-4 rounded-xl bg-[#1d1814]/80 border border-[#382f23] space-y-1.5">
          <p className="font-serif text-lg sm:text-xl font-normal text-[#f4efea] leading-tight">
            <span className="text-[#e5b869] font-medium">{totalEntries}</span>{" "}
            {totalEntries === 1 ? "marco de fé preservado" : "marcos de fé preservados"}
          </p>
          <p className="font-serif italic text-xs text-[#8f8272]">
            "Até aqui nos ajudou o Senhor." — 1 Samuel 7:12
          </p>
        </div>
      </div>

      {/* Widget 2: 'Para recordar... Há tantos dias você registrou...' */}
      <div className="rounded-2xl border border-[#382f23]/80 bg-[#161412] p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[#e5b869]">
            <div className="w-7 h-7 rounded-lg bg-[#e5b869]/10 border border-[#e5b869]/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-[#e5b869]" />
            </div>
            <h3 className="font-serif text-sm font-medium text-[#f4efea]">
              Para recordar...
            </h3>
          </div>
          <span className="font-mono text-[0.62rem] uppercase tracking-wider text-[#8f8272]">
            ECO DO MEMORIAL
          </span>
        </div>

        {echoMemory ? (
          <div className="space-y-3">
            <p className="font-sans text-xs text-[#8f8272]">
              Há <span className="text-[#e5b869] font-medium">{daysAgo} {daysAgo === 1 ? "dia" : "dias"}</span> você registrou:
            </p>

            <div className="p-3.5 rounded-xl bg-[#1a1612] border border-[#382f23] space-y-2">
              <div className="flex items-center gap-2">
                {catInfo && (
                  <span className="px-2 py-0.5 rounded-full bg-[#241e18] border border-[#382f23] text-[0.62rem] font-mono uppercase tracking-wider text-[#e5b869]">
                    {catInfo.label}
                  </span>
                )}
                {hasBibleReference(echoMemory) && (
                  <span className="text-[0.68rem] font-sans text-[#8f8272]">
                    {formatBibleReference(echoMemory)}
                  </span>
                )}
              </div>

              {echoMemory.title && (
                <h4 className="font-serif text-sm text-[#f4efea] font-medium leading-snug">
                  {echoMemory.title}
                </h4>
              )}

              <p className="font-sans text-xs text-[#9b8e7e] leading-relaxed line-clamp-2">
                "{echoMemory.content}"
              </p>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => onOpenEntry(echoMemory)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#e5b869] hover:underline cursor-pointer font-medium"
                >
                  <span>Revisitar marco</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="font-sans text-xs text-[#8f8272] leading-relaxed">
            Ao registrar suas orações e reflexões, o Memorial trará suas lembranças no momento certo para fortalecer sua fé.
          </p>
        )}
      </div>

      {/* Widget 3: Palavra de Firmeza / Citação Bíblica */}
      <div className="rounded-2xl border border-[#382f23]/80 bg-[#161412] p-5 sm:p-6 space-y-2.5 shadow-xl">
        <div className="flex items-center gap-2 text-[#e5b869]/80">
          <Quote className="w-4 h-4 rotate-180" />
          <span className="font-mono text-[0.62rem] uppercase tracking-wider text-[#8f8272]">
            PALAVRA DE FIRMEZA
          </span>
        </div>

        <blockquote className="font-serif italic text-xs sm:text-[0.82rem] text-[#d5c7b5] leading-relaxed pl-2 border-l border-[#e5b869]/40">
          “Porque Ele não é Deus de mortos, mas de vivos.”
        </blockquote>

        <p className="font-mono text-[0.68rem] text-[#8f8272] pl-2">
          — Mateus 22:32
        </p>
      </div>

      {/* Widget 4: Registre uma nova memória (CTA) */}
      <div className="rounded-2xl border border-[#382f23]/80 bg-gradient-to-b from-[#1c1813] to-[#161412] p-5 sm:p-6 space-y-3.5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#e5b869]/10 border border-[#e5b869]/30 flex items-center justify-center text-[#e5b869] shrink-0">
            <Feather className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-serif text-sm font-medium text-[#f4efea] leading-snug">
              Registre uma nova memória
            </h4>
            <p className="font-sans text-[0.72rem] text-[#8f8272]">
              Guarde o que Deus está fazendo na sua vida.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNewEntry}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#e5b869] hover:bg-[#d8a855] text-[#161412] text-xs font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <span>Nova memória</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
