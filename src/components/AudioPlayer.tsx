import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Play, Pause, Loader2 } from "lucide-react";

interface AudioPlayerProps {
    text: string;
    slug: string; // e.g. "JHN-3-ACF"
}

export default function AudioPlayer({ text, slug }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Cleanup when slug changes (chapter navigation)
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            setAudioUrl(null);
            setIsPlaying(false);
        };
    }, [slug]);

    const fetchAndPlay = useCallback(async () => {
        setIsFetching(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (session?.access_token) {
                headers["Authorization"] = `Bearer ${session.access_token}`;
            }

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const res = await fetch(`${supabaseUrl}/functions/v1/tts`, {
                method: "POST",
                headers,
                body: JSON.stringify({ text, slug }),
            });

            const data = await res.json();

            if (data.fallback) {
                // Google key not configured yet — use browser synthesis as last resort
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = "pt-BR";
                utterance.rate = 0.9;
                utterance.onend = () => setIsPlaying(false);
                utterance.onerror = () => { setIsPlaying(false); setIsFetching(false); };
                utterance.onstart = () => { setIsPlaying(true); setIsFetching(false); };
                const voices = window.speechSynthesis?.getVoices() ?? [];
                const ptVoice = voices.find(v => v.lang.startsWith("pt"));
                if (ptVoice) utterance.voice = ptVoice;
                window.speechSynthesis?.speak(utterance);
                return;
            }

            if (data.url) {
                setAudioUrl(data.url);
                const audio = new Audio(data.url);
                audioRef.current = audio;
                audio.onended = () => setIsPlaying(false);
                audio.onerror = () => { setIsPlaying(false); setIsFetching(false); };
                await audio.play();
                setIsPlaying(true);
            }
        } catch (err) {
            console.error("[AudioPlayer] Error:", err);
            alert("Erro ao carregar áudio. Tente novamente.");
        } finally {
            setIsFetching(false);
        }
    }, [text, slug]);

    const handlePlayPause = async () => {
        if (isPlaying) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            } else if (window.speechSynthesis?.speaking) {
                window.speechSynthesis.cancel();
            }
            setIsPlaying(false);
            return;
        }

        // Resume cached audio element if available
        if (audioRef.current && audioUrl) {
            audioRef.current.currentTime = 0;
            await audioRef.current.play();
            setIsPlaying(true);
            return;
        }

        await fetchAndPlay();
    };

    return (
        <button
            onClick={handlePlayPause}
            disabled={isFetching}
            aria-label="Reproduzir Áudio Narrado"
            title="Reproduzir Áudio Narrado"
            className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-md border border-border bg-app-surface text-app-text transition-colors hover:bg-app-raised hover:text-gold"
        >
            {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
            ) : (
                <Play className="h-4 w-4 fill-current ml-0.5" />
            )}
        </button>
    );
}
