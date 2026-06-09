// ─────────────────────────────────────────────────────────────────────────────
// AdminComentariosPage.tsx — Admin Hub › Comentários Teológicos Manuais
// Permite ao admin inserir comentários teológicos diretamente no banco de dados,
// que serão exibidos junto dos comentários gerados pela IA (de forma aditiva).
// Acesso restrito: app_metadata.role === 'admin'
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo } from "react";
import { NavLink, Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import AuthModal from "@/components/AuthModal";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ALL_BOOKS } from "@/lib/books";
import {
  Loader2, Plus, Trash2, BookOpen, Home, FileText,
  LogIn, XCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface ManualCommentaryRow {
  id: string;
  verse_id: string;
  question_type: string;
  language: string;
  author: string;
  era: string | null;
  tradition: string | null;
  work: string | null;
  year: string | null;
  original_language: string | null;
  text: string;
  source_url: string | null;
  created_at: string;
}

// Agrupamento para a listagem: (verse_id + question_type + author) = 1 entrada com 3 idiomas
interface GroupedEntry {
  verse_id: string;
  question_type: string;
  author: string;
  rows: ManualCommentaryRow[];
  created_at: string;
}

const EMPTY_META = {
  author: "",
  era: "",
  tradition: "",
  work: "",
  year: "",
  original_language: "",
  source_url: "",
};

const EMPTY_TEXTS = { pt: "", en: "", es: "" };

const LANG_LABELS: Record<string, { flag: string; label: string }> = {
  pt: { flag: "🇧🇷", label: "Português" },
  en: { flag: "🇺🇸", label: "English" },
  es: { flag: "🇪🇸", label: "Español" },
};

function buildVerseIdFromParts(bookId: string, chapter: number, verse: number | null): string {
  if (!bookId || !chapter) return "";
  if (!verse) return `${bookId.toUpperCase()}.${chapter}.ALL`;
  return `${bookId.toUpperCase()}.${chapter}.${verse}`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function groupEntries(rows: ManualCommentaryRow[]): GroupedEntry[] {
  const map = new Map<string, GroupedEntry>();
  for (const row of rows) {
    const key = `${row.verse_id}||${row.question_type}||${row.author}`;
    if (!map.has(key)) {
      map.set(key, {
        verse_id: row.verse_id,
        question_type: row.question_type,
        author: row.author,
        rows: [],
        created_at: row.created_at,
      });
    }
    map.get(key)!.rows.push(row);
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}



// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminComentariosPage() {
  usePageMeta({ title: "Admin — Comentários | Bíblia Vive", robots: "noindex, nofollow" });

  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // ── Form state ──
  const [selectedBookId, setSelectedBookId] = useState("");
  const [chapterNum, setChapterNum] = useState<number | "">(1);
  const [verseNum, setVerseNum] = useState<number | "">("" );
  const [isChapterLevel, setIsChapterLevel] = useState(false);
  const [meta, setMeta] = useState(EMPTY_META);
  const [texts, setTexts] = useState(EMPTY_TEXTS);
  const [activeLangTab, setActiveLangTab] = useState<"pt" | "en" | "es">("pt");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedBook = useMemo(() => ALL_BOOKS.find(b => b.id === selectedBookId), [selectedBookId]);
  const previewVerseId = useMemo(() => {
    if (!selectedBookId || chapterNum === "") return "";
    return buildVerseIdFromParts(selectedBookId, Number(chapterNum), isChapterLevel ? null : (verseNum === "" ? null : Number(verseNum)));
  }, [selectedBookId, chapterNum, verseNum, isChapterLevel]);

  // ── Listagem ──
  const [entries, setEntries] = useState<GroupedEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [confirmingDeleteKey, setConfirmingDeleteKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Admin check ──
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setIsAdmin(false); return; }
    const meta = user.app_metadata as Record<string, unknown>;
    setIsAdmin(meta?.role === "admin");
  }, [user, authLoading]);

  // ── Fetch entries ──
  const fetchEntries = useCallback(async () => {
    setLoadingEntries(true);
    const { data } = await supabase
      .from("manual_commentaries")
      .select("*")
      .order("created_at", { ascending: false });
    setEntries(groupEntries(data ?? []));
    setLoadingEntries(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchEntries();
  }, [isAdmin, fetchEntries]);

  // ── Save ──
  async function handleSave() {
    setFormError(null);
    setSuccessMsg(null);

    if (!selectedBookId) { setFormError("Selecione o livro."); return; }
    if (chapterNum === "" || Number(chapterNum) < 1) { setFormError("Informe o número do capítulo."); return; }
    if (!isChapterLevel && (verseNum === "" || Number(verseNum) < 1)) {
      setFormError("Informe o número do versículo, ou marque \"Capítulo inteiro\".");
      return;
    }
    if (!meta.author.trim()) { setFormError("Informe o nome do autor."); return; }
    if (!texts.pt.trim()) { setFormError("O texto em Português é obrigatório."); return; }
    if (!texts.en.trim()) { setFormError("O texto em English é obrigatório."); return; }
    if (!texts.es.trim()) { setFormError("O texto em Español é obrigatório."); return; }

    const vid = buildVerseIdFromParts(
      selectedBookId,
      Number(chapterNum),
      isChapterLevel ? null : Number(verseNum)
    );
    const questionType = isChapterLevel ? "chapter_commentary" : "commentary";
    const langs: Array<"pt" | "en" | "es"> = ["pt", "en", "es"];
    const rows = langs.map((lang) => ({
      verse_id: vid,
      question_type: questionType,
      language: lang,
      author: meta.author.trim(),
      era: meta.era.trim() || null,
      tradition: meta.tradition.trim() || null,
      work: meta.work.trim() || null,
      year: meta.year.trim() || null,
      original_language: meta.original_language.trim() || null,
      text: texts[lang].trim(),
      source_url: meta.source_url.trim() || null,
      created_by: user!.id,
    }));

    setSaving(true);
    const { error } = await supabase.from("manual_commentaries").insert(rows);
    setSaving(false);

    if (error) {
      setFormError(`Erro ao salvar: ${error.message}`);
      return;
    }

    setSuccessMsg(`Comentário de "${vid}" salvo nos 3 idiomas com sucesso!`);
    setSelectedBookId("");
    setChapterNum(1);
    setVerseNum("");
    setIsChapterLevel(false);
    setMeta(EMPTY_META);
    setTexts(EMPTY_TEXTS);
    setActiveLangTab("pt");
    fetchEntries();
  }

  // ── Entries filtradas por busca ──
  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.verse_id.toLowerCase().includes(q) ||
        e.author.toLowerCase().includes(q)
    );
  }, [entries, searchQuery]);

  // ── Guards ──
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
          <BookOpen className="h-10 w-10 text-gold" />
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
        </div>
      </Layout>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-border bg-app-bg px-4 py-2.5 text-sm text-app-text placeholder:text-app-text-muted/50 focus:outline-none focus:border-gold transition-colors";

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-10 py-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-gold" />
          <div>
            <h1 className="font-serif text-2xl text-app-text">Painel Admin</h1>
            <p className="mt-0.5 text-sm text-app-text-muted">Gerenciamento do site</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex gap-2 border-b border-border pb-4 flex-wrap">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-gold/10 text-gold" : "text-app-text-muted hover:bg-app-surface hover:text-app-text"
              }`
            }
          >
            <Home className="h-4 w-4" />
            Versículos do Dia
          </NavLink>
          <NavLink
            to="/admin/artigos"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-gold/10 text-gold" : "text-app-text-muted hover:bg-app-surface hover:text-app-text"
              }`
            }
          >
            <FileText className="h-4 w-4" />
            Artigos
          </NavLink>
          <NavLink
            to="/admin/comentarios"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-gold/10 text-gold" : "text-app-text-muted hover:bg-app-surface hover:text-app-text"
              }`
            }
          >
            <BookOpen className="h-4 w-4" />
            Comentários
          </NavLink>
        </nav>

        {/* ── Formulário ── */}
        <div className="rounded-2xl border border-border bg-app-surface p-6 space-y-5">
          <h2 className="font-sans text-xs uppercase tracking-widest text-gold flex items-center gap-2">
            <Plus className="h-4 w-4" /> Novo Comentário Manual
          </h2>

          {/* Referência estruturada */}
          <div className="space-y-3">
            <p className="text-xs text-app-text-muted font-medium">Referência <span className="text-gold">*</span></p>

            {/* Livro */}
            <div>
              <label className="block text-[0.7rem] text-app-text-muted mb-1">Livro</label>
              <select
                id="book-select"
                value={selectedBookId}
                onChange={(e) => { setSelectedBookId(e.target.value); setChapterNum(1); setVerseNum(""); }}
                className={`${inputCls} cursor-pointer`}
              >
                <option value="">— Selecione o livro —</option>
                <optgroup label="Antigo Testamento">
                  {ALL_BOOKS.filter((_, i) => i < 39).map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.id})</option>
                  ))}
                </optgroup>
                <optgroup label="Novo Testamento">
                  {ALL_BOOKS.filter((_, i) => i >= 39).map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.id})</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Capítulo + Versículo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.7rem] text-app-text-muted mb-1">Capítulo</label>
                <input
                  id="chapter-input"
                  type="number"
                  min={1}
                  max={selectedBook?.chapters ?? 150}
                  value={chapterNum}
                  onChange={(e) => setChapterNum(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)))}
                  placeholder="Ex: 3"
                  className={inputCls}
                />
                {selectedBook && (
                  <p className="mt-0.5 text-[0.65rem] text-app-text-muted/60">{selectedBook.chapters} capítulos</p>
                )}
              </div>
              <div>
                <label className="block text-[0.7rem] text-app-text-muted mb-1">Versículo</label>
                <input
                  id="verse-input"
                  type="number"
                  min={1}
                  value={verseNum}
                  disabled={isChapterLevel}
                  onChange={(e) => setVerseNum(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)))}
                  placeholder={isChapterLevel ? "—" : "Ex: 16"}
                  className={`${inputCls} disabled:opacity-40 disabled:cursor-not-allowed`}
                />
              </div>
            </div>

            {/* Toggle capítulo inteiro */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                id="chapter-level-toggle"
                type="checkbox"
                checked={isChapterLevel}
                onChange={(e) => { setIsChapterLevel(e.target.checked); setVerseNum(""); }}
                className="h-4 w-4 accent-amber-500 rounded"
              />
              <span className="text-xs text-app-text-muted">Comentário de <strong>capítulo inteiro</strong> (sem versículo específico)</span>
            </label>

            {/* Preview da referência gerada */}
            {previewVerseId && (
              <p className="text-[0.72rem] text-gold/80 font-mono">
                Referência: <strong>{previewVerseId}</strong>
                <span className="ml-2 text-app-text-muted/60 font-sans font-normal">
                  · {isChapterLevel ? "Capítulo inteiro" : "Versículo específico"}
                </span>
              </p>
            )}
          </div>

          {/* Metadados do autor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-app-text-muted mb-1">
                Autor <span className="text-gold">*</span>
              </label>
              <input
                type="text"
                value={meta.author}
                onChange={(e) => setMeta((m) => ({ ...m, author: e.target.value }))}
                placeholder="Ex: Matthew Henry, Pr. João Silva…"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs text-app-text-muted mb-1">Época / Período</label>
              <input
                type="text"
                value={meta.era}
                onChange={(e) => setMeta((m) => ({ ...m, era: e.target.value }))}
                placeholder="Ex: Século XIX"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs text-app-text-muted mb-1">Tradição Teológica</label>
              <input
                type="text"
                value={meta.tradition}
                onChange={(e) => setMeta((m) => ({ ...m, tradition: e.target.value }))}
                placeholder="Ex: Batista Reformada"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs text-app-text-muted mb-1">Obra / Trabalho</label>
              <input
                type="text"
                value={meta.work}
                onChange={(e) => setMeta((m) => ({ ...m, work: e.target.value }))}
                placeholder="Ex: Comentário Pastoral 2024"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs text-app-text-muted mb-1">Ano</label>
              <input
                type="text"
                value={meta.year}
                onChange={(e) => setMeta((m) => ({ ...m, year: e.target.value }))}
                placeholder="Ex: 2024"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs text-app-text-muted mb-1">Idioma Original</label>
              <input
                type="text"
                value={meta.original_language}
                onChange={(e) => setMeta((m) => ({ ...m, original_language: e.target.value }))}
                placeholder="Ex: Português"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs text-app-text-muted mb-1">URL da Fonte (opcional)</label>
              <input
                type="url"
                value={meta.source_url}
                onChange={(e) => setMeta((m) => ({ ...m, source_url: e.target.value }))}
                placeholder="https://…"
                className={inputCls}
              />
            </div>
          </div>

          {/* Textos por idioma */}
          <div>
            <label className="block text-xs text-app-text-muted mb-2">
              Texto do Comentário — <span className="text-gold">todos os 3 idiomas são obrigatórios</span>
            </label>

            {/* Tabs de idioma */}
            <div className="flex border-b border-border mb-3">
              {(["pt", "en", "es"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveLangTab(lang)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
                    activeLangTab === lang
                      ? "border-gold text-gold"
                      : "border-transparent text-app-text-muted hover:text-app-text"
                  }`}
                >
                  {LANG_LABELS[lang].flag} {LANG_LABELS[lang].label}
                  {texts[lang].trim() && (
                    <span className="ml-1 h-1.5 w-1.5 rounded-full bg-green-400 inline-block" title="Preenchido" />
                  )}
                </button>
              ))}
            </div>

            <textarea
              id={`text-${activeLangTab}`}
              key={activeLangTab}
              value={texts[activeLangTab]}
              onChange={(e) => setTexts((t) => ({ ...t, [activeLangTab]: e.target.value }))}
              rows={8}
              placeholder={`Texto do comentário em ${LANG_LABELS[activeLangTab].label}…`}
              className={`${inputCls} resize-none font-serif leading-relaxed`}
            />
            <p className="mt-1 text-[0.7rem] text-app-text-muted/60 text-right">
              {texts[activeLangTab].length} caracteres
            </p>
          </div>

          {/* Mensagens */}
          {formError && <p className="text-sm text-red-400">{formError}</p>}
          {successMsg && <p className="text-sm text-green-400">{successMsg}</p>}

          {/* Botão salvar */}
          <Button
            id="save-manual-commentary-btn"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-full bg-gold text-app-bg hover:bg-gold/90"
          >
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando nos 3 idiomas...</>
            ) : (
              <><Plus className="mr-2 h-4 w-4" /> Salvar Comentário (pt · en · es)</>
            )}
          </Button>
        </div>

        {/* ── Listagem ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-sans text-xs uppercase tracking-widest text-gold">
              Comentários Manuais Salvos{entries.length > 0 && ` (${entries.length})`}
            </h2>
            {entries.length > 0 && (
              <button
                type="button"
                onClick={fetchEntries}
                className="text-[0.7rem] text-app-text-muted hover:text-gold transition-colors"
              >
                ↻ Atualizar
              </button>
            )}
          </div>

          {/* Campo de busca */}
          {entries.length > 0 && (
            <input
              type="search"
              placeholder="Filtrar por referência (ex: JHN.3) ou autor..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setConfirmingDeleteKey(null); }}
              className={`${inputCls} text-[0.82rem]`}
            />
          )}

          {loadingEntries ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-app-text-muted text-center py-8">
              Nenhum comentário manual cadastrado ainda.
            </p>
          ) : filteredEntries.length === 0 ? (
            <p className="text-sm text-app-text-muted text-center py-6">
              Nenhum resultado para “{searchQuery}”.
            </p>
          ) : (
            <ol className="space-y-3">
              {filteredEntries.map((group) => {
                const key = `${group.verse_id}||${group.question_type}||${group.author}`;
                const isExpanded = expandedKey === key;
                const isDeleting = deletingKey === key;
                const isConfirming = confirmingDeleteKey === key;
                const langsPresent = group.rows.map((r) => r.language).sort().join(", ");
                const firstRow = group.rows[0];

                return (
                  <li
                    key={key}
                    className={`rounded-xl border bg-app-surface transition-all ${
                      isConfirming
                        ? "border-red-500/40 ring-1 ring-red-500/20"
                        : "border-border hover:border-gold/30"
                    }`}
                  >
                    {/* Header do card */}
                    <div className="flex items-start gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        {/* Referência + escopo */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-mono text-xs text-gold uppercase tracking-wide">
                            {group.verse_id}
                          </p>
                          <span className={`text-[0.62rem] rounded-full px-2 py-0.5 font-medium ${
                            group.question_type === "chapter_commentary"
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-gold/10 text-gold"
                          }`}>
                            {group.question_type === "chapter_commentary" ? "Capítulo" : "Versículo"}
                          </span>
                          <span className="text-[0.62rem] bg-app-raised text-app-text-muted rounded-full px-2 py-0.5">
                            {langsPresent}
                          </span>
                        </div>

                        {/* Autor */}
                        <p className="mt-0.5 text-sm font-medium text-app-text truncate">{group.author}</p>

                        {/* Metadados opcionais */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {firstRow?.era && (
                            <span className="text-[0.65rem] text-app-text-muted/60">{firstRow.era}</span>
                          )}
                          {firstRow?.tradition && (
                            <span className="text-[0.65rem] text-app-text-muted/60">· {firstRow.tradition}</span>
                          )}
                          <span className="text-[0.65rem] text-app-text-muted/50 ml-auto">
                            {formatDate(group.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Botões de ação */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedKey(isExpanded ? null : key);
                            setConfirmingDeleteKey(null);
                          }}
                          className="rounded-lg p-1.5 text-app-text-muted hover:bg-app-raised hover:text-app-text transition-colors"
                          aria-label={isExpanded ? "Fechar" : "Ver textos"}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        {!isConfirming ? (
                          <button
                            type="button"
                            onClick={() => { setConfirmingDeleteKey(key); setExpandedKey(null); }}
                            disabled={isDeleting}
                            className="rounded-lg p-1.5 text-app-text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-40"
                            aria-label="Excluir comentário"
                          >
                            {isDeleting
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash2 className="h-4 w-4" />}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmingDeleteKey(null)}
                            className="rounded-lg p-1.5 text-app-text-muted hover:bg-app-raised transition-colors"
                            aria-label="Cancelar exclusão"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Confirmação de exclusão */}
                    {isConfirming && (
                      <div className="border-t border-red-500/20 bg-red-500/5 px-4 py-3 rounded-b-xl">
                        <p className="text-xs text-red-400 mb-3">
                          Tem certeza? Isso excluirá os textos nos <strong>3 idiomas</strong> (pt · en · es) do autor
                          <strong className="text-app-text"> {group.author}</strong> para
                          <strong className="text-gold font-mono"> {group.verse_id}</strong>.
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmingDeleteKey(null)}
                            className="flex-1 rounded-lg border border-border py-1.5 text-xs text-app-text-muted hover:bg-app-raised transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            id={`confirm-delete-${group.verse_id}`}
                            disabled={isDeleting}
                            onClick={async () => {
                              setDeletingKey(key);
                              setConfirmingDeleteKey(null);
                              await supabase
                                .from("manual_commentaries")
                                .delete()
                                .eq("verse_id", group.verse_id)
                                .eq("question_type", group.question_type)
                                .eq("author", group.author);
                              setDeletingKey(null);
                              fetchEntries();
                            }}
                            className="flex-1 rounded-lg bg-red-500 py-1.5 text-xs text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            {isDeleting
                              ? <><Loader2 className="h-3 w-3 animate-spin" /> Excluindo...</>
                              : <><Trash2 className="h-3 w-3" /> Confirmar Exclusão</>
                            }
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Conteúdo expandido — prévia dos textos */}
                    {isExpanded && (
                      <div className="border-t border-border px-4 py-3 space-y-4">
                        {group.rows.sort((a, b) => a.language.localeCompare(b.language)).map((row) => (
                          <div key={row.id}>
                            <p className="text-[0.7rem] text-gold/80 font-mono uppercase mb-1.5 flex items-center gap-1">
                              {LANG_LABELS[row.language]?.flag} {LANG_LABELS[row.language]?.label}
                            </p>
                            <p className="text-xs text-app-text leading-relaxed font-serif whitespace-pre-wrap line-clamp-6">
                              {row.text}
                            </p>
                          </div>
                        ))}
                        {(firstRow?.work || firstRow?.source_url) && (
                          <p className="text-[0.68rem] text-app-text-muted/50 border-t border-border pt-2">
                            {[firstRow.work, firstRow.year].filter(Boolean).join(" · ")}
                            {firstRow.source_url && (
                              <> · <a href={firstRow.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-gold">fonte</a></>
                            )}
                          </p>
                        )}
                        {/* Botão de excluir também dentro do expandido */}
                        <button
                          type="button"
                          onClick={() => { setConfirmingDeleteKey(key); setExpandedKey(null); }}
                          className="mt-1 flex items-center gap-1.5 text-[0.72rem] text-red-400/70 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" /> Excluir este comentário
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>

      </div>
    </Layout>
  );
}
