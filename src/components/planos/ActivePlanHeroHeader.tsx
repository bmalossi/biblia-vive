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
    <div className="relative mb-10 w-full overflow-hidden rounded-3xl border border-[#382f23]/60 bg-[#161412] shadow-2xl">
      {/* Arte panorâmica com montanhas e degradê multicamadas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Imagem das montanhas posicionada à direita */}
        <div
          className="absolute right-0 top-0 bottom-0 w-full md:w-3/5 bg-cover bg-center md:bg-right opacity-35 mix-blend-luminosity"
          style={{
            backgroundImage: "url('/images/jornadas-mountain-hero.jpg')",
            maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.9) 70%, rgba(0,0,0,1) 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.9) 70%, rgba(0,0,0,1) 100%)",
          }}
        />

        {/* Glow Dourado Ambiente */}
        <div className="absolute right-1/4 top-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-[#e5b869]/10 blur-3xl pointer-events-none" />

        {/* Degradê inferior e esquerdo escuro */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#161412] via-[#161412]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#161412] via-[#161412]/80 to-transparent" />
      </div>

      {/* Conteúdo do Hero */}
      <div className="relative z-10 p-6 sm:p-8 md:p-10">
        {/* Botão de Retorno */}
        <button
          type="button"
          onClick={onBack}
          className="group mb-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#8f8272] transition-colors hover:text-[#e5b869] cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Voltar à lista de planos</span>
        </button>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          {/* Coluna Esquerda: Overline, Título, Descrição e 3 Métricas */}
          <div className="max-w-2xl space-y-4">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-[#e5b869] font-medium">
              PLANO DE LEITURA
            </p>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-[#f4efea] tracking-tight leading-[1.15]">
              {plan.name}
            </h1>

            <p className="text-sm sm:text-base text-[#a89b8c] font-sans leading-relaxed">
              {plan.description}
            </p>

            {/* 3 Métricas em Linha com divisores verticais */}
            <div className="pt-4 flex flex-wrap items-center gap-4 sm:gap-6 text-left">
              {/* Métrica 1: Duração */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#241e18] border border-[#382f23] text-[#e5b869]">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-sans text-sm sm:text-base font-semibold text-[#f4efea] leading-tight">
                    {totalDays} dias
                  </p>
                  <p className="text-[0.72rem] text-[#8f8272] font-mono leading-tight">
                    Duração
                  </p>
                </div>
              </div>

              {/* Divisor */}
              <div className="hidden sm:block h-8 w-[1px] bg-[#382f23]" />

              {/* Métrica 2: Leitura Diária */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#241e18] border border-[#382f23] text-[#e5b869]">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-sans text-sm sm:text-base font-semibold text-[#f4efea] leading-tight">
                    {plan.dailyReadingsLabel ?? "2 leituras por dia"}
                  </p>
                  <p className="text-[0.72rem] text-[#8f8272] font-mono leading-tight">
                    Leitura diária
                  </p>
                </div>
              </div>

              {/* Divisor */}
              <div className="hidden sm:block h-8 w-[1px] bg-[#382f23]" />

              {/* Métrica 3: Foco do Plano */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#241e18] border border-[#382f23] text-[#e5b869]">
                  <Heart className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-sans text-sm sm:text-base font-semibold text-[#f4efea] leading-tight">
                    {plan.focus ?? "Crescimento espiritual"}
                  </p>
                  <p className="text-[0.72rem] text-[#8f8272] font-mono leading-tight">
                    Foco do plano
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Box do Gauge Circular de Progresso */}
          <div className="flex shrink-0 self-start lg:self-center">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#382f23]/90 bg-[#161412]/80 backdrop-blur-md px-7 py-5 shadow-2xl min-w-[150px]">
              <div className="relative flex h-24 w-24 items-center justify-center">
                <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                  {/* Trilha do Gauge */}
                  <circle
                    className="text-[#2a241c]"
                    strokeWidth="7"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  {/* Preenchimento Dourado */}
                  <circle
                    className="text-[#e5b869]"
                    strokeWidth="7"
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
                <div className="text-center">
                  <span className="font-serif text-2xl font-bold text-[#f4efea]">
                    {progressPct}%
                  </span>
                </div>
              </div>
              <p className="mt-2.5 font-mono text-[0.75rem] text-[#8f8272]">
                {completedDaysCount} de {totalDays} dias
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivePlanHeroHeader;
