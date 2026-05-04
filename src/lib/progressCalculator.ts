// ─────────────────────────────────────────────────────────────────────────────
// progressCalculator.ts — Bíblia Vive
//
// Funções puras de domínio para Progresso em Planos de Leitura (ADR-0006).
// Sem dependências de React, localStorage ou Supabase.
// Testáveis com dados arbitrários e datas injetadas.
// ─────────────────────────────────────────────────────────────────────────────

import type { ReadingPlan, PlanProgress } from "./readingPlanTypes";

/**
 * Calcula o índice do dia atual do Leitor no Plano de Leitura.
 *
 * Regra de domínio crítica: nunca avança além de (diasConcluídos + 1),
 * mesmo que mais dias tenham passado no calendário. Isso garante que o
 * Leitor que pulou dias não vê a leitura "avançar" automaticamente.
 *
 * @param progress - Progresso atual do Leitor
 * @param today    - Data de referência (injetada para testabilidade)
 * @returns Índice do dia (base 1)
 */
export function calcCurrentDayIndex(progress: PlanProgress, today: Date): number {
    const start = new Date(progress.startDate);

    const todayNorm = new Date(today);
    todayNorm.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);

    const diffMs = Math.abs(todayNorm.getTime() - start.getTime());
    const calendarDayIndex = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

    // Never auto-advance past days that haven't been completed yet
    return Math.min(calendarDayIndex, progress.completedDays.length + 1);
}

/**
 * Retorna as Referências (capítulos) prescritas para um dia específico do Plano.
 * Retorna [] se o dia não existir.
 */
export function getDayRefs(plan: ReadingPlan, dayIndex: number): string[] {
    return plan.days.find((d) => d.day === dayIndex)?.refs ?? [];
}

/**
 * True se o Leitor já completou todas as Referências do dia informado.
 */
export function isDayCompleted(progress: PlanProgress, dayIndex: number): boolean {
    return progress.completedDays.includes(dayIndex);
}

/**
 * Percentual de conclusão do Plano de Leitura (0–100, inteiro).
 * Baseado nos Dias Concluídos vs totalDays do Plano.
 */
export function calcProgressPct(plan: ReadingPlan, progress: PlanProgress): number {
    if (plan.totalDays === 0) return 0;
    return Math.round((progress.completedDays.length / plan.totalDays) * 100);
}

/**
 * Dias Concluídos — contagem acumulada de dias em que o Leitor completou
 * todas as Referências. Não é uma sequência; não regride se dias forem pulados.
 * (Ver CONTEXT.md: "Dias Concluídos")
 */
export function calcDiasConcluidos(progress: PlanProgress): number {
    return progress.completedDays.length;
}
