# Issue #006 — UI: Accordion Lexical "Ver mais ▾" na aba Língua

**Tipo**: AFK  
**PRD**: [prd-lexico-hebraico.md](../prd-lexico-hebraico.md)

## What to build

Adicionar o **Accordion Lexical** ao card de palavra selecionada na aba "Língua" do `StudyPanel`. Quando o usuário clica em uma palavra hebraica e o card exibe o significado, um botão "Ver mais ▾" aparece na parte inferior — mas apenas se a entrada tiver pelo menos um dos campos de enriquecimento (`root`, `word_group`, `usage_tags` ou `bdb_short`). Ao expandir, as seções disponíveis são exibidas uma a uma, sem exibir seções de campos ausentes.

O card existente — palavra original, badge Strong, transliteração, significado localizado, ocorrências — não sofre nenhuma alteração visual ou comportamental.

**Layout expandido:**
- **Raiz** → texto hebraico de `root` (quando presente)
- **Família lexical** → valor em inglês de `word_group` (quando presente)
- **Usos** → chips/badges individuais de `usage_tags` (quando presente)
- **Resumo BDB** → parágrafo com texto de `bdb_short` (quando presente)

## Acceptance criteria

- [ ] Accordion inicia **fechado** ao selecionar uma palavra
- [ ] Botão "Ver mais ▾" só aparece quando a entrada tem ao menos um campo de enriquecimento
- [ ] Ao expandir, apenas as seções com dados são renderizadas (seções com campo `undefined` não aparecem)
- [ ] Seção "Raiz" exibe o texto hebraico de `root` sob rótulo em PT-BR
- [ ] Seção "Família lexical" exibe o valor em inglês de `word_group` sob rótulo em PT-BR
- [ ] Seção "Usos" exibe `usage_tags` como chips individuais (máx. 6–8), escaneáveis
- [ ] Seção "Resumo BDB" exibe o texto de `bdb_short` em parágrafo sob rótulo em PT-BR
- [ ] Hover e seleção de palavras no texto hebraico original continuam funcionando sem alteração
- [ ] `hoveredWord`, `clickedWord` e a seleção de card não são afetados
- [ ] Resolução de significado por locale (`definition_pt` → `definition_es` → `definition`) preservada
- [ ] Painel grego (Novo Testamento) continua funcionando — accordion não aparece para entradas gregas sem campos de enriquecimento
- [ ] Verificação manual: selecionar uma palavra em Gênesis 1:1 mostra accordion com dados; selecionar em João 3:16 não mostra accordion (sem dados de enriquecimento grego)
- [ ] `npx tsc --noEmit` passa sem erros

## Blocked by

- [Issue #005](./issue-005.md) — tipo `StrongsEntry` com novos campos deve estar disponível
