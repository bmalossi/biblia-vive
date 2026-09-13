// ─────────────────────────────────────────────────────────────────────────────
// microphonePermission.ts — Bíblia Vive
//
// Utilitário cirúrgico para verificação e solicitação de permissão de microfone.
//
// No Chrome/Edge desktop:
//  - Se a permissão estiver em "prompt" (primeira vez), chamar SpeechRecognition
//    diretamente pode não abrir a caixa nativa do navegador e falhar com not-allowed.
//  - Invocar navigator.mediaDevices.getUserMedia força o navegador a abrir o modal
//    nativo de autorização ("Permitir" / "Bloquear").
//  - Após a aprovação, as tracks são imediatamente liberadas para que a
//    Web Speech API possa capturar o áudio sem travamentos ou concorrência.
//  - Se a permissão já estiver bloqueada nas configurações do site (denied),
//    retorna uma mensagem instruindo o usuário a desbloquear no ícone ao lado da URL.
// ─────────────────────────────────────────────────────────────────────────────

export interface MicPermissionResult {
    ok: boolean;
    error?: string;
}

export async function ensureMicrophonePermission(): Promise<MicPermissionResult> {
    if (typeof window === "undefined") {
        return { ok: true };
    }

    // 1. Checa se navigator.mediaDevices está disponível (HTTPS ou localhost)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Ambiente sem mediaDevices (ex: HTTP não seguro), tenta seguir
        return { ok: true };
    }

    // 2. Consulta a Permissions API se disponível para verificar se já foi negado permanentemente
    if (navigator.permissions && navigator.permissions.query) {
        try {
            const permissionStatus = await navigator.permissions.query({
                name: "microphone" as PermissionName,
            });

            if (permissionStatus.state === "denied") {
                return {
                    ok: false,
                    error: "O microfone está bloqueado nas configurações do site. Clique no ícone de cadeado/configurações ao lado do endereço do site (URL) e altere 'Microfone' para 'Permitir'.",
                };
            }
        } catch {
            // Alguns browsers não implementam a query com 'microphone'
        }
    }

    // Não criamos streams fantasmas aqui para não prender o hardware do microfone.
    // O startAudioCapture() abrirá diretamente o stream oficial único com as constraints de HD.
    return { ok: true };
}
