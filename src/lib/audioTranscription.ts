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
        stream.getTracks().forEach((track) => {
            try {
                track.enabled = false;
                track.stop();
            } catch {
                // Silencioso
            }
        });
    };

    const controller: AudioCaptureController = {
        stop: () => {
            return new Promise<Blob | null>((resolve) => {
                if (isCancelled || mediaRecorder.state === "inactive") {
                    cleanup();
                    resolve(null);
                    return;
                }

                mediaRecorder.onstop = () => {
                    cleanup();
                    if (isCancelled || chunks.length === 0) {
                        resolve(null);
                        return;
                    }
                    const finalBlob = new Blob(chunks, {
                        type: mediaRecorder.mimeType || "audio/webm",
                    });
                    resolve(finalBlob);
                };

                try {
                    mediaRecorder.stop();
                } catch {
                    cleanup();
                    resolve(null);
                }
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

export interface TranscribeOptions {
    audioBlob: Blob | null;
    fallbackText: string;
    maxWaitMs?: number;
    onStatusChange?: (status: "uploading" | "transcribing" | "completed" | "fallback") => void;
}

export interface TranscribeResult {
    text: string;
    source: "assemblyai" | "webspeech";
}

/**
 * Executa a transcrição do áudio via Cloudflare R2 + AssemblyAI.
 * Se o áudio for nulo, muito curto (< 300 bytes) ou qualquer etapa falhar/estourar o tempo,
 * retorna de forma instantânea e transparente o fallbackText do Web Speech.
 */
export async function transcribeVoiceRecording({
    audioBlob,
    fallbackText,
    maxWaitMs = 7000,
    onStatusChange,
}: TranscribeOptions): Promise<TranscribeResult> {
    const cleanFallback = fallbackText.trim();

    // Se não há áudio ou é minúsculo, usa fallback diretamente
    if (!audioBlob || audioBlob.size < 400) {
        onStatusChange?.("fallback");
        return { text: cleanFallback, source: "webspeech" };
    }

    try {
        onStatusChange?.("uploading");

        // 1. Obter presigned PUT URL para o Cloudflare R2 via api/stt unificada
        const urlRes = await fetch("/api/stt?action=upload-url");

        if (!urlRes.ok) {
            throw new Error(`Falha ao obter URL de upload: status ${urlRes.status}`);
        }

        const { uploadUrl, audioUrl } = await urlRes.json();
        if (!uploadUrl || !audioUrl) {
            throw new Error("URL de upload inválida recebida do servidor.");
        }

        // 2. Upload direto para o Cloudflare R2 (zero tráfego pesado na Vercel)
        const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "Content-Type": audioBlob.type || "audio/webm",
            },
            body: audioBlob,
        });

        if (!uploadRes.ok) {
            throw new Error(`Falha no upload direto para o R2: status ${uploadRes.status}`);
        }

        onStatusChange?.("transcribing");

        // 3. Submeter à AssemblyAI enviando apenas a URL do áudio no R2
        const submitRes = await fetch("/api/stt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioUrl }),
        });

        if (!submitRes.ok) {
            throw new Error(`Falha ao submeter transcrição: status ${submitRes.status}`);
        }

        const { id: transcriptId } = await submitRes.json();
        if (!transcriptId) {
            throw new Error("ID de transcrição não retornado pela AssemblyAI.");
        }

        // 4. Polling rápido com limite estrito de tempo
        const startTime = Date.now();
        while (Date.now() - startTime < maxWaitMs) {
            await new Promise((r) => setTimeout(r, 900));

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

        // Se estourou o tempo de polling, segue para fallback
        throw new Error("Tempo limite de processamento com IA excedido.");

    } catch (err: any) {
        console.warn("[Voice Transcription Fallback]:", err?.message || err);
        onStatusChange?.("fallback");
        // Fallback transparente: retorna o texto limpo do Web Speech
        return { text: cleanFallback, source: "webspeech" };
    }
}
