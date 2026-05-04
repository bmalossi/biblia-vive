# notesHighlights.ts dividido em NoteStore, HighlightStore, exportador e migração

`notesHighlights.ts` acumulou quatro responsabilidades distintas num único arquivo de 500+ linhas. O split acordado:

```
src/lib/
  noteStore.ts        ← NoteStore interface + SupabaseNoteStore + LocalNoteStore
  highlightStore.ts   ← HighlightStore interface + SupabaseHighlightStore + LocalHighlightStore
  notesExport.ts      ← exportNotesToTXT, exportNotesToPDF
  notesMigration.ts   ← migrateVerseDataToCloud(userId)
  notesHighlights.ts  ← barrel de re-export (temporário, deletar quando callers forem atualizados)
```

Decisões tomadas durante o design:

- **Dual-mode via seam explícito**: o `if (userId)` que bifurca entre Supabase e localStorage em cada operação CRUD é substituído por dois adapters concretos (`SupabaseNoteStore`, `LocalNoteStore`) com interface comum. O seam permite testes unitários com um adapter in-memory sem depender do Supabase real.
- **Interfaces separadas** para Nota e Destaque: os payloads de save são diferentes o suficiente (`content: string` vs `color: HighlightColor`) para tornar uma interface genérica mais obscura que útil.
- **Migração localStorage→Supabase como função standalone** em `notesMigration.ts`: a migração é disparada apenas no login e orquestra os dois conceitos ao mesmo tempo — acoplá-la a qualquer store criaria dependência entre stores que não existe no fluxo normal.
- **Barrel de re-export** como primeiro passo: `notesHighlights.ts` vira `export * from './noteStore'; ...` para que a refatoração interna não quebre os callers existentes em uma única mudança.

## Considered options

- Manter o `if (userId)` e apenas separar o PDF: descartado porque o CRUD permaneceria intestável sem Supabase real.
- Interface genérica `VerseDataStore<T>`: descartada por forçar tipos union nas assinaturas de save.
- Migração dentro dos stores Supabase: descartada por criar acoplamento entre NoteStore e HighlightStore fora do fluxo normal.
