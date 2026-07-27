// ─────────────────────────────────────────────────────────────────────────────
// AdminPage.tsx — Métricas do painel admin
// Access controlled via Supabase auth + role check (app_metadata.role = 'admin').
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import AuthModal from "@/components/AuthModal";
import AdminNav from "@/components/AdminNav";
import { Loader2, Sparkles, LogIn, XCircle, Bell, BarChart3 } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { getSession } from "@/lib/auth";

interface NotificationStats {
    total: number;
    addedLast7Days: number;
    addedLast30Days: number;
    removedByInvalidation: {
        total: number | null;
        last7Days: number | null;
        last30Days: number | null;
        tracked: boolean;
    };
}

export default function AdminPage() {
    usePageMeta({
        title: "Métricas — Admin Bíblia Vive",
        robots: "noindex, nofollow",
    });

    const { user, loading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [notificationStats, setNotificationStats] = useState<NotificationStats | null>(null);
    const [notificationStatsError, setNotificationStatsError] = useState<string | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setIsAdmin(false);
            return;
        }
        const meta = user.app_metadata as Record<string, unknown>;
        setIsAdmin(meta?.role === "admin");
    }, [user, authLoading]);

    async function fetchNotificationStats() {
        setLoadingStats(true);
        try {
            const session = await getSession();
            if (!session?.access_token) return;

            const response = await fetch("/api/notifications/stats", {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });

            if (!response.ok) {
                throw new Error("Não foi possível carregar métricas de notificações");
            }

            setNotificationStats(await response.json());
            setNotificationStatsError(null);
        } catch (err) {
            console.error("[AdminPage] fetchNotificationStats failed:", err);
            setNotificationStatsError("Métricas indisponíveis");
        } finally {
            setLoadingStats(false);
        }
    }

    useEffect(() => {
        if (isAdmin) fetchNotificationStats();
    }, [isAdmin]);

    if (authLoading || isAdmin === null) {
        return (
            <Layout>
                <div className="flex min-h-[60vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gold" />
                </div>
            </Layout>
        );
    }

    if (!user) {
        return (
            <Layout>
                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
                    <Sparkles className="h-10 w-10 text-gold" />
                    <div>
                        <h1 className="font-serif text-2xl text-app-text">Área Restrita</h1>
                        <p className="mt-2 text-sm text-app-text-muted">
                            Faça login com uma conta de administrador para acessar o painel.
                        </p>
                    </div>
                    <button
                        onClick={() => setAuthModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-gold/60 bg-transparent px-6 py-2.5 text-sm font-medium text-gold transition-colors hover:bg-gold-bg"
                    >
                        <LogIn className="h-4 w-4" />
                        Fazer Login
                    </button>
                    <AuthModal
                        isOpen={authModalOpen}
                        onClose={() => setAuthModalOpen(false)}
                        hint="Entre com sua conta de administrador."
                    />
                </div>
            </Layout>
        );
    }

    if (isAdmin === false) {
        return (
            <Layout>
                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                    <XCircle className="h-10 w-10 text-red-500/80" />
                    <div>
                        <h1 className="font-serif text-2xl text-app-text">Acesso Negado</h1>
                        <p className="mt-2 text-sm text-app-text-muted max-w-[300px]">
                            Seu usuário ({user.email}) não possui a função 'admin' no Supabase.
                        </p>
                    </div>
                    <Link to="/" className="mt-2 text-sm text-gold hover:underline">
                        Voltar para o Início
                    </Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="mx-auto max-w-2xl space-y-10 py-8">
                <div className="flex items-center gap-3">
                    <BarChart3 className="h-6 w-6 text-gold" />
                    <div>
                        <h1 className="font-serif text-2xl text-app-text">Métricas</h1>
                        <p className="mt-0.5 text-sm text-app-text-muted">Indicadores internos do site</p>
                    </div>
                </div>

                <AdminNav />

                <div className="rounded-2xl border border-border bg-app-surface p-6">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
                            <Bell className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs uppercase tracking-widest text-app-text-muted">
                                Notificações push
                            </p>
                            {loadingStats ? (
                                <div className="mt-3 flex items-center gap-2 text-sm text-app-text-muted">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Carregando...
                                </div>
                            ) : (
                                <>
                                    <p className="mt-1 font-serif text-3xl text-app-text">
                                        {notificationStats?.total ?? "—"}
                                    </p>
                                    <p className="mt-1 text-sm text-app-text-muted">
                                        Inscritos em notificações
                                    </p>
                                    {notificationStats && (
                                        <dl className="mt-4 grid gap-2 text-sm">
                                            <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
                                                <dt className="text-app-text-muted">Novos (7 dias)</dt>
                                                <dd className="font-medium text-app-text">+{notificationStats.addedLast7Days}</dd>
                                            </div>
                                            <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
                                                <dt className="text-app-text-muted">Novos (30 dias)</dt>
                                                <dd className="font-medium text-app-text">+{notificationStats.addedLast30Days}</dd>
                                            </div>
                                            {notificationStats.removedByInvalidation.tracked && (
                                                <>
                                                    <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
                                                        <dt className="text-app-text-muted">Removidos (token inválido)</dt>
                                                        <dd className="font-medium text-app-text">
                                                            {notificationStats.removedByInvalidation.total ?? 0}
                                                        </dd>
                                                    </div>
                                                    <div className="flex justify-between gap-4">
                                                        <dt className="text-app-text-muted">Removidos (7 / 30 dias)</dt>
                                                        <dd className="font-medium text-app-text">
                                                            {notificationStats.removedByInvalidation.last7Days ?? 0} / {notificationStats.removedByInvalidation.last30Days ?? 0}
                                                        </dd>
                                                    </div>
                                                </>
                                            )}
                                        </dl>
                                    )}
                                    {notificationStatsError && (
                                        <p className="mt-3 text-sm text-red-400">{notificationStatsError}</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
