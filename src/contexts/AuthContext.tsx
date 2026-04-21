// ─────────────────────────────────────────────────────────────────────────────
// AuthContext.tsx — Bíblia Vive
// Single global Auth Provider.  Stores ONE onAuthStateChange listener for
// the whole app so every useAuth() consumer reads the same state without
// creating extra Supabase subscriptions or triggering duplicate re-renders.
// ─────────────────────────────────────────────────────────────────────────────

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { signInWithEmail, signUpWithEmail, signOut as authSignOut, signInWithGoogle as authSignInWithGoogle } from '@/lib/auth';
import { migrateLocalToSupabase } from '@/lib/notesHighlights';
import { migrateLocalPlanToSupabase } from '@/lib/readingPlanSync';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
    user: User | null;
    /** true only during the very first session restore on mount */
    loading: boolean;
    /** true when an async auth action (login/logout/signup) is in progress */
    isPending: boolean;
    isAuthenticated: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthState | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    // Starts true; becomes false exactly once after INITIAL_SESSION fires.
    const [loading, setLoading] = useState(true);
    const [isPending, setIsPending] = useState(false);
    const migratedUserIdRef = useRef<string | null>(null);

    useEffect(() => {
        // ── Single listener for the entire app ──
        // In Supabase JS v2, onAuthStateChange fires INITIAL_SESSION as its
        // first event, reading from localStorage synchronously.  We do NOT
        // need a separate getSession() call; that only adds a race.
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            const nextUser = session?.user ?? null;

            setUser(nextUser);
            // Mark initial load as done on the very first event — ANY event, not
            // just INITIAL_SESSION, so edge cases (e.g. SIGNED_IN fires first)
            // never leave the app stuck in loading=true forever.
            setLoading(false);
            setIsPending(false); // SAFETY: Reset pending on any auth event

            // Refresh user object after token refresh to pick up new metadata
            if (event === 'TOKEN_REFRESHED' && nextUser) {
                try {
                    const { data } = await supabase.auth.getUser();
                    if (data.user) setUser(data.user);
                } catch { /* non-fatal */ }
            }

            // Migrate local data exactly once per user login
            if (event === 'SIGNED_IN' && nextUser) {
                if (migratedUserIdRef.current !== nextUser.id) {
                    migratedUserIdRef.current = nextUser.id;
                    try {
                        await Promise.allSettled([
                            migrateLocalToSupabase(nextUser.id),
                            migrateLocalPlanToSupabase(nextUser.id),
                        ]);
                    } catch { /* non-fatal */ }
                }
            }

            if (event === 'SIGNED_OUT') {
                migratedUserIdRef.current = null;
            }
        });

        // Safety net: if INITIAL_SESSION never fires (e.g. Supabase client
        // bug or network error), unblock the UI after 3 s so the app is
        // not stuck in a permanent loading state.
        const safetyTimer = setTimeout(() => setLoading(false), 3000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(safetyTimer);
        };
    }, []);

    // ── Auth actions ──────────────────────────────────────────────────────────

    const signIn = useCallback(async (email: string, password: string) => {
        setIsPending(true);
        try {
            await signInWithEmail(email, password);
        } finally {
            setIsPending(false);
        }
    }, []);

    const signUp = useCallback(async (email: string, password: string) => {
        setIsPending(true);
        try {
            await signUpWithEmail(email, password);
        } finally {
            setIsPending(false);
        }
    }, []);

    const signOut = useCallback(async () => {
        setIsPending(true);
        try {
            await authSignOut();
        } finally {
            setUser(null);
            migratedUserIdRef.current = null;
            setIsPending(false);
        }
    }, []);

    const signInWithGoogle = useCallback(async () => {
        setIsPending(true);
        try {
            await authSignInWithGoogle();
            // Navigation is handled by the OAuth redirect; isPending stays true
            // until the page unloads. Auth state update fires on return.
        } catch (err) {
            setIsPending(false);
            throw err;
        }
    }, []);

    // ── Value ─────────────────────────────────────────────────────────────────

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isPending,
                isAuthenticated: !!user,
                signIn,
                signUp,
                signOut,
                signInWithGoogle,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// ─── Consumer hook ────────────────────────────────────────────────────────────

export function useAuthContext(): AuthState {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuthContext must be used inside <AuthProvider>');
    }
    return ctx;
}
