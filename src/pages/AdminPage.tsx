// ─────────────────────────────────────────────────────────────────────────────
// AdminPage.tsx — Bíblia Viva · Sprint 12
// Protected admin panel for scheduling curated daily verses.
// Access controlled via Supabase auth + role check (app_metadata.role = 'admin').
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import AuthModal from "@/components/AuthModal";
import { Loader2, Plus, Trash2, CalendarDays, Sparkles, LogIn, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface DailyVerseRow {
    id: string;
    verse_date: string;
    verse_text: string;
    verse_reference: string;
    reflection_text?: string | null;
}

interface NewVerse {
    verse_date: string;
    verse_text: string;
    verse_reference: string;
    reflection_text: string;
}

const EMPTY_VERSE: NewVerse = {
    verse_date: "",
    verse_text: "",
    verse_reference: "",
    reflection_text: "",
};

export default function AdminPage() {
    const { user, loading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [verses, setVerses] = useState<DailyVerseRow[]>([]);
    const [form, setForm] = useState<NewVerse>(EMPTY_VERSE);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [authModalOpen, setAuthModalOpen] = useState(false);

    // ── Check admin role ─────────────────────────────────────────────────────
    useEffect(() => {
        if (authLoading) return; // wait for session to resolve
        if (!user) {
            setIsAdmin(false); // User is logged out — not admin
            return;
        }
        const meta = user.app_metadata as Record<string, unknown>;
        setIsAdmin(meta?.role === "admin");
    }, [user, authLoading]);

    // ── Fetch upcoming verses ────────────────────────────────────────────────
    async function fetchVerses() {
        const { data } = await supabase
            .from("daily_verses")
            .select("id, verse_date, verse_text, verse_reference, reflection_text")
            .gte("verse_date", new Date().toISOString().slice(0, 10))
            .order("verse_date", { ascending: true })
            .limit(35);
        setVerses(data ?? []);
    }

    useEffect(() => {
        if (isAdmin) fetchVerses();
    }, [isAdmin]);

    // ── Save ─────────────────────────────────────────────────────────────────
    async function handleSave() {
        if (!form.verse_date || !form.verse_text || !form.verse_reference) {
            setError("Preencha data, texto e referência.");
            return;
        }
        setSaving(true);
        setError(null);
        setSuccessMsg(null);

        let { error: sbError } = await supabase.from("daily_verses").upsert(
            {
                verse_date: form.verse_date,
                verse_text: form.verse_text,
                verse_reference: form.verse_reference,
                reflection_text: form.reflection_text || null,
                created_by: user!.id,
            },
            { onConflict: "verse_date" }
        );

        // Transient lock error retry (common in multi-tab Supabase v2 environments)
        if (sbError && sbError.message.includes("lock:") && sbError.message.includes("stole it")) {
            console.warn("Auth lock stolen, retrying upsert once...");
            await new Promise((resolve) => setTimeout(resolve, 800));
            const retry = await supabase.from("daily_verses").upsert(
                {
                    verse_date: form.verse_date,
                    verse_text: form.verse_text,
                    verse_reference: form.verse_reference,
                    reflection_text: form.reflection_text || null,
                    created_by: user!.id,
                },
                { onConflict: "verse_date" }
            );
            sbError = retry.error;
        }

        if (sbError) {
            setError(sbError.message);
        } else {
            setSuccessMsg(`Versículo de ${form.verse_date} salvo com sucesso!`);
            setForm(EMPTY_VERSE);
            fetchVerses();
        }
        setSaving(false);
    }

    // ── Delete ───────────────────────────────────────────────────────────────
    async function handleDelete(id: string) {
        await supabase.from("daily_verses").delete().eq("id", id);
        fetchVerses();
    }

    // ── Guards ───────────────────────────────────────────────────────────────
    // 1. Still loading auth state
    if (authLoading || isAdmin === null) {
        return (
            <Layout>
                <div className="flex min-h-[60vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gold" />
                </div>
            </Layout>
        );
    }

    // 2. Not logged in — show inline prompt to log in
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

    // 3. Logged in but not admin — show access denied
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

    // ── UI ───────────────────────────────────────────────────────────────────
    return (
        <Layout>
            <div className="mx-auto max-w-2xl space-y-10 py-8">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Sparkles className="h-6 w-6 text-gold" />
                    <div>
                        <h1 className="font-serif text-2xl text-app-text">Painel Admin</h1>
                        <p className="mt-0.5 text-sm text-app-text-muted">Agendar Versículo do Dia</p>
                    </div>
                </div>

                {/* Form */}
                <div className="rounded-2xl border border-border bg-app-surface p-6 space-y-4">
                    <h2 className="font-sans text-xs uppercase tracking-widest text-gold flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" /> Novo Versículo
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-app-text-muted mb-1">Data</label>
                            <input
                                type="date"
                                value={form.verse_date}
                                onChange={(e) => setForm((f) => ({ ...f, verse_date: e.target.value }))}
                                className="w-full rounded-xl border border-border bg-app-bg px-4 py-2.5 text-sm text-app-text focus:outline-none focus:border-gold transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-app-text-muted mb-1">Referência (e.g. João 3:16 ACF)</label>
                            <input
                                type="text"
                                value={form.verse_reference}
                                onChange={(e) => setForm((f) => ({ ...f, verse_reference: e.target.value }))}
                                placeholder="Ex: João 3:16 (ACF)"
                                className="w-full rounded-xl border border-border bg-app-bg px-4 py-2.5 text-sm text-app-text focus:outline-none focus:border-gold transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-app-text-muted mb-1">Texto do Versículo</label>
                        <textarea
                            value={form.verse_text}
                            onChange={(e) => setForm((f) => ({ ...f, verse_text: e.target.value }))}
                            rows={3}
                            placeholder="Porque Deus amou o mundo de tal maneira..."
                            className="w-full rounded-xl border border-border bg-app-bg px-4 py-2.5 text-sm text-app-text focus:outline-none focus:border-gold transition-colors resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-app-text-muted mb-1">Reflexão Editorial (opcional)</label>
                        <textarea
                            value={form.reflection_text}
                            onChange={(e) => setForm((f) => ({ ...f, reflection_text: e.target.value }))}
                            rows={2}
                            placeholder="Uma breve meditação sobre o versículo..."
                            className="w-full rounded-xl border border-border bg-app-bg px-4 py-2.5 text-sm text-app-text focus:outline-none focus:border-gold transition-colors resize-none"
                        />
                    </div>

                    {error && <p className="text-sm text-red-400">{error}</p>}
                    {successMsg && <p className="text-sm text-green-400">{successMsg}</p>}

                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full rounded-full bg-gold text-app-bg hover:bg-gold/90"
                    >
                        {saving ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                        ) : (
                            <><Plus className="mr-2 h-4 w-4" /> Salvar Versículo</>
                        )}
                    </Button>
                </div>

                {/* Scheduled verses list */}
                {verses.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="font-sans text-xs uppercase tracking-widest text-gold">
                            Programados ({verses.length})
                        </h2>
                        {verses.map((v) => (
                            <div
                                key={v.id}
                                className="group flex items-start justify-between gap-4 rounded-xl border border-border bg-app-surface px-4 py-3"
                            >
                                <div className="min-w-0">
                                    <p className="text-xs font-mono text-gold">{v.verse_date}</p>
                                    <p className="mt-0.5 text-sm text-app-text truncate">{v.verse_text}</p>
                                    <p className="text-xs text-app-text-muted">{v.verse_reference}</p>
                                </div>
                                <button
                                    onClick={() => handleDelete(v.id)}
                                    className="mt-0.5 flex-shrink-0 rounded-lg p-1.5 text-app-text-muted opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400 transition-all"
                                    aria-label="Remover versículo"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
