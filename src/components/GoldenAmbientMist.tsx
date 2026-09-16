import React, { memo } from "react";
import { useReadingTheme } from "@/hooks/useReadingTheme";
import { cn } from "@/lib/utils";

/**
 * GoldenAmbientMist
 *
 * Renderiza o plano de fundo atmosférico e contínuo da página de leitura:
 * - Modo Dark: marrom escuro nobre (from-[#1c1814] via-[#151311] to-[#100f0d]) com fumacinhas douradas/âmbar.
 * - Modo Sépia: pergaminho suave e aconchegante (from-[#f8f3e8] via-[#f4eee0] to-[#eae0cd]) com brilho âmbar leve.
 * - Modo Light / White: branco cristalino e límpido (from-[#ffffff] via-[#fafafa] to-[#f5f5f5]) com aura tênue.
 */
export const GoldenAmbientMist: React.FC = memo(function GoldenAmbientMist() {
  const { isDark, isSepia } = useReadingTheme();

  const bgGradientClass = isDark
    ? "bg-gradient-to-br from-[#1c1814] via-[#151311] to-[#100f0d]"
    : isSepia
      ? "bg-gradient-to-br from-[#f8f3e8] via-[#f4eee0] to-[#eae0cd]"
      : "bg-gradient-to-br from-[#ffffff] via-[#fafafa] to-[#f5f5f5]";

  // Blush 1: Canto Superior Direito (traseira sutil da grade de capítulos e topo)
  const blush1 = isDark
    ? "radial-gradient(circle at 45% 45%, rgba(229, 184, 105, 0.12) 0%, rgba(190, 140, 45, 0.03) 50%, transparent 75%)"
    : isSepia
      ? "radial-gradient(circle at 45% 45%, rgba(198, 140, 40, 0.11) 0%, rgba(175, 120, 30, 0.03) 50%, transparent 75%)"
      : "radial-gradient(circle at 45% 45%, rgba(215, 160, 45, 0.07) 0%, rgba(235, 185, 70, 0.02) 50%, transparent 75%)";

  // Blush 2: Centro Esquerda (periferia sutil da margem esquerda)
  const blush2 = isDark
    ? "radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.09) 0%, rgba(150, 100, 25, 0.02) 55%, transparent 80%)"
    : isSepia
      ? "radial-gradient(circle at 50% 50%, rgba(205, 145, 45, 0.08) 0%, rgba(168, 112, 25, 0.02) 55%, transparent 80%)"
      : "radial-gradient(circle at 50% 50%, rgba(220, 165, 50, 0.055) 0%, rgba(238, 190, 75, 0.015) 55%, transparent 80%)";

  // Blush 3: Canto Inferior Direito (traseira inferior sutil)
  const blush3 = isDark
    ? "radial-gradient(circle at 60% 60%, rgba(235, 195, 115, 0.10) 0%, rgba(140, 90, 20, 0.02) 60%, transparent 80%)"
    : isSepia
      ? "radial-gradient(circle at 60% 60%, rgba(195, 138, 38, 0.09) 0%, rgba(170, 115, 28, 0.02) 60%, transparent 80%)"
      : "radial-gradient(circle at 60% 60%, rgba(210, 155, 40, 0.06) 0%, rgba(230, 180, 65, 0.015) 60%, transparent 80%)";

  // Blush 4: Canto Superior Esquerdo (aura sutil no canto oposto)
  const blush4 = isDark
    ? "radial-gradient(circle at center, rgba(225, 180, 95, 0.07) 0%, rgba(170, 120, 35, 0.015) 50%, transparent 75%)"
    : isSepia
      ? "radial-gradient(circle at center, rgba(200, 142, 42, 0.06) 0%, rgba(165, 110, 25, 0.015) 50%, transparent 75%)"
      : "radial-gradient(circle at center, rgba(218, 162, 48, 0.04) 0%, rgba(235, 185, 70, 0.01) 50%, transparent 75%)";

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-0 overflow-hidden select-none transition-colors duration-500",
        bgGradientClass
      )}
      aria-hidden="true"
    >
      {/* Blush 1: Canto Superior Direito */}
      <div
        className="absolute -top-[12%] -right-[10%] h-[550px] w-[550px] rounded-full blur-[150px] transition-all duration-500"
        style={{ background: blush1 }}
      />

      {/* Blush 2: Centro Esquerda Periférico */}
      <div
        className="absolute top-[32%] -left-[16%] h-[600px] w-[600px] rounded-full blur-[160px] transition-all duration-500"
        style={{ background: blush2 }}
      />

      {/* Blush 3: Canto Inferior Direito */}
      <div
        className="absolute -bottom-[16%] right-[6%] h-[650px] w-[650px] rounded-full blur-[170px] transition-all duration-500"
        style={{ background: blush3 }}
      />

      {/* Blush 4: Canto Superior Esquerdo Periférico */}
      <div
        className="absolute -top-[12%] -left-[10%] h-[480px] w-[480px] rounded-full blur-[140px] transition-all duration-500"
        style={{ background: blush4 }}
      />
    </div>
  );
});

export default GoldenAmbientMist;

