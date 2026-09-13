// ─────────────────────────────────────────────────────────────────────────────
// audioTranscription.ts — Bíblia Vive
//
// Módulo de captura de áudio em alta fidelidade e transcrição híbrida:
// 1. Áudio capturado via MediaRecorder com cancelamento de ruído/eco ativo.
// 2. Upload direto para Cloudflare R2 via presigned PUT URL (sem passar pela Vercel).
// 3. Submissão do áudio para AssemblyAI (Universal-2 em pt-BR com pontuação).
// 4. Polling rápido com timeout estrito (máx 7s).
// 5. Fallback automático e transparente para o texto do Web Speech caso haja
//    qualquer falha de rede, timeout ou indisponibilidade da API.
// ─────────────────────────────────────────────────────────────────────────────

export interface AudioCaptureController {
    stop: () => Promise<Blob | null>;
    cancel: () => void;
    getStream: () => MediaStream | null;
}

/**
 * Inicia a gravação de áudio com as melhores configurações de hardware possíveis
 * para máxima nitidez da fala.
 */
export async function startAudioCapture(): Promise<{
    controller: AudioCaptureController;
    stream: MediaStream;
}> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Gravação de áudio não suportada pelo navegador.");
    }

    // Constraints para alta clareza de voz humana
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: 48000,
        },
    });

    let mimeType = "audio/webm;codecs=opus";
    if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
            mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
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

    const chunks: Blob[] = [];
    let isCancelled = false;

    mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
            chunks.push(e.data);
        }
    };

    mediaRecorder.start(250); // Coleta fatias a cada 250ms

    const cleanup = () => {
        try {
            stream.getTracks().forEach((track) => {
                try {
                    track.enabled = false;
                    track.stop();
                } catch {
                    // Silencioso
                }
            });
        } catch {
            // Silencioso
        }
    };

    const controller: AudioCaptureController = {
        stop: () => {
            return new Promise<Blob | null>((resolve) => {
                let resolved = false;

                const finish = (blob: Blob | null) => {
                    if (resolved) return;
                    resolved = true;
                    cleanup();
                    resolve(blob);
                };

                if (isCancelled || mediaRecorder.state === "inactive") {
                    finish(null);
                    return;
                }

                mediaRecorder.onstop = () => {
                    if (isCancelled || chunks.length === 0) {
                        finish(null);
                        return;
                    }
                    const finalBlob = new Blob(chunks, {
                        type: mediaRecorder.mimeType || "audio/webm",
                    });
                    finish(finalBlob);
                };

                try {
                    if (mediaRecorder.state === "recording") {
                        try {
                            mediaRecorder.requestData();
                        } catch {
                            // Silencioso
                        }
                    }
                    mediaRecorder.stop();
                } catch {
                    finish(null);
                    return;
                }

                // Libera imediatamente todos os canais de áudio do microfone no sistema operacional
                cleanup();

                // Failsafe: se onstop do navegador demorar mais de 500ms
                setTimeout(() => {
                    if (!resolved) {
                        const finalBlob = chunks.length > 0
                            ? new Blob(chunks, { type: mediaRecorder.mimeType || "audio/webm" })
                            : null;
                        finish(finalBlob);
                    }
                }, 500);
            });
        },
        cancel: () => {
            isCancelled = true;
            try {
                if (mediaRecorder.state !== "inactive") {
                    mediaRecorder.stop();
                }
            } catch {
                // Silencioso
            }
            cleanup();
        },
        getStream: () => stream,
    };

    return { controller, stream };
}

import { isWebSpeechFallbackDisabled } from "./voiceSettings";

export interface TranscribeOptions {
    audioBlob: Blob | null;
    fallbackText: string;
    maxWaitMs?: number;
    disableFallback?: boolean;
    onStatusChange?: (status: "uploading" | "transcribing" | "completed" | "fallback") => void;
}

export interface TranscribeResult {
    text: string;
    source: "assemblyai" | "webspeech";
}

/**
 * Executa a transcrição do áudio via Cloudflare R2 + AssemblyAI.
 * Se o upload para o R2 falhar (por exemplo, erro de credencial ou CORS),
 * tenta automaticamente envio binário direto para a AssemblyAI via /api/stt.
 * Se a IA falhar e o fallback do Web Speech estiver desativado no Admin,
 * lança erro explícito para diagnóstico imediato.
 */
export async function transcribeVoiceRecording({
    audioBlob,
    fallbackText,
    maxWaitMs = 20000,
    disableFallback,
    onStatusChange,
}: TranscribeOptions): Promise<TranscribeResult> {
    const cleanFallback = fallbackText.trim();
    const shouldDisableFallback = typeof disableFallback === "boolean"
        ? disableFallback
        : isWebSpeechFallbackDisabled();

    // Se não há áudio ou é minúsculo
    if (!audioBlob || audioBlob.size < 400) {
        if (shouldDisableFallback) {
            throw new Error("Nenhum áudio foi capturado pelo gravador. Verifique as permissões de microfone.");
        }
        onStatusChange?.("fallback");
        return { text: cleanFallback, source: "webspeech" };
    }

    try {
        onStatusChange?.("uploading");

        let transcriptId: string | null = null;

        // 1. Tentar caminho primário: Presigned PUT URL para o Cloudflare R2
        let usedR2 = false;
        try {
            const urlRes = await fetch("/api/stt?action=upload-url");
            if (urlRes.ok) {
                const { uploadUrl, audioUrl } = await urlRes.json();
                if (uploadUrl && audioUrl) {
                    const uploadRes = await fetch(uploadUrl, {
                        method: "PUT",
                        headers: {
                            "Content-Type": audioBlob.type || "audio/webm",
                        },
                        body: audioBlob,
                    });

                    if (uploadRes.ok) {
                        usedR2 = true;
                        onStatusChange?.("transcribing");

                        // Submeter URL do R2 para AssemblyAI
                        const submitRes = await fetch("/api/stt", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ audioUrl }),
                        });

                        if (submitRes.ok) {
                            const submitData = await submitRes.json();
                            transcriptId = submitData.id || null;
                        } else {
                            const errData = await submitRes.json().catch(() => ({}));
                            console.warn("[STT R2 Submit Warning]", errData?.error);
                        }
                    } else {
                        console.warn(`[STT R2 PUT Warning]: status ${uploadRes.status}`);
                    }
                }
            }
        } catch (r2Err) {
            console.warn("[STT R2 Path Failed, fallback to direct upload]:", r2Err);
        }

        // 2. Se o caminho R2 falhou, usar o caminho direto via /api/stt (Direct AssemblyAI proxy)
        if (!transcriptId) {
            onStatusChange?.("uploading");
            console.log("[STT] Enviando áudio diretamente para /api/stt...");

            const directRes = await fetch("/api/stt", {
                method: "POST",
                headers: {
                    "Content-Type": audioBlob.type || "audio/webm",
                },
                body: audioBlob,
            });

            if (!directRes.ok) {
                const errData = await directRes.json().catch(() => ({}));
                throw new Error(`Falha no upload direto para IA: status ${directRes.status} (${errData?.error || "desconhecido"})`);
            }

            const directData = await directRes.json();
            transcriptId = directData.id || null;
        }

        if (!transcriptId) {
            throw new Error("ID de transcrição não retornado pela AssemblyAI.");
        }

        onStatusChange?.("transcribing");

        // 3. Polling com limite de tempo (AssemblyAI leva ~6 a 12s)
        const startTime = Date.now();
        while (Date.now() - startTime < maxWaitMs) {
            await new Promise((r) => setTimeout(r, 1000));

            const pollRes = await fetch(`/api/stt?id=${encodeURIComponent(transcriptId)}`);
            if (pollRes.ok) {
                const pollData = await pollRes.json();
                if (pollData.status === "completed" && pollData.text) {
                    const aiText = String(pollData.text).trim();
                    if (aiText) {
                        onStatusChange?.("completed");
                        return { text: aiText, source: "assemblyai" };
                    }
                }
                if (pollData.status === "error") {
                    throw new Error(`Erro AssemblyAI: ${pollData.error || "Transcrição falhou"}`);
                }
            }
        }

        // Se estourou o tempo de polling
        throw new Error("Tempo limite de processamento com IA excedido (timeout).");

    } catch (err: any) {
        if (shouldDisableFallback) {
            console.error("[STT AssemblyAI Error - Fallback Desativado no Admin]:", err?.message || err);
            throw new Error(err?.message || "Erro desconhecido na transcrição por IA.");
        }

        console.warn("[Voice Transcription Fallback - Web Speech Usado]:", err?.message || err);
        onStatusChange?.("fallback");
        // Fallback transparente: retorna o texto do Web Speech
        return { text: cleanFallback, source: "webspeech" };
    }
}
