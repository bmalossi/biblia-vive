# Issue #002 — Pipeline: extração de `root` e `word_group` via LexicalIndex

**Tipo**: AFK  
**PRD**: [prd-lexico-hebraico.md](../prd-lexico-hebraico.md)

## What to build

Estender o script `scripts/build-hebrew-lexicon.ts` para parsear o `LexicalIndex.xml` do OpenScriptures e popular os campos `root` e `word_group` em cada entrada do `strongs_hebrew_os.json`.

A lógica de extração percorre a hierarquia de entradas do índice lexical: para cada palavra com `<etym type="sub">ID_PAI</etym>`, sobe na hierarquia até encontrar o entry raiz com `<etym type="main" root="TEXTO_HEBRAICO">`, extraindo o texto hebraico trilítere para `root` e o campo `<def>` do entry raiz para `word_group`. Se não houver hierarquia clara ou o texto hebraico não estiver disponível, os campos são omitidos.

## Acceptance criteria

- [ ] Campo `root` populado com texto hebraico trilítere (ex.: `שׁמר`) quando inferível com confiança
- [ ] Campo `root` omitido (não presente na entrada JSON) quando a hierarquia for ambígua ou ausente
- [ ] Campo `word_group` populado com o valor `<def>` em inglês do entry raiz (ex.: `"father"`, `"perish"`)
- [ ] Campo `word_group` omitido quando não houver entry raiz identificável
- [ ] Entradas raiz (type="main") não recebem `word_group` referenciando a si mesmas
- [ ] Verificação manual: `H8104` (שׁמר, guardar) apresenta `root` correto; `H1` (pai) apresenta `word_group: "father"`
- [ ] Entradas aramaicas processadas com as mesmas regras

## Blocked by

- [Issue #001](./issue-001.md) — schema base do JSON deve estar estável antes de popular campos adicionais
