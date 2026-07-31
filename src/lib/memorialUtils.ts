// ─────────────────────────────────────────────────────────────────────────────
// memorialUtils.ts — Bíblia Vive · Sprint 27
// Helper para agrupamento temporal e utilitários do Memorial
// ─────────────────────────────────────────────────────────────────────────────

import type { MemorialEntry } from "./noteStore";

export interface TimeGroup {
    key: string;
    label: string;
    yearHeader?: number;
    entries: MemorialEntry[];
}

/**
 * Agrupa registros do Memorial por proximidade temporal:
 * - Hoje (0 dias)
 * - Ontem (1 dia)
 * - Esta semana (2 a 6 dias atrás — semana corrida de 3-7 dias)
 * - Mês de Ano (7+ dias atrás, ex: "Julho de 2026")
 * Exibe cabeçalho de ano quando a transição anual ocorre.
 */
export function groupEntriesByTime(entries: MemorialEntry[], now: Date = new Date()): TimeGroup[] {
    if (!entries || entries.length === 0) return [];

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Ordena do mais recente para o mais antigo
    const sorted = [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const groupsMap = new Map<string, { label: string; year: number; entries: MemorialEntry[] }>();

    for (const entry of sorted) {
        const entryDate = new Date(entry.createdAt);
        const entryDayStart = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
        const diffMs = todayStart.getTime() - entryDayStart.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        let groupKey: string;
        let groupLabel: string;
        const entryYear = entryDate.getFullYear();

        if (diffDays <= 0) {
            groupKey = 'today';
            groupLabel = 'Hoje';
        } else if (diffDays === 1) {
            groupKey = 'yesterday';
            groupLabel = 'Ontem';
        } else if (diffDays >= 2 && diffDays <= 6) {
            groupKey = 'this_week';
            groupLabel = 'Esta semana';
        } else {
            const monthName = entryDate.toLocaleDateString('pt-BR', { month: 'long' });
            const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
            groupKey = `${entryYear}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;
            groupLabel = `${capitalizedMonth} de ${entryYear}`;
        }

        if (!groupsMap.has(groupKey)) {
            groupsMap.set(groupKey, { label: groupLabel, year: entryYear, entries: [] });
        }
        groupsMap.get(groupKey)!.entries.push(entry);
    }

    const groups: TimeGroup[] = [];
    let lastRenderedYear: number | null = null;

    for (const [key, group] of groupsMap.entries()) {
        let yearHeaderToShow: number | undefined;

        if (key !== 'today' && key !== 'yesterday' && key !== 'this_week') {
            if (lastRenderedYear === null || group.year !== lastRenderedYear) {
                yearHeaderToShow = group.year;
                lastRenderedYear = group.year;
            }
        } else {
            lastRenderedYear = group.year;
        }

        groups.push({
            key,
            label: group.label,
            yearHeader: yearHeaderToShow,
            entries: group.entries,
        });
    }

    return groups;
}
