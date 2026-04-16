// ─────────────────────────────────────────────────────────────────────────────
// useDailyVerse.ts — Bíblia Vive
// Prioritises the curated verse from Supabase daily_verses table.
// Falls back to the i18n static verse if:
//   • No record is scheduled for today
//   • The Supabase query takes longer than 5 s (timeout safety net)
//   • Any network/RLS error occurs
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface DailyVerse {
    text: string;
    reference: string;
    reflection?: string;
    isCurated: boolean; // true = from Supabase, false = static fallback
}

const today = () => new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

/** Maximum ms to wait for the Supabase query before showing the fallback. */
const FETCH_TIMEOUT_MS = 5000;

/** Returns a promise that rejects after the given delay. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), ms)
        ),
    ]);
}

export function useDailyVerse(
    fallbackText: string,
    fallbackRef: string
): { verse: DailyVerse | null; loading: boolean } {
    const [verse, setVerse] = useState<DailyVerse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function fetchCurated() {
            try {
                // Wrap in a proper Promise so Promise.race() can use it.
                // The Supabase query builder is thenable but not a native Promise
                // in all versions, so we resolve it explicitly.
                const queryPromise = new Promise<{ data: { verse_text: string; verse_reference: string; reflection_text: string | null } | null }>((resolve, reject) => {
                    supabase
                        .from('daily_verses')
                        .select('verse_text, verse_reference, reflection_text')
                        .eq('verse_date', today())
                        .maybeSingle()
                        .then(resolve, reject);
                });

                const { data } = await withTimeout(queryPromise, FETCH_TIMEOUT_MS);

                if (cancelled) return;

                if (data?.verse_text) {
                    setVerse({
                        text: data.verse_text,
                        reference: data.verse_reference,
                        reflection: data.reflection_text ?? undefined,
                        isCurated: true,
                    });
                } else {
                    // No record today — use static fallback
                    setVerse({ text: fallbackText, reference: fallbackRef, isCurated: false });
                }
            } catch {
                // Timeout, network error, or RLS block — show fallback
                if (!cancelled) {
                    setVerse({ text: fallbackText, reference: fallbackRef, isCurated: false });
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchCurated();

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Fetch once per mount; fallbackText/Ref are stable i18n strings

    return { verse, loading };
}
