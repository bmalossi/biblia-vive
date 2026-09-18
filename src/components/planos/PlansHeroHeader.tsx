import React from "react";
import { BookOpen, Compass, Heart } from "lucide-react";

export default function PlansHeroHeader() {
  return (
    <section
      aria-label="Apresentação dos Planos de Leitura"
      className="relative mb-8 overflow-hidden rounded-2xl md:rounded-3xl border border-[#382f23]/80 bg-[#161412] p-6 sm:p-8 md:p-10 shadow-2xl transition-all duration-300"
    >
      {/* Imagem de Fundo Panorâmica com Efeito Esfumaçado Multicamadas */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-full sm:w-[60%] md:w-[55%] lg:w-[50%] overflow-hidden select-none">
        <img
          src="/images/jornadas-mountain-hero.jpg"
          alt="Montanhas ao nascer do sol com raios de luz dourada iluminando a névoa"
          className="h-full w-full object-cover object-center"
          style={{
            maskImage:
              "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 35%, rgba(0,0,0,0.65) 60%, rgba(0,0,0,0.18) 80%, transparent 100%)",
          }}
        />
        {/* Camadas graduais de fusão atmosférica para integrar ao marrom escuro */}
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#161412]/40 via-40% to-[#161412]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_90%_at_25%_50%,#161412_15%,rgba(22,20,18,0.75)_50%,transparent_90%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(229,184,105,0.16)_0%,rgba(198,154,80,0.03)_50%,transparent_80%)] mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#161412]/60 via-transparent to-[#161412]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#161412]/80 via-transparent to-transparent" />
      </div>

      {/* Conteúdo Textual e Pilares de Valor */}
      <div className="relative z-10 max-w-xl space-y-4">
        <p className="font-mono text-[0.68rem] sm:text-xs uppercase tracking-[0.22em] text-[#e5b869] font-medium">
          PLANOS DE LEITURA
        </p>

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-[#f4efea] leading-[1.14]">
          Caminhe com Deus
          <br />
          todos os dias.
        </h1>

        <p className="font-sans text-xs sm:text-sm text-[#9b8e7e] leading-relaxed max-w-lg">
          Planos de leitura bíblica para cada momento da sua jornada.
          <br className="hidden sm:block" />
          Escolha um plano, comece hoje e veja como a Palavra transforma o seu dia.
        </p>

        {/* 3 Pilares de Valor em Linha */}
        <div className="pt-3 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-[#9b8e7e]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#241e18] border border-[#382f23] text-[#e5b869]">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-[#f4efea] leading-tight">Mais foco</p>
              <p className="text-[0.68rem] text-[#8f8272] leading-tight">na Palavra</p>
            </div>
          </div>

          <div className="h-6 w-px bg-[#382f23]/80 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#241e18] border border-[#382f23] text-[#e5b869]">
              <Compass className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-[#f4efea] leading-tight">Disciplina</p>
              <p className="text-[0.68rem] text-[#8f8272] leading-tight">com propósito</p>
            </div>
          </div>

          <div className="h-6 w-px bg-[#382f23]/80 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#241e18] border border-[#382f23] text-[#e5b869]">
              <Heart className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-[#f4efea] leading-tight">Crescimento</p>
              <p className="text-[0.68rem] text-[#8f8272] leading-tight">espiritual</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
