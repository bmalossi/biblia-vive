## Parent

## What to build

Adicionar geração de JSON-LD Schema.org/Chapter ao script de prerender. Cada página de capítulo deve incluir script com tipo `application/ld+json` contendo:

- `@type: "Chapter"`
- `name`: "{BookName} {N} — ACF"
- `position`: número do capítulo
- `isPartOf`: entidade Book → Bible
- `text`: primeiros 3 versículos concatenados (extraídos do JSON local)

## Acceptance criteria

- [ ] Cada HTML de capítulo contém `<script type="application/ld+json">`
- [ ] O JSON-LD tem `@type: "Chapter"`
- [ ] O campo `position` contém o número do capítulo
- [ ] O campo `text` contém os primeiros 3 versículos do capítulo
- [ ] O JSON-LD é válido e passa no schema.org Validator

## Blocked by

- #2 (Script de Prerender JSON-based)