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
        // Pre-load native voices to avoid OS cold-start delay
        if (window.speechSynthesis) {
            window.speechSynthesis.getVoices();
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            if (window.speechSynthesis && window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
        };
    }, [slug]);

    const handlePlayPause = async () => {
        if (!user || (!isPro && !proLoading)) {
            // Se não for pro, redireciona para PricingPage
            navigate("/pro");
            return;
        }

        if (isPlaying) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0; // Return to start as requested
            } else if (window.speechSynthesis && window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel(); // Clears queue, returning to start
            }
            setIsPlaying(false);
            return;
        }

        if (audioRef.current && audioUrl) {
            audioRef.current.play();
            setIsPlaying(true);
            return;
        }

        // Use browser Web Speech API directly (free tier)
        setIsFetching(true);
        try {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "pt-BR";
            utterance.rate = 0.9;
            utterance.onend = () => setIsPlaying(false);
            utterance.onerror = () => {
                setIsPlaying(false);
                setIsFetching(false);
            };
            utterance.onstart = () => {
                setIsPlaying(true);
                setIsFetching(false);
            };

            // Pick a Portuguese voice if available
            const voices = window.speechSynthesis.getVoices();
            const ptVoice = voices.find(v => v.lang.startsWith("pt"));
            if (ptVoice) utterance.voice = ptVoice;

            window.speechSynthesis.speak(utterance);
        } catch {
            setIsFetching(false);
            alert("Erro ao carregar áudio. Tente novamente.");
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
                        ? "Narração em alta qualidade."
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
