import React from "react";
import { ArrowLeft, Calendar, BookOpen, Heart } from "lucide-react";
import type { ReadingPlan } from "@/lib/readingPlanTypes";

interface ActivePlanHeroHeaderProps {
  plan: ReadingPlan;
  completedDaysCount: number;
  totalDays: number;
  progressPct: number;
  onBack: () => void;
}

export const ActivePlanHeroHeader: React.FC<ActivePlanHeroHeaderProps> = ({
  plan,
  completedDaysCount,
  totalDays,
  progressPct,
  onBack,
}) => {
  return (
    <div className="relative mb-6 w-full overflow-hidden rounded-2xl border border-border/80 bg-app-surface shadow-xl">
      {/* Arte panorâmica com montanhas e degradê multicamadas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {/* Imagem das montanhas posicionada à direita */}
        <div
          className="absolute right-0 top-0 bottom-0 w-full md:w-1/2 bg-cover bg-center md:bg-right opacity-30 dark:opacity-40 mix-blend-luminosity"
          style={{
            backgroundImage: "url('/images/jornadas-mountain-hero.jpg')",
            maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.9) 70%, rgba(0,0,0,1) 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.9) 70%, rgba(0,0,0,1) 100%)",
          }}
        />

        {/* Glow Dourado Ambiente */}
        <div className="absolute right-1/4 top-1/2 -translate-y-1/2 h-40 w-40 rounded-full bg-gold/10 blur-2xl pointer-events-none" />

        {/* Degradê inferior e esquerdo escuro */}
        <div className="absolute inset-0 bg-gradient-to-t from-app-surface via-app-surface/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-app-surface via-app-surface/80 to-transparent" />
      </div>

      {/* Conteúdo do Hero Compacto */}
      <div className="relative z-10 px-5 sm:px-7 py-3.5 sm:py-4">
        {/* Topbar: Botão de Retorno e Overline */}
        <div className="flex items-center justify-between gap-4 mb-2">
          <button
            type="button"
            onClick={onBack}
            className="group inline-flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-wider text-app-text-muted transition-colors hover:text-gold cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Voltar à lista de planos</span>
          </button>

          <span className="font-mono text-[0.65rem] sm:text-[0.7rem] uppercase tracking-[0.22em] text-gold font-medium">
            PLANO DE LEITURA
          </span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
          {/* Coluna Esquerda: Título, Descrição e 3 Métricas */}
          <div className="max-w-2xl">
            <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-normal text-app-text tracking-tight leading-tight">
              {plan.name}
            </h1>

            <p className="mt-0.5 text-xs text-app-text-muted font-sans leading-relaxed line-clamp-1 sm:line-clamp-none max-w-xl">
              {plan.description}
            </p>

            {/* 3 Métricas em Linha Compacta */}
            <div className="pt-2.5 flex flex-wrap items-center gap-3 sm:gap-4.5 text-left">
              {/* Métrica 1: Duração */}
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-app-raised border border-border text-gold">
                  <Calendar className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-sans text-xs sm:text-sm font-semibold text-app-text leading-tight">
                    {totalDays} dias
                  </p>
                  <p className="text-[0.65rem] text-app-text-muted font-mono leading-tight">
                    Duração
                  </p>
                </div>
              </div>

              <div className="hidden sm:block h-6 w-[1px] bg-border" />

              {/* Métrica 2: Leitura Diária */}
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-app-raised border border-border text-gold">
                  <BookOpen className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-sans text-xs sm:text-sm font-semibold text-app-text leading-tight">
                    {plan.dailyReadingsLabel ?? "2 leituras por dia"}
                  </p>
                  <p className="text-[0.65rem] text-app-text-muted font-mono leading-tight">
                    Leitura diária
                  </p>
                </div>
              </div>

              <div className="hidden sm:block h-6 w-[1px] bg-border" />

              {/* Métrica 3: Foco do Plano */}
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-app-raised border border-border text-gold">
                  <Heart className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-sans text-xs sm:text-sm font-semibold text-app-text leading-tight">
                    {plan.focus ?? "Crescimento espiritual"}
                  </p>
                  <p className="text-[0.65rem] text-app-text-muted font-mono leading-tight">
                    Foco do plano
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Box do Gauge Circular de Progresso Compacto */}
          <div className="flex shrink-0 self-start lg:self-center">
            <div className="flex items-center gap-3.5 rounded-xl border border-border/90 bg-app-surface/80 backdrop-blur-md px-4 py-2.5 shadow-xl">
              <div className="relative flex h-13 w-13 items-center justify-center">
                <svg className="h-12 w-12 -rotate-90 transform" viewBox="0 0 100 100">
                  {/* Trilha do Gauge */}
                  <circle
                    className="text-border"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  {/* Preenchimento Dourado */}
                  <circle
                    className="text-gold"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * progressPct) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                    style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="font-serif text-xs font-bold text-app-text">
                    {progressPct}%
                  </span>
                </div>
              </div>
              <div className="text-left">
                <p className="font-mono text-[0.65rem] uppercase tracking-wider text-app-text-muted">
                  Progresso
                </p>
                <p className="font-mono text-xs font-medium text-gold">
                  {completedDaysCount} de {totalDays} dias
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivePlanHeroHeader;
