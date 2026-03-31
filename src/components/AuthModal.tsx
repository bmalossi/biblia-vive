// ─────────────────────────────────────────────────────────────────────────────
// AuthModal.tsx — Bíblia Viva · Sprint 7
// Modal login/cadastro com email/senha
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

export default function AuthModal({ isOpen, onClose, hint }: Props) {
    const { t } = useTranslation();
    const { signIn, signUp, loading } = useAuth();
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const emailRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setEmail(''); setPassword(''); setError(''); setSuccess('');
            setTimeout(() => emailRef.current?.focus(), 50);
        }
    }, [isOpen, mode]);

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(''); setSuccess('');
        try {
            if (mode === 'login') {
                await signIn(email, password);
                onClose();
            } else {
                await signUp(email, password);
                setSuccess(t('auth.checkEmail'));
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : t('auth.genericError'));
        }
    }

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

                {/* Form */}
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
                        disabled={loading}
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
