// ─────────────────────────────────────────────────────────────────────────────
// voiceSettings.ts — Bíblia Vive
//
// Gerenciador de configurações de voz, reconhecimento e inteligência artificial.
// Controla a ativação/desativação do fallback para Web Speech (navegador)
// em caso de indisponibilidade ou falha da AssemblyAI.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY_DISABLE_FALLBACK = "bv_disable_webspeech_fallback";
const EVENT_NAME = "bv-voice-settings-updated";

/**
 * Retorna se o fallback para Web Speech está desativado pelo administrador.
 * Padrão: false (ou seja, o fallback está ATIVADO por segurança para o usuário final).
 */
export function isWebSpeechFallbackDisabled(): boolean {
    if (typeof window === "undefined" || !window.localStorage) {
        return false;
    }
    return window.localStorage.getItem(STORAGE_KEY_DISABLE_FALLBACK) === "true";
}

/**
 * Define se o fallback para Web Speech deve ser desativado.
 * Quando desativado (true), qualquer gravação que falhar na AssemblyAI
 * retornará erro explícito em vez de usar o texto do navegador.
 */
export function setWebSpeechFallbackDisabled(disabled: boolean): void {
    if (typeof window === "undefined" || !window.localStorage) {
        return;
    }
    window.localStorage.setItem(STORAGE_KEY_DISABLE_FALLBACK, String(disabled));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { disabled } }));
}

/**
 * Hook React para ler e alterar as configurações de voz de forma reativa.
 */
export function useVoiceSettings() {
    const [disabled, setDisabledState] = useState<boolean>(() => isWebSpeechFallbackDisabled());

    useEffect(() => {
        const handleUpdate = () => {
            setDisabledState(isWebSpeechFallbackDisabled());
        };

        window.addEventListener(EVENT_NAME, handleUpdate);
        window.addEventListener("storage", handleUpdate);

        return () => {
            window.removeEventListener(EVENT_NAME, handleUpdate);
            window.removeEventListener("storage", handleUpdate);
        };
    }, []);

    const toggleFallback = useCallback(() => {
        const next = !disabled;
        setWebSpeechFallbackDisabled(next);
        setDisabledState(next);
    }, [disabled]);

    const setFallbackDisabled = useCallback((val: boolean) => {
        setWebSpeechFallbackDisabled(val);
        setDisabledState(val);
    }, []);

    return {
        isFallbackDisabled: disabled,
        isFallbackEnabled: !disabled,
        toggleFallback,
        setFallbackDisabled,
    };
}
