import React from "react";

interface HarpaHeroHeaderProps {}

export default function HarpaHeroHeader({}: HarpaHeroHeaderProps = {}) {
  return (
    <section
      aria-label="Apresentação da Harpa Cristã"
      className="relative mb-10 overflow-hidden pt-4 pb-2"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Coluna Esquerda: Textos de Apresentação */}
        <div className="lg:col-span-7 z-10 space-y-4">
          <p className="font-mono text-[0.68rem] sm:text-xs uppercase tracking-[0.22em] text-gold font-medium">
            HARPA CRISTÃ
          </p>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.2rem] font-normal tracking-tight text-app-text leading-[1.12]">
            Hinos que acompanham
            <br />
            a caminhada.
          </h1>

          <p className="font-sans text-xs sm:text-sm text-app-text-muted leading-relaxed max-w-lg">
            Cante, ouça e guarde os hinos da Harpa Cristã. Uma coletânea de louvores que
            fortalecem a fé e renovam o coração todos os dias.
          </p>
        </div>

        {/* Coluna Direita: Arte Sacra Geométrica com Cruz Pura Luminosa e Arcos Celestiais */}
        <div className="lg:col-span-5 relative flex items-center justify-center min-h-[240px] select-none pointer-events-none">
          {/* Brilho Dourado Suave e Difuso de Fundo */}
          <div className="absolute w-60 h-60 rounded-full bg-gold/10 blur-[35px]" />

          {/* SVG com Cruz Pura Slender e Arcos Concêntricos */}
          <svg
            className="w-full max-w-[380px] h-[260px]"
            viewBox="0 0 400 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Gradiente Dourado dos Arcos Concêntricos */}
              <linearGradient id="celestialArcGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e5b869" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#c69a50" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#695627" stopOpacity="0.03" />
              </linearGradient>

              {/* Gradiente da Haste Vertical da Cruz */}
              <linearGradient id="crossVerticalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e5b869" stopOpacity="0.3" />
                <stop offset="30%" stopColor="#fae7b5" stopOpacity="0.9" />
                <stop offset="45%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="65%" stopColor="#fae7b5" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#e5b869" stopOpacity="0.25" />
              </linearGradient>

              {/* Gradiente da Haste Horizontal da Cruz */}
              <linearGradient id="crossHorizontalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#e5b869" stopOpacity="0.25" />
                <stop offset="35%" stopColor="#fae7b5" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="65%" stopColor="#fae7b5" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#e5b869" stopOpacity="0.25" />
              </linearGradient>

              {/* Feixe Vertical Sutil e Fino */}
              <linearGradient id="subtleVerticalShaft" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e5b869" stopOpacity="0" />
                <stop offset="35%" stopColor="#e5b869" stopOpacity="0.25" />
                <stop offset="50%" stopColor="#fae7b5" stopOpacity="0.4" />
                <stop offset="65%" stopColor="#e5b869" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#e5b869" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Arcos Concêntricos Celestiais */}
            <circle cx="200" cy="120" r="35" stroke="url(#celestialArcGold)" strokeWidth="0.8" strokeDasharray="3 2" />
            <circle cx="200" cy="120" r="65" stroke="url(#celestialArcGold)" strokeWidth="0.9" />
            <circle cx="200" cy="120" r="105" stroke="url(#celestialArcGold)" strokeWidth="1" strokeOpacity="0.7" />
            <circle cx="200" cy="120" r="145" stroke="url(#celestialArcGold)" strokeWidth="0.8" strokeOpacity="0.45" />
            <circle cx="200" cy="120" r="190" stroke="url(#celestialArcGold)" strokeWidth="0.6" strokeOpacity="0.25" />

            {/* Feixe Vertical Sutil de Luz em Toda a Altura */}
            <rect x="199.5" y="25" width="1" height="230" fill="url(#subtleVerticalShaft)" opacity="0.6" />

            {/* A Cruz Pura Luminosa (Sem círculo no meio, menor e elegante) */}
            {/* Haste Vertical da Cruz (centro em x=200, cruzando y=110) */}
            <rect x="199.2" y="92" width="1.6" height="50" rx="0.8" fill="url(#crossVerticalGrad)" />
            {/* Haste Horizontal da Cruz (posição proporcional: terço superior em y=106) */}
            <rect x="185" y="105.2" width="30" height="1.6" rx="0.8" fill="url(#crossHorizontalGrad)" />

            {/* Suave reflexo de luz pura nos eixos */}
            <rect x="198" y="95" width="4" height="44" fill="#fae7b5" opacity="0.15" filter="blur(1px)" />
            <rect x="187" y="104" width="26" height="4" fill="#fae7b5" opacity="0.15" filter="blur(1px)" />
          </svg>
        </div>
      </div>
    </section>
  );
}
