import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ensureMicrophonePermission } from "@/lib/microphonePermission";
import { startAudioCapture, AudioCaptureController, transcribeVoiceRecording } from "@/lib/audioTranscription";
import { createSpeechRecognitionEngine, SpeechEngineController, isSpeechRecognitionSupported } from "@/lib/speechRecognitionEngine";

interface VoiceRecordButtonProps {
    /** Callback chamado a cada resultado de transcrição (live) e ao concluir */
    onTranscript: (text: string) => void;
    /** Modo: 'append' concatena ao existente com espaço; 'replace' substitui */
    mode?: "append" | "replace";
    /** Texto atual do campo — atualizado pelo componente pai */
    currentValue?: string;
    /** Tamanho visual do botão */
    size?: "sm" | "md" | "icon";
    /** Classe CSS personalizada */
    className?: string;
    /** Label personalizado para estado inativo */
    label?: string;
}

const HAPTIC_PULSE_MS = 35;
const MAX_RECORDING_SECONDS = 120;

export default function VoiceRecordButton({
    onTranscript,
    mode = "append",
    currentValue = "",
    size = "icon",
    className,
    label = "Ditar por voz",
}: VoiceRecordButtonProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Snapshot do texto do campo no exato momento em que o usuário clicou em Gravar
    const startValueRef = useRef<string>("");
    const liveTextRef = useRef<string>("");

    const audioControllerRef = useRef<AudioCaptureController | null>(null);
    const speechEngineRef = useRef<SpeechEngineController | null>(null);
    const timerRef = useRef<number | null>(null);

    const triggerHaptic = () => {
        if (typeof navigator !== "undefined" && "vibrate" in navigator && typeof navigator.vibrate === "function") {
            try { navigator.vibrate(HAPTIC_PULSE_MS); } catch { /* silencioso */ }
        }
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    // Cleanup ao desmontar
    useEffect(() => {
        return () => {
            stopTimer();
            audioControllerRef.current?.cancel();
            speechEngineRef.current?.cancel();
        };
    }, []);

    const buildOutput = useCallback((spokenText: string): string => {
        if (mode === "replace") return spokenText;
        const base = startValueRef.current ? startValueRef.current.trimEnd() + " " : "";
        return (base + spokenText).trim();
    }, [mode]);

    const startRecording = async () => {
        setErrorMessage(null);
        startValueRef.current = currentValue || "";
        liveTextRef.current = "";

        // Garante autorização de microfone
        const permResult = await ensureMicrophonePermission();
        if (!permResult.ok) {
            setErrorMessage(permResult.error || "Microfone não autorizado.");
            setTimeout(() => setErrorMessage(null), 6000);
            return;
        }

        try {
            // 1. Inicia MediaRecorder para captura HD
            const { controller } = await startAudioCapture();
            audioControllerRef.current = controller;

            // 2. Inicia Web Speech determinístico sem duplicações
            if (isSpeechRecognitionSupported()) {
                const engine = createSpeechRecognitionEngine({
                    onLiveUpdate: (state) => {
                        liveTextRef.current = state.fullText;
                        if (state.fullText) {
                            onTranscript(buildOutput(state.fullText));
                        }
                    },
                    onError: (errText) => {
                        console.warn("[VoiceRecordButton Engine Warning]:", errText);
                    },
                });
                speechEngineRef.current = engine;
            }

            setIsRecording(true);
            setRecordingTime(0);
            triggerHaptic();

            timerRef.current = window.setInterval(() => {
                setRecordingTime((prev) => {
                    if (prev + 1 >= MAX_RECORDING_SECONDS) {
                        stopRecording();
                        return MAX_RECORDING_SECONDS;
                    }
                    return prev + 1;
                });
            }, 1000);

        } catch (err: any) {
            console.error("Erro ao iniciar gravação:", err);
            setIsRecording(false);
            setErrorMessage(err.message || "Erro ao iniciar gravação.");
            setTimeout(() => setErrorMessage(null), 4000);
        }
    };

    const stopRecording = async () => {
        stopTimer();
        setIsRecording(false);
        setIsProcessing(true);
        triggerHaptic();

        // 1. Finaliza Web Speech e obtém o texto capturado localmente
        const fallbackText = speechEngineRef.current?.stop() || liveTextRef.current || "";
        speechEngineRef.current = null;

        // Atualiza imediatamente com o texto capturado até agora
        if (fallbackText) {
            onTranscript(buildOutput(fallbackText));
        }

        // 2. Finaliza MediaRecorder e obtém o blob de áudio
        let audioBlob: Blob | null = null;
        if (audioControllerRef.current) {
            audioBlob = await audioControllerRef.current.stop();
            audioControllerRef.current = null;
        }

        // 3. Se temos áudio, tenta aprimorar com AssemblyAI via Cloudflare R2
        if (audioBlob && audioBlob.size >= 400) {
            try {
                const result = await transcribeVoiceRecording({
                    audioBlob,
                    fallbackText,
                    maxWaitMs: 6000,
                });

                if (result.text && result.text !== fallbackText) {
                    onTranscript(buildOutput(result.text));
                }
            } catch {
                // Silencioso: já temos o fallbackText entregue
            }
        }

        setIsProcessing(false);
    };

    if (isProcessing) {
        return (
            <div className={cn("inline-flex items-center gap-1.5 rounded-lg bg-gold/10 border border-gold/30 px-2 py-1 text-gold text-xs", className)}>
                <Loader2 className="h-3 w-3 animate-spin text-gold" />
                <span className="text-[0.68rem] font-sans">Aprimorando...</span>
            </div>
        );
    }

    if (isRecording) {
        return (
            <div className={cn("inline-flex items-center gap-1.5 rounded-lg bg-gold/15 border border-gold/40 px-2 py-1 text-gold text-xs", className)}>
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
                </span>
                <span className="font-mono text-[0.7rem] font-semibold">{recordingTime}s</span>
                <button
                    type="button"
                    onClick={stopRecording}
                    title="Parar ditado e salvar"
                    className="ml-1 inline-flex items-center gap-1 rounded bg-gold text-black font-semibold px-1.5 py-0.5 text-[0.68rem] hover:bg-gold/90 transition-colors"
                >
                    <Square className="h-2.5 w-2.5 fill-current" />
                    <span>Concluir</span>
                </button>
            </div>
        );
    }

    return (
        <div className="relative inline-flex items-center">
            {errorMessage && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[0.65rem] px-2 py-0.5 rounded shadow whitespace-nowrap z-50 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {size === "icon" ? (
                <button
                    type="button"
                    onClick={startRecording}
                    title={label}
                    aria-label={label}
                    className={cn(
                        "p-1.5 rounded-md text-app-text-muted hover:text-gold hover:bg-gold/10 transition-colors",
                        className
                    )}
                >
                    <Mic className="h-3.5 w-3.5" />
                </button>
            ) : (
                <button
                    type="button"
                    onClick={startRecording}
                    className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-app-surface px-2.5 py-1 text-[0.75rem] font-medium text-app-text hover:text-gold hover:border-gold/40 transition-colors shadow-2xs",
                        className
                    )}
                >
                    <Mic className="h-3.5 w-3.5 text-gold" />
                    <span>{label}</span>
                </button>
            )}
        </div>
    );
}
