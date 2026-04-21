// ─────────────────────────────────────────────────────────────────────────────
// AuthCallbackPage.tsx — Bíblia Vive
// Handles OAuth provider redirects (e.g. Google).
// Supabase detectSessionInUrl:true processes the hash automatically.
// We just wait for the session and navigate accordingly.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;

        async function handleCallback() {
            try {
                // Give Supabase a moment to process the URL hash and persist the session
                const { data, error } = await Promise.race([
                    supabase.auth.getSession(),
                    new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error('Session timeout')), 8000)
                    ),
                ]);

                if (cancelled) return;

                if (error || !data?.session) {
                    navigate('/?auth_error=1', { replace: true });
                } else {
                    navigate('/planos', { replace: true });
                }
            } catch {
                if (!cancelled) navigate('/?auth_error=1', { replace: true });
            }
        }

        handleCallback();
        return () => { cancelled = true; };
    }, [navigate]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-app-bg">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
                <p className="font-sans text-sm text-app-text-muted">Autenticando...</p>
            </div>
        </div>
    );
}
