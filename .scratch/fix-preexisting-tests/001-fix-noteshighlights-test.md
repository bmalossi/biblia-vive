# Fix notesHighlights test — use LocalNoteStore in-memory adapter

## Parent

Context: existing failing test in `src/test/notesHighlights.test.ts`

## What to build

The test `should call supabase upsert when saving note` uses old mocking structure (direct mock of Supabase client). Rewrite to use the `LocalNoteStore` in-memory adapter pattern already established in other tests in the same file.

## Acceptance criteria

- [ ] Test rewritten using LocalNoteStore in-memory adapter
- [ ] No logic changes to implementation code
- [ ] All existing tests still pass
- [ ] Test file follows existing patterns from other tests in the same file

## Blocked by

None - can start immediately