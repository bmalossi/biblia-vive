import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
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

    // Auto cleanup audio object URL if we loaded local blobs
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [slug]);

    const handlePlayPause = async () => {
        if (!user || (!isPro && !proLoading)) {
            // Se não for pro, redireciona para PricingPage
            navigate("/pro");
            return;
        }

        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }

        if (audioRef.current && audioUrl) {
            audioRef.current.play();
            setIsPlaying(true);
            return;
        }

        // Fetch audio from TTS API
        setIsFetching(true);
        try {
            const token = user?.id ? (await supabase.auth.getSession()).data.session?.access_token : "";

            const res = await fetch("/api/tts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ text, slug }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                if (res.status === 402) {
                    navigate("/pro");
                    return;
                }
                throw new Error(err.error || "Failed to fetch audio");
            }

            const data = await res.json();
            setAudioUrl(data.url);

            const audio = new Audio(data.url);
            audio.onended = () => setIsPlaying(false);

            audioRef.current = audio;
            await audio.play();
            setIsPlaying(true);

        } catch (error) {
            console.error(error);
            alert("Erro ao carregar áudio. Tente novamente.");
        } finally {
            setIsFetching(false);
        }
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
                    <h4 className="text-sm font-medium text-app-text">Áudio Premium</h4>
                    {!isPro && <Crown className="h-3.5 w-3.5 text-gold" />}
                </div>
                <p className="text-xs text-app-text-muted leading-relaxed">
                    {isPro
                        ? "Narração ElevenLabs em alta qualidade."
                        : "Escute este capítulo narrado por voz humana realista."}
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
