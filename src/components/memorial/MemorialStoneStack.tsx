import React from "react";
import { Sparkles } from "lucide-react";

export interface MemorialStoneStackProps {
  totalEntries: number;
  className?: string;
}

export const MemorialStoneStack: React.FC<MemorialStoneStackProps> = ({
  totalEntries,
  className = "",
}) => {
  // Número visual de pedras estilizadas no altar (entre 1 e 5 pedras físicas)
  const stonesCount = totalEntries === 0 ? 0 : Math.min(Math.max(1, Math.ceil(totalEntries / 3)), 5);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-app-surface via-app-surface to-gold/5 border border-gold/30 p-5 shadow-xs transition-all ${className}`}
      data-testid="memorial-stone-stack"
    >
      {/* Luz ambiente sutil de fundo */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
        <div className="flex items-start gap-4">
          {/* Ilustração das Pedras Empilhadas (Altar de Gratidão / Ebenézer) */}
          <div className="relative flex-shrink-0 w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center p-2">
            <svg
              viewBox="0 0 64 64"
              className="w-full h-full text-gold drop-shadow-xs"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Base do Altar */}
              <ellipse
                cx="32"
                cy="56"
                rx="24"
                ry="4"
                className="fill-gold/20 stroke-gold/40"
                strokeWidth="1.5"
              />

              {/* Pedra 1 (Base larga) */}
              <path
                d="M14 48 C14 44, 20 42, 32 42 C44 42, 50 44, 50 48 C50 52, 44 54, 32 54 C20 54, 14 52, 14 48 Z"
                className="fill-gold/20 stroke-gold/60"
                strokeWidth="1.5"
              />

              {/* Pedra 2 */}
              {stonesCount >= 2 && (
                <path
                  d="M18 38 C18 34, 24 32, 32 32 C40 32, 46 34, 46 38 C46 42, 40 44, 32 44 C24 44, 18 42, 18 38 Z"
                  className="fill-gold/30 stroke-gold/70"
                  strokeWidth="1.5"
                />
              )}

              {/* Pedra 3 */}
              {stonesCount >= 3 && (
                <path
                  d="M22 28 C22 25, 26 23, 32 23 C38 23, 42 25, 42 28 C42 31, 38 33, 32 33 C26 33, 22 31, 22 28 Z"
                  className="fill-gold/40 stroke-gold/80"
                  strokeWidth="1.5"
                />
              )}

              {/* Pedra 4 */}
              {stonesCount >= 4 && (
                <path
                  d="M25 20 C25 17, 28 15, 32 15 C36 15, 39 17, 39 20 C39 23, 36 24, 32 24 C28 24, 25 23, 25 20 Z"
                  className="fill-gold/50 stroke-gold/90"
                  strokeWidth="1.5"
                />
              )}

              {/* Pedra de Topo (Ebenézer) */}
              {stonesCount >= 5 && (
                <path
                  d="M28 12 C28 9, 30 8, 32 8 C34 8, 36 9, 36 12 C36 14, 34 15, 32 15 C30 15, 28 14, 28 12 Z"
                  className="fill-gold stroke-gold"
                  strokeWidth="1.5"
                />
              )}
            </svg>
          </div>

          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Marcos de Fé · Ebenézer</span>
            </div>
            <h2 className="text-base font-serif font-medium text-app-text">
              {totalEntries === 0 ? (
                "Seu altar de memórias está pronto para começar"
              ) : (
                <>
                  <span className="font-semibold text-gold">{totalEntries}</span> {totalEntries === 1 ? "marco de fé preservado" : "marcos de fé preservados"}
                </>
              )}
            </h2>
            <p className="text-xs font-serif italic text-app-text-muted">
              "Até aqui nos ajudou o Senhor." — 1 Samuel 7:12
            </p>
          </div>
        </div>

        {/* Resumo visual compacto */}
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-app-raised/60 border border-border text-xs font-sans text-app-text-muted">
          <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
          <span>{totalEntries} {totalEntries === 1 ? "registro" : "registros"}</span>
        </div>
      </div>
    </div>
  );
};
