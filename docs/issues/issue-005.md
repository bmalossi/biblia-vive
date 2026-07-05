# Issue #005 — Estender `StrongsEntry` + atualizar `loadHebrew()`

**Tipo**: AFK  
**PRD**: [prd-lexico-hebraico.md](../prd-lexico-hebraico.md)

## What to build

Estender o tipo `StrongsEntry` em `src/lib/strongs.ts` com os quatro novos campos opcionais (`root`, `word_group`, `usage_tags`, `bdb_short`) e atualizar a função `loadHebrew()` para carregar o novo arquivo `strongs_hebrew_os.json` em vez do `strongs_hebrew.json` atual.

Nenhuma outra função pública é alterada. `getStrongsEntry()`, `getVerseWords()`, `getOriginalVerseText()` e `prefetchLexicons()` continuam com a mesma assinatura e comportamento. O loader grego (`loadGreek()`) não é tocado.

## Acceptance criteria

- [ ] Interface `StrongsEntry` extendida com `root?: string`, `word_group?: string`, `usage_tags?: string[]`, `bdb_short?: string`
- [ ] Nenhum campo existente removido ou alterado (`number`, `word`, `translit`, `definition`, `definition_pt`, `definition_es`, `occurrences`)
- [ ] `loadHebrew()` aponta para `/data/strongs_hebrew_os.json`
- [ ] Cache em memória (`hebrewCache`) funciona exatamente como antes
- [ ] `getStrongsEntry("H430")` retorna entrada com novos campos quando disponíveis, sem quebrar callers existentes
- [ ] `getStrongsEntry("G2316")` (grego) continua funcionando sem alteração
- [ ] `npx tsc --noEmit` passa sem erros

## Blocked by

- [Issue #001](./issue-001.md) — o arquivo `strongs_hebrew_os.json` com schema estável deve existir antes desta mudança
