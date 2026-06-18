Your task is to inspect the current application and implement a production-ready authenticated feature called “Chapter Notebook” (Portuguese UI naming should follow the terminology already used by the project, preferably “Caderno” or “Caderno do capítulo”).

Do not assume the framework, database, authentication provider, component library, routing model, or state-management solution. Inspect the repository first and follow its existing architecture and conventions.

IMPORTANT PRODUCT CLARIFICATION

The notebook must NOT contain, copy, or duplicate the full biblical chapter text.

It is only associated with the chapter from which it was created and must display contextual metadata such as:

- Livro/Capítulo: Romanos 8
- Tradução: ACF

The biblical text remains in the central reading interface. The notebook stores the user’s title and personal written content only.

The feature complements the existing verse-note functionality and must not replace, merge, migrate, or break it.

==================================================
PHASE 1 - REPOSITORY INSPECTION AND PLAN
==================================================

Before changing code, inspect and document:

1. Frontend framework, version, routing structure, rendering strategy, and relevant chapter-reading routes.
2. Backend/API architecture and server boundaries.
3. Database, ORM/query layer, migrations, and row-level security if present.
4. Authentication and user-session model.
5. Existing verse-note implementation, including schema, APIs, ownership checks, UI components, state handling, and account pages.
6. Existing design system, tokens, typography, colors, icons, buttons, drawers, dialogs, sheets, forms, editors, toasts, and responsive utilities.
7. Current desktop and mobile page structure shown on Bible chapter routes.
8. Existing bottom mobile navigation and all safe-area handling.
9. Existing testing, linting, formatting, type-checking, and build commands.
10. Existing localization conventions and whether interface strings are centralized.

Then produce a concise implementation plan before coding. The plan must list:

- database/schema changes;
- API/server operations;
- UI components;
- chapter-page integration points;
- account-area integration points;
- state and autosave strategy;
- authorization controls;
- test coverage;
- files expected to be created or modified.

Do not begin a broad refactor. Reuse existing patterns and dependencies wherever possible.

==================================================
PHASE 2 - FUNCTIONAL REQUIREMENTS
==================================================

Implement an authenticated chapter notebook feature with these capabilities:

1. A registered user can create multiple notebooks for the same Bible chapter.
2. Each notebook is associated with:
   - authenticated user;
   - Bible translation;
   - canonical book identifier or slug;
   - chapter number;
   - canonical display reference, where useful.
3. Each notebook contains:
   - optional title;
   - personal written content;
   - creation timestamp;
   - last-update timestamp.
4. The user can:
   - create;
   - open;
   - edit;
   - autosave;
   - minimize;
   - resume;
   - delete with confirmation;
   - browse notebooks from the current chapter;
   - browse/search notebooks from other chapters;
   - navigate from a notebook to its associated chapter.
5. The feature must preserve drafts during ordinary user mistakes or navigation transitions.
6. The existing verse-note feature must continue to work unchanged.

A user must NOT be restricted to one notebook per chapter.

==================================================
PHASE 3 - DATA MODEL
==================================================

Adapt names and types to the repository conventions. A likely entity is:

ChapterNotebook

Suggested fields:

- id
- userId / user_id
- title (nullable or optional)
- content
- translationId or translationSlug
- bookId or canonicalBookSlug
- chapterNumber
- canonicalReference (optional if derivable)
- createdAt
- updatedAt
- deletedAt only if the project already uses soft deletion
- revision/version field if needed for optimistic concurrency

Do not store the full biblical chapter or full verse text in the notebook record.

Add indexes appropriate for:

- user plus updated date;
- user plus book/chapter;
- user plus translation/book/chapter;
- text search only if supported by the existing database architecture.

Enforce ownership at the server/database layer for every read, create, update, and delete operation. Client-side checks are not authorization.

Validate that the requested translation, book, and chapter are legitimate according to the project’s Bible data model.

If rich text or HTML is stored, sanitize it at a trusted boundary. Prefer the project’s current editor/storage convention. Do not introduce unsafe HTML execution.

==================================================
PHASE 4 - DESKTOP UX
==================================================

Use the supplied product direction and the current Bíblia Vive chapter layout.

Add a floating notebook button in the lower-left area of Bible chapter pages.

Requirements:

1. It must remain visible without covering essential controls.
2. It must respect viewport edges and accessibility contrast.
3. It must have an accessible name, for example:
   - “Abrir caderno do capítulo”
   - when notebooks exist: “Abrir caderno do capítulo. 2 cadernos salvos neste capítulo.”
4. It should show a subtle state or badge when the current chapter already has notebooks.
5. It must not conflict with the mobile bottom navigation.

On desktop, clicking the button opens a left-side notebook workspace.

The workspace must:

- be anchored to the left side;
- expand from the left edge toward the center;
- occupy the usable vertical space beneath the fixed header, according to the existing layout;
- preserve the central Bible text in view on sufficiently wide screens;
- allow simultaneous reading and writing;
- remain open while the chapter is scrolled;
- support minimize and close actions;
- restore the current notebook, cursor position where practical, scroll state, and unsaved draft when reopened;
- avoid reducing the Bible column below a readable width.

Use a responsive width based on the existing design system, approximately:

clamp(340px, 28vw, 460px)

This is guidance, not a hard-coded requirement. Adapt it to the actual layout.

At intermediate widths, prefer an overlay drawer rather than squeezing the Bible reader into an unusable column.

Do not use a small chatbot popup for the editor on desktop. This is a writing workspace, not a chat widget.

Suggested desktop structure:

- header with “Meu caderno”, chapter context, minimize, and close;
- tabs or segmented controls:
  - “Neste capítulo”
  - “Todos os cadernos”
- current-chapter notebook list;
- “Novo caderno” action;
- selected notebook editor;
- title field;
- non-editable contextual line such as “Romanos 8 - ACF”;
- created/updated metadata;
- content editor;
- subtle autosave state;
- delete action with confirmation.

==================================================
PHASE 5 - MOBILE UX
==================================================

On mobile, do not attempt to keep the Bible and notebook side by side.

Implement the notebook as a bottom sheet or equivalent mobile sheet component already present in the project.

The mobile sheet must:

- rise from the bottom over the existing chapter page;
- respect the fixed bottom navigation and device safe-area insets;
- support a collapsed/peek state and an expanded near-full-screen state;
- preserve the chapter underneath;
- preserve the unsaved draft when minimized;
- handle the virtual keyboard without hiding the active field or actions;
- avoid accidental dismissal while the user is actively writing.

Recommended interaction:

1. Tap floating notebook button.
2. Open a compact or medium sheet showing:
   - “Meu caderno”;
   - current context, e.g. “Romanos 8 - ACF”;
   - notebooks from this chapter;
   - “Novo caderno”.
3. Selecting or creating a notebook expands the editor nearly full screen.
4. Provide a clear top control to alternate between:
   - “Bíblia”
   - “Caderno”
5. Choosing “Bíblia” minimizes or collapses the sheet enough to read the passage.
6. Choosing “Caderno” restores the editor with the same draft and state.

The user must never lose text merely because the sheet was collapsed, the Bible was viewed, the keyboard was dismissed, or the viewport orientation changed.

Use accessible sheet semantics, focus management, and escape/back-button behavior consistent with the framework and platform.

==================================================
PHASE 6 - NOTEBOOK LISTS AND ACCOUNT ACCESS
==================================================

Inside the chapter workspace, provide:

- notebooks from the current chapter;
- a way to access all user notebooks;
- recently edited notebooks;
- search when practical within the existing architecture.

In the authenticated account area, create or extend a notebook section.

Each notebook item should display:

- title or generated fallback title;
- book and chapter;
- translation;
- creation date;
- update date;
- short content preview.

Support at least:

- sort by recently updated;
- filter by book or translation if this fits existing UI patterns;
- search title and content if supported safely and efficiently;
- open/edit;
- delete with confirmation;
- navigate to the related Bible chapter.

Use a fallback title when the title is blank, for example:

“Estudo de Romanos 8 - 17/06/2026”

Do not require a title before the user can start writing.

==================================================
PHASE 7 - AUTOSAVE AND DRAFT SAFETY
==================================================

Implement robust debounced autosave.

Requirements:

1. Do not send a request on every keystroke.
2. Use an appropriate debounce interval based on existing application patterns.
3. Show a subtle state:
   - Salvando...
   - Salvo
   - Salvo localmente
   - Falha ao sincronizar
4. Prevent stale responses from overwriting newer edits.
5. Preserve a local draft when network save fails or the user temporarily goes offline.
6. Namespace local drafts by authenticated user and notebook/draft context.
7. Do not expose one user’s draft after another user logs into the same browser.
8. Clear obsolete local drafts after confirmed synchronization.
9. Flush or safely preserve pending changes before:
   - panel close;
   - chapter change;
   - account logout;
   - page unload where technically possible.
10. Avoid disruptive toast notifications for every successful save.

Use optimistic concurrency or an updated-at/version check if the architecture supports editing from multiple sessions. If a conflict occurs, do not silently discard either version. Present a recoverable conflict state or preserve the local content for manual recovery.

==================================================
PHASE 8 - AUTHENTICATION AND UNAUTHENTICATED USERS
==================================================

Bible reading must remain available without authentication.

If an unauthenticated visitor activates the notebook button:

- use the existing authentication flow;
- show contextual copy explaining the benefit, for example:
  “Entre ou crie uma conta gratuita para escrever e salvar seus estudos deste capítulo.”
- preserve the intended chapter context through the login flow where possible;
- return the user to the same chapter after successful authentication.

Do not create a separate or duplicate authentication implementation.

==================================================
PHASE 9 - RELATIONSHIP WITH VERSE NOTES
==================================================

Maintain a clear distinction:

- annotation/note on a verse = short content tied to one verse;
- chapter notebook = long-form content tied to the chapter.

Do not migrate or merge existing verse notes.

Do not reuse identical iconography or labels if doing so creates ambiguity.

Design the new schema and component API so a future release may associate selected verse numbers or ranges with a notebook. This future capability must not require storing complete verse text.

Do not implement advanced verse linking now unless it is straightforward and does not increase risk to the existing verse-selection system.

==================================================
PHASE 10 - EDITOR REQUIREMENTS
==================================================

Reuse an existing editor if the project already has one.

For the first release, prioritize reliability over advanced document formatting.

At minimum, support:

- multiline text;
- paragraphs and line breaks;
- undo/redo through native or editor behavior;
- keyboard navigation;
- accessible label and description;
- paste without broken or unsafe markup;
- comfortable long-form writing;
- mobile keyboard compatibility.

Only add rich text, Markdown, toolbar controls, or new editor dependencies if they are already part of the project or clearly justified.

Set reasonable title and content limits and provide user-friendly validation messages.

==================================================
PHASE 11 - ACCESSIBILITY
==================================================

The complete feature must:

- be operable by keyboard;
- use visible focus states;
- restore focus to the floating button when the workspace closes;
- manage focus correctly in drawer/sheet modes;
- expose clear screen-reader labels;
- announce save errors without relying only on color;
- respect reduced-motion settings;
- maintain sufficient contrast in light and dark themes if both exist;
- avoid trapping users inside the editor;
- support browser zoom and responsive text;
- provide an accessible deletion-confirmation dialog.

Do not create an inaccessible custom sheet when an established accessible component is already available.

==================================================
PHASE 12 - ERROR, EMPTY, AND LOADING STATES
==================================================

Implement explicit states for:

- loading notebooks;
- no notebooks for this chapter;
- no notebooks in the account;
- creation failure;
- save failure;
- delete failure;
- offline local draft;
- invalid chapter context;
- unavailable translation;
- notebook deleted in another session;
- concurrent update conflict;
- expired authentication session.

Errors must not erase the editor content.

==================================================
PHASE 13 - TESTING
==================================================

Use the repository’s existing testing tools and conventions.

Add or update tests for:

DATA AND AUTHORIZATION

- authenticated user can create a notebook;
- user can create multiple notebooks for the same chapter;
- user can read only their own notebooks;
- user can update only their own notebooks;
- user can delete only their own notebooks;
- invalid book/chapter/translation is rejected;
- notebook records do not contain duplicated full chapter text.

DESKTOP UI

- floating button appears on chapter pages;
- badge/state reflects existing chapter notebooks;
- left workspace opens and closes;
- main reading area remains usable;
- current chapter context is correct;
- existing notebook can be selected and edited;
- minimized workspace preserves the draft.

MOBILE UI

- bottom sheet opens from the floating button;
- collapsed and expanded states work;
- Bible/Notebook switch preserves state;
- bottom navigation and safe area remain usable;
- mobile keyboard does not hide the active editor controls;
- back/close behavior does not silently lose content.

AUTOSAVE

- input is debounced;
- latest edit wins over stale responses;
- failed network save preserves a local draft;
- successful synchronization clears obsolete local data;
- logout does not expose the previous user’s draft.

ACCOUNT AREA

- notebooks are listed with correct metadata;
- fallback title is shown when title is empty;
- search/filter behavior works if implemented;
- notebook opens correctly;
- navigation to associated chapter works;
- deletion requires confirmation.

REGRESSION

- existing verse notes still work;
- chapter reading still works;
- chapter navigation still works;
- audio, comparison mode, display settings, and other existing chapter controls remain functional;
- unauthenticated reading remains functional.

Where the project has end-to-end testing, add one complete flow covering creation on a chapter page, automatic save, minimization, reopening, account retrieval, editing, and deletion.

==================================================
PHASE 14 - IMPLEMENTATION CONSTRAINTS
==================================================

- Do not rewrite unrelated areas.
- Do not alter the canonical Bible route structure unless unavoidable.
- Do not duplicate full chapter text in notebook records.
- Do not restrict users to one notebook per chapter.
- Do not discard drafts silently.
- Do not rely on client-side ownership checks.
- Do not add AI-generated interpretation or writing assistance in this task.
- Do not break or merge verse notes.
- Do not introduce a large editor dependency without justification.
- Do not claim completion without running the available validation commands.
- Preserve the existing Bíblia Vive visual identity rather than copying the conceptual mockup literally.

==================================================
PHASE 15 - VALIDATION AND DELIVERY
==================================================

After implementation, run all applicable repository commands, including:

- formatter/check;
- lint;
- type-check;
- unit/integration tests;
- end-to-end tests where available;
- production build.

Fix failures caused by the implementation.

Then provide a final implementation report containing:

1. Architecture adopted.
2. Database migration/schema changes.
3. Created and modified files.
4. Authorization and ownership enforcement.
5. Desktop behavior.
6. Mobile bottom-sheet behavior.
7. Autosave and local-draft strategy.
8. Account notebook access.
9. Tests added and exact results.
10. Build/lint/type-check results.
11. Manual QA checklist.
12. Remaining limitations and recommended next steps.

Before editing files, inspect the repository and present the implementation plan. Then proceed with the implementation unless a genuine blocking ambiguity is found.