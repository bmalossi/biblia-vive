// ─────────────────────────────────────────────────────────────────────────────
// ReadingAmbientOrchestrator.tsx — Bíblia Vive · O Santuário Editorial
//
// Orquestrador contextual único pré-texto bíblico.
// Aplica a Regra Estrita de Precedência: NO MÁXIMO 1 aviso/banner principal
// visível por vez, garantindo que o primeiro versículo reine absoluto
// na primeira dobra da tela (WCAG AA, anti-clutter, foco contemplativo).
//
// Ordem de Precedência Estrita:
//   1. P1: Alerta de Sistema / Modo Offline (fallbackNotice)
//   2. P2: Plano de Leitura Ativo (isPlanReading && activePlan)
//   3. P3: Eco do Memorial (echoEntry)
//   4. P4: Fio da Escritura (scriptureThreadResult)
//   5. P5: Louvor do Salmista (WorshipCard para Salmos)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { WifiOff, ChevronRight, Music2, Sparkles, BookOpen, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemorialEntry, EchoContext } from "@/lib/noteStore";
import type { ScriptureThreadResult } from "@/lib/scriptureThread";
import EchoBanner from "@/components/EchoBanner";
import WorshipCard from "@/components/WorshipCard";
import ScriptureThreadBanner from "@/components/ScriptureThreadBanner";
import StoneIcon from "@/components/StoneIcon";

export interface ReadingAmbientOrchestratorProps {
  // 1. Alerta crítico de offline
  fallbackNotice?: string | null;

  // 2. Plano de leitura
  isPlanReading: boolean;
  activePlan?: {
    id: string;
    name: string;
  } | null;
  planDayNumber?: number;
  currentPlanStep?: number;
  totalPlanSteps?: number;
  bookName?: string;
  chapterNumber?: number | string;

  // 3. Eco do memorial
  echoEntry?: MemorialEntry | null;
  echoContext?: EchoContext;
  onOpenEchoModal?: () => void;

  // 4. Fio da Escritura
  scriptureThreadResult?: ScriptureThreadResult | null;
  scriptureThreadCandidate?: MemorialEntry | null;
  chapterRef?: string;
  onOpenScriptureThreadModal?: () => void;

  // 5. Louvor do Salmista
  bookId?: string;
  isPsalm?: boolean;

  className?: string;
}

export default function ReadingAmbientOrchestrator({
  fallbackNotice,
  isPlanReading,
  activePlan,
  planDayNumber = 1,
  currentPlanStep = 0,
  totalPlanSteps = 1,
  bookName,
  chapterNumber,
  echoEntry,
  echoContext = "direct",
  onOpenEchoModal,
  scriptureThreadResult,
  scriptureThreadCandidate,
  chapterRef,
  onOpenScriptureThreadModal,
  bookId,
  isPsalm = false,
  className,
}: ReadingAmbientOrchestratorProps) {
  // Estado local para alternar expansão secundária (ex: leitor no plano que deseja abrir o player de Salmo)
  const [showSecondaryWorship, setShowSecondaryWorship] = useState(false);

  // 1. Determinação da Precedência Estrita
  const hasFallback = Boolean(fallbackNotice);
  const hasPlan = Boolean(isPlanReading && activePlan);
  const hasEcho = Boolean(echoEntry && onOpenEchoModal);
  const hasThread = Boolean(scriptureThreadResult && onOpenScriptureThreadModal);
  const hasPsalmAudio = Boolean(isPsalm && bookId === "ps");

  // Se nenhum sinal estiver presente, não renderiza nada (zero layout impact)
  if (!hasFallback && !hasPlan && !hasEcho && !hasThread && !hasPsalmAudio) {
    return null;
  }

  // Precedência 1: Falha / Cache Offline
  if (hasFallback) {
    return (
      <aside
        aria-label="Alerta de modo offline"
        className={cn(
          "mb-5 flex items-center justify-between gap-3 rounded-xl border border-gold/30 bg-gold-bg/15 px-4 py-2.5 text-xs text-app-text shadow-xs animate-in fade-in duration-200",
          className
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <WifiOff className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
          <p className="truncate text-app-text leading-tight">
            <strong className="font-semibold text-gold mr-1.5">Modo Offline:</strong>
            <span className="text-app-text-muted">{fallbackNotice}</span>
          </p>
        </div>

        {/* Chip secundário se houver plano ou eco associado */}
        {hasPlan && (
          <Link
            to={`/planos?id=${activePlan?.id}`}
            className="shrink-0 text-xs font-mono text-gold hover:underline flex items-center gap-1"
          >
            Plano Dia {planDayNumber} <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </aside>
    );
  }

  // Precedência 2: Plano de Leitura Ativo
  if (hasPlan && activePlan) {
    return (
      <aside
        aria-label={`Plano de Leitura: ${activePlan.name}`}
        className={cn(
          "mb-5 rounded-xl border border-border/80 bg-app-surface/90 px-4 py-3 shadow-xs transition-colors hover:border-gold/40 animate-in fade-in duration-200",
          className
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Lado Esquerdo: Identificação Sóbria do Dia e Porção */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-mono font-semibold">
              {planDayNumber}
            </span>
            <div className="min-w-0">
              <p className="font-serif text-sm font-medium text-app-text truncate leading-tight">
                {activePlan.name}
              </p>
              <p className="font-mono text-xs text-gold mt-0.5 leading-tight">
                Dia {planDayNumber} &bull; Leitura {currentPlanStep + 1} de {totalPlanSteps}
                {bookName && ` (${bookName} ${chapterNumber})`}
              </p>
            </div>
          </div>

          {/* Lado Direito: Ações & Chips Secundários Opcionais */}
          <div className="flex items-center gap-2">
            {/* Chip de Salmo se o leitor quiser ouvir louvor sem estragar o topo */}
            {hasPsalmAudio && (
              <button
                type="button"
                onClick={() => setShowSecondaryWorship((prev) => !prev)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors border",
                  showSecondaryWorship
                    ? "bg-gold/15 text-gold border-gold/40"
                    : "bg-app-bg text-app-text-muted border-border hover:text-gold hover:border-gold/30"
                )}
                aria-label="Alternar áudio de louvor do Salmo"
              >
                <Music2 className="h-3 w-3" />
                <span className="hidden sm:inline">Louvor</span>
              </button>
            )}

            {/* Chip discreto de Fio se detectado no plano */}
            {hasThread && (
              <button
                type="button"
                onClick={onOpenScriptureThreadModal}
                className="inline-flex items-center gap-1.5 rounded-full bg-app-bg px-2.5 py-1 text-xs font-medium text-app-text-muted border border-border hover:text-gold hover:border-gold/30 transition-colors"
                aria-label="Abrir Fio da Escritura detectado"
              >
                <Layers className="h-3 w-3 text-gold" />
                <span className="hidden sm:inline">Fio da Escritura</span>
              </button>
            )}

            {/* Chip discreto de Eco se o leitor já tem memorial no capítulo */}
            {hasEcho && (
              <button
                type="button"
                onClick={onOpenEchoModal}
                className="inline-flex items-center gap-1.5 rounded-full bg-app-bg px-2.5 py-1 text-xs font-medium text-app-text-muted border border-border hover:text-gold hover:border-gold/30 transition-colors"
                aria-label="Abrir Eco do Memorial deste capítulo"
              >
                <StoneIcon className="h-3 w-3 text-gold" />
                <span className="hidden sm:inline">Eco</span>
              </button>
            )}

            <Link
              to={`/planos?id=${activePlan.id}`}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-app-bg px-3 py-1 text-xs font-mono text-app-text-muted hover:text-gold hover:border-gold/40 transition-colors"
            >
              <span>Ver plano</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Expansão sob demanda para o louvor do Salmo dentro do plano */}
        {showSecondaryWorship && hasPsalmAudio && (
          <div className="mt-3 pt-3 border-t border-border/60 animate-in fade-in duration-200">
            <WorshipCard bookId={bookId} chapter={Number(chapterNumber)} />
          </div>
        )}
      </aside>
    );
  }

  // Precedência 3: Eco do Memorial Pessoal
  if (hasEcho && echoEntry) {
    return (
      <div className={cn("mb-5", className)}>
        <EchoBanner
          entry={echoEntry}
          echoContext={echoContext}
          onOpenModal={onOpenEchoModal}
        />
      </div>
    );
  }

  // Precedência 4: Fio da Escritura (Tipologia JEV)
  if (hasThread && scriptureThreadResult) {
    return (
      <div className={cn("mb-5", className)}>
        <ScriptureThreadBanner
          result={scriptureThreadResult}
          candidateNote={scriptureThreadCandidate ?? null}
          chapterRef={chapterRef}
          onOpenModal={onOpenScriptureThreadModal}
        />
      </div>
    );
  }

  // Precedência 5: Louvor do Salmista (Salmos com áudio)
  if (hasPsalmAudio) {
    return (
      <div className={cn("mb-5", className)}>
        <WorshipCard bookId={bookId} chapter={Number(chapterNumber)} />
      </div>
    );
  }

  return null;
}
