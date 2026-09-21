// ─────────────────────────────────────────────────────────────────────────────
// ScriptureThreadBanner.tsx — Bíblia Vive
//
// Banner discreto e nobre exibido acima do título do capítulo na página de
// leitura quando o modelo JEV detecta uma conexão tipológica ou profética de
// alta confiança com o acervo espiritual do Leitor.
// ─────────────────────────────────────────────────────────────────────────────

import { Sparkles, ArrowRight, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScriptureThreadResult, ScriptureThreadCategory } from "@/lib/scriptureThread";
import type { MemorialEntry } from "@/lib/noteStore";

interface ScriptureThreadBannerProps {
  result: ScriptureThreadResult | null;
  candidateNote: MemorialEntry | null;
  chapterRef?: string;
  onOpenModal: () => void;
  className?: string;
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
  className,
}: ScriptureThreadBannerProps) {
  if (!result) return null;

  const categoryMeta = CATEGORY_LABELS[result.category] || {
    label: "Conexão da Escritura",
    description: "Ressonância com suas memórias de fé",
  };

  return (
    <aside
      aria-label="Fio da Escritura detectado"
      className={cn(
        "relative overflow-hidden mb-6 rounded-2xl bg-gradient-to-r from-app-surface via-app-surface to-gold/5 border border-gold/40 hover:border-gold/60 p-4 shadow-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.08)] transition-all duration-500 animate-in fade-in zoom-in-95 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group",
        className
      )}
    >
      {/* Brilho dourado pulsante e sutil de fundo */}
      <div className="absolute -top-12 -left-12 w-28 h-28 bg-gold/10 rounded-full blur-2xl pointer-events-none group-hover:bg-gold/15 transition-all duration-700" />
      <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-gold/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex items-start gap-3">
        {/* Caixa de Ícone Temática Dourada */}
        <div className="mt-0.5 flex-shrink-0 text-gold p-2 rounded-xl bg-gold/10 border border-gold/20 group-hover:border-gold/40 transition-colors">
          <Network className="h-4 w-4 text-gold" />
        </div>

        {/* Informações e Detalhes da Conexão */}
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="inline-flex items-center gap-1 text-[0.6rem] uppercase tracking-widest font-sans font-semibold text-gold border border-gold/30 bg-gold/5 px-2 py-0.5 rounded-full">
              <Sparkles className="h-2.5 w-2.5" />
              Fio da Escritura
            </span>
            <span className="text-[0.65rem] font-sans font-medium text-gold/90 uppercase tracking-wider">
              {categoryMeta.label}
            </span>
          </div>

          <p className="text-xs font-serif font-medium text-app-text">
            Seu Memorial guarda uma conexão profunda com este capítulo
            {chapterRef ? ` (${chapterRef})` : ""}.
          </p>

          {candidateNote?.title ? (
            <p className="text-xs font-serif text-app-text-muted italic line-clamp-1">
              "{candidateNote.title}"
            </p>
          ) : candidateNote?.content ? (
            <p className="text-xs font-serif text-app-text-muted italic line-clamp-1">
              "{candidateNote.content}"
            </p>
          ) : (
            <p className="text-xs font-serif text-app-text-muted line-clamp-1">
              {categoryMeta.description}
            </p>
          )}
        </div>
      </div>

      {/* Botão de Ação CTA */}
      <button
        type="button"
        onClick={onOpenModal}
        className="relative flex-shrink-0 self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gold text-black font-semibold text-xs hover:bg-gold/90 transition-all duration-200 shadow-xs active:scale-95 cursor-pointer"
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span>Revelar o Fio</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </aside>
  );
}
