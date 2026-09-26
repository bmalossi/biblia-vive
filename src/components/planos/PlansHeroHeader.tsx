import React from "react";
import { BookOpen, Compass, Heart } from "lucide-react";

export default function PlansHeroHeader() {
  return (
    <section
      aria-label="Apresentação dos Planos de Leitura"
      className="relative mb-6 overflow-hidden rounded-2xl border border-border/80 bg-app-surface shadow-xl transition-all duration-300"
    >
      {/* Imagem de Fundo Panorâmica com Efeito Esfumaçado Multicamadas */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-full sm:w-[50%] md:w-[45%] overflow-hidden select-none">
        <img
          src="/images/jornadas-mountain-hero.jpg"
          alt="Montanhas ao nascer do sol com raios de luz dourada iluminando a névoa"
          className="h-full w-full object-cover object-center opacity-30 dark:opacity-40 mix-blend-luminosity"
          style={{
            maskImage:
              "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 35%, rgba(0,0,0,0.5) 65%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 35%, rgba(0,0,0,0.5) 65%, transparent 100%)",
          }}
        />
        {/* Camadas graduais de fusão atmosférica para integrar ao container */}
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-app-surface/50 to-app-surface" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(229,184,105,0.14)_0%,transparent_75%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-app-surface via-transparent to-transparent" />
      </div>

      {/* Conteúdo Textual Reduzido e Pilares de Valor em Linha */}
      <div className="relative z-10 px-5 sm:px-7 py-3.5 sm:py-4">
        {/* Overline superior */}
        <p className="font-mono text-[0.65rem] sm:text-[0.7rem] uppercase tracking-[0.22em] text-gold font-medium mb-1.5">
          PLANOS DE LEITURA
        </p>

        {/* Linha Principal: Título + 3 Pilares lado a lado */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-6">
          <div>
            <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-normal tracking-tight text-app-text leading-tight">
              Caminhe com Deus todos os dias.
            </h1>
            <p className="mt-0.5 text-xs text-app-text-muted font-sans leading-relaxed max-w-xl">
              Planos de leitura bíblica para cada momento da sua jornada. Comece hoje e veja como a Palavra transforma o seu dia.
            </p>
          </div>

          {/* 3 Pilares de Valor Compactos em Linha */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4.5 text-left shrink-0 pt-1 lg:pt-0">
            {/* Pilar 1: Mais foco */}
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-app-raised border border-border text-gold">
                <BookOpen className="h-3.5 w-3.5" />
              </div>
              <div className="text-left">
                <p className="text-xs sm:text-sm font-semibold text-app-text leading-tight">Mais foco</p>
                <p className="text-[0.65rem] text-app-text-muted font-mono leading-tight">na Palavra</p>
              </div>
            </div>

            <div className="hidden sm:block h-6 w-px bg-border" />

            {/* Pilar 2: Disciplina */}
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-app-raised border border-border text-gold">
                <Compass className="h-3.5 w-3.5" />
              </div>
              <div className="text-left">
                <p className="text-xs sm:text-sm font-semibold text-app-text leading-tight">Disciplina</p>
                <p className="text-[0.65rem] text-app-text-muted font-mono leading-tight">com propósito</p>
              </div>
            </div>

            <div className="hidden sm:block h-6 w-px bg-border" />

            {/* Pilar 3: Crescimento */}
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-app-raised border border-border text-gold">
                <Heart className="h-3.5 w-3.5" />
              </div>
              <div className="text-left">
                <p className="text-xs sm:text-sm font-semibold text-app-text leading-tight">Crescimento</p>
                <p className="text-[0.65rem] text-app-text-muted font-mono leading-tight">espiritual</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
