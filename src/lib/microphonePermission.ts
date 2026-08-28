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

            if (permissionStatus.state === "granted") {
                // Já autorizado anteriormente — pode prosseguir direto
                return { ok: true };
            }
        } catch {
            // Alguns browsers não implementam a query com 'microphone', prossegue para o passo 3
        }
    }

    // 3. Permissão em "prompt" (ou desconhecida): chama getUserMedia para forçar o navegador
    // a abrir o pop-up nativo de permissão
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Libera imediatamente todos os canais de áudio capturados
        // para que a Web Speech API assuma o microfone com exclusividade
        stream.getTracks().forEach((track) => {
            try {
                track.stop();
            } catch {
                // Silencioso
            }
        });

        return { ok: true };
    } catch (err: any) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            return {
                ok: false,
                error: "Permissão de microfone negada. Clique no ícone ao lado do endereço do site (URL) e altere para 'Permitir'.",
            };
        }

        if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            return {
                ok: false,
                error: "Nenhum microfone foi encontrado no seu computador ou celular.",
            };
        }

        if (err.name === "NotReadableError" || err.name === "TrackStartError") {
            return {
                ok: false,
                error: "O microfone está em uso por outro aplicativo. Feche outros apps de áudio e tente novamente.",
            };
        }

        return {
            ok: false,
            error: err.message || "Não foi possível acessar o microfone.",
        };
    }
}
