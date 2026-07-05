# Issue #003 — Pipeline: extração de `bdb_short` via BrownDriverBriggs

**Tipo**: AFK  
**PRD**: [prd-lexico-hebraico.md](../prd-lexico-hebraico.md)

## What to build

Estender o script `scripts/build-hebrew-lexicon.ts` para parsear o `BrownDriverBriggs.xml` do OpenScriptures e popular o campo `bdb_short` em cada entrada do `strongs_hebrew_os.json`.

A lógica localiza cada entrada pelo número Strong, extrai o texto do primeiro `<sense>` com conteúdo textual significativo, remove todo o ruído (tags XML, referências cruzadas, símbolos `†`, `√`, `‡`, marcadores editoriais), e produz um resumo compacto. Se o texto resultante exceder 400 chars, é truncado no último espaço antes do limite e acrescido de `…`. Entradas sem correspondência no BDB ficam sem o campo.

## Acceptance criteria

- [ ] Campo `bdb_short` populado com texto limpo (sem tags XML, sem `†`, `√`, `‡`, sem referências cruzadas)
- [ ] Texto extraído do primeiro `<sense>` principal com conteúdo significativo
- [ ] Comprimento do campo: alvo 250–300 chars; faixa aceitável 200–350; máximo absoluto 400 chars
- [ ] Quando truncado, o texto termina com `…` no último espaço antes do limite
- [ ] Campo omitido quando não há correspondência no BDB (sem valor vazio ou `null`)
- [ ] Verificação manual: `H430` (Elohim) e `H7225` (início) apresentam `bdb_short` com texto coerente e dentro do limite
- [ ] Caracteres hebraicos e unicode preservados corretamente no texto quando presentes

## Blocked by

- [Issue #001](./issue-001.md) — schema base do JSON deve estar estável antes de popular campos adicionais
