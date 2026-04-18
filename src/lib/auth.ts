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
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function getSession() {
    try {
        const { data } = await Promise.race([
            supabase.auth.getSession(),
            new Promise<any>(resolve => setTimeout(() => resolve({ data: { session: null } }), 5000))
        ]);
        return data.session;
    } catch {
        return null;
    }
}

export async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
}
