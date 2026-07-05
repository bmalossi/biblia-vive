# Issue #001 — Pipeline base: parsear HebrewStrong + merge PT-BR

**Tipo**: AFK  
**PRD**: [prd-lexico-hebraico.md](../prd-lexico-hebraico.md)

## What to build

Criar o script TypeScript `scripts/build-hebrew-lexicon.ts` que parseia o `HebrewStrong.xml` do OpenScriptures, extrai os campos base de cada entrada hebraica (`word`, `translit`, `definition`, `usage_tags`), e mescla os campos de tradução (`definition_pt`, `definition_es`) do `strongs_hebrew.json` atual — produzindo o arquivo `public/data/strongs_hebrew_os.json` pronto para consumo pelo frontend.

Este slice estabelece o schema base do JSON de saída, incluindo os quatro campos novos opcionais (`root`, `word_group`, `usage_tags`, `bdb_short`) já presentes como `undefined` nesta etapa, para que os slices dependentes possam avançar em paralelo.

## Acceptance criteria

- [ ] Script executável via `npx tsx scripts/build-hebrew-lexicon.ts` sem erros
- [ ] Arquivo `public/data/strongs_hebrew_os.json` gerado em UTF-8 com chaves no formato `H1`, `H7586` (sem zero-padding)
- [ ] Cada entrada contém ao menos `word`, `translit`, `definition` extraídos do `HebrewStrong.xml`
- [ ] `usage_tags` normalizado: split por vírgula/ponto e vírgula, remoção de ruído (`×`, `Compare...`, parênteses excessivos), máx. 6–8 tokens de até ~40 chars
- [ ] `definition_pt` preservado do `strongs_hebrew.json` atual quando a chave Strong corresponder
- [ ] `definition_es` preservado do `strongs_hebrew.json` atual quando disponível
- [ ] Entradas sem correspondência no arquivo atual ficam sem campos de tradução (sem erro)
- [ ] Verificação manual das entradas `H1` (pai), `H430` (Elohim) e `H7225` (início) mostra campos corretos
- [ ] `scripts/data/openscriptures/` adicionado ao `.gitignore` (XMLs não versionados)

## Blocked by

Nenhum — pode começar imediatamente.
