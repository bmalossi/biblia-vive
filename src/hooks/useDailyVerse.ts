// ─────────────────────────────────────────────────────────────────────────────
// useDailyVerse.ts — Bíblia Vive
//
// Fetches today's curated verse from /api/verse-today (Vercel serverless).
// The endpoint uses the service-role key server-side — no Supabase credentials
// are exposed in the browser bundle.
//
// Falls back to the i18n static verse when:
//   • /api/verse-today returns null (no verse scheduled)
//   • The request takes longer than 5 s (timeout safety net)
//   • Any network or HTTP error occurs
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';

export interface DailyVerse {
    text: string;
    reference: string;
    reflection?: string;
    isCurated: boolean; // true = from Supabase, false = static fallback
}

/** Maximum ms to wait for the API before showing the fallback. */
const FETCH_TIMEOUT_MS = 5000;

interface ApiVerseResponse {
    text: string;
    reference: string;
    reflection?: string;
}

export function useDailyVerse(
    fallbackText: string,
    fallbackRef: string
): { verse: DailyVerse | null; loading: boolean } {
    const [verse, setVerse] = useState<DailyVerse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        async function fetchVerse() {
            try {
                const res = await fetch('/api/verse-today', {
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (cancelled) return;

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }

                const data: ApiVerseResponse | null = await res.json();

                if (cancelled) return;

                if (data?.text) {
                    setVerse({
                        text: data.text,
                        reference: data.reference,
                        reflection: data.reflection,
                        isCurated: true,
                    });
                } else {
                    // No verse scheduled — show static fallback
                    setVerse({ text: fallbackText, reference: fallbackRef, isCurated: false });
                }
            } catch {
                // Timeout, network error, or non-OK response — show fallback silently
                clearTimeout(timeoutId);
                if (!cancelled) {
                    setVerse({ text: fallbackText, reference: fallbackRef, isCurated: false });
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchVerse();

        return () => {
            cancelled = true;
            controller.abort();
            clearTimeout(timeoutId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Fetch once per mount; fallbackText/Ref are stable i18n strings

    return { verse, loading };
}
