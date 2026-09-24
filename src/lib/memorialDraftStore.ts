// ─────────────────────────────────────────────────────────────────────────────
// memorialDraftStore.ts — Bíblia Vive
//
// Gerenciador de rascunhos em tempo real para o Memorial (Reflexão SOAP,
// Oração, Testemunho, Propósito).
// Salva cada tecla digitada no localStorage para garantir que NENHUMA reflexão
// seja perdida caso o usuário saia da tela, feche a gaveta ou troque de app.
// ─────────────────────────────────────────────────────────────────────────────

import type { MemorialCategory } from "./noteStore";

export interface MemorialDraft {
    category: MemorialCategory;
    title: string;
    content: string;
    tags: string;
    includeReference: boolean;
    soapS: string;
    soapO: string;
    soapA: string;
    soapP: string;
    motivo: string;
    pedido: string;
    entrega: string;
    oQueAconteceu: string;
    comoDeusSustentou: string;
    dataFato: string;
    objetivo: string;
    dataInicio: string;
    dataPrevista: string;
    updatedAt: number;
}

export function getMemorialDraftKey(
    entryId?: string | null,
    category?: MemorialCategory,
    bookId?: string,
    chapter?: number
): string {
    if (entryId) {
        return `bv_memorial_draft_entry_${entryId}`;
    }
    const cat = category || "reflection";
    const bId = (bookId || "geral").toLowerCase();
    const ch = chapter ?? 0;
    return `bv_memorial_draft_new_${cat}_${bId}_${ch}`;
}

export function saveMemorialDraft(key: string, draft: MemorialDraft): void {
    try {
        localStorage.setItem(key, JSON.stringify(draft));
        localStorage.setItem("bv_memorial_draft_latest_key", key);
    } catch (e) {
        console.warn("Falha ao salvar rascunho do memorial no localStorage", e);
    }
}

export function getMemorialDraft(key: string): MemorialDraft | null {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw) as MemorialDraft;
    } catch {
        return null;
    }
}

export function clearMemorialDraft(key: string): void {
    try {
        localStorage.removeItem(key);
        const latestKey = localStorage.getItem("bv_memorial_draft_latest_key");
        if (latestKey === key) {
            localStorage.removeItem("bv_memorial_draft_latest_key");
        }
    } catch (e) {
        console.warn("Falha ao limpar rascunho do memorial", e);
    }
}
