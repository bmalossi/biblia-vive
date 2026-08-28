import React, { useState, useRef, useEffect, useMemo } from "react";
import { Mic, Square, Loader2, CheckCircle2, RefreshCw, Edit3, ArrowRight, AlertCircle, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createNoteStore, MemorialCategory, MemorialEntry } from "@/lib/noteStore";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import MemorialEntryModal from "./MemorialEntryModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const MAX_RECORDING_SECONDS = 120; // 2 minutos máximo

export default function QuickVoiceMemorial() {
    const { user } = useAuth();
    const store = useMemo(() => createNoteStore(user?.id ?? null), [user]);

    const [category, setCategory] = useState<MemorialCategory>("reflection");
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [transcribedText, setTranscribedText] = useState<string | null>(null);
    const [savedEntry, setSavedEntry] = useState<MemorialEntry | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showMobileTooltip, setShowMobileTooltip] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const cleanupAudioStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
                track.enabled = false;
                track.stop();
            });
            streamRef.current = null;
        }
        if (mediaRecorderRef.current) {
            try {
                if (mediaRecorderRef.current.stream) {
                    mediaRecorderRef.current.stream.getTracks().forEach((track) => {
                        track.enabled = false;
                        track.stop();
                    });
                }
            } catch {
                // ignorar se stream já estiver encerrado
            }
            mediaRecorderRef.current = null;
        }
    };

    // Limpar recursos ao desmontar
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            cleanupAudioStream();
        };
    }, []);

    const startRecording = async () => {
        setErrorMessage(null);
        setTranscribedText(null);
        setSavedEntry(null);
        audioChunksRef.current = [];

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Seu navegador não suporta gravação de áudio direto.");
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            let mimeType = "audio/webm;codecs=opus";
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                if (MediaRecorder.isTypeSupported("audio/webm")) {
                    mimeType = "audio/webm";
                } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
                    mimeType = "audio/mp4";
                } else {
                    mimeType = "";
                }
            }

            const mediaRecorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);

            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                handleAudioReady();
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

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
            console.error("Erro ao acessar microfone:", err);
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                setErrorMessage("Permissão de microfone negada. Permita o microfone no navegador para gravar.");
            } else {
                setErrorMessage(err.message || "Não foi possível iniciar o microfone.");
            }
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }

        cleanupAudioStream();
        setIsRecording(false);
    };

    const cancelRecording = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.onstop = null;
            mediaRecorderRef.current.stop();
        }

        cleanupAudioStream();
        audioChunksRef.current = [];
        setIsRecording(false);
        setRecordingTime(0);
    };

    const handleAudioReady = async () => {
        if (audioChunksRef.current.length === 0) return;

        const audioBlob = new Blob(audioChunksRef.current, {
            type: mediaRecorderRef.current?.mimeType || "audio/webm"
        });

        if (audioBlob.size < 500) {
            toast.error("Áudio muito curto ou inaudível. Tente novamente.");
            return;
        }

        setIsProcessing(true);

        try {
            const response = await fetch("/api/stt", {
                method: "POST",
                headers: {
                    "Content-Type": audioBlob.type || "audio/webm"
                },
                body: audioBlob,
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `Falha na transcrição (${response.status})`);
            }

            const data = await response.json();
            const text = data.text?.trim();

            if (!text) {
                throw new Error("Nenhuma fala detectada no áudio gravado.");
            }

            setTranscribedText(text);

            const now = new Date();
            const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
            const dateStr = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

            const categoryLabels: Record<MemorialCategory, string> = {
                reflection: "Reflexão por Voz",
                prayer: "Oração por Voz",
                testimony: "Testemunho por Voz",
                fasting: "Propósito por Voz"
            };

            const autoTitle = `${categoryLabels[category]} (${dateStr} às ${timeStr})`;

            // Montar metadata estruturado correspondente à categoria
            const metadataPayload: MemorialMetadata = {};
            if (category === "reflection") {
                metadataPayload.soap = { observation: text };
            } else if (category === "prayer") {
                metadataPayload.motivo = text;
            } else if (category === "testimony") {
                metadataPayload.oQueAconteceu = text;
            } else if (category === "fasting") {
                metadataPayload.objetivo = text;
            }

            // Dados a salvar na store — sem id/createdAt/updatedAt para forçar INSERT
            const entryToSave = {
                type: category,
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

            // Para o estado local (modal de edição), montamos o objeto completo
            const now2 = new Date();
            const localEntry: MemorialEntry = {
                ...entryToSave,
                id: crypto.randomUUID(), // placeholder — o id real fica no Supabase
                createdAt: now2.toISOString(),
                updatedAt: now2.toISOString(),
            };
            setSavedEntry(localEntry);

            window.dispatchEvent(new CustomEvent("bv-memorial-updated"));

            toast.success("Gravado e salvo com sucesso no seu Memorial!", {
                description: text.length > 70 ? `${text.slice(0, 70)}...` : text,
                action: {
                    label: "Editar",
                    onClick: () => setIsEditModalOpen(true),
                },
                duration: 6000,
            });

        } catch (err: any) {
            console.error("Erro na transcrição:", err);
            setErrorMessage(err.message || "Ocorreu um erro ao transcrever o áudio.");
            toast.error(err.message || "Erro ao transcrever.");
        } finally {
            setIsProcessing(false);
            audioChunksRef.current = [];
        }
    };

    const formatSeconds = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const tooltipText = "Dirigindo ou em movimento? Toque para falar e guarde sua oração, testemunho ou reflexão sem precisar digitar.";

    return (
        <section className="mb-6 pt-1">
            {/* Linha Principal: No Desktop os botões ficam no CENTRO da página na mesma altura horizontal do título */}
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center min-h-[36px]">
                {/* Lado Esquerdo: Título idêntico ao dos livros + Ícone '!' */}
                <div className="flex items-center gap-2 sm:absolute sm:left-0">
                    <h2 className="font-sans text-[0.65rem] uppercase tracking-[0.15em] text-gold">
                        Gravação por Voz
                    </h2>

                    <TooltipProvider delayDuration={150}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => setShowMobileTooltip(prev => !prev)}
                                    aria-label="Informações sobre a gravação por voz"
                                    className="inline-flex h-3.5 w-3.5 min-w-[14px] min-h-[14px] max-w-[14px] max-h-[14px] aspect-square shrink-0 items-center justify-center rounded-full border border-gold/60 text-[9px] font-mono font-bold leading-none text-gold/90 hover:border-gold hover:text-gold transition-colors p-0 select-none"
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

                {/* Seletor de Categoria + Botão de Gravar (Exatamente no CENTRO da página no Desktop e Mobile) */}
                {!isRecording && !isProcessing && !transcribedText && (
                    <div className="flex flex-wrap items-center justify-center gap-2.5 w-full sm:w-auto">
                        {/* Pílulas de Categoria */}
                        <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-surface/80 p-0.5">
                            {(
                                [
                                    { id: "reflection", label: "Reflexão" },
                                    { id: "prayer", label: "Oração" },
                                    { id: "testimony", label: "Testemunho" },
                                ] as const
                            ).map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setCategory(item.id)}
                                    className={`rounded-full px-2.5 py-1 text-[0.72rem] font-sans transition-colors ${
                                        category === item.id
                                            ? "bg-gold text-primary-foreground font-medium shadow-2xs"
                                            : "text-app-text-muted hover:text-app-text"
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {/* Botão Gravar por Voz */}
                        <button
                            type="button"
                            onClick={startRecording}
                            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gold px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-gold/90 transition-all shadow-2xs active:scale-[0.98]"
                        >
                            <Mic className="h-3.5 w-3.5" />
                            <span>Gravar por Voz</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Tooltip inline no mobile ao tocar no '!' */}
            {showMobileTooltip && (
                <div className="mt-2 sm:hidden rounded-lg bg-surface border border-border/70 p-2.5 text-xs text-app-text-muted">
                    <p>{tooltipText}</p>
                </div>
            )}

            {/* Mensagem de Erro com cor vermelha sólida e letras brancas */}
            {errorMessage && (
                <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-red-600 px-3.5 py-2.5 text-xs font-medium text-white shadow-sm">
                    <AlertCircle className="h-4 w-4 shrink-0 text-white" />
                    <span className="flex-1 leading-snug text-white">{errorMessage}</span>
                </div>
            )}

            {/* Estado: GRAVANDO */}
            {isRecording && (
                <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-gold/40 bg-surface/90 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                        <span className="relative flex h-3.5 w-3.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-red-500"></span>
                        </span>
                        <p className="font-serif text-sm text-app-text">
                            Ouvindo você...
                        </p>
                        <span className="font-mono text-xs text-gold">
                            {formatSeconds(recordingTime)} / {formatSeconds(MAX_RECORDING_SECONDS)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
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
                            className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-gold/90 shadow-2xs transition-all"
                        >
                            <Square className="h-3 w-3 fill-current" />
                            Concluir e Salvar
                        </button>
                    </div>
                </div>
            )}

            {/* Estado: TRANSCREVENDO */}
            {isProcessing && (
                <div className="mt-3 flex items-center justify-center gap-2.5 rounded-xl border border-gold/30 bg-surface/90 p-4">
                    <Loader2 className="h-4 w-4 animate-spin text-gold" />
                    <p className="font-serif text-xs text-app-text">
                        Transcrevendo e guardando no Memorial...
                    </p>
                </div>
            )}

            {/* Estado: TRANSCRIÇÃO CONCLUÍDA */}
            {transcribedText && savedEntry && !isRecording && !isProcessing && (
                <div className="mt-3 flex flex-col gap-2.5 rounded-xl border border-gold/40 bg-surface/95 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
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
