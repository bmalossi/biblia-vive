# Issue #007 — Documentação e atribuição

**Tipo**: AFK  
**PRD**: [prd-lexico-hebraico.md](../prd-lexico-hebraico.md)

## What to build

Criar o arquivo de documentação `docs/lexicon-hebrew.md` detalhando as fontes utilizadas (`openscriptures/HebrewLexicon`), os arquivos XML consumidos, a licença Creative Commons Attribution 4.0 (CC BY 4.0), e instruções para baixar os arquivos XML e executar o script de conversão.

Também garantir que a pasta `scripts/data/openscriptures/` esteja configurada no `.gitignore` para evitar que os arquivos XML originais (que são grandes) sejam commitados no repositório.

## Acceptance criteria

- [ ] Arquivo `docs/lexicon-hebrew.md` criado com:
  - Fontes utilizadas e links de referência.
  - Licença e texto de atribuição exigidos pelo OpenScriptures.
  - Passo a passo para baixar os XMLs.
  - Como executar o script `build-hebrew-lexicon.ts`.
- [ ] Entrada `/scripts/data/openscriptures/` presente no `.gitignore` (ou o padrão equivalente).
- [ ] Verificação de que os XMLs de origem não aparecem nas alterações do Git (`git status`).

## Blocked by

- [Issue #001](./issue-001.md)
