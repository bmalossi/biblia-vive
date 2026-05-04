# Fix readingPlanSync test — update import and assertions

## Parent

Context: existing failing test in `src/test/readingPlanSync.test.ts`

## What to build

The test `should map multiple Supabase rows to Record<string, PlanProgress> format` expects a return value that now comes from `progressCalculator`. Update the import and assertion to match new module boundaries.

## Acceptance criteria

- [ ] Test uses correct import from progressCalculator
- [ ] Assertions updated to match new return format
- [ ] No logic changes to implementation code
- [ ] Test passes

## Blocked by

None - can start immediately