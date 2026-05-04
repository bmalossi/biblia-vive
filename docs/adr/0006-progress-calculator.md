# Lógica pura de Progresso extraída para progressCalculator.ts

`useReadingPlan.ts` misturava lógica de domínio pura com sincronização de rede e estado React, tornando as regras de negócio de Progresso invisíveis a testes.

As cinco funções puras abaixo foram extraídas para `lib/progressCalculator.ts`:

```ts
calcCurrentDayIndex(progress: PlanProgress, today: Date): number
getDayRefs(plan: ReadingPlan, dayIndex: number): string[]
isDayCompleted(progress: PlanProgress, dayIndex: number): boolean
calcProgressPct(plan: ReadingPlan, progress: PlanProgress): number
calcDiasConcluidos(progress: PlanProgress): number
```

Decisões:

- `today: Date` é parâmetro obrigatório de `calcCurrentDayIndex` — permite testar "e se hoje fosse dia 15?" sem mockar `Date`.
- Os tipos `ReadingPlan`, `ReadingPlanDay` e `PlanProgress` foram co-localizados em `lib/readingPlanTypes.ts` para serem compartilhados por `progressCalculator`, `readingPlanSync` e `useReadingPlan` sem importações cruzadas entre libs e hooks.
- O hook `useReadingPlan` continua existindo como orquestrador de sync + React state; as 3 ações com efeitos colaterais (`markRefRead`, `startPlan`, `abandonPlan`) permanecem nele.

## Consequences

- As 5 funções puras são testáveis sem montar um componente React e sem Supabase.
- A regra crítica "não avançar além de completedDays.length + 1" (que antes estava invisível no hook) agora tem um nome e um local canônico.
