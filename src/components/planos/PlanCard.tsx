import React from "react";
import { Calendar, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReadingPlan, PlanProgress } from "@/lib/readingPlanTypes";

export interface PlanCardProps {
  plan: ReadingPlan;
  progress?: PlanProgress | null;
  onSelectPlan: (planId: string) => void;
  className?: string;
}

export default function PlanCard({
  plan,
  progress,
  onSelectPlan,
  className,
}: PlanCardProps) {
  const hasStarted = !!progress;
  const completedDaysCount = progress?.completedDays?.length ?? 0;
  const progressPct =
    plan.totalDays > 0
      ? Math.round((completedDaysCount / plan.totalDays) * 100)
      : 0;

  const renderCategoryBadge = () => {
    if (plan.isFeatured) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#241e18] border border-[#e5b869]/40 text-[#e5b869] text-[0.6rem] font-mono uppercase tracking-wider font-medium shrink-0">
          EM DESTAQUE
        </span>
      );
    }
    if (plan.category === "thematic") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#241e18] border border-[#382f23] text-[#e5b869] text-[0.6rem] font-mono uppercase tracking-wider font-medium shrink-0">
          TEMÁTICO
        </span>
      );
    }
    if (plan.category === "books") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#241e18] border border-[#382f23] text-[#e5b869] text-[0.6rem] font-mono uppercase tracking-wider font-medium shrink-0">
          LIVROS
        </span>
      );
    }
    if (plan.category === "seasonal") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#241e18] border border-[#382f23] text-[#e5b869] text-[0.6rem] font-mono uppercase tracking-wider font-medium shrink-0">
          SAZONAL
        </span>
      );
    }
    return null;
  };

  return (
    <div
      data-testid={`plan-card-${plan.id}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelectPlan(plan.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectPlan(plan.id);
        }
      }}
      aria-label={`Abrir plano ${plan.name}`}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-[#382f23]/80 bg-[#161412] p-5 shadow-lg transition-all duration-300 hover:border-[#c69a50]/60 hover:shadow-xl hover:shadow-black/40 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#e5b869]/50 select-none min-h-[160px]",
        className
      )}
    >
      {/* Fundo Atmosférico com Névoa Sutil (Padrão Oficial Jornadas) */}
      <div
        className="pointer-events-none absolute inset-0 bg-[url('/images/jornadas-mountain-hero.jpg')] bg-cover bg-center opacity-[0.06] mix-blend-luminosity group-hover:opacity-[0.11] transition-opacity duration-500"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1c1814]/80 via-[#161412] to-[#12100e]"
        aria-hidden="true"
      />

      {/* Conteúdo do Card */}
      <div className="relative z-10">
        {/* Linha Superior: Nome do Plano (sem ícone, sem truncamento) + Selo de Categoria */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <h2 className="font-serif text-sm sm:text-[0.95rem] text-[#f0e8de] font-normal tracking-wide group-hover:text-[#e5b869] transition-colors leading-snug">
            {plan.name}
          </h2>

          {renderCategoryBadge()}
        </div>

        {/* Resumo do Plano (delimitado a 2 linhas) */}
        <p className="font-sans text-xs text-[#8f8272] leading-relaxed line-clamp-2 min-h-[34px]">
          {plan.description}
        </p>
      </div>

      {/* Rodapé do Card: Contador de Dias + Confirmação Verde / Progresso + Ação com Seta */}
      <div className="relative z-10 pt-4 border-t border-[#382f23]/50 flex items-center justify-between mt-3 text-xs text-[#c69a50]">
        <div className="flex items-center gap-2 font-mono text-[0.72rem] text-[#c69a50]">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{plan.totalDays} dias</span>
          </div>

          {/* Símbolo de confirmação em verde quando 100% concluído */}
          {progressPct === 100 ? (
            <span
              className="inline-flex items-center justify-center p-0.5 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-emerald-400"
              title="100% concluído"
              aria-label="Plano concluído"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
          ) : progressPct > 0 ? (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-emerald-400 text-[0.62rem] font-medium font-mono">
              {progressPct}% lido
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1 font-sans text-xs text-[#c69a50] group-hover:text-[#e5b869] transition-colors font-medium">
          <span>{hasStarted ? "Continuar" : "Iniciar"}</span>
          <ArrowRight className="w-4 h-4 text-[#c69a50] transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
}
