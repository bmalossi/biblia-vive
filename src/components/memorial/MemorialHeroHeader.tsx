import React from "react";
import { cn } from "@/lib/utils";

export interface MemorialHeroHeaderProps {
  className?: string;
}

export default function MemorialHeroHeader({ className }: MemorialHeroHeaderProps) {
  return (
    <section
      aria-label="Apresentação do Meu Memorial"
      className={cn(
        "relative mb-10 overflow-hidden rounded-2xl md:rounded-3xl border border-[#382f23]/80 bg-[#161412] p-6 sm:p-8 md:p-10 shadow-2xl transition-all duration-300",
        className
      )}
    >
      {/* Imagem de Fundo com Máscara e Degradês em Camadas para o Efeito Fumaça Suave */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-full sm:w-[60%] md:w-[52%] lg:w-[48%] overflow-hidden select-none">
        <img
          src="/images/memorial-bible-hero.jpg"
          alt="Bíblia antiga iluminada por raio de luz dourada sobre mesa de madeira"
          className="h-full w-full object-cover object-center"
          style={{
            maskImage:
              "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0.2) 78%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0.2) 78%, transparent 100%)",
          }}
        />

        {/* Camada 1: Transição Linear Horizontal do Fundo */}
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#161412]/40 via-40% to-[#161412]" />

        {/* Camada 2: Névoa Radial Difusa / Densidade de Fumaça */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_90%_at_25%_50%,#161412_15%,rgba(22,20,18,0.75)_50%,transparent_90%)]" />

        {/* Camada 3: Blush/Brilho Dourado Suave */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_65%_45%,rgba(229,184,105,0.14)_0%,rgba(198,154,80,0.03)_50%,transparent_80%)] mix-blend-screen" />

        {/* Camada 4: Vinhetas de Borda Suaves */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#161412]/60 via-transparent to-[#161412]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#161412]/80 via-transparent to-transparent" />
      </div>

      {/* Conteúdo à Esquerda */}
      <div className="relative z-10 max-w-xl space-y-4">
        <p className="font-mono text-[0.68rem] sm:text-xs uppercase tracking-[0.22em] text-[#e5b869] font-medium">
          MEU MEMORIAL
        </p>

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-[#f4efea] leading-[1.14]">
          Tudo o que Deus tem
          <br />
          feito, permanece.
        </h1>

        <p className="font-sans text-xs sm:text-sm text-[#9b8e7e] leading-relaxed max-w-lg">
          Aqui estão as suas memórias espirituais — registros de encontros,
          respostas, aprendizados e marcas que o Senhor deixou em seu coração.
        </p>

        {/* Linha dourada delicada de acento */}
        <div className="w-12 h-0.5 bg-[#e5b869]/80 rounded-full" />

        {/* Versículo de Fé */}
        <p className="font-serif italic text-xs text-[#8f8272] pt-1">
          “Eu me lembrarei das obras do Senhor...” — Salmo 77:11
        </p>
      </div>
    </section>
  );
}
