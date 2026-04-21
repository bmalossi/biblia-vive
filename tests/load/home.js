/**
 * home.js — Load test for the Bíblia Vive home page
 *
 * Scenario: Anonymous user hits the root URL (Vercel CDN serves the SPA shell).
 * This measures Vercel's ability to serve the static index.html under load.
 *
 * Ramp-up:
 *   0 →  1 VU  for  30 s  (warm-up / smoke)
 *   1 → 50 VU  for   2 min
 *  50 → 100 VU for   2 min
 * 100 VUs held for   2 min
 * 100 → 0 VU  for  30 s  (ramp-down)
 *
 * Expected baseline: Vercel CDN handles 100 VUs with p95 < 500 ms.
 * If p95 climbs above 2 s or errors appear, Vercel edge may be the bottleneck
 * (unlikely for a static SPA — more often a Supabase/Edge issue).
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { SITE_BASE, DEFAULT_THRESHOLDS } from './k6-config.js';

export const options = {
    stages: [
        { duration: '30s', target: 1 }, // warm-up
        { duration: '2m', target: 50 }, // ramp up
        { duration: '2m', target: 100 }, // push harder
        { duration: '2m', target: 100 }, // hold
        { duration: '30s', target: 0 }, // ramp down
    ],
    thresholds: DEFAULT_THRESHOLDS,
};

export default function () {
    const res = http.get(SITE_BASE + '/', {
        tags: { name: 'home' },
    });

    check(res, {
        'status is 200': (r) => r.status === 200,
        'body contains Bíblia Vive': (r) =>
            r.body.includes('Bíblia Vive') || r.body.includes('bibliavive'),
    });

    // Simulate 2–4 s think time between page loads (realistic user pacing)
    sleep(Math.random() * 2 + 2);
}
