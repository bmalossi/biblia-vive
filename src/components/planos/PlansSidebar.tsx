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
        className="rounded-2xl border border-border/80 bg-app-surface p-5 sm:p-6 shadow-lg transition-all duration-300 hover:border-gold/50 hover:bg-app-raised/40 hover:shadow-xl cursor-pointer group select-none"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Ícone de Altar Sagrado de Pedras (Ebenézer) */}
            <div className="w-11 h-11 rounded-full bg-app-raised border border-border flex items-center justify-center text-gold shrink-0 group-hover:border-gold/40 transition-colors">
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
              <p className="font-mono text-[0.65rem] uppercase tracking-wider text-gold font-medium">
                MARCOS DE FÉ — EBENÉZER
              </p>
              <h4 className="font-serif text-base sm:text-[1.05rem] font-medium text-app-text leading-tight group-hover:text-gold transition-colors">
                {totalMarks} {totalMarks === 1 ? "marco de fé preservado" : "marcos de fé preservados"}
              </h4>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-app-text-muted group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>

        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
          <p className="font-serif italic text-xs text-app-text-muted">
            "Até aqui nos ajudou o Senhor."
          </p>
          <span className="text-[0.68rem] text-app-text-muted/80 font-serif">
            — 1 Samuel 7:12
          </span>
        </div>
      </div>

      {/* Widget 2: SEU MOMENTO */}
      <div
        data-testid="sidebar-momentum-widget"
        className="rounded-2xl border border-border/80 bg-app-surface p-5 sm:p-6 shadow-lg space-y-4"
      >
        <div className="flex items-center gap-2.5 text-gold">
          <div className="w-8 h-8 rounded-full bg-app-raised border border-border flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-gold" />
          </div>
          <p className="font-mono text-[0.65rem] uppercase tracking-wider text-gold font-medium">
            SEU MOMENTO
          </p>
        </div>

        <div className="space-y-2">
          <p className="font-serif text-sm sm:text-[0.95rem] text-app-text leading-snug">
            {daysReadCount > 0 ? (
              <>
                Você já percorreu{" "}
                <span className="text-gold font-semibold">
                  {daysReadCount} {daysReadCount === 1 ? "dia" : "dias"}
                </span>{" "}
                de leitura.
              </>
            ) : (
              "Comece hoje seu hábito de leitura bíblica guiada."
            )}
          </p>
          <p className="font-sans text-xs text-app-text-muted leading-relaxed">
            Continue de onde parou e mantenha o ritmo da sua jornada.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={onContinueReading}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border hover:border-gold bg-app-surface hover:bg-gold/10 text-gold px-5 py-2 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <span>{hasActivePlan || daysReadCount > 0 ? "Continuar leitura" : "Iniciar plano"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
