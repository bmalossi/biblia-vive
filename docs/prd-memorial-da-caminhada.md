# PRD — Memorial da Caminhada
## Evolução do Caderno da Bíblia Vive

---

## 1. Problem Statement

O Caderno da Bíblia Vive atualmente limita o Leitor a anotações em texto simples restritas a um único versículo. Não há uma forma estruturada de registrar as diferentes manifestações da caminhada espiritual — como orações apresentadas a Deus, testemunhos de sustentação, meditações estruturadas ou propósitos de jejum — acumuladas ao longo dos anos de leitura bíblica.

Além disso, as anotações ficam dispersas em visões isoladas, incapazes de transmitir ao Leitor a percepção de uma caminhada contínua com Deus através das Escrituras.

---

## 2. Solution

Transformar o Caderno no **Meu Memorial** (`/memorial`), um espaço sagrado, sóbrio e unificado onde toda memória espiritual gerada pela Palavra permanece preservada ao longo dos anos.

Por meio de um Floating Action Button (FAB) expansível integrado diretamente à experiência de leitura bíblica, o Leitor pode registrar em menos de 15 segundos 4 tipos distintos de memórias espirituais (**Reflexão**, **Oração**, **Testemunho**, **Jejum / Propósito**), sem jamais abandonar ou interromper sua leitura. Todos os registros são vinculados automaticamente à Referência bíblica (livro, capítulo, versículo quando houver, versão e data/horário) e apresentados em uma **Linha do Tempo da Caminhada** com busca em tempo real e filtros por categoria.

---

## 3. User Stories

1. As a Leitor reading a Bible chapter, I want to click an expandable FAB to quickly choose between creating a Reflexão, Oração, Testemunho, or Jejum, so that I can capture my spiritual response in under 15 seconds without leaving the reader.
2. As a Leitor, I want any record created during Bible reading to automatically capture the current book, chapter, verse (if selected), Bible translation, and timestamp, so that I never have to manually enter biblical references.
3. As a Leitor, I want to create a Reflexão using the SOAP model (Escritura, Observação, Aplicação, Oração), so that I can meditate deeply on a passage.
4. As a Leitor, I want to record an Oração with fields for title, motive, request, and surrender before God, so that I can present my petitions clearly during reading.
5. As a Leitor navigating to a previously created Oração, I want to register God's response and mark it as answered with the timestamp, so that I can look back and remember answered prayers.
6. As a Leitor, I want to record a Testemunho with a title, description of what happened, and how God sustained me, so that I can preserve major milestones of grace in my life.
7. As a Leitor, I want to register a Jejum / Propósito with a goal, start date, target end date, and progress notes, so that I can track dedicated periods of spiritual seeking.
8. As a Leitor, I want to access `/memorial` ("Meu Memorial") and see a continuous timeline of all my spiritual records ordered chronologically, so that I can see the history of what God has built in my life.
9. As a Leitor on `/memorial`, I want to filter records by category (Todos, Reflexões, Orações, Testemunhos, Propósitos, Respondidas, Favoritos), so that I can easily focus on specific areas of my journey.
10. As a Leitor on `/memorial`, I want to search through my records by typing text, titles, book names, chapter numbers, or tags, so that I can instantly find past entries from years ago.
11. As a Leitor clicking a timeline entry, I want to view its full details and click its biblical reference link, so that I am taken directly to that chapter in the Bible reader.
12. As a Leitor with existing legacy notes, I want all my past notes to be preserved and automatically migrated as Reflexões in Meu Memorial, so that none of my historical records are lost.
13. As a Visitante (unauthenticated reader), I want my Memorial entries to persist locally in my browser, so that I can experience the feature before creating an account.
14. As an authenticated Leitor, I want my Memorial entries to sync seamlessly to my Supabase cloud account, so that my spiritual journey is accessible across all my devices.
15. As a Leitor accessing the legacy route `/minhas-notas`, I want to be redirected automatically to `/memorial`, so that bookmarks and old links continue working seamlessly.

---

## 4. Implementation Decisions

### Seams and Test Boundary
- **Unified Memory Seam**: `NoteStore` / `MemorialStore` interface serving as the single contract for both `SupabaseNoteStore` (authenticated cloud mode) and `LocalNoteStore` (local storage mode). All UI components consume this seam via `useNotebookContext`.

### Unified Database Schema & Migration
- Evolution of PostgreSQL table `user_notes`:
  - Removal of strict `UNIQUE (user_id, book_id, chapter, verse)` constraint to support multiple entries per chapter or verse.
  - Making `verse` a nullable integer (`INTEGER NULL`) to support chapter-level records.
  - Adding columns: `type` (`TEXT`), `title` (`TEXT`), `status` (`TEXT`), `favorite` (`BOOLEAN`), `answered_at` (`TIMESTAMPTZ`), `answered_note` (`TEXT`), `tags` (`TEXT[]`), and `metadata` (`JSONB`).
  - Automated migration of legacy notes setting `type = 'reflection'`.

### Metadata JSONB Payload Strategy
- Template-specific structured form fields stored in `metadata` (JSONB) to eliminate future SQL migrations when extending templates or adding attachments:
  - **Reflexão**: `{ soap: { scripture, observation, application, prayer } }`
  - **Oração**: `{ motivo, pedido, entrega }`
  - **Testemunho**: `{ o_que_aconteceu, como_deus_sustentou, data_fato }`
  - **Jejum**: `{ objetivo, data_inicio, data_prevista, acompanhamentos }`

### Expandable FAB & Fast Entry UX
- Expandable Floating Action Button in `ReadingPage` styled with discreet, non-vibrant color tokens matching Bíblia Vive visual identity:
  - Reflexão: Institutional Gold (`gold`)
  - Oração: Discreet Blue (`blue`)
  - Testemunho: Soft Green (`emerald`/`green`)
  - Jejum / Propósito: Slate Gray (`slate`)
- Opening creation sheet/modal pre-fills Bible context (`book_id`, `book_name`, `chapter`, `verse`, `version`, `created_at`) automatically.

### Page `/memorial` & Navigation
- Route `/memorial` presenting "Meu Memorial" with subtitle *"Aqui permanecem registradas as marcas da sua caminhada."*
- Permanent HTTP/router redirect from `/minhas-notas` to `/memorial`.
- Main menu links updated to "Meu Memorial".

---

## 5. Testing Decisions

### Behavioral Seam Testing
- Tests focus strictly on external behavior of `NoteStore`/`MemorialStore` adapters and React components, avoiding coupling to private state internals.
- Verification of dual-mode storage: verifying that CRUD operations, filtering by category, search matching, and deletion work identically in both `LocalNoteStore` and `SupabaseNoteStore`.

### Prior Art
- Existing unit and integration tests in `src/test/notesHighlights.test.ts`.
- Command for test suite execution: `npm test` and `npx tsc --noEmit`.

---

## 6. Out of Scope

- File, photo, audio, and document attachments (reserved for future phases via `metadata` extension).
- Exporting full PDF or CSV reports.
- Annual timeline visualization and spiritual heatmap.
- Public sharing of memorial entries.

---

## 7. Further Notes

- Strict adherence to Bíblia Vive design principles: quiet, reverent, spacious visual hierarchy; no productivity app, Notion, or Evernote aesthetics.
- Fully responsive: drawer-style sheet on mobile devices, clean modal/workspace panel on desktop.
