import { useHarpaPlayer } from "@/contexts/HarpaPlayerContext";
import { Link } from "react-router-dom";
import {
    Music2,
    Play,
    Pause,
    Repeat,
    SkipForward,
    Volume2,
    Volume1,
    VolumeX,
    X,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function HarpaPlayerBar() {
    const {
        state,
        pause,
        resume,
        seek,
        setVolume,
        toggleMute,
        toggleLoop,
        toggleAutoAdvance,
        next,
        close,
    } = useHarpaPlayer();

    if (state.hymnNumber === null) {
        return null;
    }

    const {
        hymnNumber,
        title,
        isPlaying,
        progress,
        volume,
        isMuted,
        loopMode,
        autoAdvance,
        error,
    } = state;

    const handlePlayPause = () => {
        if (isPlaying) {
            pause();
        } else {
            resume();
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        seek(ratio);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVolume(parseFloat(e.target.value));
    };

    const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

    return (
        <div
            className={cn(
                "fixed inset-x-0 z-[45] transition-all duration-300",
                "bottom-[53px] md:bottom-0",
                "border-t border-gold/20 bg-app-surface/95 backdrop-blur-md shadow-lg",
                "animate-in slide-in-from-bottom-2 duration-300"
            )}
            aria-label="Player de Louvor da Harpa Cristã"
            role="region"
        >
            {/* Seekable Progress Bar on Top — Ultra-fine */}
            <div
                className="group relative h-[3px] w-full cursor-pointer bg-gold/15 transition-all hover:h-1"
                onClick={handleSeek}
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progresso do louvor"
            >
                <div
                    className="h-full bg-gold transition-all duration-100 relative"
                    style={{ width: `${progress}%` }}
                >
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gold opacity-0 group-hover:opacity-100 shadow" />
                </div>
            </div>

            <div className="mx-auto flex max-w-6xl items-center justify-between gap-2.5 px-3 py-1.5 md:px-5 md:py-1.5">
                {/* Left: Hymn info with link */}
                <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                    <span
                        className={cn(
                            "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold ring-1 ring-gold/20 transition-all",
                            isPlaying && "animate-pulse ring-gold/40"
                        )}
                        aria-hidden="true"
                    >
                        <Music2 className="h-3.5 w-3.5" />
                    </span>

                    <Link
                        to={`/harpa/${hymnNumber}`}
                        className="group flex min-w-0 flex-col justify-center text-left"
                        title={`Ir para a letra do Hino ${hymnNumber} — ${title}`}
                    >
                        <span className="text-[0.6rem] sm:text-[0.65rem] font-mono uppercase tracking-wider text-gold leading-none truncate">
                            Hino {hymnNumber}
                        </span>
                        <span className="text-xs sm:text-[0.82rem] font-medium text-app-text group-hover:text-gold transition-colors leading-none truncate mt-1">
                            {title}
                        </span>
                    </Link>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    {/* Error notice if audio failed */}
                    {error && (
                        <span
                            className="flex items-center gap-1 text-[0.68rem] text-rose-500 font-medium mr-1"
                            title="Erro ao carregar áudio"
                        >
                            <AlertCircle className="h-3 w-3" />
                            <span className="hidden sm:inline">Erro</span>
                        </span>
                    )}

                    {/* Volume control (desktop only) */}
                    <div className="hidden sm:flex items-center gap-1.5 mr-1">
                        <button
                            type="button"
                            onClick={toggleMute}
                            aria-label={isMuted || volume === 0 ? "Ativar som" : "Silenciar"}
                            title={isMuted || volume === 0 ? "Ativar som" : "Silenciar"}
                            className="text-gold/60 hover:text-gold transition-colors p-0.5"
                        >
                            <VolumeIcon className="h-3.5 w-3.5" />
                        </button>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            aria-label="Volume do player"
                            className="w-14 sm:w-16 h-0.5 cursor-pointer appearance-none rounded-full bg-gold/20 accent-gold focus:outline-none"
                        />
                    </div>

                    {/* Loop button */}
                    <button
                        type="button"
                        onClick={toggleLoop}
                        aria-label={loopMode ? "Desativar repetição" : "Repetir este Hino"}
                        title={loopMode ? "Desativar repetição" : "Repetir este Hino"}
                        className={cn(
                            "p-1 rounded-md transition-colors",
                            loopMode
                                ? "text-gold bg-gold/15"
                                : "text-app-text-muted hover:text-gold"
                        )}
                    >
                        <Repeat className="h-3.5 w-3.5" />
                    </button>

                    {/* Next / Auto-Advance button */}
                    <button
                        type="button"
                        onClick={next}
                        aria-label="Tocar próximo Hino"
                        title="Tocar próximo Hino"
                        className={cn(
                            "p-1 rounded-md transition-colors",
                            autoAdvance
                                ? "text-gold bg-gold/15"
                                : "text-app-text-muted hover:text-gold"
                        )}
                    >
                        <SkipForward className="h-3.5 w-3.5" />
                    </button>

                    {/* Play / Pause button — Slim & delicate */}
                    <button
                        onClick={handlePlayPause}
                        aria-label={isPlaying ? "Pausar louvor" : "Tocar louvor"}
                        title={isPlaying ? "Pausar louvor" : "Tocar louvor"}
                        type="button"
                        className={cn(
                            "flex h-7.5 w-7.5 sm:h-8 sm:w-8 items-center justify-center rounded-full border transition-all shadow-sm",
                            isPlaying
                                ? "border-gold bg-gold text-white"
                                : "border-gold/40 bg-app-surface text-gold hover:bg-gold/15"
                        )}
                    >
                        {isPlaying ? (
                            <Pause className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
                        ) : (
                            <Play className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current ml-0.5" />
                        )}
                    </button>

                    {/* Close button */}
                    <button
                        type="button"
                        onClick={close}
                        aria-label="Fechar player"
                        title="Fechar player e parar áudio"
                        className="text-app-text-muted/70 hover:text-rose-400 p-1 transition-colors ml-0.5"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
