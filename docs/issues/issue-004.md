# Issue #004 — Testes unitários do HebrewLexiconParser

**Tipo**: AFK  
**PRD**: [prd-lexico-hebraico.md](../prd-lexico-hebraico.md)

## What to build

Escrever testes unitários via Vitest para as funções de normalização e extração do script `build-hebrew-lexicon.ts`. Os testes usam fragmentos reais dos XMLs como fixtures inline, verificando apenas o comportamento externo de cada função — não os detalhes internos de parsing.

As funções testadas devem ser exportáveis em isolamento (não exigir execução do script completo). Se necessário, refatorar o script para extrair as funções puras antes de escrever os testes.

## Acceptance criteria

- [ ] **`normalizeUsageTags(raw: string): string[]`** — dado `"chief, (fore-) father(-less), × patrimony, principal. Compare names in 'Abi-'."`, retorna `["chief", "father", "patrimony", "principal"]`; tokens com mais de ~40 chars descartados; máx. 6–8 tags
- [ ] **`normalizeUsageTags`** — dado uma string vazia ou só com ruído, retorna `[]`
- [ ] **`extractRoot(entryId: string, indexMap: Map): string | undefined`** — dado fragmento do `LexicalIndex.xml` com hierarquia `sub → main` e atributo `root`, retorna o texto hebraico correto
- [ ] **`extractRoot`** — dado entry sem parent (entry raiz ou sem etym), retorna `undefined`
- [ ] **`extractWordGroup(entryId: string, indexMap: Map): string | undefined`** — dado entry com parent que tem `<def>father</def>`, retorna `"father"`
- [ ] **`extractBdbShort(strongNumber: string, bdbMap: Map): string | undefined`** — dado fragmento de entrada BDB com texto longo, retorna texto limpo dentro de 400 chars com `…` ao final quando truncado
- [ ] **`extractBdbShort`** — dado entrada BDB com texto dentro do limite, retorna sem `…`
- [ ] **`mergeTranslations`** — dado registro OpenScriptures sem `definition_pt` e registro atual com `definition_pt`, resultado contém `definition_pt` preservado
- [ ] **`mergeTranslations`** — dado chave sem correspondência no arquivo atual, resultado não tem `definition_pt`
- [ ] Todos os testes passam via `npx vitest run`

## Blocked by

- [Issue #001](./issue-001.md)
- [Issue #002](./issue-002.md)
- [Issue #003](./issue-003.md)
