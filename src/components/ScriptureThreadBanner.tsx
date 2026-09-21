// ─────────────────────────────────────────────────────────────────────────────
// ScriptureThreadBanner.tsx — Bíblia Vive
//
// Banner moderno e nobre exibido acima do título do capítulo na página de
// leitura bíblica quando o modelo JEV detecta uma conexão tipológica ou
// profética com o Memorial do leitor.
// Design alinhado ao banner da página inicial (CapituloDeHojeSection):
//   - Cores escuras e profundas (#1c1814 / #151311 / #100f0d)
//   - Arcos concêntricos dourados de background à direita
//   - Tipografia sóbria sem ícones decorativos
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
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
      onClick={onOpenModal}
      className={cn(
        "group relative overflow-hidden rounded-xl sm:rounded-2xl border border-[#382f23]/80 bg-gradient-to-br from-[#1c1814] via-[#151311] to-[#100f0d] p-5 sm:p-6 md:p-7 shadow-xl hover:border-gold/50 hover:shadow-2xl hover:shadow-gold/5 transition-all duration-300 mb-6 cursor-pointer select-none",
        className
      )}
    >
      {/* Detalhes modernos: Arcos Concêntricos Dourados no Lado Direito */}
      <div className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 h-[150%] w-1/2 max-w-[340px] select-none overflow-hidden flex items-center justify-end">
        <svg
          className="h-full w-full opacity-35 transition-opacity duration-300 group-hover:opacity-50"
          viewBox="0 0 360 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="scriptureThreadGoldRingGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.75" />
              <stop offset="50%" stopColor="#bfa152" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#695627" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <circle cx="340" cy="140" r="90" stroke="url(#scriptureThreadGoldRingGlow)" strokeWidth="1.2" />
          <circle cx="340" cy="140" r="140" stroke="url(#scriptureThreadGoldRingGlow)" strokeWidth="1.2" />
          <circle cx="340" cy="140" r="190" stroke="url(#scriptureThreadGoldRingGlow)" strokeWidth="1.2" />
          <circle cx="340" cy="140" r="240" stroke="url(#scriptureThreadGoldRingGlow)" strokeWidth="1" strokeOpacity="0.5" />
        </svg>
      </div>

      {/* Conteúdo Principal do Banner */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Coluna Esquerda: Informações da Conexão */}
        <div className="max-w-xl">
          {/* Overline com categoria e selo */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <p className="font-mono text-[0.62rem] sm:text-[0.68rem] font-semibold tracking-[0.2em] uppercase text-gold/80">
              <span>Fio da Escritura</span> &bull; <span>{categoryMeta.label}</span>
            </p>
            <span className="hidden sm:inline-flex items-center text-[0.65rem] text-gold/60 bg-gold/5 px-2 py-0.5 rounded-full border border-gold/20 group-hover:border-gold/40 group-hover:text-gold transition-colors">
              Toque para ver a conexão
            </span>
          </div>

          {/* Título Principal em Tipografia Clássica */}
          <h2 className="font-serif text-lg sm:text-xl md:text-2xl font-normal leading-snug tracking-tight text-[#f5f5f0] mb-2.5 text-balance group-hover:text-gold-light transition-colors">
            {candidateNote?.title ? `"${candidateNote.title}"` : categoryMeta.label}
          </h2>

          {/* Parágrafo de Contexto e Reflexão */}
          <p className="font-sans text-xs sm:text-[0.82rem] text-neutral-300/80 leading-relaxed mb-3 font-light max-w-lg line-clamp-2">
            Seu Memorial guarda uma conexão profunda com este capítulo{chapterRef ? ` (${chapterRef})` : ""}. {categoryMeta.description}.
          </p>

          {/* Barra inferior de tags e ação */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center rounded-full border border-neutral-700/60 bg-neutral-900/40 px-2.5 py-1 text-[0.7rem] text-neutral-300 backdrop-blur-xs">
              <span className="font-sans font-medium tracking-wide">{chapterRef || "Este capítulo"}</span>
            </div>

            <span className="inline-flex items-center gap-1 text-[0.7rem] text-gold/90 group-hover:text-gold font-medium ml-1 transition-colors">
              Revelar reflexão completa &rarr;
            </span>
          </div>
        </div>

        {/* Coluna Direita: Ações CTA */}
        <div className="flex flex-col items-start lg:items-center justify-center shrink-0 pr-0 lg:pr-6 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenModal();
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gold px-5 py-2 text-xs font-semibold text-[#121110] shadow-sm transition-all duration-200 hover:bg-gold/90 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>Revelar o Fio</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
