import React from "react";
import { Link } from "react-router-dom";
import { Star, Play, Pause } from "lucide-react";
import { useHarpaPlayer } from "@/contexts/HarpaPlayerContext";
import { useHarpaAudio } from "@/hooks/useHarpaAudio";
import { HarpaHymn, getHymnRatingData, formatHymnNumber, hasValidRating } from "@/lib/harpaUtils";
import { cn } from "@/lib/utils";

interface HarpaHymnCardProps {
  hymn: HarpaHymn;
}

export default function HarpaHymnCard({ hymn }: HarpaHymnCardProps) {
  const { state, play, pause, resume } = useHarpaPlayer();
  const { audioUrl } = useHarpaAudio(hymn.numero, hymn.tituloFormatado);

  const isCurrent = state.hymnNumber === hymn.numero;
  const isPlaying = isCurrent && state.isPlaying;

  const ratingInfo = getHymnRatingData(hymn.numero);
  const showRating = hasValidRating(ratingInfo?.rating);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!hymn.hasAudio) return;

    if (isPlaying) {
      pause();
    } else if (isCurrent) {
      resume();
    } else if (audioUrl) {
      play({
        hymnNumber: hymn.numero,
        title: hymn.tituloFormatado,
        audioUrl,
      });
    }
  };

  return (
    <Link
      to={`/harpa/${hymn.numero}`}
      aria-label={`Hino ${hymn.numero}: ${hymn.tituloFormatado}`}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#382f23]/80 bg-[#161412] p-4 sm:p-4.5",
        "shadow-lg transition-all duration-300 hover:border-[#c69a50]/60 hover:shadow-xl hover:shadow-black/40",
        "min-h-[108px] text-left select-none focus:outline-none focus:ring-1 focus:ring-[#e5b869]/50",
        isPlaying && "border-[#e5b869]/70 bg-[#1e1914] shadow-md shadow-gold/5"
      )}
    >
      {/* Fundo Atmosférico com Névoa Sutil (Idêntico aos cards de 'Permanecer', 'Cultivo' em Jornada) */}
      <div
        className="pointer-events-none absolute inset-0 bg-[url('/images/jornadas-mountain-hero.jpg')] bg-cover bg-center opacity-[0.06] mix-blend-luminosity group-hover:opacity-[0.11] transition-opacity duration-500"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1c1814]/80 via-[#161412] to-[#12100e]"
        aria-hidden="true"
      />

      {/* Topo: Número e Título do Hino */}
      <div className="relative z-10">
        <p className="font-mono text-[0.62rem] text-[#8f8272] tracking-wider uppercase mb-1 group-hover:text-[#a09383] transition-colors">
          Nº {formatHymnNumber(hymn.numero)}
        </p>

        <h3 className="font-serif text-sm sm:text-[0.92rem] text-[#f4efea] font-normal leading-snug line-clamp-1 group-hover:text-[#e5b869] transition-colors">
          {hymn.tituloFormatado}
        </h3>
      </div>

      {/* Rodapé: Avaliação / Estrofes e Botão de Play (Apenas quando houver áudio disponível) */}
      <div className="relative z-10 pt-2.5 border-t border-[#382f23]/50 flex items-center justify-between mt-3 min-h-[26px]">
        {showRating ? (
          <div className="flex items-center gap-1 text-[0.68rem] text-[#8f8272]">
            <Star className="w-2.5 h-2.5 fill-[#e5b869] text-[#e5b869]" />
            <span className="font-medium text-[#c4b5a2]">{ratingInfo.rating}</span>
            {ratingInfo.reviewsCount && Number(ratingInfo.reviewsCount) > 0 && (
              <span className="text-[0.62rem]">({ratingInfo.reviewsCount})</span>
            )}
          </div>
        ) : (
          <span className="font-sans text-[0.62rem] text-[#6e6355]">
            {hymn.estrofes} {hymn.estrofes === 1 ? "estrofe" : "estrofes"}
          </span>
        )}

        {/* Botão de Play Circular — Exclusivo para hinos com gravação de áudio real */}
        {hymn.hasAudio && (
          <button
            type="button"
            onClick={handlePlayClick}
            className={cn(
              "w-6 h-6 rounded-full border border-[#382f23] flex items-center justify-center transition-all cursor-pointer shrink-0 ml-auto",
              "group-hover:border-[#e5b869] group-hover:bg-[#e5b869] group-hover:text-[#161412]",
              isPlaying
                ? "border-[#e5b869] bg-[#e5b869] text-[#161412]"
                : "text-[#c69a50]"
            )}
            aria-label={isPlaying ? `Pausar hino ${hymn.numero}` : `Tocar hino ${hymn.numero}`}
          >
            {isPlaying ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current ml-0.5" />
            )}
          </button>
        )}
      </div>
    </Link>
  );
}
