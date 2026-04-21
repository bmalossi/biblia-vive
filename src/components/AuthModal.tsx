// ─────────────────────────────────────────────────────────────────────────────
// AuthModal.tsx — Bíblia Viva · Sprint 7
// Modal login/cadastro com email/senha + Google OAuth
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import { X, Loader2, BookOpen } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    hint?: string; // motivo pelo qual o modal foi aberto
}

type AuthMode = 'login' | 'register';

// Google G logo — inline SVG as specified
const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.1 4 9.4 8.4 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.8 13.5-4.7l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7l-6.6 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.9 6l6.2 5.2C40.5 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-4z" />
    </svg>
);

export default function AuthModal({ isOpen, onClose, hint }: Props) {
    const { t } = useTranslation();
    const { signIn, signUp, signInWithGoogle, isPending: loading, user } = useAuth();
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [googleLoading, setGoogleLoading] = useState(false);
    const emailRef = useRef<HTMLInputElement>(null);
    // Track whether this modal triggered a sign-in attempt
    const attemptingLogin = useRef(false);

    // Auto-close when a login attempt succeeds and the user state updates
    useEffect(() => {
        if (isOpen && user && attemptingLogin.current) {
            attemptingLogin.current = false;
            onClose();
        }
    }, [user, isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            setEmail(''); setPassword(''); setError(''); setSuccess('');
            setGoogleLoading(false);
            attemptingLogin.current = false;
            setTimeout(() => emailRef.current?.focus(), 50);
        }
    }, [isOpen, mode]);

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(''); setSuccess('');
        try {
            if (mode === 'login') {
                attemptingLogin.current = true;
                await signIn(email, password);
                // If the promise resolves normally before the state change fires, close here too
                onClose();
            } else {
                await signUp(email, password);
                setSuccess(t('auth.checkEmail'));
            }
        } catch (err: unknown) {
            attemptingLogin.current = false;
            setError(err instanceof Error ? err.message : t('auth.genericError'));
        }
    }

    async function handleGoogleSignIn() {
        setError('');
        setGoogleLoading(true);
        try {
            await signInWithGoogle();
            // Page will redirect — no need to reset state
        } catch (err: unknown) {
            setGoogleLoading(false);
            setError(err instanceof Error ? err.message : t('auth.genericError'));
        }
    }

    const anyLoading = loading || googleLoading;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

            <div className="relative z-10 w-full max-w-sm mx-4 rounded-2xl bg-app-surface border border-border shadow-2xl p-6 space-y-5">
                {/* Close */}
                <button
                    type="button"
                    aria-label={t('settings.close')}
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-app-raised transition-colors"
                >
                    <X className="h-4 w-4 text-app-text-muted" />
                </button>

                {/* Header */}
                <div className="flex flex-col items-center gap-2 text-center">
                    <BookOpen className="h-8 w-8 text-gold" />
                    <h2 id="auth-modal-title" className="text-lg font-semibold text-app-text">
                        {mode === 'login' ? t('auth.signIn') : t('auth.createAccount')}
                    </h2>
                    {hint && <p className="text-[0.78rem] text-app-text-muted">{hint}</p>}
                </div>

                {/* Google OAuth Button */}
                <button
                    id="auth-google-btn"
                    type="button"
                    disabled={anyLoading}
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-border bg-white py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                    {googleLoading
                        ? <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                        : <GoogleIcon />
                    }
                    Continuar com Google
                </button>

                {/* Separator */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[0.72rem] text-app-text-muted select-none">ou</span>
                    <div className="flex-1 h-px bg-border" />
                </div>

                {/* Email/Password Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="text-[0.75rem] font-medium text-app-text/80 mb-1.5 block" htmlFor="auth-email">
                            {t('auth.email')}
                        </label>
                        <input
                            ref={emailRef}
                            id="auth-email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-border bg-app-surface px-3 py-2.5 text-sm text-app-text focus:outline-none focus:ring-1 focus:ring-gold/50"
                        />
                    </div>

                    <div>
                        <label className="text-[0.75rem] font-medium text-app-text/80 mb-1.5 block" htmlFor="auth-password">
                            {t('auth.password')}
                        </label>
                        <input
                            id="auth-password"
                            type="password"
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            required
                            minLength={6}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-border bg-app-surface px-3 py-2.5 text-sm text-app-text focus:outline-none focus:ring-1 focus:ring-gold/50"
                        />
                    </div>

                    {error && <p className="text-[0.78rem] text-destructive">{error}</p>}
                    {success && <p className="text-[0.78rem] text-green-500">{success}</p>}

                    <button
                        type="submit"
                        disabled={anyLoading}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-sm font-medium text-black hover:bg-gold/90 disabled:opacity-50 transition-colors"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {mode === 'login' ? t('auth.signIn') : t('auth.createAccount')}
                    </button>
                </form>

                {/* Switch mode */}
                <p className="text-center text-[0.8rem] text-app-text/70">
                    {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
                    <button
                        type="button"
                        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                        className="text-gold hover:underline"
                    >
                        {mode === 'login' ? t('auth.createAccount') : t('auth.signIn')}
                    </button>
                </p>
            </div>
        </div>
    );
}
