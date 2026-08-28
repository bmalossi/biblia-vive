// ─────────────────────────────────────────────────────────────────────────────
// VoiceRecordButton.tsx — Bíblia Vive
//
// Botão reutilizável de ditado por voz via Web Speech API nativa (pt-BR).
// Pode ser acoplado a qualquer campo de texto (textarea/input) ou usado com
// callback onTranscript. Oferece preview em tempo real, timer e cancelamento.
//
// Arquitetura robusta:
//  - startValueRef: congela o valor inicial do campo ao iniciar a gravação,
//    evitando duplicação de texto a cada renderização/interim result.
//  - isRecordingRef + auto-restart em onend: garante que pausas de fala (no-speech)
//    não encerrem a sessão antes de o usuário clicar em Concluir.
//  - Cleanup completo no unmount.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ensureMicrophonePermission } from "@/lib/microphonePermission";

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
    const [recordingTime, setRecordingTime] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);
    const accumulatedFinalRef = useRef<string>("");
    // Snapshot do texto do campo no exato momento em que o usuário clicou em Gravar
    const startValueRef = useRef<string>("");
    // Refs de controle de ciclo de vida
    const isRecordingRef = useRef<boolean>(false);
    const isManualStopRef = useRef<boolean>(false);
    const timerRef = useRef<number | null>(null);
    const restartTimeoutRef = useRef<number | null>(null);

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
        if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
            restartTimeoutRef.current = null;
        }
    };

    // Cleanup ao desmontar
    useEffect(() => {
        return () => {
            isRecordingRef.current = false;
            stopTimer();
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch { /* silencioso */ }
                recognitionRef.current = null;
            }
        };
    }, []);

    const buildOutput = useCallback((spokenText: string): string => {
        if (mode === "replace") return spokenText;
        const base = startValueRef.current ? startValueRef.current.trimEnd() + " " : "";
        return (base + spokenText).trim();
    }, [mode]);

    const setupRecognition = useCallback(() => {
        const SpeechRecognitionAPI =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (!SpeechRecognitionAPI) return null;

        const recognition = new SpeechRecognitionAPI();
        recognition.lang = "pt-BR";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
            let interim = "";
            let newlyFinalized = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const t = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    newlyFinalized += t + " ";
                } else {
                    interim = t;
                }
            }

            if (newlyFinalized) {
                accumulatedFinalRef.current += newlyFinalized;
            }

            // Preview em tempo real: base inicial + fala acumulada até agora + interim atual
            const liveSpoken = (accumulatedFinalRef.current + (interim ? interim : "")).trim();
            if (liveSpoken) {
                onTranscript(buildOutput(liveSpoken));
            }
        };

        recognition.onerror = (event: any) => {
            // Ignorar paradas manuais ou silêncios normais (no-speech)
            if (event.error === "aborted" || event.error === "no-speech") return;

            // Erro fatal real
            isRecordingRef.current = false;
            isManualStopRef.current = false;
            stopTimer();
            setIsRecording(false);
            recognitionRef.current = null;

            const errorMap: Record<string, string> = {
                "not-allowed": "Microfone não autorizado. Permita o acesso nas configurações do navegador.",
                "audio-capture": "Microfone não encontrado ou em uso por outro aplicativo.",
                "network": "Erro de conexão no reconhecimento de voz.",
                "service-not-allowed": "Serviço de voz não disponível.",
            };
            setErrorMessage(errorMap[event.error] ?? `Erro: ${event.error}`);
            setTimeout(() => setErrorMessage(null), 5000);
        };

        recognition.onend = () => {
            // Se a sessão ainda estiver ativa e o usuário NÃO clicou em Concluir,
            // significa que o Chrome pausou por silêncio. Reinicia sem interrupção.
            if (isRecordingRef.current && !isManualStopRef.current) {
                restartTimeoutRef.current = window.setTimeout(() => {
                    if (isRecordingRef.current && !isManualStopRef.current) {
                        try {
                            const nextRec = setupRecognition();
                            if (nextRec) {
                                nextRec.start();
                                recognitionRef.current = nextRec;
                            }
                        } catch {
                            // Se falhar ao reiniciar imediatamente, tenta novamente
                        }
                    }
                }, 50);
                return;
            }

            // Encerramento intencional (usuário clicou em Concluir)
            stopTimer();
            setIsRecording(false);
            recognitionRef.current = null;
            triggerHaptic();

            const finalSpoken = accumulatedFinalRef.current.trim();
            if (finalSpoken) {
                onTranscript(buildOutput(finalSpoken));
            }
        };

        return recognition;
    }, [buildOutput, onTranscript]);

    const startRecording = async () => {
        setErrorMessage(null);
        accumulatedFinalRef.current = "";
        // Congela o valor atual do campo antes de ditar
        startValueRef.current = currentValue || "";
        isManualStopRef.current = false;

        const SpeechRecognitionAPI =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (!SpeechRecognitionAPI) {
            setErrorMessage("Navegador sem suporte a gravação de voz. Use Chrome ou Edge.");
            setTimeout(() => setErrorMessage(null), 4000);
            return;
        }

        // Garante que o navegador pergunte/autorize o uso do microfone
        const permResult = await ensureMicrophonePermission();
        if (!permResult.ok) {
            setErrorMessage(permResult.error || "Microfone não autorizado.");
            setTimeout(() => setErrorMessage(null), 6000);
            return;
        }

        isRecordingRef.current = true;

        try {
            const recognition = setupRecognition();
            if (!recognition) return;

            recognition.start();
            recognitionRef.current = recognition;
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
            isRecordingRef.current = false;
            setIsRecording(false);
            setErrorMessage(err.message || "Erro ao iniciar gravação.");
            setTimeout(() => setErrorMessage(null), 4000);
        }
    };

    const stopRecording = () => {
        isManualStopRef.current = true;
        isRecordingRef.current = false;
        stopTimer();

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch {
                // Se .stop() falhar, entrega o texto diretamente
                recognitionRef.current = null;
                setIsRecording(false);
                const finalSpoken = accumulatedFinalRef.current.trim();
                if (finalSpoken) {
                    onTranscript(buildOutput(finalSpoken));
                }
            }
        } else {
            setIsRecording(false);
            const finalSpoken = accumulatedFinalRef.current.trim();
            if (finalSpoken) {
                onTranscript(buildOutput(finalSpoken));
            }
        }
    };

    // ── UI ───────────────────────────────────────────────────────────────────

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
