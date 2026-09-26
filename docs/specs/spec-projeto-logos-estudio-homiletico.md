# Spec: Projeto Logos — Estúdio Homilético 3x4, Modo Púlpito e Guardião do Evangelho (Gálatas 1:8)

## Problem Statement

Atualmente, o mercado de software e inteligência artificial para o contexto cristão comete o erro de oferecer "geradores automáticos de sermão". Essas ferramentas produzem esboços impessoais e mecânicos, transformando o pregador em um mero leitor de algoritmos, incentivando a preguiça hermenêutica e enfraquecendo a reverência diante do altar.

Por outro lado, pastores e líderes enfrentam bloqueios comuns na preparação de mensagens: começam pela introdução sem saber onde o sermão vai terminar, diluem tópicos repetindo a mesma ideia com palavras diferentes, sofrem com telas de tablets ou celulares apagando no púlpito durante o culto, e correm o risco involuntário de pregar a mesma mensagem repetida na mesma comunidade ou de desviar o foco da Graça de Cristo para fórmulas humanistas de autoajuda ou moralismo legalista.

## Solution

O Projeto Logos transforma a plataforma Bíblia Vive em uma oficina de capacitação homilética e proteção teológica para o Pregador (Leitor Templo). A IA não escreve o sermão pelo pregador; ela atua como um provocador pedagógico e guardião doutrinário:

1. **Semente no Memorial ("Eu e Deus"):** Captura a faísca espiritual cotidiana em uma categoria dedicada no Memorial (`inspiration`), exigindo registro reflexivo de 3 a 5 linhas.
2. **Estúdio Homilético 3x4:** Conduz o estudo pelo Método da Marcha-Ré (definição obrigatória do Desfecho antes dos blocos) com Desbloqueio Progressivo e Edição Livre, Trava Anti-Esegese (Ancoradouro de Intenção Original), e o desenvolvimento dos tópicos da inspiração em 4 degraus inegociáveis (Fato, Porquê, Contraste e Tensão), com guardrail rígido de 1 a 4 tópicos.
3. **Persistência Serverless no Cloudflare D1:** Toda a estrutura de sermões e históricos de ministração reside no SQLite de borda da Cloudflare com autenticação JWT do Supabase, contornando o limite de armazenamento excedido do PostgreSQL.
4. **Modo Púlpito Solene:** Interface imersiva e de alto contraste com Screen Wake Lock API (tela sempre ativa), cronômetro discreto, pílulas de versículos expansíveis em cards flutuantes, marcadores visuais de tom de voz e registro estruturado pós-pregação para prevenção de duplicidade na mesma congregação.
5. **Guardião do Evangelho (Gálatas 1:8):** Auditoria tipada sob demanda via Modelo JEV (TypeSafe AI) avaliando centralidade na Graça e ausência de desvios (prosperidade, autoajuda, moralismo sem graça), com alerta solene direcionado à consciência pastoral do pregador.

## User Stories

1. As a Pregador, I want to record an "Inspiração Homilética" in Meu Memorial with a mandatory 3-5 line spiritual flow capture, so that I preserve the initial divine spark before developing a sermon.
2. As a Pregador, I want to click a dedicated button on an inspiration note in Meu Memorial to launch the 3x4 Homiletic Studio, so that I seamlessly transition from daily devotion to sermon preparation.
3. As a Pregador, I want to access a central Studio Dashboard at `/estudio`, so that I can manage my sermon drafts, finished outlines, and past preaching logs in one place.
4. As a Visitante or Leitor Gratuito/Pro, I want to see an institutional explanation and upgrade prompt when visiting `/estudio`, so that I understand this feature is exclusive to the Templo plan.
5. As a Pregador, I want the studio to enforce the Reverse Method (Marcha-Ré) by requiring me to select an intended Desfecho (Consolação, Confronto, Conversão, Oração) and outcome description before unlocking topic drafting, so that my message has an intentional destination from the start.
6. As a Pregador, I want progressive unlock with free retroactive editing in the studio, so that I am guided pedagogically without being locked out from adjusting my conclusion later.
7. As a Pregador, I want to complete the Anti-Eisegesis checkpoint ("Qual era a intenção do autor sagrado para os primeiros ouvintes deste texto?") at the end of Block 1, so that my message is compelled to honor the historical and biblical context.
8. As a Pregador, I want my answer to the original intent question to be automatically reused as the contextual header of Block 1, so that I build the outline as I answer.
9. As a Pregador, I want Block 2 (Pregar a Inspiração) to initialize with exactly 3 default topic slots, so that the classic homiletic structure is presented immediately.
10. As a Pregador, I want to add or remove topics in Block 2 within a strict range of 1 to 4 topics, so that I maintain homiletic focus and prevent sprawling, disjointed outlines.
11. As a Pregador, I want every active topic in Block 2 to enforce the 4 Stepwise Developments (Degrau A: O Fato, Degrau B: O Porquê, Degrau C: O Contraste, Degrau D: A Tensão/Gancho), so that each sub-point meaningfully advances the thought instead of repeating words.
12. As a Pregador, I want to complete Block 3 (Aplicar à Vida Real), so that my sermon directly addresses the congregation's real-life circumstances on Monday morning.
13. As a Pregador, I want to craft the Introduction last with an engaging entry hook, so that my introductory words reflect the fully defined journey of the sermon.
14. As a Pregador, I want my sermon outline to automatically persist to the Cloudflare D1 repository, so that my work is synchronized across my phone, tablet, and desktop without consuming Supabase storage quotas.
15. As a Pregador, I want to trigger a Test of Orthodoxy (`[ 🏛️ Testar Ortodoxia ]`), so that I can verify alignment with classical theological exposition (Barnes, Henry, Gill) retrieved via RAG.
16. As a Pregador, I want the Guardian of the Gospel (Gálatas 1:8) to evaluate my outline using the JEV model on demand or before entering the pulpit, so that I am alerted if humanistic self-help, prosperity theology, or graceless moralism creeps into my message.
17. As a Pregador, I want the Gálatas 1:8 warning to appear as a solemn pastoral alert rather than a rigid mechanical block, so that my pastoral conscience is provoked while preserving my ministerial responsibility.
18. As a Pregador, I want to click `[ 📖 Pregar Agora ]` to enter Pulpit Mode at `/pulpito/[sermonId]`, so that I can preach from an altar-focused interface devoid of distractions.
19. As a Pregador, I want Pulpit Mode to activate the Screen Wake Lock API, so that my tablet or smartphone screen never dims or sleeps while I am preaching.
20. As a Pregador, I want Pulpit Mode to feature high-contrast, noble serif typography and an arm's-length readable layout, so that I can read comfortably from the pulpit.
21. As a Pregador, I want visual markers for dynamics and tone of voice (`[ 💡 Ilustração ]`, `[ 🤫 Pausa Silenciosa ]`, `[ ⚡ Tom de Voz / Apelo ]`), so that I maintain vocal and rhetorical intentionality during delivery.
22. As a Pregador, I want scripture references in Pulpit Mode to appear as interactive pills that open an in-place floating drawer/card, so that I can consult the full biblical text without losing my place in the outline.
23. As a Pregador, I want a discreet elapsed-time stopwatch at the top of Pulpit Mode, so that I can pace my sermon without looking at a distracting wristwatch or clock.
24. As a Pregador, I want a top sermon map with pills for smooth scrolling to major blocks, so that I can navigate sections smoothly if time runs short.
25. As a Pregador, I want a post-preaching prompt upon ending Pulpit Mode to record the church name, city, date, and spiritual impact in `preaching_logs`, so that I prevent accidental repetition of the same sermon in the same community in the future.
26. As a Pregador, I want an optional checkbox on the post-preaching screen to publish a personal summary to Meu Memorial as a Testemunho, so that my personal walk records God's faithfulness at the altar.

## Implementation Decisions

### Architectural Decisions & Storage
- **Edge Persistence Layer (Cloudflare D1):** Sermons, topics, and preaching history are stored in SQLite at the Cloudflare Edge via a dedicated Cloudflare Worker. This circumvents the 500 MB quota ceiling of the Supabase PostgreSQL database while leveraging Cloudflare's 5 GB free tier.
- **Unified Authentication:** Client requests carry the existing Supabase Auth JWT in the `Authorization: Bearer <token>` header. The Cloudflare Worker validates the token's cryptographic signature and enforces row-level isolation by matching `user_id`.
- **Decoupled Cross-Database References:** References from D1 sermons to Supabase Memorial notes (`inspiration_note_id`) are stored as logical UUID strings without cross-database foreign key constraints.

### Homiletic Studio Engine (3x4)
- **Marcha-Ré Progression Lock:** Block 1 (Explicar o Texto), Block 2 (Pregar a Inspiração), Block 3 (Aplicar à Vida Real), and the Introduction are initially locked until the Desfecho Homilético (type: Consolação | Confronto | Conversão | Oração, plus text) is committed. Once unlocked, the preacher retains full freedom to edit any section at any time.
- **Anti-Eisegesis Gate:** Block 2 remains locked until the preacher fills in the mandatory original intent question ("Qual era a intenção do autor sagrado para os primeiros ouvintes deste texto?"). The response is automatically injected as the contextual header of Block 1 in the final outline.
- **Block 2 Guardrails:** Initializes with 3 topics. Preachers can delete down to 1 topic or add up to a maximum of 4 topics. Every active topic strictly inherits the 4 Stepwise Development fields (Degrau A: Fato, Degrau B: Porquê, Degrau C: Contraste, Degrau D: Tensão/Gancho).

### AI Infrastructure & Gospel Guardian (Gálatas 1:8)
- **Decoupled JEV Payload:** The state sent to the TypeSafe AI JEV evaluator is strictly self-contained and does NOT include the 30 Memorial notes used by ScriptureThread. The payload consists of:
  - `biblical_passage_text`: Scriptural base text.
  - `sermon_initial_spark`: "Eu e Deus" capture.
  - `sermon_intended_outcome`: Marcha-Ré Desfecho.
  - `sermon_block_1_exegesis`: Historical context and author intent.
  - `sermon_block_2_topics`: Active topics with their 4 Degraus (A, B, C, D).
  - `sermon_block_3_application`: Monday morning practical application.
- **RAG vs JEV Boundary:** Historical commentaries (Barnes, Henry, Gill) are retrieved via existing RAG pipelines during Block 1 study. The JEV model functions purely as a System One evaluator executing `Noul` (`is_grace_centered`) and `Choice` (`theological_deviation`: `Teologia_Prosperidade` | `Humanismo_SelfHelp` | `Moralismo_Sem_Graca` | `Fiel_Ao_Texto`).
- **Milestone Auditing:** The Gospel Guardian runs on demand (via `[ 🏛️ Testar Ortodoxia ]`) and upon clicking `[ 📖 Pregar Agora ]`. If deviation confidence is $\ge 0.85$, a solemn theological alert is rendered with pastoral reflection options rather than a hard UI block.

### Altar Phase (Pulpit Mode)
- **Screen Wake Lock:** Integrates `navigator.wakeLock.request('screen')` on mount with graceful fallback and release on unmount or manual exit.
- **Visual Rhetoric Markers:** Standardized markdown or inline tag chips for `[ 💡 Ilustração ]` (amber), `[ 🤫 Pausa Silenciosa ]` (blue), and `[ ⚡ Tom de Voz / Apelo ]` (gold).
- **Repetition Warning:** When opening a sermon, the Studio queries `preaching_logs` in D1 for matching community names and displays a warning if previously delivered.

## Testing Decisions

### What Makes a Good Test
Tests must verify observable external behavior and contracts rather than internal component state or arbitrary CSS classes:
- Verifying that interactive fields become accessible or remain inaccessible based on progression rules.
- Verifying that API calls to the Cloudflare Worker carry valid authentication headers and strict payload shapes.
- Verifying that solemn warnings appear when confidence thresholds are exceeded.
- Verifying that exiting Pulpit Mode prompts for ministry logs and submits records to D1.

### Tested Modules & Seams
1. **Homiletic Studio Integration Seam (`SermonStudio.test.tsx`):**
   - Tests the Marcha-Ré lock and unlock cycle.
   - Tests the Anti-Eisegesis question requirement and header reflection.
   - Tests topic addition/removal limits (1 to 4) and 4-step field rendering.
   - Tests `[ 🏛️ Testar Ortodoxia ]` button triggering evaluation.
2. **Pulpit Mode Integration Seam (`PulpitMode.test.tsx`):**
   - Tests Wake Lock API acquisition and release.
   - Tests interactive scripture pill clicking and floating card presentation.
   - Tests stopwatch timer operation.
   - Tests preaching conclusion flow and log persistence.
3. **Edge Worker & Service Contract Seam (`homileticWorker.test.ts` & `jevHomileticService.test.ts`):**
   - Tests JWT validation, authorization failure, and D1 SQLite operations for `sermons` and `preaching_logs`.
   - Tests JEV evaluator payload construction and response parsing.

### Prior Art
- `src/tests/MemorialPageRedesign.test.tsx` & `src/tests/MemorialEntryModal.test.tsx` for modal interactions and note lifecycle.
- `src/tests/bibleSearchClient.test.ts` & `src/tests/bibleSearchIntegration.test.ts` for Cloudflare Worker edge testing.
- `src/test/scriptureThread.test.ts` for JEV evaluator response assertions.

## Out of Scope

- Automatic sermon generation or AI writing of paragraphs (strictly prohibited by the project philosophy).
- Offline synchronization queue (IndexedDB/ServiceWorker background sync) for sermons — network connectivity is assumed for D1 persistence in MVP.
- Audio recording or real-time transcription during pulpit delivery.
- Multi-user collaborative co-authoring of sermons in real time.
- Direct integration or automated slide generation for projection software (handled separately by Modo Igreja).

## Further Notes

- All persistent terminology aligns with the canonical definitions in `CONTEXT.md`.
- Storage and edge routing follow the precedent established in ADR-0014 and the dedicated homiletic decisions in ADR-0015 and ADR-0016.
- The feature is gated strictly to users with the active `Templo` plan.
