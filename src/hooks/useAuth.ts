// ─────────────────────────────────────────────────────────────────────────────
// useAuth.ts — Bíblia Viva · Sprint 7
// Hook de estado de autenticação + migração localStorage → Supabase
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { signInWithEmail, signUpWithEmail, signOut as authSignOut } from '@/lib/auth';
import { migrateLocalToSupabase } from '@/lib/notesHighlights';
import { migrateLocalPlanToSupabase } from '@/lib/readingPlanSync';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data }) => {
            setUser(data.session?.user ?? null);
            setLoading(false);
        });

        // Listen to auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                const nextUser = session?.user ?? null;
                const prevUser = user;

                setUser(nextUser);
                setLoading(false);

                // Migrate localStorage data if user just signed in
                if (!prevUser && nextUser) {
                    try {
                        // Migrate notes & highlights (Sprint 7)
                        await migrateLocalToSupabase(nextUser.id);
                        // Migrate reading plan progress (Sprint 12)
                        await migrateLocalPlanToSupabase(nextUser.id);
                    } catch {
                        // Non-fatal: migration can be retried
                    }
                }
            }
        );

        return () => subscription.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        setLoading(true);
        try {
            await signInWithEmail(email, password);
        } finally {
            setLoading(false);
        }
    }, []);

    const signUp = useCallback(async (email: string, password: string) => {
        setLoading(true);
        try {
            await signUpWithEmail(email, password);
        } finally {
            setLoading(false);
        }
    }, []);

    const signOut = useCallback(async () => {
        setLoading(true);
        try {
            await authSignOut();
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        user,
        loading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
    };
}
