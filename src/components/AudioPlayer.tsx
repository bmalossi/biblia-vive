import { useState, useRef, useEffect } from "react";
import { Play, Pause, Loader2, AlertCircle } from "lucide-react";
import { useAudioBible } from "@/hooks/useAudioBible";

interface AudioPlayerProps {
    bookId: string | undefined;
    chapter: number;
    version: string;
}

export default function AudioPlayer({ bookId, chapter, version }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [runtimeError, setRuntimeError] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const { audioUrl, isAvailable, isLoading, checking } = useAudioBible(bookId, chapter, version);

    // Reset state when chapter/book changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setIsPlaying(false);
        setRuntimeError(false);
    }, [bookId, chapter, version]);

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
                audioRef.current = audio;

                audio.onended = () => setIsPlaying(false);

                audio.onerror = () => {
                    console.error("[AudioPlayer] Runtime error playing audio");
                    setRuntimeError(true);
                    setIsPlaying(false);
                };

                // Handle loading state in case of slow connection
                audio.onplaying = () => setRuntimeError(false);
            }

            await audioRef.current.play();
            setIsPlaying(true);
        } catch (err) {
            console.error("[AudioPlayer] Playback failed:", err);
            setRuntimeError(true);
        }
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
        <button
            onClick={handlePlayPause}
            disabled={isLoading || checking}
            aria-label={isPlaying ? "Pausar Áudio Narrado" : "Reproduzir Áudio Narrado"}
            title={isPlaying ? "Pausar Áudio Narrado" : "Reproduzir Áudio Narrado"}
            className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-md border border-border bg-app-surface text-app-text transition-colors hover:bg-app-raised hover:text-gold disabled:opacity-50"
        >
            {isLoading || checking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
            ) : (
                <Play className="h-4 w-4 fill-current ml-0.5" />
            )}
        </button>
    );
}
