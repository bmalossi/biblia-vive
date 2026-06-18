import { useState, useRef, useEffect, useCallback } from "react";
import { Music2, Play, Pause, Volume2, Volume1, VolumeX, Repeat, SkipForward } from "lucide-react";
import { useHarpaAudio } from "@/hooks/useHarpaAudio";
import { cn } from "@/lib/utils";

interface HarpaWorshipCardProps {
    hymnNumber: number;
    title: string;
    /** When true, starts playing as soon as audio is ready (used after auto-advance navigation). */
    autoPlay?: boolean;
    /** Called when audio ends and autoAdvance mode is active. Parent should navigate to next. */
    onEnded?: () => void;
    /** Called after autoPlay is consumed so the parent can reset the flag. */
    onAutoPlayConsumed?: () => void;
}

export default function HarpaWorshipCard({ hymnNumber, title, autoPlay, onEnded, onAutoPlayConsumed }: HarpaWorshipCardProps) {
    const { audioUrl, isAvailable, checking } = useHarpaAudio(hymnNumber, title);
    const [isPlaying, setIsPlaying]     = useState(false);
    const [progress, setProgress]       = useState(0);   // 0-100
    const [duration, setDuration]       = useState(0);
    const [volume, setVolume]           = useState(0.8); // 0-1
    const [error, setError]             = useState(false);
    const [loopMode, setLoopMode]       = useState(false);
    const [autoAdvance, setAutoAdvance] = useState(false);

    const audioRef       = useRef<HTMLAudioElement | null>(null);
    const prevVolumeRef  = useRef(0.8);
    const loopModeRef    = useRef(false);
    const autoAdvanceRef = useRef(false);
    const onEndedRef     = useRef<(() => void) | undefined>(undefined);
    const onConsumedRef  = useRef<(() => void) | undefined>(undefined);

    useEffect(() => { loopModeRef.current = loopMode; },             [loopMode]);
    useEffect(() => { autoAdvanceRef.current = autoAdvance; },       [autoAdvance]);
    useEffect(() => { onEndedRef.current = onEnded; },               [onEnded]);
    useEffect(() => { onConsumedRef.current = onAutoPlayConsumed; }, [onAutoPlayConsumed]);

    // Sync native audio.loop when loopMode toggles
    useEffect(() => {
        if (audioRef.current) audioRef.current.loop = loopMode;
    }, [loopMode]);

    const [prevHymnNumber, setPrevHymnNumber] = useState(hymnNumber);
    if (hymnNumber !== prevHymnNumber) {
        setPrevHymnNumber(hymnNumber);
        setIsPlaying(false);
        setProgress(0);
        setDuration(0);
        setError(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    }

    const attachListeners = useCallback((audio: HTMLAudioElement) => {
        audio.onloadedmetadata = () => setDuration(audio.duration);
        audio.ontimeupdate = () => {
            if (audio.duration > 0) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        };
        audio.onended = () => {
            if (autoAdvanceRef.current && onEndedRef.current) {
                onEndedRef.current();
                return;
            }
            setIsPlaying(false);
            setProgress(0);
            if (audioRef.current) audioRef.current.currentTime = 0;
        };
        audio.onerror = () => {
            setError(true);
            setIsPlaying(false);
        };
    }, []);

    // Auto-play when parent requests it
    useEffect(() => {
        if (!autoPlay || !isAvailable || checking || isPlaying || !audioUrl) return;
        let cancelled = false;

        const start = async () => {
            try {
                if (!audioRef.current) {
                    const audio = new Audio(audioUrl);
                    audio.volume = volume;
                    audio.loop   = loopModeRef.current;
                    attachListeners(audio);
                    audioRef.current = audio;
                }
                if (cancelled) return;
                await audioRef.current.play();
                if (!cancelled) {
                    setIsPlaying(true);
                    onConsumedRef.current?.();
                }
            } catch {
                if (!cancelled) {
                    setError(true);
                    onConsumedRef.current?.();
                }
            }
        };
        start();
        return () => { cancelled = true; };
    }, [autoPlay, isAvailable, checking, audioUrl, attachListeners]);

    const handlePlayPause = async () => {
        if (!audioUrl) return;
        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
            return;
        }
        try {
            if (!audioRef.current) {
                const audio = new Audio(audioUrl);
                audio.volume = volume;
                audio.loop   = loopModeRef.current;
                attachListeners(audio);
                audioRef.current = audio;
            }
            await audioRef.current.play();
            setIsPlaying(true);
        } catch {
            setError(true);
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current || duration === 0) return;
        const rect  = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        audioRef.current.currentTime = ratio * duration;
        setProgress(ratio * 100);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (audioRef.current) audioRef.current.volume = val;
        if (val > 0) prevVolumeRef.current = val;
    };

    const handleVolumeMuteToggle = () => {
        if (volume > 0) {
            prevVolumeRef.current = volume;
            setVolume(0);
            if (audioRef.current) audioRef.current.volume = 0;
        } else {
            const restored = prevVolumeRef.current || 0.8;
            setVolume(restored);
            if (audioRef.current) audioRef.current.volume = restored;
        }
    };

    const handleToggleLoop = () => {
        setLoopMode((prev) => {
            const next = !prev;
            if (next) setAutoAdvance(false);
            return next;
        });
    };

    const handleToggleAutoAdvance = () => {
        setAutoAdvance((prev) => {
            const next = !prev;
            if (next) setLoopMode(false);
            return next;
        });
    };

    const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

    if (checking || !isAvailable || error) return null;

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
                        onClick={handleVolumeMuteToggle}
                        aria-label={volume === 0 ? "Ativar som" : "Silenciar"}
                        title={volume === 0 ? "Ativar som" : "Silenciar"}
                        className="text-gold/60 hover:text-gold transition-colors duration-150"
                    >
                        <VolumeIcon className="h-3.5 w-3.5" />
                    </button>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={volume}
                        onChange={handleVolumeChange}
                        aria-label="Volume do louvor"
                        className="worship-volume-slider w-16 h-0.5 cursor-pointer appearance-none rounded-full bg-gold/20 accent-gold focus:outline-none"
                    />
                </div>

                {/* Loop & Auto-advance controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        type="button"
                        onClick={handleToggleLoop}
                        aria-label={loopMode ? "Desativar repetição" : "Repetir este Hino"}
                        title={loopMode ? "Desativar repetição" : "Repetir este Hino"}
                        className={cn(
                            "transition-colors duration-150",
                            loopMode ? "text-gold" : "text-gold/40 hover:text-gold"
                        )}
                    >
                        <Repeat className="h-3.5 w-3.5" />
                    </button>
                    {onEnded && (
                        <button
                            type="button"
                            onClick={handleToggleAutoAdvance}
                            aria-label={autoAdvance ? "Desativar avanço automático" : "Avançar para o próximo Hino ao final"}
                            title={autoAdvance ? "Desativar avanço automático" : "Avançar para o próximo Hino ao final"}
                            className={cn(
                                "transition-colors duration-150",
                                autoAdvance ? "text-gold" : "text-gold/40 hover:text-gold"
                            )}
                        >
                            <SkipForward className="h-3.5 w-3.5" />
                        </button>
                    )}
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
                    isPlaying ? "opacity-100" : "opacity-0"
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
