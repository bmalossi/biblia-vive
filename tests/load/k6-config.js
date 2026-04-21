// k6-config.js — Shared configuration for all Bíblia Vive load tests
// ─────────────────────────────────────────────────────────────────────

// ── Endpoints ───────────────────────────────────────────────────────
export const SITE_BASE = 'https://www.bibliavive.com.br';
export const SUPABASE_URL = 'https://yqnsaslvxmqaeeccmcmg.supabase.co';

// Public anon key — safe to commit; it has Row Level Security enforced.
export const ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
    'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxbnNhc2x2eG1xYWVlY2NtY21nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDk0NzIsImV4cCI6MjA5MDAyNTQ3Mn0.' +
    'CLj0G4_2TWy1TSoUDkg_vC5ZPIB6DxGeXepwKRo73gE';

// ── Default Thresholds ───────────────────────────────────────────────
// Import these into each test file's `options.thresholds`.
export const DEFAULT_THRESHOLDS = {
    // Less than 1 % of requests may fail
    http_req_failed: ['rate<0.01'],
    // 95th-percentile response time under 2 s
    http_req_duration: ['p(95)<2000'],
};

// Stricter threshold for Supabase REST calls (pure DB, no external APIs)
export const SUPABASE_THRESHOLDS = {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
};

// Relaxed threshold for Edge Function + OpenAI (expect 3–10 s)
export const EDGE_THRESHOLDS = {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<10000'],
};

// ── Supabase REST helper ─────────────────────────────────────────────
/**
 * Returns headers for Supabase REST requests.
 * Pass `jwt` for authenticated calls, omit for anon.
 */
export function supabaseHeaders(jwt) {
    const h = {
        'apikey': ANON_KEY,
        'Content-Type': 'application/json',
    };
    if (jwt) h['Authorization'] = `Bearer ${jwt}`;
    return h;
}

// ── Auth helper ──────────────────────────────────────────────────────
import http from 'k6/http';

/**
 * Exchange email/password for a Supabase JWT access_token.
 * Call once per VU in the `setup()` or `init` phase — not inside the iteration.
 *
 * @param {string} email
 * @param {string} password
 * @returns {string} JWT access_token
 */
export function supabaseSignIn(email, password) {
    const res = http.post(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        JSON.stringify({ email, password }),
        {
            headers: {
                'apikey': ANON_KEY,
                'Content-Type': 'application/json',
            },
        }
    );

    if (res.status !== 200) {
        console.error(`[auth] Login failed: ${res.status} ${res.body}`);
        return null;
    }

    const body = JSON.parse(res.body);
    return body.access_token;
}
