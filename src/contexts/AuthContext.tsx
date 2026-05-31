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
import * as Sentry from '@sentry/react';

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
        // IMPORTANT: The callback must be SYNCHRONOUS (not async). Supabase JS v2
        // does NOT await the return value of onAuthStateChange callbacks. If the
        // callback is async and contains `await supabase.auth.*` calls, those
        // awaits run *inside* the auth Web Lock, causing contention with the next
        // auth event and triggering "AbortError: Lock broken by another request
        // with the 'steal' option" (DOMException code 20).
        //
        // Pattern: Update state synchronously, then schedule secondary async work
        // via queueMicrotask / Promise.resolve() so it runs AFTER the lock is
        // released by the Supabase internals.
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            const nextUser = session?.user ?? null;

            // ── Synchronous state updates (safe inside the lock) ──────────────
            setUser(nextUser);
            // Mark initial load as done on the very first event — ANY event, not
            // just INITIAL_SESSION, so edge cases (e.g. SIGNED_IN fires first)
            // never leave the app stuck in loading=true forever.
            setLoading(false);
            setIsPending(false); // SAFETY: Reset pending on any auth event

            // ── Async secondary work (deferred OUTSIDE the lock) ─────────────
            // queueMicrotask ensures these run after the current synchronous
            // execution stack (and the Supabase lock release) completes.
            if (event === 'TOKEN_REFRESHED' && nextUser) {
                // Refresh user object to pick up new metadata (e.g. app_metadata).
                // Deferred so it does not compete with the lock held by the
                // token-refresh operation that just fired this event.
                queueMicrotask(() => {
                    supabase.auth.getUser().then(({ data }) => {
                        if (data.user) setUser(data.user);
                    }).catch((err: unknown) => {
                        // Silently ignore AbortError — it means a concurrent auth
                        // operation stole the lock; the next TOKEN_REFRESHED event
                        // will retry automatically.
                        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('Lock broken'))) return;
                        console.warn('[AuthContext] getUser after TOKEN_REFRESHED failed:', err);
                    });
                });
            }

            if (event === 'SIGNED_IN' && nextUser) {
                // Associate user with Sentry for error context.
                Sentry.setUser({ id: nextUser.id });

                // Migrate local data exactly once per user login, deferred outside lock.
                if (migratedUserIdRef.current !== nextUser.id) {
                    migratedUserIdRef.current = nextUser.id;
                    queueMicrotask(() => {
                        Promise.allSettled([
                            migrateLocalToSupabase(nextUser.id),
                            migrateLocalPlanToSupabase(nextUser.id),
                        ]).catch(() => { /* allSettled never rejects, belt-and-suspenders */ });
                    });
                }
            }

            if (event === 'SIGNED_OUT') {
                migratedUserIdRef.current = null;
                Sentry.setUser(null);
            }
        });

        // ── Renovação proativa de sessão ao retornar ao app ──────────────────
        // Quando o JWT expira durante inatividade (aba em background ou janela
        // fechada), o Supabase JS armazena o refresh_token mas não renova o
        // access_token até que uma requisição autenticada falhe.  Este listener
        // antecipa esse fluxo: assim que o usuário volta à aba, tentamos
        // renovar a sessão ANTES que qualquer query autenticada seja disparada.
        const isRefreshingRef = { current: false };
        const handleVisibilityChange = () => {
            if (document.visibilityState !== 'visible' || isRefreshingRef.current) return;
            isRefreshingRef.current = true;
            // Use the hardened getSession from auth.ts (localStorage fast-path +
            // 5s timeout) so this call never hangs or steals the lock from an
            // ongoing token refresh.
            import('@/lib/auth').then(({ getSession }) =>
                getSession()
                    .catch((err: unknown) => {
                        // AbortError here means a concurrent refresh already holds
                        // the lock — that is fine, the token will be refreshed.
                        if (err instanceof Error && (err.name === 'AbortError' || err.message?.includes('Lock broken'))) return;
                        console.warn('[AuthContext] proactive session refresh failed:', err);
                    })
                    .finally(() => { isRefreshingRef.current = false; })
            ).catch(() => { isRefreshingRef.current = false; });
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Safety net: if INITIAL_SESSION never fires (e.g. Supabase client
        // bug or network error), unblock the UI after 3 s so the app is
        // not stuck in a permanent loading state.
        const safetyTimer = setTimeout(() => setLoading(false), 3000);

        return () => {
            subscription.unsubscribe();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
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
