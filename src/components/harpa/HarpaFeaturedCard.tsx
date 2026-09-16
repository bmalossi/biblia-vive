import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Pause, Star, Bookmark } from "lucide-react";
import { useHarpaPlayer } from "@/contexts/HarpaPlayerContext";
import { useHarpaAudio } from "@/hooks/useHarpaAudio";
import { getHymnRatingData, formatHymnNumber, hasValidRating } from "@/lib/harpaUtils";
import { cn } from "@/lib/utils";

interface HarpaFeaturedCardProps {
  hymnNumber?: number;
  title?: string;
}

export default function HarpaFeaturedCard({
  hymnNumber = 1,
  title = "Chuvas de Graça",
}: HarpaFeaturedCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const { audioUrl } = useHarpaAudio(hymnNumber, title);
  const { state, play, pause, resume, seek } = useHarpaPlayer();

  const isCurrentHymn = state.hymnNumber === hymnNumber;
  const isPlaying = isCurrentHymn && state.isPlaying;
  const progress = isCurrentHymn ? state.progress : 0;
  const duration = isCurrentHymn && state.duration > 0 ? state.duration : 192; // 3:12 em segundos como padrão

  const ratingInfo = getHymnRatingData(hymnNumber);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      pause();
    } else if (isCurrentHymn) {
      resume();
    } else if (audioUrl) {
      play({ hymnNumber, title, audioUrl });
    }
  };

  // Formatação de tempo em mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const currentSeconds = Math.round((progress / 100) * duration);

  // Barras de visualização de áudio estilizadas
  const waveHeights = [
    25, 45, 60, 30, 75, 90, 65, 40, 85, 100, 70, 50, 80, 95, 60, 45, 70, 85, 50,
    35, 65, 75, 45, 60, 80, 55, 35, 20,
  ];

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCurrentHymn) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(ratio);
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl md:rounded-3xl border border-[#382f23]/80 bg-[#161412] p-5 sm:p-6 md:p-7 shadow-2xl mb-10 transition-all duration-300 hover:border-[#c69a50]/60 min-h-[160px]">
      {/* Imagem de Fundo com Máscara e Degradês em Camadas para o Efeito Fumaça (Idêntico ao card de Jornada) */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-full sm:w-[55%] md:w-[48%] lg:w-[42%] overflow-hidden select-none">
        <img
          src="/images/jornadas-mountain-hero.jpg"
          alt="Montanhas ao amanhecer com raios de sol e névoa"
          className="h-full w-full object-cover object-left"
          style={{
            maskImage:
              "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0.25) 78%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0.25) 78%, transparent 100%)",
          }}
        />

        {/* Camada 1 de Efeito Fumaça: Gradiente Linear Horizontal Suave */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#161412]/40 via-40% to-[#161412]" />

        {/* Camada 2 de Efeito Fumaça: Névoa Radial Difusa / Densidade de Fumaça */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_90%_at_75%_50%,#161412_15%,rgba(22,20,18,0.75)_50%,transparent_90%)]" />

        {/* Camada 3: Blush/Brilho Dourado Confortável e Suave */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_35%_45%,rgba(229,184,105,0.12)_0%,rgba(198,154,80,0.03)_50%,transparent_80%)] mix-blend-screen" />

        {/* Camada 4: Vinhetas Suaves de Borda (Top/Bottom/Left) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#161412]/50 via-transparent to-[#161412]/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#161412]/30 via-transparent to-transparent" />
      </div>

      {/* Botões Superiores de Ação: Favorito e Marcador */}
      <div className="absolute top-4 right-4 sm:top-5 sm:right-5 flex items-center gap-2 z-20">
        <button
          type="button"
          onClick={() => setIsFavorited(!isFavorited)}
          className={cn(
            "p-1.5 rounded-full transition-colors cursor-pointer",
            isFavorited
              ? "text-[#e5b869] fill-[#e5b869]"
              : "text-[#8f8272] hover:text-[#e5b869]"
          )}
          aria-label={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          <Star className={cn("w-4 h-4", isFavorited && "fill-current")} />
        </button>

        <button
          type="button"
          onClick={() => setIsBookmarked(!isBookmarked)}
          className={cn(
            "p-1.5 rounded-full transition-colors cursor-pointer",
            isBookmarked
              ? "text-[#e5b869] fill-[#e5b869]"
              : "text-[#8f8272] hover:text-[#e5b869]"
          )}
          aria-label={isBookmarked ? "Remover marcador" : "Salvar hino"}
        >
          <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
        </button>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Bloco Esquerda: Informações e Metadados do Hino */}
        <div className="space-y-1.5 min-w-0 max-w-xl pl-0 sm:pl-2 flex-1">
          <p className="font-mono text-[0.62rem] sm:text-[0.65rem] uppercase tracking-[0.2em] text-[#e5b869] font-medium">
            HINO EM DESTAQUE
          </p>

          <p className="font-mono text-xs text-[#a09383] font-medium">
            Nº {formatHymnNumber(hymnNumber)}
          </p>

          <div className="flex items-baseline gap-2 flex-wrap">
            <Link
              to={`/harpa/${hymnNumber}`}
              className="font-serif text-xl sm:text-2xl md:text-[1.7rem] text-[#f4efea] font-normal hover:text-[#e5b869] transition-colors leading-tight"
            >
              {title}
            </Link>

            {hasValidRating(ratingInfo?.rating) && (
              <div className="inline-flex items-center gap-1 text-xs text-[#e5b869] font-sans">
                <Star className="w-3 h-3 fill-current" />
                <span className="font-medium">{ratingInfo.rating}</span>
                {ratingInfo.reviewsCount && Number(ratingInfo.reviewsCount) > 0 && (
                  <span className="text-[#8f8272] text-[0.7rem]">({ratingInfo.reviewsCount})</span>
                )}
              </div>
            )}
          </div>

          {/* Tags / Categorias */}
          {ratingInfo.tags && (
            <div className="flex items-center gap-1.5 pt-0.5 pb-0.5 flex-wrap">
              {ratingInfo.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-full bg-[#201b17]/90 border border-[#382f23] text-[0.65rem] text-[#9b8e7e] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Descrição Sinopse */}
          <p className="font-sans text-xs sm:text-[0.82rem] text-[#9b8e7e] leading-relaxed line-clamp-2 max-w-lg">
            {ratingInfo.description}
          </p>
        </div>

        {/* Bloco Direita: Player de Áudio e Visualizador de Ondas */}
        <div className="w-full lg:w-auto flex items-center justify-between sm:justify-start gap-4 lg:gap-6 pt-2 lg:pt-0 shrink-0">
          {/* Botão Play Circular Dourado */}
          <button
            type="button"
            onClick={handlePlayPause}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#e5b869] hover:bg-[#d8a855] text-[#161412] flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer shrink-0"
            aria-label={isPlaying ? "Pausar hino" : "Ouvir hino"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          {/* Visualizador Waveform */}
          <div
            onClick={handleWaveformClick}
            className="flex items-center gap-1 sm:gap-1.5 h-10 px-2 py-1 cursor-pointer select-none group"
            title="Avançar / retroceder áudio"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            {waveHeights.map((height, idx) => {
              const barProgress = (idx / waveHeights.length) * 100;
              const isPassed = progress >= barProgress;

              return (
                <div
                  key={idx}
                  className="w-1 sm:w-1.5 rounded-full transition-all duration-150"
                  style={{
                    height: `${isPlaying ? Math.max(15, (height * (0.6 + Math.random() * 0.4))) : height * 0.7}%`,
                    backgroundColor: isPassed ? "#e5b869" : "#4a3e30",
                  }}
                />
              );
            })}
          </div>

          {/* Tempo decorrido / Duração */}
          <div className="font-mono text-xs text-[#8f8272] shrink-0 min-w-[65px] text-right">
            <span>
              {formatTime(currentSeconds)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
