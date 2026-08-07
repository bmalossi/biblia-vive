// ─────────────────────────────────────────────────────────────────────────────
// StoneIcon.tsx — Bíblia Vive · Eco do Memorial
//
// Ícone SVG sob medida representando uma Tábua de Pedra (Tábua de Memorial).
// Formato retangular sobrio com cantos levemente chanfrados/suavizados (sem arco de lápide),
// e linhas horizontais gravadas/entalhadas representando as memórias do leitor.
// ─────────────────────────────────────────────────────────────────────────────

interface StoneIconProps {
  className?: string;
}

export default function StoneIcon({ className = "h-4 w-4 text-gold" }: StoneIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Tábua de Pedra Retangular Sóbria (topo plano com cantos suavemente lapidados) */}
      <path d="M7 3H17C17.5523 3 18 3.44772 18 4V20C18 20.5523 17.5523 21 17 21H7C6.44772 21 6 20.5523 6 20V4C6 3.44772 6.44772 3 7 3Z" />

      {/* Bisel / Chanfro superior elegante (lapidação da pedra no topo) */}
      <path d="M6 5.5L8.5 3" strokeOpacity="0.5" />
      <path d="M18 5.5L15.5 3" strokeOpacity="0.5" />

      {/* Linhas horizontais de texto/registro entalhadas na pedra */}
      <line x1="9" y1="8" x2="15" y2="8" strokeOpacity="0.85" />
      <line x1="9" y1="11.5" x2="15" y2="11.5" strokeOpacity="0.85" />
      <line x1="9" y1="15" x2="13.5" y2="15" strokeOpacity="0.7" />
    </svg>
  );
}
