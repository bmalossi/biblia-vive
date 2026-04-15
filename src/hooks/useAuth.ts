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
            async (event, session) => {
                const nextUser = session?.user ?? null;
                const prevUser = user;

                setUser(nextUser);
                setLoading(false);

                if (event === 'TOKEN_REFRESHED' && nextUser) {
                    try {
                        const { data } = await supabase.auth.getUser();
                        if (data.user) setUser(data.user);
                    } catch { /* ignore */ }
                }

                if (!prevUser && nextUser) {
                    try {
                        await migrateLocalToSupabase(nextUser.id);
                        await migrateLocalPlanToSupabase(nextUser.id);
                    } catch { /* non-fatal */ }
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
