// ─────────────────────────────────────────────────────────────────────────────
// useDailyVerse.ts — Bíblia Viva · Sprint 12
// Prioritises the curated verse from Supabase daily_verses table.
// Falls back to the i18n static verse if no record is scheduled for today.
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
                const { data } = await supabase
                    .from('daily_verses')
                    .select('verse_text, verse_reference, reflection_text')
                    .eq('verse_date', today())
                    .maybeSingle();

                if (cancelled) return;

                if (data?.verse_text) {
                    setVerse({
                        text: data.verse_text,
                        reference: data.verse_reference,
                        reflection: data.reflection_text ?? undefined,
                        isCurated: true,
                    });
                } else {
                    // Graceful fallback to static i18n content
                    setVerse({
                        text: fallbackText,
                        reference: fallbackRef,
                        isCurated: false,
                    });
                }
            } catch {
                // Network offline or Supabase unavailable — fallback
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
    }, []); // Only fetch once per mount

    return { verse, loading };
}
