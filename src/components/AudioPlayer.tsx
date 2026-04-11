import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Play, Pause, Loader2, Crown } from "lucide-react";

interface AudioPlayerProps {
    text: string;
    slug: string; // e.g. "JHN-3-ACF"
}

export default function AudioPlayer({ text, slug }: AudioPlayerProps) {
    const { isPro, loading: proLoading } = useSubscription();
    const { user } = useAuth();
    const navigate = useNavigate();

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
        // Require login to play
        if (!user) {
            navigate("/pro");
            return;
        }

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

    if (proLoading) {
        return <div className="animate-pulse h-12 bg-app-raised rounded-xl" />;
    }

    return (
        <div className="bg-app-raised/50 border border-border rounded-xl p-4 flex items-center gap-4">
            <button
                onClick={handlePlayPause}
                disabled={isFetching}
                className={`h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95 ${isPro ? "bg-gold text-app-bg shadow-lg shadow-gold/20" : "bg-app-surface border border-gold/30 text-gold"
                    }`}
            >
                {isFetching ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPlaying ? (
                    <Pause className="h-5 w-5 fill-current" />
                ) : (
                    <Play className="h-5 w-5 fill-current ml-1" />
                )}
            </button>

            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-app-text">
                        {isPro ? "Áudio Narrado" : "Áudio Narrado"}
                    </h4>
                    {!isPro && <Crown className="h-3.5 w-3.5 text-gold" />}
                </div>
                <p className="text-xs text-app-text-muted leading-relaxed">
                    {isPro
                        ? "Narração com qualidade."
                        : "Ouça os versículos narrados assinando o plano PRO."}
                </p>
                {!isPro && (
                    <button
                        onClick={() => navigate("/pro")}
                        className="text-[0.65rem] uppercase tracking-wider text-gold hover:underline mt-1 inline-block"
                    >
                        Desbloquear Acesso Pro
                    </button>
                )}
            </div>
        </div>
    );
}
