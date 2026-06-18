import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Loader2, AlertCircle, Repeat, SkipForward } from "lucide-react";
import { useAudioBible } from "@/hooks/useAudioBible";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
    bookId: string | undefined;
    chapter: number;
    version: string;
    /** When true, starts playing as soon as audio is ready (used after auto-advance navigation). */
    autoPlay?: boolean;
    /** Called when audio ends and autoAdvance mode is active. Parent should navigate to next. */
    onEnded?: () => void;
    /** Called after autoPlay is consumed so the parent can reset the flag. */
    onAutoPlayConsumed?: () => void;
}

export default function AudioPlayer({ bookId, chapter, version, autoPlay, onEnded, onAutoPlayConsumed }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying]     = useState(false);
    const [runtimeError, setRuntimeError] = useState(false);
    const [loopMode, setLoopMode]         = useState(false);
    const [autoAdvance, setAutoAdvance]   = useState(false);

    const audioRef       = useRef<HTMLAudioElement | null>(null);
    const loopModeRef    = useRef(false);
    const autoAdvanceRef = useRef(false);
    const onEndedRef     = useRef<(() => void) | undefined>(undefined);
    const onConsumedRef  = useRef<(() => void) | undefined>(undefined);

    useEffect(() => { loopModeRef.current = loopMode; },             [loopMode]);
    useEffect(() => { autoAdvanceRef.current = autoAdvance; },       [autoAdvance]);
    useEffect(() => { onEndedRef.current = onEnded; },               [onEnded]);
    useEffect(() => { onConsumedRef.current = onAutoPlayConsumed; }, [onAutoPlayConsumed]);

    const { audioUrl, isAvailable, isLoading, checking } = useAudioBible(bookId, chapter, version);

    // Sync native loop property
    useEffect(() => {
        if (audioRef.current) audioRef.current.loop = loopMode;
    }, [loopMode]);

    const [prevBookId, setPrevBookId] = useState(bookId);
    const [prevChapter, setPrevChapter] = useState(chapter);
    const [prevVersion, setPrevVersion] = useState(version);
    if (bookId !== prevBookId || chapter !== prevChapter || version !== prevVersion) {
        setPrevBookId(bookId);
        setPrevChapter(chapter);
        setPrevVersion(version);
        setIsPlaying(false);
        setRuntimeError(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    }

    const attachListeners = useCallback((audio: HTMLAudioElement) => {
        audio.onended = () => {
            if (autoAdvanceRef.current && onEndedRef.current) {
                onEndedRef.current();
                return;
            }
            setIsPlaying(false);
        };
        audio.onerror = () => {
            setRuntimeError(true);
            setIsPlaying(false);
        };
        audio.onplaying = () => setRuntimeError(false);
    }, []);

    // Auto-play when parent requests it
    useEffect(() => {
        if (!autoPlay || !isAvailable || checking || isPlaying || !audioUrl) return;
        let cancelled = false;

        const start = async () => {
            try {
                if (!audioRef.current) {
                    const audio = new Audio(audioUrl);
                    audio.loop  = loopModeRef.current;
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
                    setRuntimeError(true);
                    onConsumedRef.current?.();
                }
            }
        };
        start();
        return () => { cancelled = true; };
    }, [autoPlay, isAvailable, checking, audioUrl, attachListeners]);

    const handlePlayPause = async () => {
        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
            return;
        }
        if (!audioUrl) return;
        try {
            if (!audioRef.current) {
                const audio = new Audio(audioUrl);
                audio.loop  = loopModeRef.current;
                attachListeners(audio);
                audioRef.current = audio;
            }
            await audioRef.current.play();
            setIsPlaying(true);
        } catch (err) {
            console.error("[AudioPlayer] Playback failed:", err);
            setRuntimeError(true);
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

    if (runtimeError || (!checking && !isAvailable)) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-app-text-muted bg-app-raised/30 rounded-md border border-border/50">
                <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                <span>Áudio indisponível para este capítulo</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1 flex-shrink-0">
            {/* Loop toggle */}
            <button
                type="button"
                onClick={handleToggleLoop}
                aria-label={loopMode ? "Desativar repetição" : "Repetir este capítulo"}
                title={loopMode ? "Desativar repetição" : "Repetir este capítulo"}
                className={cn(
                    "h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-md border border-border bg-app-surface transition-colors",
                    loopMode
                        ? "text-gold border-gold/40 bg-gold/5"
                        : "text-app-text-muted hover:bg-app-raised hover:text-gold"
                )}
            >
                <Repeat className="h-4 w-4" />
            </button>

            {/* Play / Pause */}
            <button
                onClick={handlePlayPause}
                disabled={isLoading || checking}
                aria-label={isPlaying ? "Pausar Áudio Narrado" : "Reproduzir Áudio Narrado"}
                title={isPlaying ? "Pausar Áudio Narrado" : "Reproduzir Áudio Narrado"}
                className={cn(
                    "h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-md border border-border bg-app-surface text-app-text transition-colors hover:bg-app-raised hover:text-gold disabled:opacity-50",
                    isPlaying && "text-gold border-gold/40"
                )}
            >
                {isLoading || checking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : isPlaying ? (
                    <Pause className="h-4 w-4 fill-current" />
                ) : (
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                )}
            </button>

            {/* Auto-advance toggle — only when parent provides onEnded */}
            {onEnded && (
                <button
                    type="button"
                    onClick={handleToggleAutoAdvance}
                    aria-label={autoAdvance ? "Desativar avanço automático" : "Avançar para o próximo capítulo ao final"}
                    title={autoAdvance ? "Desativar avanço automático" : "Avançar para o próximo capítulo ao final"}
                    className={cn(
                        "h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-md border border-border bg-app-surface transition-colors",
                        autoAdvance
                            ? "text-gold border-gold/40 bg-gold/5"
                            : "text-app-text-muted hover:bg-app-raised hover:text-gold"
                    )}
                >
                    <SkipForward className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
