// ─────────────────────────────────────────────────────────────────────────────
// useAuth.ts — Bíblia Viva · Sprint 15
// Hook de estado de autenticação + migração localStorage → Supabase
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { signInWithEmail, signUpWithEmail, signOut as authSignOut } from '@/lib/auth';
import { migrateLocalToSupabase } from '@/lib/notesHighlights';
import { migrateLocalPlanToSupabase } from '@/lib/readingPlanSync';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    // Track whether migration has been attempted for a given user ID to avoid duplicates
    const migratedUserIdRef = useRef<string | null>(null);

    useEffect(() => {
        // Get initial session on mount
        supabase.auth.getSession().then(({ data }) => {
            setUser(data.session?.user ?? null);
            setLoading(false);
        });

        // Listen to auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                const nextUser = session?.user ?? null;

                setUser(nextUser);
                setLoading(false);

                // Refresh user object on token refresh
                if (event === 'TOKEN_REFRESHED' && nextUser) {
                    try {
                        const { data } = await supabase.auth.getUser();
                        if (data.user) setUser(data.user);
                    } catch { /* ignore */ }
                }

                // On SIGNED_IN: run local-to-cloud migration exactly once per user
                if (event === 'SIGNED_IN' && nextUser) {
                    if (migratedUserIdRef.current !== nextUser.id) {
                        migratedUserIdRef.current = nextUser.id;
                        try {
                            // Run both migrations in parallel for speed
                            await Promise.allSettled([
                                migrateLocalToSupabase(nextUser.id),
                                migrateLocalPlanToSupabase(nextUser.id),
                            ]);
                        } catch { /* non-fatal */ }
                    }
                }

                // On SIGNED_OUT: reset migration tracker
                if (event === 'SIGNED_OUT') {
                    migratedUserIdRef.current = null;
                }
            }
        );

        return () => subscription.unsubscribe();
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

