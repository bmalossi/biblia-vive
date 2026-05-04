// ─────────────────────────────────────────────────────────────────────────────
// readingPlanTypes.ts — Bíblia Vive
//
// Tipos canônicos de Plano de Leitura e Progresso (ADR-0006).
// Fonte única de verdade compartilhada por:
//   - progressCalculator.ts  (lógica de domínio pura)
//   - readingPlanSync.ts     (sincronização local/cloud)
//   - useReadingPlan.ts      (hook React)
// ─────────────────────────────────────────────────────────────────────────────

/** Uma Referência de um dia de um Plano de Leitura, ex: "sl/1" = Salmos cap. 1 */
export interface ReadingPlanDay {
    day: number;
    refs: string[];
}

/** Template curado com título, descrição e sequência de dias */
export interface ReadingPlan {
    id: string;
    name: string;
    description: string;
    totalDays: number;
    days: ReadingPlanDay[];
}

/**
 * Estado do Leitor num Plano de Leitura específico.
 * Persiste localmente e na nuvem (Supabase).
 */
export interface PlanProgress {
    planId: string;
    startDate: number;       // Unix timestamp em ms
    completedDays: number[];
    readRefs: string[];      // Referências lidas individualmente, ex: ["sl/1", "sl/2"]
}
