// ─────────────────────────────────────────────────────────────────────────────
// auth.ts — Bíblia Viva · Sprint 7
// Helpers de autenticação Supabase (email/senha)
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase';

export async function signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
}

export async function signUpWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data.user;
}

export async function signOut() {
    try {
        // RACE CONDITION SAFETY: Supabase v2 lock bugs can cause signOut() to hang.
        // We use a 3s timeout to ensure we don't block the UI forever.
        await Promise.race([
            supabase.auth.signOut(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Sign out timeout')), 3000))
        ]);
    } catch (error) {
        console.warn('Sign out had issues (possibly timeout or lock), clearing locally anyway.', error);
    } finally {
        // ALWAYS clear local storage to ensure the user is logged out visually/locally
        if (typeof window !== 'undefined') {
            localStorage.removeItem('bv-auth-token');
        }
    }
}

export async function getSession() {
    try {
        // FAST FALLBACK: Supabase v2 lock bugs can cause getSession() to hang eternally.
        // Try reading synchronously from localStorage first (storageKey: 'bv-auth-token')
        const localData = typeof window !== 'undefined' ? localStorage.getItem('bv-auth-token') : null;
        if (localData) {
            try {
                const parsed = JSON.parse(localData);
                const token = parsed?.access_token;
                // Very basic expiry check (optional, but good practice)
                if (token && parsed?.expires_at) {
                    const expiresAt = parsed.expires_at * 1000;
                    if (Date.now() < expiresAt) {
                        return { access_token: token, user: parsed.user };
                    }
                }
            } catch (err) {
                console.warn('Silent local session parse error', err);
            }
        }

        // If not found or expired, fallback to the official async method with a strict 5s safety net
        const { data } = await Promise.race([
            supabase.auth.getSession(),
            new Promise<any>(resolve => setTimeout(() => resolve({ data: { session: null } }), 5000))
        ]);
        return data?.session;
    } catch {
        return null;
    }
}

export async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
}
