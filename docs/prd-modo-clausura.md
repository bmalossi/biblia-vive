# PRD — Modo Clausura

---

## Problem Statement

Ao ler e meditar nas Escrituras na Bíblia Vive, o leitor entra em um estado contemplativo de silêncio e permanência. A presença constante de elementos periféricos de interface — como cabeçalho, rodapé, barra de navegação móvel, seletores de versão, menus e botões flutuantes — concorre com o texto bíblico e gera ruído cognitivo durante a meditação profunda.

---

## Solution

Implementar o **Modo Clausura** na tela de leitura bíblica (`ReadingPage`): um sistema de inatividade inteligente que desvanece toda a interface periférica do usuário via opacidade suave após 30 segundos de silêncio, deixando exposto exclusivamente o texto bíblico. A restauração da interface é instantânea ao detectar qualquer toque, clique, pressionamento de tecla ou movimento significativo do mouse (> 10px). A rolagem da página (`scroll`) não cancela o Modo Clausura, permitindo ao leitor continuar navegando e lendo sem interromper o estado imersivo.

---

## User Stories

1. As a Leitor reading a Bible chapter, I want the surrounding interface (header, footer, mobile navigation, version selector, and page floating action buttons) to softly fade out after 30 seconds of inactivity, so that I can meditate on scripture without cognitive noise or visual distractions.
2. As a Leitor in Modo Clausura, I want the Bible text container to remain in its exact position without any layout shift or reflow, so that my reading flow is completely undisturbed.
3. As a Leitor in Modo Clausura, I want any hidden UI buttons to become non-clickable (`pointer-events-none`) while faded out, so that I don't accidentally trigger actions while touching or clicking near invisible controls.
4. As a Leitor in Modo Clausura, I want moving my mouse by more than 10 pixels to instantly restore the full interface, so that micro-hand vibrations or accidental sub-pixel movements do not prematurely exit Clausura mode.
5. As a Leitor in Modo Clausura, I want any touch event on a mobile screen, mouse click, or key press to instantly bring back the entire interface without delay, so that I can access controls whenever I intend to.
6. As a Leitor in Modo Clausura on mobile or desktop, I want scrolling down or up through the Bible chapter to keep the interface hidden, so that I can continue reading through long passages without bringing back the menus.
7. As a Leitor interacting with a modal (such as NoteModal, AuthModal, or VerseCardModal), I want Modo Clausura to be disabled, so that the interface never fades out while I am filling out a form or reading a dialog.
8. As a Leitor with the Study Panel (`StudyPanel`) open, I want Modo Clausura to be disabled, so that my study workflow remains visible and interactive.
9. As a Leitor with a verse selected (`VerseToolbar` active), I want Modo Clausura to be disabled, so that my verse action options do not disappear while I am deciding what action to take.
10. As a Leitor listening to Bible audio narration or TTS playback, I want Modo Clausura to be disabled while audio is actively playing, so that playback controls remain accessible throughout the listening session.
11. As a Leitor exiting Modo Clausura, I want the UI elements to reappear with instant responsiveness (`duration-0`), so that the interface feels snappy and immediately ready for action.
12. As a Leitor using the global notebook floating button (`GlobalNotebookContainer`), I want the global floating button to remain visible on the app shell level during Clausura, so that global app features remain predictably reachable.

---

## Implementation Decisions

- **Custom Hook `useInactivity`**: High-level reactivity hook receiving `timeoutMs` (30000ms by default), `disabled` (boolean condition flag), and `mouseThreshold` (10px). Exposes `{ isInactive, resetTimer }`.
- **Event Listeners**: Registers passive event listeners for `mousemove` (evaluated against euclidean distance `Math.hypot(dx, dy) > 10`), `mousedown`, `touchstart`, and `keydown`. Consciously excludes `scroll` events from resetting the inactivity timer.
- **Invalidation Flags**: `isClausuraDisabled` in `ReadingPage` evaluates `isStudyPanelOpen || isNoteModalOpen || isAuthModalOpen || isCardModalOpen || isEchoModalOpen || isSettingsOpen || isChapterPickerOpen || rateLimitStatus.open || !!selectedVerse || isAudioPlaying`.
- **Styling & Transition Architecture**: Uses Tailwind opacity and pointer event utility classes (`transition-opacity duration-1000 opacity-0 pointer-events-none`) for fade-out and `duration-0 opacity-100` for instant fade-in.
- **DOM Stability Guarantee**: No structural conditional unmounting (`if (isClausuraActive) return null`) for main layout elements; opacity manipulation prevents layout recalculations or DOM re-renders.

---

## Testing Decisions

- **Test Seams**:
  1. `useInactivity` Hook Unit Test Seam (Primary): Tested via Vitest and `@testing-library/react-hooks` with `vi.useFakeTimers()`. Validates 30s timeout firing, mousemove threshold logic (>10px vs <10px), touchstart reset, keydown reset, scroll event exclusion, and `disabled` prop state updates.
  2. `Layout` / `ReadingPage` Render Seam (Secondary): Component integration check asserting that `pointer-events-none` and `opacity-0` Tailwind classes are applied to header/footer containers when `isClausuraActive` is true.
- **Prior Art**: Extends existing hook testing patterns in `src/tests/` using Vitest.

---

## Out of Scope

- Audio player auto-hiding during playback (per user decision, audio playback blocks Clausura).
- Custom user configuration for Clausura timeout duration in settings (fixed at 30 seconds for MVP).
- On-screen toast notifications or visual badges indicating Clausura state (fade out is 100% silent and discreet).

---

## Further Notes

- Aligned with domain glossary `CONTEXT.md` term **Modo Clausura**.
- Aligned with Architectural Decision Record [`docs/adr/0010-modo-clausura.md`](file:///c:/Users/sorai/Desktop/Bruno/Projetos/Biblia/biblia-vive-leitura-main/docs/adr/0010-modo-clausura.md).
