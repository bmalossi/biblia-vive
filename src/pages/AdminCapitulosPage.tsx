// ─────────────────────────────────────────────────────────────────────────────
// AdminCapitulosPage.tsx — Gestão do Capítulo de Hoje (Jornada Narrativa de Permanência)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import AuthModal from "@/components/AuthModal";
import AdminNav from "@/components/AdminNav";
import {
  Loader2,
  Plus,
  Trash2,
  Edit2,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  LogIn,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/usePageMeta";
import { EditorialChapter } from "@/types/editorialChapter";
import { ALL_BOOKS } from "@/lib/books";

interface ChapterForm {
  series_name: string;
  series_order: number;
  chapter_number: number;
  title: string;
  intro_text: string;
  book_slug: string;
  book_name: string;
  chapter: number;
  verse_start: string;
  verse_end: string;
  publish_date: string;
  status: "rascunho" | "publicado";
}

const EMPTY_FORM: ChapterForm = {
  series_name: "Permanecer",
  series_order: 1,
  chapter_number: 1,
  title: "",
  intro_text: "",
  book_slug: "sl",
  book_name: "Salmos",
  chapter: 1,
  verse_start: "",
  verse_end: "",
  publish_date: new Date().toISOString().split("T")[0],
  status: "publicado",
};

export default function AdminCapitulosPage() {
  usePageMeta({
    title: "Gestão do Capítulo de Hoje — Admin Bíblia Vive",
    robots: "noindex, nofollow",
  });

  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [chapters, setChapters] = useState<EditorialChapter[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ChapterForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [isTriggeringNotifications, setIsTriggeringNotifications] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleTriggerNotifications = async () => {
    setIsTriggeringNotifications(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/notifications/trigger-scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao disparar notificações agendadas");
      }

      setSuccessMsg(data.message || "Verificação de notificações concluída!");
      await loadChapters();
    } catch (err: unknown) {
      console.error("Erro ao disparar notificações:", err);
      const msg = err instanceof Error ? err.message : "Erro ao disparar notificações";
      setError(msg);
    } finally {
      setIsTriggeringNotifications(false);
    }
  };

  // Checagem de role de admin
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      return;
    }
    const role = user.app_metadata?.role;
    setIsAdmin(role === "admin");
  }, [user, authLoading]);

  // Carregar lista de capítulos
  const loadChapters = async () => {
    try {
      setLoadingChapters(true);
      const { data, error } = await supabase
        .from("editorial_chapters")
        .select("*")
        .order("publish_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChapters(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar capítulos:", err);
      setError("Falha ao carregar a lista de capítulos.");
    } finally {
      setLoadingChapters(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadChapters();
    }
  }, [isAdmin]);

  // Atualiza book_name ao alterar book_slug
  const handleBookChange = (slug: string) => {
    const found = ALL_BOOKS.find((b) => b.slug.toLowerCase() === slug.toLowerCase());
    setForm((prev) => ({
      ...prev,
      book_slug: slug,
      book_name: found ? found.name : prev.book_name,
    }));
  };

  // Salvar / Atualizar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.intro_text.trim()) {
      setError("O título e o texto introdutório são obrigatórios.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const payload = {
        series_name: form.series_name.trim(),
        series_order: Number(form.series_order) || 1,
        chapter_number: Number(form.chapter_number) || 1,
        title: form.title.trim(),
        intro_text: form.intro_text.trim(),
        book_slug: form.book_slug,
        book_name: form.book_name,
        chapter: Number(form.chapter) || 1,
        verse_start: form.verse_start ? Number(form.verse_start) : null,
        verse_end: form.verse_end ? Number(form.verse_end) : null,
        publish_date: form.publish_date,
        status: form.status,
      };

      if (editingId) {
        const { error } = await supabase
          .from("editorial_chapters")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        setSuccessMsg("Capítulo atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("editorial_chapters").insert(payload);
        if (error) throw error;
        setSuccessMsg("Novo capítulo criado com sucesso!");
      }

      setForm(EMPTY_FORM);
      setEditingId(null);
      await loadChapters();
    } catch (err: any) {
      console.error("Erro ao salvar capítulo:", err);
      setError(err.message || "Ocorreu um erro ao salvar o capítulo.");
    } finally {
      setSaving(false);
    }
  };

  // Preencher formulário para edição
  const handleEdit = (item: EditorialChapter) => {
    setEditingId(item.id);
    setForm({
      series_name: item.series_name,
      series_order: item.series_order ?? 1,
      chapter_number: item.chapter_number,
      title: item.title,
      intro_text: item.intro_text,
      book_slug: item.book_slug,
      book_name: item.book_name,
      chapter: item.chapter,
      verse_start: item.verse_start ? String(item.verse_start) : "",
      verse_end: item.verse_end ? String(item.verse_end) : "",
      publish_date: item.publish_date,
      status: item.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Deletar
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este capítulo?")) return;

    try {
      setError(null);
      const { error } = await supabase.from("editorial_chapters").delete().eq("id", id);
      if (error) throw error;

      setSuccessMsg("Capítulo removido.");
      await loadChapters();
    } catch (err: any) {
      console.error("Erro ao deletar:", err);
      setError("Erro ao excluir capítulo.");
    }
  };

  // Se não autenticado ou não admin
  if (authLoading) {
    return (
      <Layout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="mx-auto max-w-md py-16 text-center">
          <LogIn className="mx-auto h-12 w-12 text-gold" />
          <h1 className="mt-4 font-serif text-2xl font-bold text-app-text">
            Acesso Restrito
          </h1>
          <p className="mt-2 text-sm text-app-text-muted">
            Faça login com uma conta de administrador para acessar o painel.
          </p>
          <Button onClick={() => setAuthModalOpen(true)} className="mt-6">
            Entrar
          </Button>
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
          />
        </div>
      </Layout>
    );
  }

  if (isAdmin === false) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl py-8 px-4">
        {/* Navegação Principal do Admin */}
        <AdminNav />

        {/* Cabeçalho da Seção */}
        <div className="my-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-app-text flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-gold" />
              Capítulo de Hoje — Jornada de Permanência
            </h1>
            <p className="mt-1 text-sm text-app-text-muted">
              Gerencie a sequência de capítulos narrativos exibidos na página inicial.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={isTriggeringNotifications}
              onClick={handleTriggerNotifications}
              className="border-gold/40 text-gold hover:bg-gold/10 flex items-center gap-1.5 text-xs md:text-sm"
            >
              {isTriggeringNotifications ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              Disparar Notificações Pendentes
            </Button>
            {editingId && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY_FORM);
                }}
              >
                Cancelar Edição
              </Button>
            )}
          </div>
        </div>

        {/* Notificações */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-6 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
            {successMsg}
          </div>
        )}

        {/* Formulário de Cadastro / Edição */}
        <form
          onSubmit={handleSubmit}
          className="mb-10 rounded-2xl border border-border bg-app-surface p-6 shadow-sm space-y-6"
        >
          <h2 className="font-serif text-lg font-semibold text-app-text border-b border-border pb-3">
            {editingId ? "Editar Capítulo" : "Cadastrar Novo Capítulo"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-app-text-muted mb-1">
                Nome da Série (Tema)
              </label>
              <input
                type="text"
                value={form.series_name}
                onChange={(e) => setForm({ ...form, series_name: e.target.value })}
                placeholder="Ex: Permanecer"
                className="w-full rounded-lg border border-border bg-app-raised px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-1 focus:ring-gold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-app-text-muted mb-1">
                Nº da Série (Temporada)
              </label>
              <input
                type="number"
                min="1"
                value={form.series_order}
                onChange={(e) =>
                  setForm({ ...form, series_order: parseInt(e.target.value) || 1 })
                }
                placeholder="Ex: 1 para Série 1"
                className="w-full rounded-lg border border-border bg-app-raised px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-1 focus:ring-gold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-app-text-muted mb-1">
                Nº do Capítulo na Série
              </label>
              <input
                type="number"
                min="1"
                value={form.chapter_number}
                onChange={(e) =>
                  setForm({ ...form, chapter_number: parseInt(e.target.value) || 1 })
                }
                className="w-full rounded-lg border border-border bg-app-raised px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-1 focus:ring-gold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-app-text-muted mb-1">
                Data de Publicação
              </label>
              <input
                type="date"
                value={form.publish_date}
                onChange={(e) => setForm({ ...form, publish_date: e.target.value })}
                className="w-full rounded-lg border border-border bg-app-raised px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-1 focus:ring-gold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-app-text-muted mb-1">
              Título Principal em Destaque
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Você percebeu como quase tudo hoje exige pressa?"
              className="w-full rounded-lg border border-border bg-app-raised px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-1 focus:ring-gold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-app-text-muted mb-1">
              Texto Introdutório (Parágrafos separados por duas quebras de linha '\n\n')
            </label>
            <textarea
              value={form.intro_text}
              onChange={(e) => setForm({ ...form, intro_text: e.target.value })}
              rows={4}
              placeholder="É difícil desacelerar quando tudo ao redor parece correr.&#10;&#10;A caminhada com Deus segue outro ritmo."
              className="w-full rounded-lg border border-border bg-app-raised px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-1 focus:ring-gold"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-app-text-muted mb-1">
                Livro Bíblico
              </label>
              <select
                value={form.book_slug}
                onChange={(e) => handleBookChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-app-raised px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-1 focus:ring-gold"
              >
                {ALL_BOOKS.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-app-text-muted mb-1">
                Capítulo Bíblico
              </label>
              <input
                type="number"
                min="1"
                value={form.chapter}
                onChange={(e) =>
                  setForm({ ...form, chapter: parseInt(e.target.value) || 1 })
                }
                className="w-full rounded-lg border border-border bg-app-raised px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-1 focus:ring-gold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-app-text-muted mb-1">
                Versículo Inicial (Opcional)
              </label>
              <input
                type="number"
                min="1"
                value={form.verse_start}
                onChange={(e) => setForm({ ...form, verse_start: e.target.value })}
                placeholder="Ex: 1"
                className="w-full rounded-lg border border-border bg-app-raised px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-app-text-muted mb-1">
                Versículo Final (Opcional)
              </label>
              <input
                type="number"
                min="1"
                value={form.verse_end}
                onChange={(e) => setForm({ ...form, verse_end: e.target.value })}
                placeholder="Ex: 5"
                className="w-full rounded-lg border border-border bg-app-raised px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <label className="block text-xs font-medium text-app-text-muted mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as "rascunho" | "publicado" })
                }
                className="rounded-lg border border-border bg-app-raised px-3 py-2 text-sm text-app-text focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="publicado">Publicado (Agendado)</option>
                <option value="rascunho">Rascunho</option>
              </select>
            </div>

            <Button type="submit" disabled={saving} className="bg-gold text-black hover:bg-gold/90">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Atualizar Capítulo" : "Salvar Capítulo"}
            </Button>
          </div>
        </form>

        {/* Listagem de Capítulos Cadastrados */}
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-bold text-app-text mb-4">
            Capítulos Cadastrados ({chapters.length})
          </h2>

          {loadingChapters ? (
            <div className="py-8 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-gold" />
            </div>
          ) : chapters.length === 0 ? (
            <div className="rounded-xl border border-border bg-app-surface p-8 text-center text-app-text-muted">
              Nenhum capítulo cadastrado ainda. Use o formulário acima para criar o primeiro.
            </div>
          ) : (
            chapters.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-border bg-app-surface p-5 shadow-sm hover:border-gold/30 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gold">
                      Capítulo {item.chapter_number} · {item.series_name}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${
                        item.status === "publicado"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {item.status === "publicado" ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" /> Publicado
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" /> Rascunho
                        </>
                      )}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-medium text-app-text">
                    {item.title}
                  </h3>
                  <p className="text-xs text-app-text-muted">
                    Leitura:{" "}
                    <span className="font-medium text-app-text">
                      {item.book_name} {item.chapter}
                      {item.verse_start ? `:${item.verse_start}` : ""}
                      {item.verse_end ? `-${item.verse_end}` : ""}
                    </span>{" "}
                    • Data: {item.publish_date}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    className="flex items-center gap-1"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="flex items-center gap-1 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
