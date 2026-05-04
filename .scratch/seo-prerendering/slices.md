# SEO Prerendering - Vertical Slices

## Slice 1: SEO Placeholders in index.html
**Type:** AFK  
**Blocked by:** None - can start immediately  
**User stories covered:** 3, 4, 5, 6, 10, 11

Add 10 HTML comment placeholders to `<head>` in `index.html`:
- `META_TITLE`, `META_DESCRIPTION`, `CANONICAL_URL`
- `OG_URL`, `OG_TYPE`, `OG_TITLE`, `OG_DESCRIPTION`, `OG_IMAGE`
- `TWITTER_CARD`, `JSON_LD`

The `usePageMeta` hook remains unchanged - it continues injecting meta at runtime for real users.

---

## Slice 2: JSON-based Prerender Script
**Type:** AFK  
**Blocked by:** 1  
**User stories covered:** 1, 2, 10, 11

Create `scripts/prerender.mjs` that:
- Reads `dist/index.html` as template
- Reads `src/data/books.json` for 66 books
- Reads each book JSON from `public/bible/pt-br/acf/{slug}/{slug}.json`
- Generates `dist/acf/{slug}/{N}/index.html` for each chapter (~1,189 files)
- Replaces all 10 placeholders per chapter
- Prints final report with count of generated files

---

## Slice 3: JSON-LD Schema.org/Chapter
**Type:** AFK  
**Blocked by:** 2  
**User stories covered:** 9, 13

Enhance prerender script to include JSON-LD:
- `@type: "Chapter"`
- `name`: "{BookName} {N} — ACF"
- `position`: chapter number
- `isPartOf`: Book → Bible entity
- `text`: first 3 verses concatenated

---

## Slice 4: Sitemap Generation
**Type:** AFK  
**Blocked by:** 2  
**User stories covered:** 12

Add sitemap generation to prerender script:
- Generate `dist/sitemap.xml`
- Include all canonical URLs: 1,189 chapters + `/planos` + home
- Standard sitemap schema with lastmod, changefreq, priority

---

## Slice 5: Build Integration & Planos Page
**Type:** AFK  
**Blocked by:** 2  
**User stories covered:** 2

- Update `package.json`: `build: "vite build && node scripts/prerender.mjs"`
- Add `prerender: "node scripts/prerender.mjs"` script
- Generate `dist/planos/index.html` with static meta tags for Planos page
- No changes to `vercel.json` needed

---

## Slice 6: Unit Tests for Prerender Script
**Type:** AFK  
**Blocked by:** 2  
**User stories covered:** 15, 16, 17, 18

Add vitest tests:
- Given mock book JSON (2 chapters), generates exactly 2 HTML files
- HTML contains `<title>` with format "{BookName} {N} — ACF | Bíblia Vive"
- HTML contains `<link rel="canonical">` with absolute URL
- HTML contains `<script type="application/ld+json">` with correct Chapter schema
- `sitemap.xml` contains all expected canonical URLs

---

## Summary

| Slice | Title | Type | Blocked by |
|-------|-------|------|------------|
| 1 | SEO Placeholders in index.html | AFK | - |
| 2 | JSON-based Prerender Script | AFK | 1 |
| 3 | JSON-LD Schema.org/Chapter | AFK | 2 |
| 4 | Sitemap Generation | AFK | 2 |
| 5 | Build Integration & Planos | AFK | 2 |
| 6 | Unit Tests | AFK | 2 |

**Total: 6 slices, all AFK**