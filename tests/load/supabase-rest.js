/**
 * supabase-rest.js — Load test for authenticated Supabase Postgres queries
 *
 * Scenario: Logged-in user syncs reading plan progress and checks subscription.
 * These are the two most frequent Supabase Postgres queries in the app.
 *
 * ─── Authentication strategy ────────────────────────────────────────
 * k6 `setup()` runs ONCE before all VUs start.
 * The JWT returned there is passed to every VU via the `data` argument.
 * This means auth/v1/token is called exactly ONCE per test run — not per
 * iteration — so we measure Postgres performance, not auth throughput.
 *
 * ─── Credentials ────────────────────────────────────────────────────
 * Use the -e flag to pass credentials:
 * k6 run -e TEST_EMAIL="seu@email.pro" -e TEST_PASSWORD="suasenha" tests/load/supabase-rest.js
 *
 * ─── Ramp-up ────────────────────────────────────────────────────────
 *  0 → 1 VU   for 30 s  (smoke)
 *  1 → 10 VU  for  1 min
 * 10 → 30 VU  for  2 min
 * 30 VUs held for  3 min   ← point where Supabase free tier typically struggles
 * 30 → 0 VU  for 30 s
 *
 * ─── Supabase Free limits (reference) ───────────────────────────────
 * - 60 Postgres connections
 * - 500 MB DB storage
 * - 2 GB bandwidth / month
 * If p95 spikes here, likely hitting connection pool exhaustion.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { SUPABASE_URL, SUPABASE_THRESHOLDS, supabaseHeaders, supabaseSignIn } from './k6-config.js';

export const options = {
    stages: [
        { duration: '30s', target: 1 },
        { duration: '1m', target: 10 },
        { duration: '2m', target: 30 },
        { duration: '3m', target: 30 },
        { duration: '30s', target: 0 },
    ],
    thresholds: {
        ...SUPABASE_THRESHOLDS,
        'http_req_duration{name:plan_progress}': ['p(95)<800'],
        'http_req_duration{name:subscription}': ['p(95)<600'],
    },
};

/**
 * setup() is called ONCE before VUs start.
 * Returns an object that is passed as `data` to every VU's default function.
 */
export function setup() {
    const email = __ENV.TEST_EMAIL;
    const password = __ENV.TEST_PASSWORD;

    if (!email || !password) {
        console.warn(
            '[supabase-rest] TEST_EMAIL or TEST_PASSWORD not set. ' +
            'Run with: k6 run --env-file tests/load/.env.load-test tests/load/supabase-rest.js\n' +
            'Skipping authenticated tests.'
        );
        return { jwt: null, userId: null };
    }

    const jwt = supabaseSignIn(email, password);
    if (!jwt) return { jwt: null, userId: null };

    // Fetch the user's ID so we can scope the SELECT queries correctly
    const meRes = http.get(`${SUPABASE_URL}/auth/v1/user`, {
        headers: supabaseHeaders(jwt),
    });

    if (meRes.status !== 200) {
        console.error('[supabase-rest] Could not fetch user info:', meRes.status);
        return { jwt, userId: null };
    }

    const userId = JSON.parse(meRes.body).id;
    console.log(`[supabase-rest] Signed in as ${email} (uid: ${userId})`);
    return { jwt, userId };
}

export default function (data) {
    const { jwt, userId } = data;

    // If credentials were not provided, do a simple anon REST call instead
    // so the ramp-up still exercises the network path.
    if (!jwt || !userId) {
        const res = http.get(
            `${SUPABASE_URL}/rest/v1/`,
            { headers: supabaseHeaders(null), tags: { name: 'anon_ping' } }
        );
        check(res, { 'anon ping ok': (r) => r.status < 500 });
        sleep(2);
        return;
    }

    // ── Query 1: fetch reading plan progress ────────────────────────
    const planRes = http.get(
        `${SUPABASE_URL}/rest/v1/user_plan_progress` +
        `?user_id=eq.${userId}&select=plan_id,completed_days,read_refs,updated_at&order=updated_at.desc`,
        {
            headers: supabaseHeaders(jwt),
            tags: { name: 'plan_progress' },
        }
    );
    check(planRes, {
        'plan_progress status 200': (r) => r.status === 200,
        'plan_progress returns array': (r) => { try { return Array.isArray(JSON.parse(r.body)); } catch { return false; } },
    });

    sleep(0.5); // brief pause between the two queries (as browser would)

    // ── Query 2: check PRO subscription status ───────────────────────
    const subRes = http.get(
        `${SUPABASE_URL}/rest/v1/user_subscriptions` +
        `?user_id=eq.${userId}&select=plan_type,status,cancel_at_period_end,current_period_end`,
        {
            headers: supabaseHeaders(jwt),
            tags: { name: 'subscription' },
        }
    );
    check(subRes, {
        'subscription status 200': (r) => r.status === 200,
        'subscription returns array': (r) => { try { return Array.isArray(JSON.parse(r.body)); } catch { return false; } },
    });

    // Simulate user spending 3–8 s reading before the next sync
    sleep(Math.random() * 5 + 3);
}
