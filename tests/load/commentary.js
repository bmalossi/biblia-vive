/**
 * commentary.js — Load test for the Supabase Edge Function "commentary"
 *
 * Scenario: A PRO user requests an AI commentary for a Bible verse.
 * This calls the real Supabase Edge Function which hits OpenAI — expect 3–10 s latency.
 *
 * ─── COST WARNING ───────────────────────────────────────────────────
 * Each iteration calls OpenAI gpt-4o-mini (a few cents per call).
 * This test is capped at MAX_ITERATIONS to avoid unexpected bill.
 * Run conservatively: 5 VUs × 20 iterations = 100 API calls max ≈ R$ 0.30.
 *
 * ─── Auth ───────────────────────────────────────────────────────────
 * Login happens once in setup() — same pattern as supabase-rest.js.
 *
 * ─── Run command ────────────────────────────────────────────────────
 * k6 run -e TEST_EMAIL="seu@email.pro" -e TEST_PASSWORD="suasenha" tests/load/commentary.js
 *
 * ─── What to look for ───────────────────────────────────────────────
 * - p95 < 10 s  → Edge Function + OpenAI healthy
 * - HTTP 429    → Supabase Edge or OpenAI rate-limiting your key
 * - HTTP 401    → JWT expired mid-test (should not happen; JWT lasts 1 h)
 * - HTTP 504    → Edge Function timeout (check Supabase function logs)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { SUPABASE_URL, EDGE_THRESHOLDS, supabaseHeaders, supabaseSignIn, ANON_KEY } from './k6-config.js';

// Hard cap to protect OpenAI budget
const MAX_ITERATIONS = 20;

export const options = {
    // Use scenarios instead of stages for iteration cap
    scenarios: {
        commentary_load: {
            executor: 'per-vu-iterations',
            vus: 5,
            iterations: MAX_ITERATIONS,
            maxDuration: '10m',
        },
    },
    thresholds: {
        ...EDGE_THRESHOLDS,
        'http_req_duration{name:commentary}': ['p(95)<10000'],
        'http_req_failed{name:commentary}': ['rate<0.05'], // 5 % tolerance for AI timeouts
    },
};

// Passages to rotate — use the APP ROUTE slug (bookId) as the Edge Function expects it.
// The `bookId` field matches the book's app-level identifier (same as route slug).
// The Edge Function body params (line 217 of index.ts):
//   const { bookId, chapter, verse, verseText, version, language } = body;
// Required: bookId, chapter. Others optional.
const PASSAGES = [
    { bookId: 'gn', chapter: 1, verse: 1, verseText: 'No princípio criou Deus o céu e a terra.' },
    { bookId: 'gn', chapter: 1, verse: 3, verseText: 'E disse Deus: Haja luz; e houve luz.' },
    { bookId: 'mt', chapter: 5, verse: 3, verseText: 'Bem-aventurados os pobres de espírito.' },
    { bookId: 'rm', chapter: 8, verse: 28, verseText: 'E sabemos que todas as coisas contribuem juntamente para o bem.' },
    { bookId: 'sl', chapter: 23, verse: 1, verseText: 'O Senhor é o meu pastor; nada me faltará.' },
];

export function setup() {
    const email = __ENV.TEST_EMAIL;
    const password = __ENV.TEST_PASSWORD;

    if (!email || !password) {
        console.warn(
            '[commentary] TEST_EMAIL / TEST_PASSWORD not set. ' +
            'Run with: k6 run --env-file tests/load/.env.load-test tests/load/commentary.js'
        );
        return { jwt: null };
    }

    const jwt = supabaseSignIn(email, password);
    if (!jwt) {
        console.error('[commentary] Login failed — aborting.');
        return { jwt: null };
    }

    console.log('[commentary] Auth OK. Starting Edge Function load test (5 VUs × 20 iterations).');
    return { jwt };
}

let iterationCount = 0;

export default function (data) {
    const { jwt } = data;

    if (!jwt) {
        console.warn('[commentary] No JWT available — skipping iteration.');
        return;
    }

    const passage = PASSAGES[iterationCount % PASSAGES.length];
    iterationCount++;

    // Body must match Edge Function destructure:
    // const { bookId, chapter, verse, verseText, version, language } = body;
    const payload = JSON.stringify({
        bookId: passage.bookId,
        chapter: passage.chapter,
        verse: passage.verse,
        verseText: passage.verseText,   // optional but helps OpenAI focus on the verse
        language: 'pt',                // request Portuguese response
    });

    // Supabase Edge Functions require both Authorization AND apikey headers
    const headers = {
        ...supabaseHeaders(jwt),
        'apikey': ANON_KEY,             // required by Supabase Edge gateway
    };

    const res = http.post(
        `${SUPABASE_URL}/functions/v1/commentary`,
        payload,
        {
            headers,
            tags: { name: 'commentary' },
            timeout: '30s',
        }
    );

    // Edge Function response shape: { response: "<JSON string>", cached: bool }
    // The inner JSON string has shape: { status, count, commentaries: [...] }
    check(res, {
        'commentary status 200': (r) => r.status === 200,
        'response has commentary': (r) => {
            try {
                const outer = JSON.parse(r.body);
                // Could be cached hit or fresh — both have `response` field
                if (typeof outer.response === 'string') {
                    const inner = JSON.parse(outer.response);
                    return Array.isArray(inner.commentaries) || inner.status === 'unavailable';
                }
                return false;
            } catch { return false; }
        },
    });

    if (res.status !== 200) {
        console.warn(`[commentary] Unexpected status ${res.status}: ${res.body.slice(0, 300)}`);
    } else {
        // Log whether response was cached (to distinguish OpenAI cost from cache hits)
        try {
            const outer = JSON.parse(res.body);
            if (outer.cached) console.log(`[commentary] Cache hit for ${passage.bookId} ${passage.chapter}:${passage.verse}`);
        } catch { /* noop */ }
    }

    // Users read the commentary for 10–20 s before requesting another
    sleep(Math.random() * 10 + 10);
}
