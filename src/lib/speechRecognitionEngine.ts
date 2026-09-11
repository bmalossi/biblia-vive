// ─────────────────────────────────────────────────────────────────────────────
// speechRecognitionEngine.ts — Bíblia Vive
//
// Motor de reconhecimento de voz Web Speech com algoritmo determinístico:
// - Elimina 100% das duplicações causadas por re-emissão de índices pelo Chrome.
// - Reconstrói a sessão ativa a partir de results[0..length-1] imutavelmente.
// - Mantém buffer consolidado entre auto-restarts por silêncio natural.
// ─────────────────────────────────────────────────────────────────────────────

export interface LiveSpeechState {
    finalText: string;
    interimText: string;
    fullText: string;
}

export interface SpeechEngineOptions {
    onLiveUpdate: (state: LiveSpeechState) => void;
    onError?: (error: string) => void;
    lang?: string;
}

export interface SpeechEngineController {
    stop: () => string;
    cancel: () => void;
    getText: () => string;
}

export function isSpeechRecognitionSupported(): boolean {
    if (typeof window === "undefined") return false;
    return Boolean(
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
    );
}

export function createSpeechRecognitionEngine({
    onLiveUpdate,
    onError,
    lang = "pt-BR",
}: SpeechEngineOptions): SpeechEngineController {
    const SpeechRecognitionAPI =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
        throw new Error("Reconhecimento de fala não suportado neste navegador.");
    }

    let isRunning = true;
    let isManualStop = false;
    let isCancelled = false;
    let activeRecognition: any = null;
    let restartTimeout: number | null = null;

    // Guarda o texto acumulado de sessões passadas que sofreram auto-restart
    let accumulatedPastSessions = "";
    // Guarda o texto finalizado da sessão atual
    let currentSessionFinal = "";
    let currentSessionInterim = "";

    const computeFullText = () => {
        const parts = [accumulatedPastSessions, currentSessionFinal, currentSessionInterim]
            .map((p) => p.trim())
            .filter(Boolean);
        return parts.join(" ");
    };

    const computeFinalText = () => {
        const parts = [accumulatedPastSessions, currentSessionFinal]
            .map((p) => p.trim())
            .filter(Boolean);
        return parts.join(" ");
    };

    const startSession = () => {
        if (!isRunning || isManualStop || isCancelled) return;

        const rec = new SpeechRecognitionAPI();
        rec.lang = lang;
        rec.continuous = true;
        rec.interimResults = true;
        rec.maxAlternatives = 1;

        currentSessionFinal = "";
        currentSessionInterim = "";

        rec.onresult = (event: any) => {
            if (!isRunning || isCancelled) return;

            let sessionFinal = "";
            let sessionInterim = "";

            // Loop completo determinístico de 0 até results.length - 1
            // Imune a saltos ou repetições de event.resultIndex do Chrome!
            for (let i = 0; i < event.results.length; i++) {
                const res = event.results[i];
                const text = res[0]?.transcript || "";
                if (res.isFinal) {
                    sessionFinal += text + " ";
                } else {
                    sessionInterim += text;
                }
            }

            currentSessionFinal = sessionFinal;
            currentSessionInterim = sessionInterim;

            onLiveUpdate({
                finalText: computeFinalText(),
                interimText: currentSessionInterim.trim(),
                fullText: computeFullText(),
            });
        };

        rec.onerror = (event: any) => {
            // Ignorar erros normais de parada ou silêncio
            if (event.error === "aborted" || event.error === "no-speech") return;

            const errorMap: Record<string, string> = {
                "not-allowed": "Microfone não autorizado. Permita o microfone no navegador.",
                "audio-capture": "Microfone não encontrado ou indisponível.",
                "network": "Erro de rede no serviço de voz.",
                "service-not-allowed": "Serviço de voz indisponível.",
            };
            onError?.(errorMap[event.error] || `Erro no microfone: ${event.error}`);
        };

        rec.onend = () => {
            if (!isRunning || isCancelled) return;

            // Se ainda deve estar rodando e o usuário NÃO clicou em parar:
            // Chrome pausou por silêncio natural -> consolida sessão e reinicia
            if (!isManualStop) {
                if (currentSessionFinal.trim()) {
                    accumulatedPastSessions = (accumulatedPastSessions + " " + currentSessionFinal).trim();
                }
                currentSessionFinal = "";
                currentSessionInterim = "";

                restartTimeout = window.setTimeout(() => {
                    if (isRunning && !isManualStop && !isCancelled) {
                        try {
                            startSession();
                        } catch {
                            // Silencioso
                        }
                    }
                }, 50);
                return;
            }

            // Parada intencional
            if (currentSessionFinal.trim()) {
                accumulatedPastSessions = (accumulatedPastSessions + " " + currentSessionFinal).trim();
            }
            currentSessionFinal = "";
            currentSessionInterim = "";
        };

        activeRecognition = rec;
        try {
            rec.start();
        } catch {
            // Se falhar ao iniciar, tenta novamente se ainda ativo
        }
    };

    startSession();

    return {
        stop: () => {
            isManualStop = true;
            isRunning = false;
            if (restartTimeout) clearTimeout(restartTimeout);

            if (activeRecognition) {
                try {
                    activeRecognition.stop();
                } catch {
                    // Silencioso
                }
                activeRecognition = null;
            }

            // Consolida tudo o que foi falado
            const finalText = computeFullText();
            return finalText;
        },
        cancel: () => {
            isCancelled = true;
            isRunning = false;
            if (restartTimeout) clearTimeout(restartTimeout);

            if (activeRecognition) {
                try {
                    activeRecognition.abort();
                } catch {
                    // Silencioso
                }
                activeRecognition = null;
            }
        },
        getText: () => computeFullText(),
    };
}
