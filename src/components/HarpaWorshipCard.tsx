import { Music2, Play, Pause, Volume2, Volume1, VolumeX, Repeat, SkipForward } from "lucide-react";
import { useHarpaAudio } from "@/hooks/useHarpaAudio";
import { useHarpaPlayer } from "@/contexts/HarpaPlayerContext";
import { cn } from "@/lib/utils";

interface HarpaWorshipCardProps {
    hymnNumber: number;
    title: string;
    autoPlay?: boolean;
    onEnded?: () => void;
    onAutoPlayConsumed?: () => void;
}

export default function HarpaWorshipCard({ hymnNumber, title }: HarpaWorshipCardProps) {
    const { audioUrl, isAvailable, checking } = useHarpaAudio(hymnNumber, title);
    const {
        state,
        play,
        seek,
        setVolume,
        toggleMute,
        toggleLoop,
        toggleAutoAdvance,
        next,
    } = useHarpaPlayer();

    const isCurrentHymn = state.hymnNumber === hymnNumber;
    const isPlaying     = isCurrentHymn && state.isPlaying;
    const progress      = isCurrentHymn ? state.progress : 0;
    const volume        = state.volume;
    const isMuted       = state.isMuted;
    const loopMode      = state.loopMode;
    const autoAdvance   = state.autoAdvance;

    const handlePlayPause = () => {
        if (!audioUrl) return;
        play({ hymnNumber, title, audioUrl });
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isCurrentHymn) return;
        const rect  = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        seek(ratio);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVolume(parseFloat(e.target.value));
    };

    const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

    if (checking || !isAvailable) return null;

    return (
        <div
            className={cn(
                "mb-6 flex flex-col gap-0 overflow-hidden rounded-xl border transition-all duration-500",
                "border-gold/30 bg-gold-bg/10",
                isPlaying && "shadow-[0_0_18px_2px_hsl(var(--gold)/0.18)] border-gold/50"
            )}
            aria-label="Áudio de louvor para este Hino"
        >
            {/* Main row */}
            <div className="flex items-center gap-3 px-4 py-3">
                {/* Animated icon */}
                <span
                    className={cn(
                        "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold ring-1 ring-gold/20 transition-all duration-300",
                        isPlaying && "animate-pulse ring-gold/50"
                    )}
                    aria-hidden="true"
                >
                    <Music2 className="h-4 w-4" />
                </span>

                {/* Labels */}
                <div className="flex-1 min-w-0">
                    <p className="text-[0.7rem] font-mono uppercase tracking-[0.1em] text-gold leading-tight">
                        Louve com a Harpa Cristã
                    </p>
                    <p className="text-xs text-app-text-muted leading-tight mt-0.5 truncate">
                        Hino {hymnNumber} — {title}
                    </p>
                </div>

                {/* Volume control */}
                <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                    <button
                        type="button"
                        onClick={toggleMute}
                        aria-label={isMuted || volume === 0 ? "Ativar som" : "Silenciar"}
                        title={isMuted || volume === 0 ? "Ativar som" : "Silenciar"}
                        className="text-gold/60 hover:text-gold transition-colors duration-150"
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
                        aria-label="Volume do louvor"
                        className="worship-volume-slider w-16 h-0.5 cursor-pointer appearance-none rounded-full bg-gold/20 accent-gold focus:outline-none"
                    />
                </div>

                {/* Loop & Auto-advance controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        type="button"
                        onClick={toggleLoop}
                        aria-label={loopMode ? "Desativar repetição" : "Repetir este Hino"}
                        title={loopMode ? "Desativar repetição" : "Repetir este Hino"}
                        className={cn(
                            "transition-colors duration-150",
                            loopMode ? "text-gold" : "text-gold/40 hover:text-gold"
                        )}
                    >
                        <Repeat className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={toggleAutoAdvance}
                        aria-label={autoAdvance ? "Desativar avanço automático" : "Avançar para o próximo Hino ao final"}
                        title={autoAdvance ? "Desativar avanço automático" : "Avançar para o próximo Hino ao final"}
                        className={cn(
                            "transition-colors duration-150",
                            autoAdvance ? "text-gold" : "text-gold/40 hover:text-gold"
                        )}
                    >
                        <SkipForward className="h-3.5 w-3.5" />
                    </button>
                </div>

                {/* Play / Pause button */}
                <button
                    onClick={handlePlayPause}
                    aria-label={isPlaying ? "Pausar louvor" : "Ouvir louvor"}
                    title={isPlaying ? "Pausar louvor" : "Ouvir este louvor"}
                    className={cn(
                        "h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-full border transition-all duration-200",
                        isPlaying
                            ? "border-gold bg-gold text-white shadow-sm"
                            : "border-gold/40 bg-app-surface text-gold hover:bg-gold/10 hover:border-gold/70"
                    )}
                    type="button"
                >
                    {isPlaying ? (
                        <Pause className="h-3.5 w-3.5 fill-current" />
                    ) : (
                        <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                    )}
                </button>
            </div>

            {/* Progress bar */}
            <div
                className={cn(
                    "h-0.5 w-full cursor-pointer transition-all duration-300 bg-gold/10",
                    isCurrentHymn ? "opacity-100" : "opacity-0"
                )}
                onClick={handleSeek}
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progresso do louvor"
            >
                <div
                    className="h-full bg-gold/60 transition-all duration-100"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
