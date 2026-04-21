/**
 * leitura.js — Load test for reading a Bible chapter
 *
 * Scenario: Anonymous user reads a chapter of the Bible.
 * The SPA fetches the chapter JSON from /bible/{lang}/{version}/{book}/{book}.json
 * These files are served directly by Vercel CDN (static assets) — not Supabase.
 *
 * This test rotates through several books to avoid artificially warming a
 * single CDN cache entry, which would give falsely optimistic results.
 *
 * Ramp-up:
 *   0 →   1 VU  for 30 s  (smoke)
 *   1 →  50 VU  for  2 min
 *  50 → 150 VU  for  3 min
 * 150 VUs held  for  2 min
 * 150 → 0 VU   for 30 s
 *
 * Expected: CDN should serve 150 VUs with p95 < 300 ms.
 * At 150 VUs this is ~50–80 req/s. If error rate rises, check Vercel bandwidth.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { SITE_BASE, DEFAULT_THRESHOLDS } from './k6-config.js';

export const options = {
    stages: [
        { duration: '30s', target: 1 },
        { duration: '2m', target: 50 },
        { duration: '3m', target: 150 },
        { duration: '2m', target: 150 },
        { duration: '30s', target: 0 },
    ],
    thresholds: {
        ...DEFAULT_THRESHOLDS,
        // CDN should be fast — tighten the threshold
        'http_req_duration{name:chapter_json}': ['p(95)<500'],
    },
};

// Mix of books from different parts of the Bible to avoid a single cache entry.
// IMPORTANT: Use the LOCAL FILE ID (as stored on disk / served by Vercel),
// NOT the app URL slug. Mismatches cause the Vercel SPA rewrite to return
// the index.html shell instead of the JSON file (HTTP 200 but not JSON).
//
// Mapping reference (from bibleApi.ts SLUG_TO_LOCAL_ID):
//   sl  (Salmos route slug)  → ps  (disk file)
//   joa (João route slug)    → jo  (disk file)
//   pv  (Provérbios slug)    → prv (disk file)
//   ap  (Apocalipse slug)    → re  (disk file)
const CHAPTERS = [
    { version: 'acf', lang: 'pt-br', book: 'gn' }, // Gênesis       ✓ same slug/file
    { version: 'acf', lang: 'pt-br', book: 'ps' }, // Salmos 23     ✓ file is ps (NOT sl)
    { version: 'acf', lang: 'pt-br', book: 'prv' }, // Provérbios    ✓ file is prv (NOT pv)
    { version: 'acf', lang: 'pt-br', book: 'jo' }, // João          ✓ file is jo  (NOT joa)
    { version: 'acf', lang: 'pt-br', book: 're' }, // Apocalipse    ✓ file is re  (NOT ap)
    { version: 'nvi', lang: 'pt-br', book: 'gn' }, // Gênesis NVI   ✓
    { version: 'acf', lang: 'pt-br', book: 'rm' }, // Romanos       ✓ same slug/file
    { version: 'acf', lang: 'pt-br', book: 'mt' }, // Mateus        ✓ same slug/file
];

export default function () {
    // Pick a random chapter combination per iteration
    const entry = CHAPTERS[Math.floor(Math.random() * CHAPTERS.length)];

    // The SPA resolves the book's local ID automatically; we simulate the
    // exact URL the browser fetches:
    const jsonUrl = `${SITE_BASE}/bible/${entry.lang}/${entry.version}/${entry.book}/${entry.book}.json`;

    const res = http.get(jsonUrl, {
        tags: { name: 'chapter_json' },
    });

    check(res, {
        'status is 200': (r) => r.status === 200,
        'response is JSON': (r) => {
            const ct = r.headers['Content-Type'] || '';
            return ct.includes('application/json');
        },
        'has chapters array': (r) => {
            try {
                const data = JSON.parse(r.body);
                // Structure: { id, name, chapters: [[verse,...], ...] }
                return Array.isArray(data.chapters) && data.chapters.length > 0;
            } catch { return false; }
        },
    });

    // User reads a chapter — spend 5–15 s before requesting the next one
    sleep(Math.random() * 10 + 5);
}
