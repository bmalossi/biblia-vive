# Fio da Escritura: Cache Reativo por Versão do Memorial (invalidação event-driven)

O resultado do JEV para cada capítulo é armazenado em `localStorage` sob a chave `st:{bookId}:{chapter}:{userId}`, junto ao valor de `bv_notes_version` no momento da avaliação. O cache é válido indefinidamente enquanto `bv_notes_version` não mudar — eliminando chamadas repetidas para Leitores em modo apenas-leitura (caso majoritário). O cache é invalidado automaticamente sempre que o Leitor cria, edita ou apaga um Registro do Memorial no mesmo browser: os pontos de mutação em `notesHighlights.ts` (saveNote, deleteNote) atualizam `bv_notes_version` via `localStorage` e disparam um custom event `bv-notes-version-updated`, seguindo o mesmo padrão do `voiceSettings.ts`.

Cache com TTL fixo de 24h foi descartado: um Leitor que abre Romanos 8 diariamente sem adicionar notas chamaria o JEV todos os dias sem necessidade. Cache sem expiração mas com TTL foi descartado pelo motivo inverso: se o Leitor adicionar uma nota, o resultado ficaria stale por horas.

## Consequences

- **Limitação cross-device**: a invalidação é local ao browser. Notas adicionadas no celular não invalidam o cache do desktop. Aceitável para MVP — o cache inexistente num novo browser força avaliação fresca.
- O `notesHighlights.ts` torna-se o ponto canônico de mutação de notas e deve ser estendido (não contornado) por qualquer futura feature que modifique `user_notes`.
- `bv_notes_version` é uma chave de `localStorage` de uso interno; não deve ser exibida nem manipulada pela UI.
