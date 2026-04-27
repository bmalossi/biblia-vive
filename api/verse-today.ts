// ─────────────────────────────────────────────────────────────────────────────
// api/verse-today.ts — Bíblia Vive · Vercel Serverless Function
//
// Serves today's curated verse from Supabase using the service-role key
// (never exposed to the client). Vercel Edge Cache stores the response for
// 1 hour (s-maxage=3600) and serves stale for up to 24 h while revalidating.
//
// Response shape: { reference: string; text: string; reflection?: string }
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

/** YYYY-MM-DD in UTC — consistent with how AdminPage stores verse_date */
function todayUTC(): string {
    return new Date().toISOString().slice(0, 10);
}

export default async function handler(req: Request): Promise<Response> {
    // Only GET is supported
    if (req.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL ?? '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

    if (!supabaseUrl || !serviceKey) {
        console.error('[verse-today] Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
        return new Response(
            JSON.stringify({ error: 'Server misconfiguration' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Service-role client bypasses RLS — safe here because this is server-side only
    const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false },
    });

    const { data, error } = await supabase
        .from('daily_verses')
        .select('verse_text, verse_reference, reflection_text')
        .eq('verse_date', todayUTC())
        .maybeSingle();

    if (error) {
        console.error('[verse-today] Supabase error:', error.message);
        // Return a graceful empty body — client will use its static fallback
        return new Response(JSON.stringify(null), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                // Short cache on errors so the next request retries quickly
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            },
        });
    }

    if (!data?.verse_text) {
        // No verse scheduled for today — return null so the client falls back
        return new Response(JSON.stringify(null), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                // Cache "no verse" for 15 min, stale for 1 h
                'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600',
            },
        });
    }

    const payload = {
        text: data.verse_text,
        reference: data.verse_reference,
        reflection: data.reflection_text ?? undefined,
    };

    return new Response(JSON.stringify(payload), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            // Cache verse for 1 h; serve stale for up to 24 h while revalidating
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}
