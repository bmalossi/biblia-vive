import React, { useState, useRef, useEffect, useMemo } from "react";
import { Mic, Square, Check, RefreshCw, Edit3, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createNoteStore, MemorialCategory, MemorialEntry, MemorialMetadata } from "@/lib/noteStore";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import MemorialEntryModal from "./MemorialEntryModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ensureMicrophonePermission } from "@/lib/microphonePermission";
import { startAudioCapture, AudioCaptureController, transcribeVoiceRecording } from "@/lib/audioTranscription";
import { createSpeechRecognitionEngine, SpeechEngineController, isSpeechRecognitionSupported } from "@/lib/speechRecognitionEngine";

const MAX_RECORDING_SECONDS = 120; // 2 minutos máximo
const SUCCESS_HOLD_MS = 1800;
const HAPTIC_PULSE_MS = 35;

export default function QuickVoiceMemorial() {
    const { user } = useAuth();
    const store = useMemo(() => createNoteStore(user?.id ?? null), [user]);

    const [category, setCategory] = useState<MemorialCategory>("reflection");
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSealing, setIsSealing] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [transcribedText, setTranscribedText] = useState<string | null>(null);
    const [livePreviewText, setLivePreviewText] = useState<string>("");
    const [savedEntry, setSavedEntry] = useState<MemorialEntry | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showMobileTooltip, setShowMobileTooltip] = useState(false);
    const [processingStep, setProcessingStep] = useState<string>("Guardando no Memorial...");

    // Refs de controle de captura e reconhecimento
    const audioControllerRef = useRef<AudioCaptureController | null>(null);
    const speechEngineRef = useRef<SpeechEngineController | null>(null);
    const timerRef = useRef<number | null>(null);
    const categoryRef = useRef<MemorialCategory>(category);

    useEffect(() => {
        categoryRef.current = category;
    }, [category]);

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

    // Limpar recursos ao desmontar
    useEffect(() => {
        return () => {
            stopTimer();
            audioControllerRef.current?.cancel();
            speechEngineRef.current?.cancel();
        };
    }, []);

    // ── Salvar texto transcrito no Memorial ──────────────────────────────────
    const handleSaveText = async (text: string) => {
        if (!text.trim()) {
            setErrorMessage("Nenhuma fala foi detectada. Tente falar novamente.");
            return;
        }

        try {
            const cat = categoryRef.current;
            const now = new Date();
            const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
            const dateStr = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

            const categoryLabels: Record<MemorialCategory, string> = {
                reflection: "Reflexão por Voz",
                prayer: "Oração por Voz",
                testimony: "Testemunho por Voz",
                fasting: "Propósito por Voz"
            };

            const autoTitle = `${categoryLabels[cat]} (${dateStr} às ${timeStr})`;

            const metadataPayload: MemorialMetadata = {};
            if (cat === "reflection") {
                metadataPayload.soap = { observation: text };
            } else if (cat === "prayer") {
                metadataPayload.motivo = text;
            } else if (cat === "testimony") {
                metadataPayload.oQueAconteceu = text;
            } else if (cat === "fasting") {
                metadataPayload.objetivo = text;
            }

            const entryToSave = {
                type: cat,
                title: autoTitle,
                content: text,
                bookId: "geral",
                bookName: "Geral",
                chapter: 0,
                verse: null as null,
                version: "",
                tags: ["registro-por-voz"],
                metadata: metadataPayload,
            };

            await store.save(entryToSave);

            const now2 = new Date();
            const localEntry: MemorialEntry = {
                ...entryToSave,
                id: crypto.randomUUID(),
                createdAt: now2.toISOString(),
                updatedAt: now2.toISOString(),
            };

            setTranscribedText(text);
            setSavedEntry(localEntry);
            window.dispatchEvent(new CustomEvent("bv-memorial-updated"));

            setIsProcessing(false);
            setIsSealing(true);
            triggerHaptic();

            setTimeout(() => {
                setIsSealing(false);
                toast.success("Gravado e salvo com sucesso no seu Memorial!", {
                    description: text.length > 70 ? `${text.slice(0, 70)}...` : text,
                    action: {
                        label: "Editar",
                        onClick: () => setIsEditModalOpen(true),
                    },
                    duration: 6000,
                });
            }, SUCCESS_HOLD_MS);

        } catch (err: any) {
            console.error("Erro ao salvar no Memorial:", err);
            setErrorMessage(err.message || "Ocorreu um erro ao salvar no Memorial.");
            toast.error(err.message || "Erro ao salvar.");
            setIsProcessing(false);
        }
    };

    // ── Iniciar gravação (Captura HD + Preview ao vivo) ───────────────────────
    const startRecording = async () => {
        setErrorMessage(null);
        setTranscribedText(null);
        setSavedEntry(null);
        setLivePreviewText("");

        // Garante permissão explícita no navegador
        const permResult = await ensureMicrophonePermission();
        if (!permResult.ok) {
            setErrorMessage(permResult.error || "Microfone não autorizado.");
            return;
        }

        try {
            // 1. Inicia MediaRecorder com cancelamento de ruído/eco ativo
            const { controller } = await startAudioCapture();
            audioControllerRef.current = controller;

            // 2. Inicia Web Speech determinístico para preview ao vivo (sem duplicação)
            if (isSpeechRecognitionSupported()) {
                const engine = createSpeechRecognitionEngine({
                    onLiveUpdate: (state) => {
                        setLivePreviewText(state.fullText);
                    },
                    onError: (errText) => {
                        console.warn("[Speech Engine Warning]:", errText);
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
            console.error("Erro ao iniciar gravação de voz:", err);
            setIsRecording(false);
            setErrorMessage(err.message || "Não foi possível iniciar o microfone.");
        }
    };

    // ── Parar gravação (IA AssemblyAI via Cloudflare R2 com Fallback) ─────────
    const stopRecording = async () => {
        stopTimer();
        setIsRecording(false);
        setIsProcessing(true);
        setProcessingStep("Refinando áudio com IA...");

        // 1. Finaliza reconhecimento Web Speech e obtém o texto de fallback
        const fallbackText = speechEngineRef.current?.stop() || livePreviewText || "";
        speechEngineRef.current = null;

        // 2. Finaliza MediaRecorder e obtém o arquivo de áudio binário
        let audioBlob: Blob | null = null;
        if (audioControllerRef.current) {
            audioBlob = await audioControllerRef.current.stop();
            audioControllerRef.current = null;
        }

        if (!audioBlob && !fallbackText.trim()) {
            setIsProcessing(false);
            setErrorMessage("Nenhuma fala foi detectada. Tente falar novamente.");
            return;
        }

        // 3. Executa transcrição via Cloudflare R2 + AssemblyAI
        const result = await transcribeVoiceRecording({
            audioBlob,
            fallbackText,
            maxWaitMs: 20000,
            onStatusChange: (status) => {
                if (status === "uploading") {
                    setProcessingStep("Enviando áudio...");
                } else if (status === "transcribing") {
                    setProcessingStep("Transcrevendo com IA...");
                } else if (status === "completed") {
                    setProcessingStep("Guardando no Memorial...");
                } else {
                    setProcessingStep("Guardando no Memorial...");
                }
            },
        });

        const finalText = result.text.trim();
        if (finalText) {
            await handleSaveText(finalText);
        } else {
            setIsProcessing(false);
            setErrorMessage("Nenhuma fala foi detectada. Tente falar novamente.");
        }
    };

    // ── Cancelar gravação (descarta) ─────────────────────────────────────────
    const cancelRecording = () => {
        stopTimer();
        audioControllerRef.current?.cancel();
        audioControllerRef.current = null;
        speechEngineRef.current?.cancel();
        speechEngineRef.current = null;

        setIsRecording(false);
        setIsProcessing(false);
        setLivePreviewText("");
        setRecordingTime(0);
    };

    const formatSeconds = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const tooltipText =
        "Dirigindo ou em movimento? Toque para falar e guarde sua oração, testemunho ou reflexão sem precisar digitar.";

    return (
        <section className="mb-6 pt-1">
            {/* Linha Principal: Botão Gravar + Ícone '!' ao lado direito */}
            {!isRecording && !isProcessing && !transcribedText && (
                <div className="flex items-center justify-center gap-2">
                    {/* Botão Gravar sua Reflexão por Voz */}
                    <button
                        type="button"
                        onClick={startRecording}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-gold/90 transition-all shadow-2xs active:scale-[0.98]"
                    >
                        <Mic className="h-3.5 w-3.5" />
                        <span>Gravar Reflexão com Voz</span>
                    </button>

                    {/* Ícone '!' de Informações ao lado direito do botão */}
                    <TooltipProvider delayDuration={150}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => setShowMobileTooltip(prev => !prev)}
                                    aria-label="Informações sobre a gravação por voz"
                                    className="inline-flex h-4 w-4 min-w-[16px] min-h-[16px] max-w-[16px] max-h-[16px] aspect-square shrink-0 items-center justify-center rounded-full border border-gold/60 text-[10px] font-mono font-bold leading-none text-gold/90 hover:border-gold hover:text-gold transition-colors p-0 select-none"
                                >
                                    !
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs text-xs font-sans">
                                {tooltipText}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            )}

            {/* Tooltip inline no mobile */}
            {showMobileTooltip && (
                <div className="mt-2 sm:hidden rounded-lg bg-surface border border-border/70 p-2.5 text-xs text-app-text-muted">
                    <p>{tooltipText}</p>
                </div>
            )}

            {/* Mensagem de Erro */}
            {errorMessage && (
                <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-red-600 px-3.5 py-2.5 text-xs font-medium text-white shadow-sm">
                    <AlertCircle className="h-4 w-4 shrink-0 text-white" />
                    <span className="flex-1 leading-snug text-white">{errorMessage}</span>
                </div>
            )}

            {/* Estado 1: GRAVANDO */}
            {isRecording && (
                <div className="mt-3 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-gold/60 bg-surface/95 px-4 py-3.5 animate-pulse-aura transition-all">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <span className="relative flex h-3.5 w-3.5 shrink-0">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/80 opacity-75"></span>
                                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-gold"></span>
                            </span>
                            <div>
                                <p className="font-serif text-sm font-medium text-app-text">
                                    Ouvindo com reverência...
                                </p>
                                <span className="font-mono text-[0.72rem] text-gold/90">
                                    {formatSeconds(recordingTime)} / {formatSeconds(MAX_RECORDING_SECONDS)}
                                </span>
                            </div>
                        </div>

                        {/* Preview em tempo real da transcrição (determinístico e sem duplicações) */}
                        {livePreviewText && (
                            <p className="mt-1.5 ml-6 font-serif text-xs italic leading-relaxed text-app-text-muted line-clamp-2">
                                {livePreviewText}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={cancelRecording}
                            className="rounded-md px-2.5 py-1 text-xs text-app-text-muted hover:bg-accent transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={stopRecording}
                            className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-gold/90 shadow-xs transition-all active:scale-[0.98]"
                        >
                            <Square className="h-3 w-3 fill-current" />
                            Concluir e Guardar
                        </button>
                    </div>
                </div>
            )}

            {/* Estado 2: GUARDANDO / PROCESSANDO COM IA */}
            {isProcessing && (
                <div className="mt-3 relative overflow-hidden flex items-center justify-center gap-3 rounded-xl border border-gold/40 bg-surface/95 p-4.5 shadow-sm">
                    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
                        <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-gold/25 to-transparent skew-x-12 animate-sweep-infinite" />
                    </div>
                    <div className="relative flex items-center gap-2.5 z-10">
                        <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin shrink-0" />
                        <p className="font-serif text-xs font-medium text-app-text animate-shimmer-pulse">
                            {processingStep}
                        </p>
                    </div>
                </div>
            )}

            {/* Estado 3: SELAMENTO */}
            {isSealing && (
                <div className="mt-3 relative overflow-hidden flex items-center justify-center gap-2.5 rounded-xl border border-emerald-500 bg-emerald-600/90 text-white p-4.5 shadow-[0_0_20px_rgba(16,185,129,0.35)] animate-scale-in">
                    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
                        <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 animate-sweep" />
                    </div>
                    <div className="relative flex items-center gap-2 z-10">
                        <Check className="w-4 h-4 text-white shrink-0" />
                        <span className="font-sans font-semibold text-xs tracking-wide">
                            Guardado no Coração
                        </span>
                    </div>
                </div>
            )}

            {/* Estado 4: TRANSCRIÇÃO REVELADA */}
            {transcribedText && savedEntry && !isRecording && !isProcessing && !isSealing && (
                <div className="mt-3 flex flex-col gap-2.5 rounded-xl border border-gold/40 bg-surface/95 p-4 animate-scale-in">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <Check className="h-3.5 w-3.5" />
                            <span>Salvo no Memorial</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setTranscribedText(null);
                                setSavedEntry(null);
                            }}
                            className="text-xs text-app-text-muted hover:text-app-text"
                        >
                            Fechar
                        </button>
                    </div>

                    <p className="rounded-lg border border-border/50 bg-background/80 p-3 font-serif text-xs italic leading-relaxed text-app-text">
                        "{transcribedText}"
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                        <button
                            type="button"
                            onClick={startRecording}
                            className="inline-flex items-center gap-1 text-xs text-app-text-muted hover:text-gold transition-colors"
                        >
                            <RefreshCw className="h-3 w-3" />
                            Gravar outro
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(true)}
                                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-app-text hover:bg-accent transition-colors"
                            >
                                <Edit3 className="h-3 w-3 text-gold" />
                                Editar
                            </button>
                            <Link
                                to="/memorial"
                                className="inline-flex items-center gap-1 rounded-md bg-gold px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-gold/90 transition-colors"
                            >
                                Ver no Memorial
                                <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Edição */}
            {savedEntry && (
                <MemorialEntryModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    category={savedEntry.type}
                    bookId={savedEntry.bookId}
                    bookName={savedEntry.bookName}
                    chapter={savedEntry.chapter}
                    version={savedEntry.version}
                    existingEntry={savedEntry}
                    onSave={async (updatedData) => {
                        await store.save({ ...updatedData, id: savedEntry.id });
                        setSavedEntry({ ...savedEntry, ...updatedData });
                        setTranscribedText(updatedData.content);
                        setIsEditModalOpen(false);
                        toast.success("Registro atualizado com sucesso!");
                    }}
                    onDelete={async (id) => {
                        await store.delete(id);
                        setTranscribedText(null);
                        setSavedEntry(null);
                        setIsEditModalOpen(false);
                        toast.success("Registro excluído.");
                    }}
                />
            )}

            <div className="my-6 border-t border-border" />
        </section>
    );
}
