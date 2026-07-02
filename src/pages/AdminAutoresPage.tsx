// ─────────────────────────────────────────────────────────────────────────────
// AdminAutoresPage.tsx — Admin de Autores
// CRUD completo de autores: cadastro, edição, exclusão.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import AuthModal from "@/components/AuthModal";
import AdminNav from "@/components/AdminNav";
import { Loader2, Plus, Trash2, Sparkles, LogIn, XCircle, Edit, Save, Upload, Check, AlertCircle, User, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/usePageMeta";

interface Author {
    id: string;
    name: string;
    slug: string;
    avatar_url: string | null;
    bio: string;
    church: string | null;
    city: string | null;
    role: string | null;
    created_at: string;
}

interface AuthorFormData {
    name: string;
    slug: string;
    avatar_url: string;
    bio: string;
    church: string;
    city: string;
    role: string;
}

const EMPTY_FORM: AuthorFormData = {
    name: "",
    slug: "",
    avatar_url: "",
    bio: "",
    church: "",
    city: "",
    role: "",
};

function generateSlug(name: string): string {
    const accentMap: Record<string, string> = {
        á: 'a', à: 'a', â: 'a', ä: 'a', ã: 'a',
        é: 'e', è: 'e', ê: 'e', ë: 'e',
        í: 'i', ì: 'i', î: 'i', ï: 'i',
        ó: 'o', ò: 'o', ô: 'o', ö: 'o', õ: 'o',
        ú: 'u',ù: 'u', û: 'u', ü: 'u',
        ç: 'c', ñ: 'n',
    };
    const normalized = name.toLowerCase().replace(/[áàâäãéèêëíìîïóòôöõúùûüçñ]/gi, (m) => accentMap[m] ?? m);
    const withHyphens = normalized.replace(/\s+/g, '-');
    const alphanumeric = withHyphens.replace(/[^a-z0-9-]/g, '');
    return alphanumeric.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

export default function AdminAutoresPage() {
    usePageMeta({
        title: "Admin de Autores — Bíblia Vive",
        robots: "noindex, nofollow",
    });

    const { user, loading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [view, setView] = useState<"list" | "form">("list");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<AuthorFormData>(EMPTY_FORM);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setIsAdmin(false);
            return;
        }
        const meta = user.app_metadata as Record<string, unknown>;
        setIsAdmin(meta?.role === "admin");
    }, [user, authLoading]);

    useEffect(() => {
        if (isAdmin) fetchAuthors();
    }, [isAdmin]);

    async function fetchAuthors() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("article_authors")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            setAuthors(data ?? []);
        } catch (err: any) {
            console.error('[AdminAutoresPage] fetchAuthors failed:', err);
        } finally {
            setLoading(false);
        }
    }

    function handleNameChange(name: string) {
        setForm(f => ({ ...f, name, slug: editingId ? f.slug : generateSlug(name) }));
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadError(null);

        try {
            const session = await getSession();
            if (!session?.access_token) {
                throw new Error("Sessão expirada. Faça login novamente.");
            }

            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`
            };

            const response = await fetch("/api/r2-presigned-url", {
                method: "POST",
                headers,
                body: JSON.stringify({ filename: file.name, contentType: file.type })
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Erro na API (${response.status}): ${text.slice(0, 50)}...`);
            }

            const { uploadUrl, finalUrl } = await response.json();

            const uploadRes = await fetch(uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file
            });
            if (!uploadRes.ok) throw new Error("Erro ao enviar arquivo para o Cloudflare");

            setForm(f => ({ ...f, avatar_url: finalUrl }));
            setSuccessMsg("Foto enviada com sucesso!");
        } catch (err: any) {
            console.error("Upload error:", err);
            setUploadError(err.message);
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    }

    async function handleSave() {
        if (!form.name || !form.slug) {
            setError("Nome e slug são obrigatórios.");
            return;
        }
        setSaving(true);
        setError(null);
        setSuccessMsg(null);

        const payload = {
            name: form.name,
            slug: form.slug,
            bio: form.bio,
            avatar_url: form.avatar_url || null,
            church: form.church || null,
            city: form.city || null,
            role: form.role || null,
        };

        let err;
        if (editingId) {
            const result = await supabase.from("article_authors").update(payload).eq("id", editingId);
            err = result.error;
        } else {
            const result = await supabase.from("article_authors").insert(payload);
            err = result.error;
        }

        if (err) {
            setError(err.message);
        } else {
            setSuccessMsg(editingId ? "Autor atualizado com sucesso!" : "Autor criado com sucesso!");
            setView("list");
            setEditingId(null);
            setForm(EMPTY_FORM);
            fetchAuthors();
        }
        setSaving(false);
    }

    async function handleDelete(id: string) {
        try {
            const { error } = await supabase.from("article_authors").delete().eq("id", id);
            if (error) throw error;
        } catch (err: any) {
            console.error('[AdminAutoresPage] delete failed:', err);
            alert("Erro ao deletar autor: " + err.message);
        } finally {
            setDeleteConfirm(null);
            fetchAuthors();
        }
    }

    function startEdit(author: Author) {
        setEditingId(author.id);
        setForm({
            name: author.name,
            slug: author.slug,
            avatar_url: author.avatar_url ?? "",
            bio: author.bio,
            church: author.church ?? "",
            city: author.city ?? "",
            role: author.role ?? "",
        });
        setView("form");
        setError(null);
        setSuccessMsg(null);
    }

    function startCreate() {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setView("form");
        setError(null);
        setSuccessMsg(null);
    }

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
                            Faça login com uma conta de administrador para acessar.
                        </p>
                    </div>
                    <button
                        onClick={() => setAuthModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-gold/60 bg-transparent px-6 py-2.5 text-sm font-medium text-gold transition-colors hover:bg-gold-bg"
                    >
                        <LogIn className="h-4 w-4" />
                        Fazer Login
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
                        <p className="mt-2 text-sm text-app-text-muted max-w-[300px]">
                            Seu usuário ({user.email}) não possui a função 'admin'.
                        </p>
                    </div>
                    <Link to="/" className="mt-2 text-sm text-gold hover:underline">Voltar para o Início</Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="mx-auto max-w-5xl space-y-6 py-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Award className="h-6 w-6 text-gold" />
                        <div>
                            <h1 className="font-serif text-2xl text-app-text">Admin de Autores</h1>
                            <p className="mt-0.5 text-sm text-app-text-muted">Gerencie autores dos artigos do site</p>
                        </div>
                    </div>
                    {view === "list" && (
                        <Button onClick={startCreate} className="rounded-full bg-gold text-app-bg hover:bg-gold/90">
                            <Plus className="mr-2 h-4 w-4" /> Novo Autor
                        </Button>
                    )}
                </div>

                <AdminNav />

                {view === "list" && (
                    <>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-gold" />
                            </div>
                        ) : authors.length === 0 ? (
                            <div className="text-center py-8 text-app-text-muted">
                                <p>Nenhum autor cadastrado ainda. Adicione o primeiro autor.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {authors.map(author => (
                                    <div key={author.id} className="relative flex flex-col justify-between rounded-xl border border-border bg-app-surface p-5">
                                        <div className="flex items-start gap-4">
                                            {author.avatar_url ? (
                                                <img
                                                    src={author.avatar_url}
                                                    alt={author.name}
                                                    className="h-12 w-12 rounded-full object-cover border border-border"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 rounded-full bg-app-raised flex items-center justify-center border border-border">
                                                    <User className="h-6 w-6 text-app-text-muted" />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-medium text-app-text truncate">{author.name}</h3>
                                                {author.role && <p className="text-xs text-gold truncate">{author.role}</p>}
                                                {author.church && <p className="text-xs text-app-text-muted truncate">{author.church}</p>}
                                                {author.city && <p className="text-[10px] text-app-text-muted font-mono">{author.city}</p>}
                                            </div>
                                        </div>
                                        <p className="mt-3 text-xs text-app-text-muted line-clamp-2 italic">
                                            "{author.bio || 'Sem biografia espiritual descrita.'}"
                                        </p>
                                        <div className="mt-4 pt-4 border-t border-border/50 flex justify-end gap-2">
                                            <Link to={`/autor/${author.slug}`} target="_blank" className="text-xs text-gold hover:underline mr-auto self-center">
                                                Ver perfil público
                                            </Link>
                                            <button onClick={() => startEdit(author)} className="rounded-lg p-2 text-app-text-muted hover:bg-app-bg hover:text-gold" title="Editar">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            {deleteConfirm === author.id ? (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleDelete(author.id)} className="rounded-lg bg-red-500/20 px-2 py-1 text-xs text-red-400 hover:bg-red-500/30">
                                                        Confirmar
                                                    </button>
                                                    <button onClick={() => setDeleteConfirm(null)} className="rounded-lg bg-border px-2 py-1 text-xs text-app-text-muted">
                                                        Cancelar
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setDeleteConfirm(author.id)} className="rounded-lg p-2 text-app-text-muted hover:bg-app-bg hover:text-red-400" title="Excluir">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {view === "form" && (
                    <div className="rounded-2xl border border-border bg-app-surface p-6 space-y-6 max-w-2xl mx-auto">
                        <h2 className="font-serif text-lg text-app-text">
                            {editingId ? "Editar Autor" : "Novo Autor"}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-app-text-muted mb-1">Nome do Autor *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => handleNameChange(e.target.value)}
                                    className="w-full rounded-xl border border-border bg-app-bg px-4 py-2.5 text-sm text-app-text focus:outline-none focus:border-gold"
                                    placeholder="Ex: Pr. Cláudio Duarte"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-app-text-muted mb-1">Slug (URL)</label>
                                    <input
                                        type="text"
                                        value={form.slug}
                                        onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                                        className="w-full rounded-xl border border-border bg-app-bg px-4 py-2.5 text-sm text-app-text focus:outline-none focus:border-gold"
                                        placeholder="ex-pastor-joao"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-app-text-muted mb-1">Atuação / Cargo Ministerial</label>
                                    <input
                                        type="text"
                                        value={form.role}
                                        onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                        className="w-full rounded-xl border border-border bg-app-bg px-4 py-2.5 text-sm text-app-text focus:outline-none focus:border-gold"
                                        placeholder="Ex: Pastor, Missionária, Teólogo"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-app-text-muted mb-1">Igreja / Ministério</label>
                                    <input
                                        type="text"
                                        value={form.church}
                                        onChange={e => setForm(f => ({ ...f, church: e.target.value }))}
                                        className="w-full rounded-xl border border-border bg-app-bg px-4 py-2.5 text-sm text-app-text focus:outline-none focus:border-gold"
                                        placeholder="Ex: Igreja Batista da Lagoinha"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-app-text-muted mb-1">Cidade - Estado</label>
                                    <input
                                        type="text"
                                        value={form.city}
                                        onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                                        className="w-full rounded-xl border border-border bg-app-bg px-4 py-2.5 text-sm text-app-text focus:outline-none focus:border-gold"
                                        placeholder="Ex: Belo Horizonte - MG"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-app-text-muted mb-1">Foto de Perfil (Avatar)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={form.avatar_url}
                                        onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))}
                                        className="flex-1 rounded-xl border border-border bg-app-bg px-4 py-2.5 text-sm text-app-text focus:outline-none focus:border-gold"
                                        placeholder="https://..."
                                    />
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="author-avatar-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            disabled={uploading}
                                        />
                                        <label
                                            htmlFor="author-avatar-upload"
                                            className={`flex items-center justify-center p-2.5 rounded-xl border border-dashed border-gold/40 text-gold hover:bg-gold-bg cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                                        >
                                            {uploading ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <Upload className="h-5 w-5" />
                                            )}
                                        </label>
                                    </div>
                                </div>
                                {uploadError && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {uploadError}</p>}
                                {form.avatar_url && !uploading && !uploadError && <p className="mt-1 text-xs text-green-400 flex items-center gap-1"><Check className="h-3 w-3" /> Foto selecionada</p>}
                            </div>

                            <div>
                                <label className="block text-xs text-app-text-muted mb-1">Biografia Espiritual / Ministerial (3-4 linhas)</label>
                                <textarea
                                    value={form.bio}
                                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                                    rows={4}
                                    className="w-full rounded-xl border border-border bg-app-bg px-4 py-2.5 text-sm text-app-text focus:outline-none focus:border-gold resize-none"
                                    placeholder="Conte brevemente sobre o chamado, formação teológica e atuação espiritual..."
                                />
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-400">{error}</p>}
                        {successMsg && <p className="text-sm text-green-400">{successMsg}</p>}

                        <div className="flex gap-3 pt-2">
                            <Button onClick={handleSave} disabled={saving} className="rounded-full bg-gold text-app-bg hover:bg-gold/90">
                                <Save className="mr-2 h-4 w-4" /> Salvar Autor
                            </Button>
                            <Button onClick={() => { setView("list"); setForm(EMPTY_FORM); setEditingId(null); }} variant="ghost" className="rounded-full">
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
