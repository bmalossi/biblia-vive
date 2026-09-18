import React from "react";
import { Clock, ChevronRight, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface PlansSidebarProps {
  totalMarks?: number;
  daysReadCount?: number;
  hasActivePlan?: boolean;
  onContinueReading?: () => void;
  className?: string;
}

export default function PlansSidebar({
  totalMarks = 16,
  daysReadCount = 12,
  hasActivePlan = false,
  onContinueReading,
  className,
}: PlansSidebarProps) {
  const navigate = useNavigate();

  return (
    <aside
      aria-label="Resumo e utilitários da jornada"
      className={cn("space-y-6 sticky top-24", className)}
    >
      {/* Widget 1: MARCOS DE FÉ — EBENÉZER */}
      <div
        data-testid="sidebar-ebenezer-widget"
        onClick={() => navigate("/memorial")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate("/memorial");
          }
        }}
        className="rounded-2xl border border-[#382f23]/80 bg-[#161412] p-5 sm:p-6 shadow-xl transition-all duration-300 hover:border-[#e5b869]/50 hover:shadow-2xl cursor-pointer group select-none"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Ícone de Altar Sagrado de Pedras (Ebenézer) */}
            <div className="w-11 h-11 rounded-full bg-[#241e18] border border-[#382f23] flex items-center justify-center text-[#e5b869] shrink-0 group-hover:border-[#e5b869]/40 transition-colors">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 fill-none stroke-current"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 20h16M7 16h10M9 12h6M11 8h2" />
              </svg>
            </div>

            <div className="space-y-1">
              <p className="font-mono text-[0.65rem] uppercase tracking-wider text-[#e5b869] font-medium">
                MARCOS DE FÉ — EBENÉZER
              </p>
              <h4 className="font-serif text-base sm:text-[1.05rem] font-medium text-[#f4efea] leading-tight group-hover:text-[#e5b869] transition-colors">
                {totalMarks} {totalMarks === 1 ? "marco de fé preservado" : "marcos de fé preservados"}
              </h4>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-[#8f8272] group-hover:text-[#e5b869] group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>

        <div className="mt-4 pt-3 border-t border-[#382f23]/50 flex items-center justify-between gap-2">
          <p className="font-serif italic text-xs text-[#8f8272]">
            "Até aqui nos ajudou o Senhor."
          </p>
          <span className="text-[0.68rem] text-[#6e6355] font-serif">
            — 1 Samuel 7:12
          </span>
        </div>
      </div>

      {/* Widget 2: SEU MOMENTO */}
      <div
        data-testid="sidebar-momentum-widget"
        className="rounded-2xl border border-[#382f23]/80 bg-[#161412] p-5 sm:p-6 shadow-xl space-y-4"
      >
        <div className="flex items-center gap-2.5 text-[#e5b869]">
          <div className="w-8 h-8 rounded-full bg-[#241e18] border border-[#382f23] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-[#e5b869]" />
          </div>
          <p className="font-mono text-[0.65rem] uppercase tracking-wider text-[#e5b869] font-medium">
            SEU MOMENTO
          </p>
        </div>

        <div className="space-y-2">
          <p className="font-serif text-sm sm:text-[0.95rem] text-[#f4efea] leading-snug">
            {daysReadCount > 0 ? (
              <>
                Você já percorreu{" "}
                <span className="text-[#e5b869] font-semibold">
                  {daysReadCount} {daysReadCount === 1 ? "dia" : "dias"}
                </span>{" "}
                de leitura.
              </>
            ) : (
              "Comece hoje seu hábito de leitura bíblica guiada."
            )}
          </p>
          <p className="font-sans text-xs text-[#8f8272] leading-relaxed">
            Continue de onde parou e mantenha o ritmo da sua jornada.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={onContinueReading}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#382f23] hover:border-[#e5b869] bg-[#1a1612] hover:bg-[#e5b869]/10 text-[#e5b869] px-5 py-2 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <span>{hasActivePlan || daysReadCount > 0 ? "Continuar leitura" : "Iniciar plano"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
