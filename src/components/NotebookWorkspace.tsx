// ─────────────────────────────────────────────────────────────────────────────
// NotebookWorkspace.tsx — Bíblia Vive
//
// Painel lateral de cadernos para Desktop (lado esquerdo).
// Em telas muito largas (≥1400px), empurra o conteúdo bíblico.
// Em telas intermediárias (768–1400px), atua como overlay com backdrop.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useMemo, useState } from "react";
import { BookText, Plus, Search, X, Download, BookOpen, Heart, Sparkles, Mountain } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import NotebookEditor from "@/components/NotebookEditor";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChapterNotebook } from "@/lib/notebookStore";
import type { SaveStatus } from "@/hooks/useNotebooks";
import { exportNotebooksToPDF, exportNotebooksToWord } from "@/lib/notebookExport";
import { ALL_BOOKS } from "@/lib/books";
import type { MemorialCategory } from "@/lib/noteStore";

const bookOrderMap = new Map(ALL_BOOKS.map((book, index) => [book.id.toLowerCase(), index]));

function getBookOrder(bookId: string): number {
    return bookOrderMap.get(bookId.toLowerCase()) ?? 999;
}

interface NotebookWorkspaceProps {
    notebooks: ChapterNotebook[];
    allNotebooks: ChapterNotebook[];
    bookId: string;
    chapter: number;
    version: string;
    bookName: string;
    saveStatus: SaveStatus;
    syncError: string | null;
    onSave: (data: { id?: string; title: string | null; content: string; bookId: string; chapter: number; version: string }, immediate?: boolean) => void;
    onDelete: (id: string) => Promise<void>;
    onClose: () => void;
    onNavigateToChapter?: (bookId: string, chapter: number, version: string) => void;
    getLocalDraft: (id: string) => { title: string; content: string } | null;
    getNewLocalDraft: (bookId: string, chapter: number) => { title: string; content: string } | null;
    selectedNotebook: ChapterNotebook | null;
    setSelectedNotebook: (nb: ChapterNotebook | null) => void;
    isCreatingNew: boolean;
    setIsCreatingNew: (val: boolean) => void;
    onOpenCategoryModal?: (category: MemorialCategory) => void;
}

type TabId = "chapter" | "all";

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
    });
}

function getNotebookFallbackTitle(notebook: ChapterNotebook) {
    if (notebook.title?.trim()) return notebook.title.trim();
    const date = new Date(notebook.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    return `Estudo de ${notebook.bookId} ${notebook.chapter} — ${date}`;
}

/** Remove acentos para comparação insensível a diacríticos */
function normalize(str: string) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** Destaca o trecho buscado num texto, levando em conta acentos */
function Highlight({ text, query }: { text: string; query: string }) {
    if (!query.trim()) return <>{text}</>;
    const normQuery = normalize(query);
    // Percorre o texto caractere a caractere para encontrar matches insensíveis a acento
    const result: React.ReactNode[] = [];
    let i = 0;
    while (i < text.length) {
        // Janela de comparação: fatiamos um trecho do tamanho da query e normalizamos
        const slice = text.slice(i, i + query.length);
        if (normalize(slice) === normQuery) {
            result.push(
                <mark key={i} className="bg-gold/30 text-app-text rounded-[2px] px-[1px]">
                    {slice}
                </mark>
            );
            i += query.length;
        } else {
            // Acumula caracteres sem match
            const last = result[result.length - 1];
            if (typeof last === "string") {
                result[result.length - 1] = last + text[i];
            } else {
                result.push(text[i]);
            }
            i++;
        }
    }
    return <>{result}</>;
}

export default function NotebookWorkspace({
    notebooks,
    allNotebooks,
    bookId,
    chapter,
    version,
    bookName,
    saveStatus,
    syncError,
    onSave,
    onDelete,
    onClose,
    onNavigateToChapter,
    getLocalDraft,
    getNewLocalDraft,
    selectedNotebook,
    setSelectedNotebook,
    isCreatingNew,
    setIsCreatingNew,
    onOpenCategoryModal,
}: NotebookWorkspaceProps) {
    const [activeTab, setActiveTab] = useState<TabId>("chapter");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"recent" | "biblical-asc" | "biblical-desc">("recent");

    const contextLabel = `${bookName} ${chapter} — ${version.toUpperCase()}`;

    // ── Exportações em Lote ───────────────────────────────────────────────────
    const handleExportFilteredPDF = async () => {
        if (filtered.length === 0) return;
        const label = activeTab === "chapter" 
            ? `Cadernos: ${bookName} ${chapter}` 
            : searchQuery 
            ? `Cadernos (Busca: ${searchQuery})` 
            : "Todos os Cadernos";
        const filePrefix = activeTab === "chapter" 
            ? `Cadernos_${bookName}_${chapter}` 
            : "Todos_os_Cadernos";
        await exportNotebooksToPDF(filtered, label, filePrefix);
    };

    const handleExportFilteredWord = () => {
        if (filtered.length === 0) return;
        const label = activeTab === "chapter" 
            ? `Cadernos: ${bookName} ${chapter}` 
            : searchQuery 
            ? `Cadernos (Busca: ${searchQuery})` 
            : "Todos os Cadernos";
        const filePrefix = activeTab === "chapter" 
            ? `Cadernos_${bookName}_${chapter}` 
            : "Todos_os_Cadernos";
        exportNotebooksToWord(filtered, label, filePrefix);
    };

    const handleExportAllPDF = async () => {
        if (allNotebooks.length === 0) return;
        await exportNotebooksToPDF(allNotebooks, "Todos os Cadernos", "Todos_os_Cadernos");
    };

    const handleExportAllWord = () => {
        if (allNotebooks.length === 0) return;
        exportNotebooksToWord(allNotebooks, "Todos os Cadernos", "Todos_os_Cadernos");
    };

    // ── Filtro por busca e Ordenação ──────────────────────────────────────────
    const filtered = useMemo(() => {
        const q = normalize(searchQuery);
        const source = activeTab === "chapter" ? notebooks : allNotebooks;
        
        let result = source;
        if (q) {
            result = source.filter(
                (nb) =>
                    normalize(nb.title || "").includes(q) ||
                    normalize(nb.content).includes(q) ||
                    normalize(`${nb.bookId} ${nb.chapter}`).includes(q)
            );
        }

        // Se estiver na aba "todos os cadernos", aplicar a ordenação
        if (activeTab === "all") {
            const sorted = [...result];
            if (sortBy === "recent") {
                sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            } else if (sortBy === "biblical-asc") {
                sorted.sort((a, b) => {
                    const orderA = getBookOrder(a.bookId);
                    const orderB = getBookOrder(b.bookId);
                    if (orderA !== orderB) return orderA - orderB;
                    if (a.chapter !== b.chapter) return a.chapter - b.chapter;
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                });
            } else if (sortBy === "biblical-desc") {
                sorted.sort((a, b) => {
                    const orderA = getBookOrder(a.bookId);
                    const orderB = getBookOrder(b.bookId);
                    if (orderA !== orderB) return orderB - orderA;
                    if (a.chapter !== b.chapter) return b.chapter - a.chapter;
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                });
            }
            return sorted;
        }

        return result;
    }, [searchQuery, activeTab, notebooks, allNotebooks, sortBy]);

    const handleCreateNew = useCallback(() => {
        setSelectedNotebook(null);
        setIsCreatingNew(true);
    }, [setSelectedNotebook, setIsCreatingNew]);

    const handleSelectNotebook = useCallback((notebook: ChapterNotebook) => {
        setSelectedNotebook(notebook);
        setIsCreatingNew(false);
    }, [setSelectedNotebook, setIsCreatingNew]);

    const handleBack = useCallback(() => {
        setSelectedNotebook(null);
        setIsCreatingNew(false);
    }, [setSelectedNotebook, setIsCreatingNew]);

    const handleSave = useCallback((data: { id?: string; title: string | null; content: string }, immediate?: boolean) => {
        // Ao salvar de um caderno de outro capítulo (aba "Todos"), manter bookId/chapter/version originais
        const target = selectedNotebook ?? null;
        onSave({
            ...data,
            bookId: target?.bookId ?? bookId,
            chapter: target?.chapter ?? chapter,
            version: target?.version ?? version,
        }, immediate);
    }, [onSave, selectedNotebook, bookId, chapter, version]);

    // Obter conteúdo inicial do caderno levando em conta rascunho local
    const getInitialContent = (notebook: ChapterNotebook | null) => {
        if (notebook) {
            const draft = getLocalDraft(notebook.id);
            if (draft) return { title: draft.title, content: draft.content };
            return { title: notebook.title || "", content: notebook.content };
        }
        const draft = getNewLocalDraft(bookId, chapter);
        return draft ? { title: draft.title, content: draft.content } : { title: "", content: "" };
    };

    const isEditing = isCreatingNew || selectedNotebook !== null;

    // Contexto do caderno sendo editado (pode ser de outro capítulo)
    const editorContextLabel = selectedNotebook
        ? `${selectedNotebook.bookId} ${selectedNotebook.chapter} — ${(selectedNotebook.version || version).toUpperCase()}`
        : contextLabel;

    // Se o caderno selecionado é de outro capítulo, mostra botão de navegação
    const isFromAnotherChapter =
        selectedNotebook !== null &&
        (selectedNotebook.bookId !== bookId ||
            selectedNotebook.chapter !== chapter ||
            selectedNotebook.version !== version);

    return (
        <>


            {/* Painel principal */}
            <aside
                role="complementary"
                aria-label="Caderno do capítulo"
                className={cn(
                    "fixed left-0 z-50 flex flex-col bg-app-bg border-r border-border shadow-2xl",
                    "top-[60px] bottom-0",
                    "w-[clamp(320px,28vw,440px)]",
                    "animate-in slide-in-from-left-4 duration-300",
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                    <div className="flex items-center gap-2">
                        <BookText className="h-4 w-4 text-gold" />
                        <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-app-text-muted">
                            Meu Caderno
                        </p>
                    </div>
                    <div className="flex items-center gap-1">
                        {!isEditing && allNotebooks.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        aria-label="Exportar cadernos"
                                        title="Exportar cadernos"
                                        className="h-7 w-7 flex items-center justify-center rounded-md text-app-text-muted hover:text-gold hover:bg-gold/10 transition-colors"
                                    >
                                        <Download className="h-4 w-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[220px] bg-app-bg border-border text-app-text">
                                    {filtered.length > 0 && (
                                        <>
                                            <DropdownMenuItem
                                                onClick={handleExportFilteredPDF}
                                                className="text-xs hover:bg-gold/10 hover:text-gold cursor-pointer"
                                            >
                                                Exportar Filtro Atual (PDF)
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={handleExportFilteredWord}
                                                className="text-xs hover:bg-gold/10 hover:text-gold cursor-pointer"
                                            >
                                                Exportar Filtro Atual (Word)
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                    {filtered.length > 0 && allNotebooks.length !== filtered.length && (
                                        <div className="h-px bg-border/40 my-1" />
                                    )}
                                    {allNotebooks.length !== filtered.length && (
                                        <>
                                            <DropdownMenuItem
                                                onClick={handleExportAllPDF}
                                                className="text-xs hover:bg-gold/10 hover:text-gold cursor-pointer"
                                            >
                                                Exportar Tudo (PDF)
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={handleExportAllWord}
                                                className="text-xs hover:bg-gold/10 hover:text-gold cursor-pointer"
                                            >
                                                Exportar Tudo (Word)
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Fechar caderno"
                            className="h-7 w-7 flex items-center justify-center rounded-md text-app-text-muted hover:text-app-text hover:bg-app-raised transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {isEditing ? (
                    // ── Modo edição ──
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        <NotebookEditor
                            notebook={isCreatingNew
                                ? null
                                : (() => {
                                    const initial = getInitialContent(selectedNotebook);
                                    return selectedNotebook ? { ...selectedNotebook, ...initial } : null;
                                })()
                            }
                            contextLabel={editorContextLabel}
                            saveStatus={saveStatus}
                            syncError={syncError}
                            onSave={handleSave}
                            onDelete={onDelete}
                            onBack={handleBack}
                            onNavigateToChapter={
                                isFromAnotherChapter && onNavigateToChapter && selectedNotebook
                                    ? () => onNavigateToChapter(
                                        selectedNotebook.bookId,
                                        selectedNotebook.chapter,
                                        selectedNotebook.version || version
                                    )
                                    : undefined
                            }
                            bookId={selectedNotebook?.bookId ?? bookId}
                            chapter={selectedNotebook?.chapter ?? chapter}
                            version={selectedNotebook?.version ?? version}
                        />
                    </div>
                ) : (
                    // ── Modo listagem ──
                    <>
                        {/* Tabs */}
                        <div className="grid grid-cols-2 shrink-0 border-b border-border">
                            {(["chapter", "all"] as TabId[]).map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => { setActiveTab(tab); setSearchQuery(""); }}
                                    className={cn(
                                        "py-2.5 text-[0.72rem] font-medium transition-colors border-b-2",
                                        activeTab === tab
                                            ? "border-gold text-gold"
                                            : "border-transparent text-app-text-muted hover:text-app-text"
                                    )}
                                >
                                    {tab === "chapter" ? "Neste Capítulo" : "Todos os Cadernos"}
                                </button>
                            ))}
                        </div>

                        {/* Campo de busca */}
                        <div className="px-4 pt-3 pb-1 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-app-text-muted pointer-events-none" />
                                <input
                                    type="search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={activeTab === "chapter" ? "Buscar neste capítulo…" : "Buscar em todos os cadernos…"}
                                    className="w-full h-8 pl-8 pr-3 rounded-lg bg-app-surface border border-border text-[0.78rem] text-app-text placeholder:text-app-text-muted/50 focus:outline-none focus:border-gold/50 transition-colors"
                                    aria-label="Buscar cadernos"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-app-text-muted hover:text-app-text"
                                        aria-label="Limpar busca"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Ordenação */}
                        {activeTab === "all" && allNotebooks.length > 0 && (
                            <div className="px-4 py-1.5 flex items-center justify-between shrink-0 border-b border-border/30 bg-app-surface/20">
                                <span className="text-[0.65rem] text-app-text-muted font-medium">Ordenar:</span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSortBy("recent")}
                                        className={cn(
                                            "text-[0.65rem] transition-colors hover:text-gold",
                                            sortBy === "recent" ? "text-gold font-semibold" : "text-app-text-muted"
                                        )}
                                    >
                                        Recentes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSortBy("biblical-asc")}
                                        className={cn(
                                            "text-[0.65rem] transition-colors hover:text-gold",
                                            sortBy === "biblical-asc" ? "text-gold font-semibold" : "text-app-text-muted"
                                        )}
                                    >
                                        Livro ↑
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSortBy("biblical-desc")}
                                        className={cn(
                                            "text-[0.65rem] transition-colors hover:text-gold",
                                            sortBy === "biblical-desc" ? "text-gold font-semibold" : "text-app-text-muted"
                                        )}
                                    >
                                        Livro ↓
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Lista de cadernos */}
                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 py-2 space-y-2">
                            {filtered.length === 0 ? (
                                <div className="text-center py-10 space-y-2">
                                    {searchQuery ? (
                                        <>
                                            <p className="text-[0.82rem] text-app-text-muted">Nenhum resultado para "{searchQuery}".</p>
                                            <button
                                                type="button"
                                                onClick={() => setSearchQuery("")}
                                                className="text-[0.72rem] text-gold underline"
                                            >
                                                Limpar busca
                                            </button>
                                        </>
                                    ) : activeTab === "chapter" ? (
                                        <>
                                            <p className="text-[0.82rem] text-app-text-muted">Nenhum caderno neste capítulo.</p>
                                            <p className="text-[0.72rem] text-app-text-muted/60">Clique em "Novo caderno" para começar.</p>
                                        </>
                                    ) : (
                                        <p className="text-[0.82rem] text-app-text-muted">Você ainda não tem cadernos.</p>
                                    )}
                                </div>
                            ) : (
                                filtered.map((nb) => (
                                    <button
                                        key={nb.id}
                                        type="button"
                                        onClick={() => handleSelectNotebook(nb)}
                                        className="w-full text-left rounded-xl border border-border bg-app-surface p-3 space-y-1 hover:border-gold/40 transition-colors"
                                    >
                                        <p className="text-[0.82rem] font-medium text-app-text line-clamp-1">
                                            <Highlight text={getNotebookFallbackTitle(nb)} query={searchQuery} />
                                        </p>
                                        {activeTab === "all" && (
                                            <p className="text-[0.65rem] text-gold font-mono uppercase tracking-wide">
                                                {nb.bookId} {nb.chapter} — {(nb.version || version).toUpperCase()}
                                            </p>
                                        )}
                                        <p className="text-[0.72rem] text-app-text-muted line-clamp-2">
                                            <Highlight text={nb.content} query={searchQuery} />
                                        </p>
                                        <p className="text-[0.65rem] text-app-text-muted/60">
                                            {formatDate(nb.updatedAt)}
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Botão Novo caderno e Etiquetas de Categoria */}
                        <div className="px-4 py-3 border-t border-border shrink-0 space-y-2.5">
                            <div className="space-y-1.5">
                                <p className="text-[0.68rem] font-mono text-app-text-muted uppercase tracking-wider">
                                    Registrar Memória da Caminhada:
                                </p>
                                <div className="grid grid-cols-2 gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => onOpenCategoryModal?.('reflection')}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[0.72rem] font-semibold transition-all bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-gold dark:border-gold/40 hover:opacity-90"
                                    >
                                        <BookOpen className="h-3.5 w-3.5 shrink-0" />
                                        <span>📖 Reflexão</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onOpenCategoryModal?.('prayer')}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[0.72rem] font-semibold transition-all bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/40 hover:opacity-90"
                                    >
                                        <Heart className="h-3.5 w-3.5 shrink-0" />
                                        <span>🙏 Oração</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onOpenCategoryModal?.('testimony')}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[0.72rem] font-semibold transition-all bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40 hover:opacity-90"
                                    >
                                        <Sparkles className="h-3.5 w-3.5 shrink-0" />
                                        <span>✨ Testemunho</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onOpenCategoryModal?.('fasting')}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[0.72rem] font-semibold transition-all bg-stone-200 text-stone-900 border-stone-400 dark:bg-slate-700/60 dark:text-slate-100 dark:border-slate-500/50 hover:opacity-90"
                                    >
                                        <Mountain className="h-3.5 w-3.5 shrink-0" />
                                        <span>⛰️ Jejum</span>
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="button"
                                onClick={handleCreateNew}
                                className="w-full bg-gold text-black hover:bg-gold/90 font-medium gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Novo caderno livre
                            </Button>
                        </div>
                    </>
                )}
            </aside>
        </>
    );
}
