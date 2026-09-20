// ─────────────────────────────────────────────────────────────────────────────
// ScriptureThreadBanner.tsx — Bíblia Vive
//
// Banner sereno e reverente exibido no rodapé da página de leitura (após o
// ChapterMemorialBlock) quando o modelo JEV detecta uma conexão tipológica
// ou profética de alta confiança com o acervo espiritual do Leitor.
// ─────────────────────────────────────────────────────────────────────────────

import { Sparkles, ArrowRight, Network } from "lucide-react";
import type { ScriptureThreadResult, ScriptureThreadCategory } from "@/lib/scriptureThread";
import type { MemorialEntry } from "@/lib/noteStore";

interface ScriptureThreadBannerProps {
  result: ScriptureThreadResult | null;
  candidateNote: MemorialEntry | null;
  chapterRef?: string;
  onOpenModal: () => void;
}

export const CATEGORY_LABELS: Record<ScriptureThreadCategory, { label: string; description: string }> = {
  Cumprimento_Profetico: {
    label: "Cumprimento Profético",
    description: "Continuidade direta ou cumprimento entre as alianças",
  },
  Eco_de_Linguagem: {
    label: "Eco de Linguagem",
    description: "Ressonância temática e léxica entre passagens",
  },
  Contraste_de_Alianca: {
    label: "Contraste de Aliança",
    description: "Distinção reveladora entre a Antiga e a Nova Aliança",
  },
  Resposta_de_Oracao: {
    label: "Resposta de Oração",
    description: "Conexão entre o texto bíblico e uma entrega em oração",
  },
};

export default function ScriptureThreadBanner({
  result,
  candidateNote,
  chapterRef,
  onOpenModal,
}: ScriptureThreadBannerProps) {
  if (!result) return null;

  const categoryMeta = CATEGORY_LABELS[result.category] || {
    label: "Conexão da Escritura",
    description: "Ressonância com suas memórias de fé",
  };

  return (
    <aside
      aria-label="Fio da Escritura detectado"
      className="relative overflow-hidden rounded-2xl border border-gold/35 bg-app-surface/95 p-5 sm:p-6 shadow-sm transition-all duration-300 hover:border-gold/60 mt-10 animate-in fade-in slide-in-from-bottom-3 duration-500"
    >
      {/* Detalhe estético: linha de acento dourada sutil na lateral */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gold via-gold/70 to-gold/30" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 max-w-xl pl-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-gold">
              <Network className="h-3 w-3" />
              Fio da Escritura
            </span>

            <span className="text-xs font-semibold text-app-text font-serif">
              {categoryMeta.label}
            </span>
          </div>

          <p className="text-sm font-serif text-app-text leading-relaxed">
            Seu Memorial guarda uma conexão espiritual profunda com este capítulo
            {chapterRef ? ` (${chapterRef})` : ""}.
            {candidateNote?.title && (
              <span className="text-app-text-muted italic"> — "{candidateNote.title}"</span>
            )}
          </p>

          <p className="text-xs text-app-text-muted">
            {categoryMeta.description}
          </p>
        </div>

        <div className="shrink-0 self-start sm:self-center pl-2 sm:pl-0">
          <button
            type="button"
            onClick={onOpenModal}
            className="inline-flex items-center gap-2 rounded-full border border-gold/70 bg-gold/10 px-5 py-2.5 text-xs font-medium text-gold hover:bg-gold/20 hover:border-gold transition-all duration-200 active:scale-95 shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Revelar o Fio</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
