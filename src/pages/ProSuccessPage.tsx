import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, AlertCircle, BookOpen } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { usePageMeta } from "@/hooks/usePageMeta";

/**
 * ProSuccessPage — shown after Stripe Checkout redirects back to /pro/success
 *
 * The Supabase Realtime listener inside useSubscription() will fire as soon as
 * the stripe-webhook Edge Function writes the active status to user_subscriptions.
 * This page simply waits for that update and then celebrates it.
 */
export default function ProSuccessPage() {
    usePageMeta({
        title: "Assinatura PRO Ativada — Bíblia Vive",
        robots: "noindex, nofollow",
    });

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const { isPro, loading } = useSubscription();

    // Timeout: if after 30s the webhook still hasn't fired, show the fallback
    const [timedOut, setTimedOut] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setTimedOut(true), 30_000);
        return () => clearTimeout(timer);
    }, []);

    const isConfirmed = !loading && isPro;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-app-bg px-4">
            <div className="w-full max-w-md rounded-2xl border border-app-border bg-app-surface p-8 text-center shadow-xl">

                {/* ── Confirmed ─────────────────────────────────────────────── */}
                {isConfirmed && (
                    <>
                        <div className="mb-6 flex justify-center">
                            <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gold/10">
                                <CheckCircle2 className="h-12 w-12 text-gold" />
                            </span>
                        </div>
                        <h1 className="mb-2 font-serif text-2xl font-bold text-app-text">
                            Bem-vindo ao Bíblia Vive PRO! 🎉
                        </h1>
                        <p className="mb-8 font-sans text-sm text-app-text-muted">
                            Seu plano foi ativado com sucesso. Aproveite todos os recursos desbloqueados.
                        </p>
                        <button
                            onClick={() => navigate("/")}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 font-semibold text-black transition hover:bg-gold/90 active:scale-95"
                        >
                            <BookOpen className="h-5 w-5" />
                            Começar a ler
                        </button>
                    </>
                )}

                {/* ── Timed-out fallback ────────────────────────────────────── */}
                {!isConfirmed && timedOut && (
                    <>
                        <div className="mb-6 flex justify-center">
                            <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/10">
                                <AlertCircle className="h-12 w-12 text-yellow-500" />
                            </span>
                        </div>
                        <h1 className="mb-2 font-serif text-2xl font-bold text-app-text">
                            Pagamento recebido!
                        </h1>
                        <p className="mb-4 font-sans text-sm text-app-text-muted">
                            Seu pagamento foi confirmado pelo Stripe, mas a ativação está
                            demorando um pouco mais que o esperado.
                        </p>
                        <p className="mb-8 font-sans text-xs text-app-text-muted">
                            Aguarde alguns instantes e recarregue a página. Caso o problema
                            persista, entre em contato pelo e-mail{" "}
                            <a
                                href="mailto:suporte@bibliavive.com.br"
                                className="text-gold underline underline-offset-2"
                            >
                                suporte@bibliavive.com.br
                            </a>
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 font-semibold text-black transition hover:bg-gold/90 active:scale-95"
                        >
                            Recarregar página
                        </button>
                    </>
                )}

                {/* ── Waiting / polling ─────────────────────────────────────── */}
                {!isConfirmed && !timedOut && (
                    <>
                        <div className="mb-6 flex justify-center">
                            <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gold/10">
                                <Loader2 className="h-12 w-12 animate-spin text-gold" />
                            </span>
                        </div>
                        <h1 className="mb-2 font-serif text-2xl font-bold text-app-text">
                            Confirmando seu pagamento…
                        </h1>
                        <p className="font-sans text-sm text-app-text-muted">
                            Estamos sincronizando com o Stripe. Isso costuma levar menos de 10 segundos.
                        </p>
                        {sessionId && (
                            <p className="mt-4 font-mono text-xs text-app-text-muted/60">
                                ref: {sessionId.slice(-12)}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
