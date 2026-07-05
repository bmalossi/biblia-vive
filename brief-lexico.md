# Objective

Integrate the OpenScriptures HebrewLexicon into Bíblia Vive’s **“Língua”** tab, enriching the existing Strong’s-based study experience without breaking the current UX or data flow.

# Repository

- GitHub: `https://github.com/bmalossi/biblia-vive`

# Project context

The current original-language study panel is already implemented and working.

Key files involved:

- `src/components/StudyPanel.tsx`
- `src/lib/studyPanel.ts`
- `src/lib/strongs.ts`

Current architecture:

1. `StudyPanel.tsx` renders the **“Língua”** tab.
2. It uses `useStudyData(...)`, which calls `getStudyData(...)` from `src/lib/studyPanel.ts`.
3. `getStudyData(...)` loads `verseWords` using `getVerseWords(...)` from `src/lib/strongs.ts`.
4. `StudyPanel.tsx` also loads lexical entries with `getStrongsEntry(...)`.
5. Hebrew/Greek full verse text is loaded with `getOriginalVerseText(...)`.
6. Existing local data sources include:
   - `/data/strongs_hebrew.json`
   - `/data/strongs_greek.json`
   - `/data/verse_strongs_map.json`
   - `/bible/antigo_testamento_hebraico.json`
   - `/bible/novo_testamento_grego.json`

Current relevant types in `src/lib/strongs.ts`:

```ts
export interface StrongsEntry {
  number: string;
  word: string;
  translit: string;
  definition: string;
  definition_pt?: string;
  definition_es?: string;
  occurrences?: number;
}

export interface VerseWord {
  text: string;
  strongs: string | null;
  index: number;
}
```

Important constraint:
- Do **not** redesign the whole study panel.
- Do **not** break the current “quick meaning” UX.
- Treat the OpenScriptures HebrewLexicon as an **enrichment layer**, not a total rewrite.

# New source to integrate

Use this repository as the lexical source:

- `https://github.com/openscriptures/HebrewLexicon`

Relevant files from that source:

- `HebrewStrong.xml`
- `LexicalIndex.xml`
- `BrownDriverBriggs.xml`

# High-level goal

Keep the current panel behavior, but enrich each Hebrew lexical entry with additional structured data such as:

- lexical root
- lexical family / word group
- usage terms
- short BDB summary

The user experience should remain simple at first glance, but provide deeper study value when expanded.

# Tasks

## 1. Inspect the current “Língua” tab implementation

Review how the current language tab is rendered in `src/components/StudyPanel.tsx`, especially:

- how `activeTab === "language"` is handled
- how `originalText`, `hoveredWord`, and `clickedWord` are used
- how `strongsCache` is filled
- how lexical cards are rendered for each `verseWord`
- how `getStrongsEntry(...)` is consumed
- how `definition_pt`, `definition_es`, and `definition` are chosen by locale

Also inspect:

- `src/lib/studyPanel.ts`
- `src/lib/strongs.ts`

so the new integration follows the existing architecture.

## 2. Build an offline conversion pipeline for the OpenScriptures Hebrew lexicon

Create a script under `scripts/` (Node.js or Python) that parses:

- `HebrewStrong.xml`
- `LexicalIndex.xml`
- optionally `BrownDriverBriggs.xml`

and generates a new normalized JSON file for the site.

Target output file:

- `public/data/strongs_hebrew_os.json`

Each lexical entry should be keyed by Strong number, for example:

- `H1`
- `H7586`

or zero-padded if needed, but keep compatibility with the current project conventions.

Each generated JSON entry should include at least:

```ts
{
  number: string,
  word: string,
  translit: string,
  definition: string,
  definition_pt?: string,
  definition_es?: string,
  occurrences?: number,
  usage_tags?: string[],
  root?: string,
  word_group?: string,
  bdb_short?: string
}
```

Implementation notes:

- `definition` should come from the Strong-style lexical entry.
- `usage_tags` should be extracted from the XML `<usage>` field and normalized into an array.
- `root` and `word_group` should be inferred from `LexicalIndex.xml` whenever possible.
- `bdb_short` should be a short, compact summary derived from BDB data, not a massive raw dump.
- Preserve UTF-8 Hebrew text correctly.
- Do not produce a frontend-unfriendly raw XML dump.

## 3. Extend the current `StrongsEntry` type safely

In `src/lib/strongs.ts`, extend the existing type:

```ts
export interface StrongsEntry {
  number: string;
  word: string;
  translit: string;
  definition: string;
  definition_pt?: string;
  definition_es?: string;
  occurrences?: number;
  usage_tags?: string[];
  root?: string;
  word_group?: string;
  bdb_short?: string;
}
```

Do not remove existing fields.

Do not break existing callers.

## 4. Update the Hebrew loader to use the enriched dataset

Adjust the Hebrew loader logic in `src/lib/strongs.ts` so that Hebrew entries are loaded from:

- `/data/strongs_hebrew_os.json`

Keep the Greek flow untouched unless absolutely necessary.

`getStrongsEntry(...)` must continue to work with the same external API as before.

## 5. Keep `VerseWord` and `StudyData` stable

Do **not** change these contracts unless absolutely necessary:

- `VerseWord`
- `StudyData`

The existing panel already works and should continue to work with the new lexical data source.

The enrichment should happen through `StrongsEntry`, not by rewriting the verse-word model.

## 6. Enrich the “Língua” tab UI in `StudyPanel.tsx`

In the lexical card rendering inside the language tab:

### Keep existing sections:
- original word
- Strong code badge
- transliteration
- localized meaning
- occurrences

### Add optional new sections:
- **Raiz** → render when `entry.root` exists
- **Família lexical** → render when `entry.word_group` exists
- **Usos** → render `entry.usage_tags` as chips/tags when available
- **Resumo lexical** → render `entry.bdb_short` when available

Rules:
- All new sections must be optional.
- If data is missing, render nothing.
- Do not overload the UI.
- Preserve the current visual hierarchy.
- Keep the first visible information simple and educational.

## 7. Preserve the current interaction model

Do not break:

- hover highlight on the original-language verse text
- clicked word selection
- `hoveredWord` / `clickedWord`
- the current card selection behavior
- the current locale-based meaning resolution

The new lexical fields should enhance the selected-word card, not alter the interaction pattern.

## 8. Add attribution and documentation

Create a short documentation file:

- `docs/lexicon-hebrew.md`

It should explain:

- which source repositories were used
- which XML files were parsed
- how the JSON file is generated
- where the generated file is stored
- that OpenScriptures HebrewLexicon data must be properly attributed
- the relevant license / attribution notes for use in this project

Also add any required attribution text in the most appropriate project location if necessary.

## 9. Validation

At the end:

1. Run TypeScript validation:
   ```bash
   npx tsc --noEmit
   ```

2. Confirm the app still builds.

3. Verify that the “Língua” tab still works for at least one Hebrew verse and shows:
   - original word
   - transliteration
   - localized meaning
   - new lexical enrichment fields when available

# UX intent

The goal is **not** to turn the panel into a heavy academic tool only for specialists.

The goal is:

- keep the current fast and intuitive study flow
- make lexical study feel richer and more educational
- clearly show the user why Bíblia Vive offers more value than a basic Bible app

Think in layers:

1. quick meaning
2. deeper lexical insight
3. optional advanced lexical summary

# Constraints

- Do not rewrite the whole study panel.
- Do not remove existing meaning fields.
- Do not break PT-BR support.
- Do not block the UI with huge payloads.
- Prefer clean structured JSON generated offline over parsing XML in the browser.
- Keep changes production-safe and type-safe.

# Deliverables

- Offline script to parse OpenScriptures Hebrew lexicon files
- Generated enriched Hebrew lexicon JSON
- Updated `StrongsEntry` type
- Updated Hebrew loader in `src/lib/strongs.ts`
- Updated “Língua” tab UI in `src/components/StudyPanel.tsx`
- Documentation file `docs/lexicon-hebrew.md`
- Successful TypeScript validation

# Final output format

When finished, report:

1. which files were created or modified
2. what data fields were added
3. how the UI changed
4. whether TypeScript passed
5. any limitations or follow-up recommendations