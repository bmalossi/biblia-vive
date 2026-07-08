// ─────────────────────────────────────────────────────────────────────────────
// useCommentaryQuota.ts — Bíblia Vive
//
// Gerencia a cota de comentários teológicos gratuitos por tipo (verso | capítulo).
// Unifica a lógica que estava duplicada em ReadingPage e StudyPanel.
//
// Interface exposta:
//   remaining  — quantos usos gratuitos restam (0–FREE_QUOTA)
//   canUse     — remaining > 0
//   consume()  — decrementa remaining e persiste no localStorage
//
// Chave canônica: bv_commentary_quota_{type}
// Migração automática das chaves legadas (ver readQuota).
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useState } from 'react';

// ── Constantes ────────────────────────────────────────────────────────────────

export type QuotaType = 'verse' | 'chapter';

/** Número de usos gratuitos por tipo. Altere aqui quando o limite mudar. */
export const FREE_QUOTA = 3;

const CANONICAL_KEY = (type: QuotaType) => `bv_commentary_quota_${type}`;

/** Chaves legadas a migrar (somente para leitura; removidas após migração). */
const LEGACY_USED_COUNT_KEY: Record<QuotaType, string> = {
    verse: 'bv_free_commentaries_used_count',
    chapter: 'bv_free_chapter_commentaries_used_count',
};
const LEGACY_BOOL_KEY: Record<QuotaType, string> = {
    verse: 'bv_free_commentary_used',
    chapter: 'bv_free_chapter_commentary_used',
};

// ── Persistência ──────────────────────────────────────────────────────────────

/**
 * Lê o remaining da chave canônica. Se ausente, migra das chaves legadas,
 * escreve na chave canônica e remove as legadas.
 */
function readQuota(type: QuotaType): number {
    try {
        // 1. Chave canônica — caminho normal
        const canonical = localStorage.getItem(CANONICAL_KEY(type));
        if (canonical !== null) {
            return Math.max(0, parseInt(canonical, 10));
        }

        // 2. Migração da chave de contagem legada (bv_free_*_commentaries_used_count)
        const usedCountStr = localStorage.getItem(LEGACY_USED_COUNT_KEY[type]);
        if (usedCountStr !== null) {
            const remaining = Math.max(0, FREE_QUOTA - parseInt(usedCountStr, 10));
            localStorage.setItem(CANONICAL_KEY(type), String(remaining));
            localStorage.removeItem(LEGACY_USED_COUNT_KEY[type]);
            localStorage.removeItem(LEGACY_BOOL_KEY[type]);
            return remaining;
        }

        // 3. Migração da chave booleana legada (bv_free_*_commentary_used)
        const legacyBool = localStorage.getItem(LEGACY_BOOL_KEY[type]);
        if (legacyBool !== null) {
            // 'true' = 1 uso feito = 2 restantes
            const remaining = legacyBool === 'true' ? FREE_QUOTA - 1 : FREE_QUOTA;
            localStorage.setItem(CANONICAL_KEY(type), String(remaining));
            localStorage.removeItem(LEGACY_BOOL_KEY[type]);
            return remaining;
        }

        // 4. Sem histórico: cota completa
        return FREE_QUOTA;
    } catch {
        return FREE_QUOTA;
    }
}

function writeQuota(type: QuotaType, remaining: number): void {
    try {
        localStorage.setItem(CANONICAL_KEY(type), String(remaining));
    } catch {
        // ignora erros de storage (ex: private mode com storage cheio)
    }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCommentaryQuota(type: QuotaType) {
    const [remaining, setRemainingState] = useState(() => readQuota(type));

    const canUse = remaining > 0;

    /**
     * Atualiza o contador de quota diretamente (por exemplo, sincronizando com os headers do servidor).
     */
    const setRemaining = useCallback((count: number) => {
        const next = Math.max(0, count);
        setRemainingState(next);
        writeQuota(type, next);
    }, [type]);

    /**
     * Decrementa o contador e persiste.
     * Chamar quando o comentário for gerado com sucesso (e o usuário não for Pro).
     */
    const consume = useCallback(() => {
        setRemainingState(prev => {
            const next = Math.max(0, prev - 1);
            writeQuota(type, next);
            return next;
        });
    }, [type]);

    return { remaining, canUse, consume, setRemaining };
}
