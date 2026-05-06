// ─────────────────────────────────────────────────────────────────────────────
// AdminArtigosPage.tsx — Admin de Artigos
// CRUD completo de artigos: criação, edição, publicação, exclusão.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import AuthModal from "@/components/AuthModal";
import { Loader2, Plus, Trash2, FileText, Sparkles, LogIn, XCircle, Edit, Eye, Star, StarOff, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

interface Article {
    id: string;
    title: string;
    slug: string;
    body: string;
    status: "rascunho" | "publicado";
    meta_title: string | null;
    meta_description: string | null;
    cover_image_url: string | null;
    featured: boolean;
    created_at: string;
    published_at: string | null;
}

interface ArticleFormData {
    title: string;
    slug: string;
    body: string;
    meta_title: string;
    meta_description: string;
    cover_image_url: string;
    featured: boolean;
}

const EMPTY_FORM: ArticleFormData = {
    title: "",
    slug: "",
    body: "",
    meta_title: "",
    meta_description: "",
    cover_image_url: "",
    featured: false,
};

function generateSlug(title: string): string {
    const accentMap: Record<string, string> = {
        á: 'a', à: 'a', â: 'a', ä: 'a', ã: 'a',
        é: 'e', è: 'e', ê: 'e', ë: 'e',
        í: 'i', ì: 'i', î: 'i', ï: 'i',
        ó: 'o', ò: 'o', ô: 'o', ö: 'o', õ: 'o',
        ú: 'u', ù: 'u', û: 'u', ü: 'u',
        ç: 'c', ñ: 'n',
    };
    const normalized = title.toLowerCase().replace(/[áàâäãéèêëíìîïóòôöõúùûüçñ]/gi, (m) => accentMap[m] ?? m);
    const withHyphens = normalized.replace(/\s+/g, '-');
    const alphanumeric = withHyphens.replace(/[^a-z0-9-]/g, '');
    return alphanumeric.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

export default function AdminArtigosPage() {
    const { user, loading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [view, setView] = useState<"list" | "form">("list");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ArticleFormData>(EMPTY_FORM);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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
        if (isAdmin) fetchArticles();
    }, [isAdmin]);

    async function fetchArticles() {
        setLoading(true);
        const { data } = await supabase
            .from("articles")
            .select("*")
            .order("created_at", { ascending: false });
        setArticles(data ?? []);
        setLoading(false);
    }

    function handleTitleChange(title: string) {
        setForm(f => ({ ...f, title, slug: editingId ? f.slug : generateSlug(title) }));
    }

    async function handleSave(publish = false) {
        if (!form.title || !form.slug) {
            setError("Título e slug são obrigatórios.");
            return;
        }
        setSaving(true);
        setError(null);
        setSuccessMsg(null);

        const payload = {
            title: form.title,
            slug: form.slug,
            body: form.body,
            status: publish ? "publicado" : "rascunho",
            meta_title: form.meta_title || null,
            meta_description: form.meta_description || null,
            cover_image_url: form.cover_image_url || null,
            featured: form.featured,
            published_at: publish ? new Date().toISOString() : (editingId ? undefined : null),
        };

        let error;
        if (editingId) {
            const result = await supabase.from("articles").update(payload).eq("id", editingId);
            error = result.error;
        } else {
            const result = await supabase.from("articles").insert(payload);
            error = result.error;
        }

        if (error) {
            setError(error.message);
        } else {
            setSuccessMsg(publish ? "Artigo publicado com sucesso!" : "Artigo salvo com sucesso!");
            setView("list");
            setEditingId(null);
            setForm(EMPTY_FORM);
            fetchArticles();
        }
        setSaving(false);
    }

    async function handleDelete(id: string) {
        await supabase.from("articles").delete().eq("id", id);
        setDeleteConfirm(null);
        fetchArticles();
    }

    async function toggleFeatured(article: Article) {
        await supabase.from("articles").update({ featured: !article.featured }).eq("id", article.id);
        fetchArticles();
    }

    function startEdit(article: Article) {
        setEditingId(article.id);
        setForm({
            title: article.title,
            slug: article.slug,
            body: article.body,
            meta_title: article.meta_title ?? "",
            meta_description: article.meta_description ?? "",
            cover_image_url: article.cover_image_url ?? "",
            featured: article.featured,
        });
        setView("form");
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
                        <FileText className="h-6 w-6 text-gold" />
                        <div>
                            <h1 className="font-serif text-2xl text-app-text">Admin de Artigos</h1>
                            <p className="mt-0.5 text-sm text-app-text-muted">Gerencie artigos publicados</p>
                        </div>
                    </div>
                    {view === "list" && (
                        <Button onClick={startCreate} className="rounded-full bg-gold text-app-bg hover:bg-gold/90">
                            <Plus className="mr-2 h-4 w-4" /> Novo Artigo
                        </Button>
                    )}
                </div>

                {view === "list" && (
                    <>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-gold" />
                            </div>
                        ) : articles.length === 0 ? (
                            <div className="text-center py-8 text-app-text-muted">
                                <p>Nenhum artigo encontrado. Crie o primeiro artigo.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {articles.map(article => (
                                    <div key={article.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-app-surface p-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${article.status === 'publicado' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                    {article.status}
                                                </span>
                                                {article.featured && <Star className="h-4 w-4 text-gold" />}
                                            </div>
                                            <h3 className="mt-1 font-medium text-app-text truncate">{article.title}</h3>
                                            <p className="text-xs text-app-text-muted">/{article.slug}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => toggleFeatured(article)} className="rounded-lg p-2 text-app-text-muted hover:bg-app-bg hover:text-gold" title={article.featured ? "Remover destaque" : "Destacar"}>
                                                {article.featured ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                                            </button>
                                            <Link to={`/artigos/${article.slug}`} target="_blank" className="rounded-lg p-2 text-app-text-muted hover:bg-app-bg hover:text-gold" title="Visualizar">
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                            <button onClick={() => startEdit(article)} className="rounded-lg p-2 text-app-text-muted hover:bg-app-bg hover:text-gold" title="Editar">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            {deleteConfirm === article.id ? (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleDelete(article.id)} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10" title="Confirmar exclusão">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => setDeleteConfirm(null)} className="rounded-lg p-2 text-app-text-muted hover:bg-app-bg" title="Cancelar">
                                                        <XCircle className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setDeleteConfirm(article.id)} className="rounded-lg p-2 text-app-text-muted hover:bg-red-500/10 hover:text-red-400" title="Excluir">
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
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-app-text-muted mb-1">Título</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={e => handleTitleChange(e.target.value)}
                                        className="w-full rounded-xl border border-border bg-app-bg px-4 py-2.5 text-sm text-app-text focus:outline-none focus:border-gold"
                                        placeholder="Título do artigo"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-app-text-muted mb-1">Slug</label>
                                    <input
                                        type="text"
                                        value={form.slug}
                                        onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                                        className="w-full rounded-xl border border-border bg-app-bg px-4 py-2.5 text-sm text-app-text focus:outline-none focus:border-gold"
                                        placeholder="slug-do-artigo"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-app-text-muted mb-1">URL da Imagem de Capa</label>
                                    <input
                                        type="text"
                                        value={form.cover_image_url}
                                        onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))}
                                        className="w-full rounded-xl border border-border bg-app-bg px-4 py-2.5 text-sm text-app-text focus:outline-none focus:border-gold"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-app-text-muted mb-1">Meta Title (SEO)</label>
                                    <input
                                        type="text"
                                        value={form.meta_title}
                                        onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))}
                                        className="w-full rounded-xl border border-border bg-app-bg px-4 py-2.5 text-sm text-app-text focus:outline-none focus:border-gold"
                                        placeholder="Título para SEO"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-app-text-muted mb-1">Meta Description (SEO)</label>
                                    <textarea
                                        value={form.meta_description}
                                        onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
                                        rows={2}
                                        className="w-full rounded-xl border border-border bg-app-bg px-4 py-2.5 text-sm text-app-text focus:outline-none focus:border-gold resize-none"
                                        placeholder="Descrição para SEO"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="featured"
                                        checked={form.featured}
                                        onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                                        className="rounded border-border"
                                    />
                                    <label htmlFor="featured" className="text-sm text-app-text">Artigo em destaque</label>
                                </div>
                                <div>
                                    <label className="block text-xs text-app-text-muted mb-1">Conteúdo (Markdown)</label>
                                    <textarea
                                        value={form.body}
                                        onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                                        rows={12}
                                        className="w-full rounded-xl border border-border bg-app-bg px-4 py-2.5 text-sm text-app-text focus:outline-none focus:border-gold font-mono resize-none"
                                        placeholder="# Título\n\nEscreva seu artigo aqui..."
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-sans text-xs uppercase tracking-widest text-gold">Preview</h3>
                                <div className="rounded-xl border border-border bg-app-surface p-4 min-h-[400px] prose prose-sm max-w-none prose-headings:font-serif prose-a:text-gold">
                                    {form.body ? <ReactMarkdown remarkPlugins={[remarkBreaks]}>{form.body}</ReactMarkdown> : <p className="text-app-text-muted italic">O preview aparecerá aqui...</p>}
                                </div>
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-400">{error}</p>}
                        {successMsg && <p className="text-sm text-green-400">{successMsg}</p>}

                        <div className="flex gap-3">
                            <Button onClick={() => handleSave(false)} disabled={saving} variant="outline" className="rounded-full">
                                <Save className="mr-2 h-4 w-4" /> Salvar Rascunho
                            </Button>
                            <Button onClick={() => handleSave(true)} disabled={saving} className="rounded-full bg-gold text-app-bg hover:bg-gold/90">
                                <Send className="mr-2 h-4 w-4" /> Publicar
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