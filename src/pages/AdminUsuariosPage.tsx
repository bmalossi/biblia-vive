// ─────────────────────────────────────────────────────────────────────────────
// AdminUsuariosPage.tsx — Painel Admin: Gestão de Usuários
// Permite ao admin listar, buscar e editar planos de assinatura de qualquer leitor.
// Protegido via app_metadata.role === 'admin' (mesmo padrão do Admin Hub).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import AuthModal from "@/components/AuthModal";
import AdminNav from "@/components/AdminNav";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import {
    Loader2, Users, Search, Home, FileText, BookOpen,
    LogIn, XCircle, Sparkles, ChevronLeft, ChevronRight,
    Crown, Building2, UserX, Edit3, X, Check, AlertTriangle,
    Calendar, RefreshCw,
} from "lucide-react";

// ── Tipos ────────────────────────────────────────────────────────────────────

interface UserRow {
    user_id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string | null;
    plan_type: "pro" | "templo" | "none";
    sub_status: "active" | "trialing" | "canceled" | "past_due" | "unpaid" | "incomplete" | "incomplete_expired" | "none";
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    stripe_customer_id: string | null;
}

interface EditState {
    user_id: string;
    email: string;
    plan_type: "pro" | "templo" | "none";
    sub_status: "active" | "trialing" | "canceled" | "none";
    current_period_end: string; // ISO date string YYYY-MM-DD
    cancel_at_period_end: boolean;
}

const PAGE_SIZE = 25;

// ── Helpers ──────────────────────────────────────────────────────────────────

function addMonths(months: number): string {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toISOString().slice(0, 10);
}

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Badges ───────────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: string }) {
    if (plan === "templo") return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 border border-purple-500/30 px-2.5 py-0.5 text-[0.65rem] font-semibold text-purple-400 uppercase tracking-wide">
            <Building2 className="h-3 w-3" /> Templo
        </span>
    );
    if (plan === "pro") return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 border border-gold/30 px-2.5 py-0.5 text-[0.65rem] font-semibold text-gold uppercase tracking-wide">
            <Crown className="h-3 w-3" /> PRO
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-app-surface border border-border px-2.5 py-0.5 text-[0.65rem] font-semibold text-app-text-muted uppercase tracking-wide">
            <UserX className="h-3 w-3" /> Gratuito
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string }> = {
        active:               { label: "Ativo",        cls: "text-green-400 bg-green-500/10 border-green-500/30" },
        trialing:             { label: "Trial",        cls: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
        canceled:             { label: "Cancelado",    cls: "text-red-400 bg-red-500/10 border-red-500/30" },
        past_due:             { label: "Vencido",      cls: "text-orange-400 bg-orange-500/10 border-orange-500/30" },
        unpaid:               { label: "Inadimplente", cls: "text-red-400 bg-red-500/10 border-red-500/30" },
        incomplete:           { label: "Incompleto",   cls: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" },
        incomplete_expired:   { label: "Expirado",     cls: "text-red-400 bg-red-500/10 border-red-500/30" },
        none:                 { label: "Sem plano",    cls: "text-app-text-muted bg-app-surface border-border" },
    };
    const { label, cls } = map[status] ?? map.none;
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${cls}`}>
            {label}
        </span>
    );
}

// ── Modal de Edição ───────────────────────────────────────────────────────────

function EditModal({
    edit,
    onClose,
    onSave,
    onRevoke,
    saving,
}: {
    edit: EditState;
    onClose: () => void;
    onSave: (data: EditState) => Promise<void>;
    onRevoke: (userId: string) => Promise<void>;
    saving: boolean;
}) {
    const [form, setForm] = useState<EditState>(edit);
    const [confirmRevoke, setConfirmRevoke] = useState(false);

    const set = <K extends keyof EditState>(key: K, value: EditState[K]) =>
        setForm(f => ({ ...f, [key]: value }));

    const presets = [
        { label: "+1 mês",  value: addMonths(1) },
        { label: "+3 meses", value: addMonths(3) },
        { label: "+1 ano",  value: addMonths(12) },
        { label: "+2 anos", value: addMonths(24) },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="relative w-full max-w-lg rounded-2xl border border-border bg-app-bg shadow-2xl p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="font-serif text-lg text-app-text font-bold">Editar Plano</h2>
                        <p className="text-xs text-app-text-muted mt-0.5 truncate max-w-[320px]">{edit.email}</p>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-app-text-muted hover:bg-app-surface transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Plano */}
                <div className="grid grid-cols-3 gap-2">
                    {(["none", "pro", "templo"] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => {
                                set("plan_type", p);
                                if (p === "none") { set("sub_status", "none"); set("current_period_end", ""); }
                                else if (form.sub_status === "none") set("sub_status", "active");
                            }}
                            className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 px-2 text-center transition-all ${
                                form.plan_type === p
                                    ? p === "templo" ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
                                    : p === "pro"    ? "border-gold/50 bg-gold/10 text-gold"
                                    :                  "border-border bg-app-surface text-app-text"
                                    : "border-border text-app-text-muted hover:border-border/80 hover:bg-app-surface/50"
                            }`}
                        >
                            {p === "templo" ? <Building2 className="h-4 w-4" /> : p === "pro" ? <Crown className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                            <span className="text-xs font-semibold uppercase tracking-wide">
                                {p === "none" ? "Gratuito" : p === "pro" ? "PRO" : "Templo"}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Status (apenas se tiver plano) */}
                {form.plan_type !== "none" && (
                    <div className="space-y-1.5">
                        <label className="block text-xs text-app-text-muted font-medium">Status da Assinatura</label>
                        <select
                            value={form.sub_status}
                            onChange={e => set("sub_status", e.target.value as EditState["sub_status"])}
                            className="w-full rounded-xl border border-border bg-app-bg px-3 py-2 text-sm text-app-text focus:outline-none focus:border-gold transition-colors"
                        >
                            <option value="active">Ativo</option>
                            <option value="trialing">Trial</option>
                            <option value="canceled">Cancelado</option>
                        </select>
                    </div>
                )}

                {/* Data de expiração (apenas se tiver plano) */}
                {form.plan_type !== "none" && (
                    <div className="space-y-2">
                        <label className="block text-xs text-app-text-muted font-medium flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" /> Data de Expiração
                        </label>
                        {/* Presets */}
                        <div className="flex flex-wrap gap-1.5">
                            {presets.map(p => (
                                <button
                                    key={p.label}
                                    onClick={() => set("current_period_end", p.value)}
                                    className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                                        form.current_period_end === p.value
                                            ? "border-gold/50 bg-gold/10 text-gold"
                                            : "border-border text-app-text-muted hover:border-gold/30 hover:text-app-text"
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        <input
                            type="date"
                            value={form.current_period_end}
                            onChange={e => set("current_period_end", e.target.value)}
                            className="w-full rounded-xl border border-border bg-app-bg px-3 py-2 text-sm text-app-text focus:outline-none focus:border-gold transition-colors"
                        />
                    </div>
                )}

                {/* Cancel at period end */}
                {form.plan_type !== "none" && (
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <div
                            onClick={() => set("cancel_at_period_end", !form.cancel_at_period_end)}
                            className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${form.cancel_at_period_end ? "bg-red-500/70" : "bg-app-surface border border-border"}`}
                        >
                            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.cancel_at_period_end ? "translate-x-4" : "translate-x-0.5"}`} />
                        </div>
                        <span className="text-xs text-app-text-muted">Cancelar ao vencer</span>
                    </label>
                )}

                {/* Ações */}
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                    {/* Revogar */}
                    {!confirmRevoke ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmRevoke(true)}
                            className="text-red-400 hover:text-red-400 hover:bg-red-500/10 gap-1.5 text-xs"
                        >
                            <UserX className="h-3.5 w-3.5" /> Revogar Plano
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-red-400 flex items-center gap-1">
                                <AlertTriangle className="h-3.5 w-3.5" /> Confirmar?
                            </span>
                            <Button size="sm" variant="destructive" onClick={() => onRevoke(edit.user_id)} disabled={saving} className="text-xs h-7">
                                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Sim, revogar"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setConfirmRevoke(false)} className="text-xs h-7">Não</Button>
                        </div>
                    )}

                    <div className="ml-auto flex gap-2">
                        <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">Cancelar</Button>
                        <Button
                            size="sm"
                            onClick={() => onSave(form)}
                            disabled={saving}
                            className="bg-gold text-app-bg hover:bg-gold/90 gap-1.5 text-xs font-bold"
                        >
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            Salvar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}



// ── Página Principal ──────────────────────────────────────────────────────────

export default function AdminUsuariosPage() {
    usePageMeta({ title: "Admin — Usuários — Bíblia Vive", robots: "noindex, nofollow" });

    const { user, loading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [authModalOpen, setAuthModalOpen] = useState(false);

    const [users, setUsers] = useState<UserRow[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [editTarget, setEditTarget] = useState<EditState | null>(null);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // ── Admin check ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (authLoading) return;
        if (!user) { setIsAdmin(false); return; }
        const meta = user.app_metadata as Record<string, unknown>;
        setIsAdmin(meta?.role === "admin");
    }, [user, authLoading]);

    // ── Debounce search ──────────────────────────────────────────────────────
    useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 400);
        return () => clearTimeout(t);
    }, [search]);

    // ── Fetch users ──────────────────────────────────────────────────────────
    const fetchUsers = useCallback(async () => {
        if (!isAdmin) return;
        setLoading(true);
        setError(null);
        try {
            // Tentativa 1: usar RPC admin_list_users (requer sprint20-schema.sql executado)
            const listResult = await supabase.rpc("admin_list_users", {
                p_search: debouncedSearch,
                p_limit: PAGE_SIZE,
                p_offset: page * PAGE_SIZE,
            });

            if (!listResult.error) {
                const countResult = await supabase.rpc("admin_count_users", { p_search: debouncedSearch });
                setUsers((listResult.data as UserRow[]) ?? []);
                setTotalCount(!countResult.error ? (countResult.data as number ?? 0) : (listResult.data as UserRow[]).length);
                return;
            }

            // Tentativa 2 (fallback): buscar diretamente de user_subscriptions via RLS.
            // Funciona sem o SQL executado, mas só mostra usuários que têm assinatura.
            console.warn("RPC admin_list_users indisponível, usando fallback via user_subscriptions.", listResult.error);

            let query = supabase
                .from("user_subscriptions")
                .select("user_id, status, plan_type, current_period_end, cancel_at_period_end, stripe_customer_id, updated_at", { count: "exact" })
                .order("updated_at", { ascending: false })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

            if (debouncedSearch) {
                // Sem acesso a auth.users, não conseguimos filtrar por email no fallback
                // Mostra aviso e lista sem filtro
            }

            const { data: subs, error: subsError, count } = await query;
            if (subsError) throw subsError;

            const mapped: UserRow[] = (subs ?? []).map((s: any) => ({
                user_id: s.user_id,
                email: `${s.user_id.slice(0, 8)}...` + " (execute sprint20-schema.sql para ver e-mail)",
                created_at: s.updated_at ?? new Date().toISOString(),
                last_sign_in_at: null,
                plan_type: (s.plan_type || "none") as UserRow["plan_type"],
                sub_status: (s.status || "none") as UserRow["sub_status"],
                current_period_end: s.current_period_end ?? null,
                cancel_at_period_end: s.cancel_at_period_end ?? false,
                stripe_customer_id: s.stripe_customer_id ?? null,
            }));

            setUsers(mapped);
            setTotalCount(count ?? mapped.length);

            if (!debouncedSearch) {
                setError("⚠️ Modo parcial: execute sprint20-schema.sql no Supabase SQL Editor para ver todos os usuários com e-mail e cadastro.");
            }
        } catch (err: any) {
            setError(err.message ?? "Erro ao carregar usuários.");
        } finally {
            setLoading(false);
        }
    }, [isAdmin, debouncedSearch, page]);


    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // ── Salvar alterações ────────────────────────────────────────────────────
    const handleSave = async (data: EditState) => {
        setSaving(true);
        setSuccessMsg(null);
        try {
            const periodEnd = data.current_period_end ? new Date(data.current_period_end).toISOString() : null;

            const { error } = await supabase
                .from("user_subscriptions")
                .upsert({
                    user_id: data.user_id,
                    status: data.plan_type === "none" ? "canceled" : data.sub_status,
                    plan_type: data.plan_type,
                    current_period_end: periodEnd,
                    cancel_at_period_end: data.cancel_at_period_end,
                    updated_at: new Date().toISOString(),
                }, { onConflict: "user_id" });

            if (error) throw error;
            setSuccessMsg(`Plano de ${data.email} atualizado com sucesso!`);
            setEditTarget(null);
            await fetchUsers();
            setTimeout(() => setSuccessMsg(null), 4000);
        } catch (err: any) {
            setError(err.message ?? "Erro ao salvar.");
        } finally {
            setSaving(false);
        }
    };

    // ── Revogar plano ────────────────────────────────────────────────────────
    const handleRevoke = async (userId: string) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from("user_subscriptions")
                .upsert({
                    user_id: userId,
                    status: "canceled",
                    plan_type: "none",
                    current_period_end: null,
                    cancel_at_period_end: false,
                    updated_at: new Date().toISOString(),
                }, { onConflict: "user_id" });
            if (error) throw error;
            setSuccessMsg("Plano revogado com sucesso.");
            setEditTarget(null);
            await fetchUsers();
            setTimeout(() => setSuccessMsg(null), 4000);
        } catch (err: any) {
            setError(err.message ?? "Erro ao revogar.");
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (u: UserRow) => {
        setEditTarget({
            user_id: u.user_id,
            email: u.email,
            plan_type: u.plan_type === "none" ? "none" : u.plan_type,
            sub_status: (u.sub_status === "none" ? "active" : u.sub_status) as EditState["sub_status"],
            current_period_end: u.current_period_end ? new Date(u.current_period_end).toISOString().slice(0, 10) : addMonths(1),
            cancel_at_period_end: u.cancel_at_period_end,
        });
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    // ── Guards ───────────────────────────────────────────────────────────────
    if (authLoading || isAdmin === null) {
        return <Layout><div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div></Layout>;
    }
    if (!user) {
        return (
            <Layout>
                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
                    <Sparkles className="h-10 w-10 text-gold" />
                    <div>
                        <h1 className="font-serif text-2xl text-app-text">Área Restrita</h1>
                        <p className="mt-2 text-sm text-app-text-muted">Faça login com uma conta de administrador.</p>
                    </div>
                    <button onClick={() => setAuthModalOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-gold/60 bg-transparent px-6 py-2.5 text-sm font-medium text-gold transition-colors hover:bg-gold-bg">
                        <LogIn className="h-4 w-4" /> Fazer Login
                    </button>
                    <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} hint="Entre com sua conta de administrador." />
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
                        <p className="mt-2 text-sm text-app-text-muted max-w-[300px]">Seu usuário ({user.email}) não possui a função 'admin'.</p>
                    </div>
                    <Link to="/" className="mt-2 text-sm text-gold hover:underline">Voltar para o Início</Link>
                </div>
            </Layout>
        );
    }

    // ── UI ───────────────────────────────────────────────────────────────────
    return (
        <Layout>
            <div className="mx-auto max-w-6xl space-y-8 py-8 px-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-gold" />
                    <div>
                        <h1 className="font-serif text-2xl text-app-text">Gestão de Usuários</h1>
                        <p className="mt-0.5 text-sm text-app-text-muted">
                            {totalCount > 0 ? `${totalCount} leitor${totalCount !== 1 ? "es" : ""} cadastrado${totalCount !== 1 ? "s" : ""}` : "Gerenciamento de planos e assinaturas"}
                        </p>
                    </div>
                </div>

                {/* Nav */}
                <AdminNav />

                {/* Mensagens de feedback */}
                {successMsg && (
                    <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                        <Check className="h-4 w-4 flex-shrink-0" /> {successMsg}
                    </div>
                )}
                {error && (
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}</span>
                        <button onClick={() => setError(null)} className="flex-shrink-0"><X className="h-4 w-4" /></button>
                    </div>
                )}

                {/* Barra de busca + refresh */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-app-text-muted pointer-events-none" />
                        <input
                            type="search"
                            placeholder="Buscar por e-mail..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-border bg-app-bg pl-10 pr-4 py-2.5 text-sm text-app-text focus:outline-none focus:border-gold transition-colors placeholder:text-app-text-muted/60"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchUsers}
                        disabled={loading}
                        className="h-10 w-10 rounded-xl border-border hover:border-gold/40 flex-shrink-0"
                        title="Atualizar lista"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>

                {/* Tabela */}
                <div className="rounded-2xl border border-border bg-app-surface overflow-hidden">
                    {/* Header da tabela */}
                    <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2.5 border-b border-border bg-app-bg/50">
                        {["E-mail", "Plano", "Status", "Cadastro", "Expira em", ""].map(h => (
                            <span key={h} className="text-[0.65rem] font-semibold uppercase tracking-widest text-app-text-muted">{h}</span>
                        ))}
                    </div>

                    {/* Linhas */}
                    {loading && users.length === 0 ? (
                        <div className="flex items-center justify-center py-16 gap-3 text-app-text-muted">
                            <Loader2 className="h-5 w-5 animate-spin text-gold" />
                            <span className="text-sm">Carregando usuários...</span>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-app-text-muted">
                            <Users className="h-8 w-8 opacity-30" />
                            <p className="text-sm">{debouncedSearch ? "Nenhum usuário encontrado para essa busca." : "Nenhum usuário cadastrado."}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {users.map(u => (
                                <div
                                    key={u.user_id}
                                    className="group grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 items-center px-4 py-3.5 hover:bg-app-bg/40 transition-colors"
                                >
                                    {/* Email */}
                                    <div className="min-w-0">
                                        <p className="text-sm text-app-text truncate font-medium">{u.email}</p>
                                        <p className="text-[0.65rem] text-app-text-muted mt-0.5">
                                            Último acesso: {formatDateTime(u.last_sign_in_at)}
                                        </p>
                                    </div>
                                    {/* Plano */}
                                    <div><PlanBadge plan={u.plan_type} /></div>
                                    {/* Status */}
                                    <div><StatusBadge status={u.sub_status} /></div>
                                    {/* Cadastro */}
                                    <p className="text-xs text-app-text-muted">{formatDate(u.created_at)}</p>
                                    {/* Expira */}
                                    <p className="text-xs text-app-text-muted">
                                        {u.plan_type !== "none" && u.current_period_end
                                            ? formatDate(u.current_period_end)
                                            : "—"}
                                        {u.cancel_at_period_end && <span className="ml-1 text-red-400/70">(cancela)</span>}
                                    </p>
                                    {/* Ação */}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => openEdit(u)}
                                        className="h-8 gap-1.5 text-xs text-app-text-muted hover:text-gold hover:bg-gold/10 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Edit3 className="h-3.5 w-3.5" /> Editar
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between gap-4">
                        <p className="text-xs text-app-text-muted">
                            Página {page + 1} de {totalPages} · {totalCount} usuários
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0 || loading} className="gap-1.5 h-8 text-xs">
                                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1 || loading} className="gap-1.5 h-8 text-xs">
                                Próxima <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de edição */}
            {editTarget && (
                <EditModal
                    edit={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSave={handleSave}
                    onRevoke={handleRevoke}
                    saving={saving}
                />
            )}
        </Layout>
    );
}
