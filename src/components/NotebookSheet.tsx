// ─────────────────────────────────────────────────────────────────────────────
// NotebookSheet.tsx — Bíblia Vive
//
// Bottom sheet de cadernos para Mobile usando vaul Drawer.
// Suporta estado peek (minimizado/Bíblia) e estado expandido (Caderno).
// Preserva rascunho ao minimizar.
// Inclui: abas Neste Capítulo / Todos, busca textual e navegação para capítulo.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { BookText, Plus, Search, X, Download } from "lucide-react";
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

const bookOrderMap = new Map(ALL_BOOKS.map((book, index) => [book.id.toLowerCase(), index]));

function getBookOrder(bookId: string): number {
    return bookOrderMap.get(bookId.toLowerCase()) ?? 999;
}

interface NotebookSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    notebooks: ChapterNotebook[];       // apenas deste capítulo
    allNotebooks: ChapterNotebook[];    // todos do usuário
    bookId: string;
    chapter: number;
    version: string;
    bookName: string;
    saveStatus: SaveStatus;
    syncError: string | null;
    onSave: (data: { id?: string; title: string | null; content: string; bookId: string; chapter: number; version: string }, immediate?: boolean) => void;
    onDelete: (id: string) => Promise<void>;
    onNavigateToChapter?: (bookId: string, chapter: number, version: string) => void;
    getLocalDraft: (id: string) => { title: string; content: string } | null;
    getNewLocalDraft: (bookId: string, chapter: number) => { title: string; content: string } | null;
    selectedNotebook: ChapterNotebook | null;
    setSelectedNotebook: (nb: ChapterNotebook | null) => void;
    isCreatingNew: boolean;
    setIsCreatingNew: (val: boolean) => void;
}

type TabId = "chapter" | "all";

function getNotebookFallbackTitle(notebook: ChapterNotebook) {
    if (notebook.title?.trim()) return notebook.title.trim();
    const date = new Date(notebook.updatedAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
    return `Estudo de ${notebook.bookId} ${notebook.chapter} — ${date}`;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
    });
}

/** Remove acentos para comparação insensível a diacríticos */
function normalize(str: string) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** Destaca o trecho buscado, insensível a acentos */
function Highlight({ text, query }: { text: string; query: string }) {
    if (!query.trim()) return <>{text}</>;
    const normQuery = normalize(query);
    const result: React.ReactNode[] = [];
    let i = 0;
    while (i < text.length) {
        const slice = text.slice(i, i + query.length);
        if (normalize(slice) === normQuery) {
            result.push(
                <mark key={i} className="bg-gold/30 text-app-text rounded-[2px] px-[1px]">
                    {slice}
                </mark>
            );
            i += query.length;
        } else {
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

export default function NotebookSheet({
    open,
    onOpenChange,
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
    onNavigateToChapter,
    getLocalDraft,
    getNewLocalDraft,
    selectedNotebook,
    setSelectedNotebook,
    isCreatingNew,
    setIsCreatingNew,
}: NotebookSheetProps) {
    const isEditing = isCreatingNew || selectedNotebook !== null;
    const sheetMode = isEditing ? "editor" : "list";
    const [activeSnapPoint, setActiveSnapPoint] = useState<number | string | null>(0.35);
    const [activeTab, setActiveTab] = useState<TabId>("chapter");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"recent" | "biblical-asc" | "biblical-desc">("recent");

    // Sincronizar o activeSnapPoint quando o estado de edição muda
    useEffect(() => {
        if (!isEditing) {
            setActiveSnapPoint(0.35);
        } else {
            setActiveSnapPoint(0.95);
        }
    }, [isEditing]);

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

    // ── Filtro de busca e Ordenação ────────────────────────────────────────────────────────────────────────────
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
        setActiveSnapPoint(0.95);
    }, [setSelectedNotebook, setIsCreatingNew]);

    const handleSelectNotebook = useCallback((notebook: ChapterNotebook) => {
        setSelectedNotebook(notebook);
        setIsCreatingNew(false);
        setActiveSnapPoint(0.95);
    }, [setSelectedNotebook, setIsCreatingNew]);

    const handleBack = useCallback(() => {
        setSelectedNotebook(null);
        setIsCreatingNew(false);
        setActiveSnapPoint(0.35);
    }, [setSelectedNotebook, setIsCreatingNew]);

    const handleSave = useCallback((data: { id?: string; title: string | null; content: string }, immediate?: boolean) => {
        const target = selectedNotebook ?? null;
        onSave({
            ...data,
            bookId: target?.bookId ?? bookId,
            chapter: target?.chapter ?? chapter,
            version: target?.version ?? version,
        }, immediate);
    }, [onSave, selectedNotebook, bookId, chapter, version]);

    // Obter conteúdo inicial considerando rascunhos locais
    const getInitialContent = (notebook: ChapterNotebook | null) => {
        if (notebook) {
            const draft = getLocalDraft(notebook.id);
            return draft ?? { title: notebook.title || "", content: notebook.content };
        }
        const draft = getNewLocalDraft(bookId, chapter);
        return draft ?? { title: "", content: "" };
    };

    // Ao fechar o sheet, preservar estado de edição (apenas esconder, não resetar)
    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            onOpenChange(false);
        } else {
            onOpenChange(true);
        }
    };

    // Contexto do caderno sendo editado (pode ser de outro capítulo)
    const editorContextLabel = selectedNotebook
        ? `${selectedNotebook.bookId} ${selectedNotebook.chapter} — ${(selectedNotebook.version || version).toUpperCase()}`
        : contextLabel;

    // Se o caderno selecionado é de outro capítulo, mostrar botão de navegação
    const isFromAnotherChapter =
        selectedNotebook !== null &&
        (selectedNotebook.bookId !== bookId ||
            selectedNotebook.chapter !== chapter ||
            selectedNotebook.version !== version);

    return (
        <DrawerPrimitive.Root
            open={open}
            onOpenChange={handleOpenChange}
            dismissible={sheetMode === "list"}
            snapPoints={[0.35, 0.95]}
            activeSnapPoint={activeSnapPoint}
            setActiveSnapPoint={setActiveSnapPoint}
            shouldScaleBackground
        >
            <DrawerPrimitive.Portal>
                <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40" />
                <DrawerPrimitive.Content
                    aria-label="Caderno do capítulo"
                    className={cn(
                        "fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border-t border-border bg-app-bg h-[96dvh]",
                        "pb-[env(safe-area-inset-bottom,0.5rem)]"
                    )}
                >
                    {/* Handle de arraste */}
                    <div className="mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-border shrink-0" aria-hidden="true" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0 min-h-[52px]">
                        {sheetMode === "editor" ? (
                            <>
                                {/* Esquerda: Botão Voltar */}
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="text-[0.75rem] text-app-text-muted hover:text-app-text transition-colors underline"
                                >
                                    ← Lista
                                </button>

                                {/* Centro: Seletor Bíblia / Caderno */}
                                <div className="flex bg-app-surface border border-border p-0.5 rounded-lg shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setActiveSnapPoint(0.35)}
                                        className={cn(
                                            "text-[0.72rem] font-medium py-1 px-3 rounded-md transition-colors",
                                            activeSnapPoint === 0.35
                                                ? "bg-gold text-black font-semibold"
                                                : "text-app-text-muted hover:text-app-text"
                                        )}
                                    >
                                        Bíblia
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveSnapPoint(0.95)}
                                        className={cn(
                                            "text-[0.72rem] font-medium py-1 px-3 rounded-md transition-colors",
                                            activeSnapPoint === 0.95
                                                ? "bg-gold text-black font-semibold"
                                                : "text-app-text-muted hover:text-app-text"
                                        )}
                                    >
                                        Caderno
                                    </button>
                                </div>

                                {/* Direita: Botão Fechar */}
                                <button
                                    type="button"
                                    onClick={() => onOpenChange(false)}
                                    aria-label="Fechar caderno"
                                    className="h-7 w-7 flex items-center justify-center rounded-md text-app-text-muted hover:text-app-text transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    <BookText className="h-4 w-4 text-gold" />
                                    <div>
                                        <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-app-text-muted">
                                            Meu Caderno
                                        </p>
                                        <p className="text-[0.68rem] text-gold font-mono">
                                            {contextLabel}
                                        </p>
                                    </div>
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
                                        onClick={() => onOpenChange(false)}
                                        aria-label="Fechar caderno"
                                        className="h-7 w-7 flex items-center justify-center rounded-md text-app-text-muted hover:text-app-text transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Conteúdo do sheet */}
                    {sheetMode === "editor" ? (
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
                                        ? () => {
                                            onNavigateToChapter(
                                                selectedNotebook.bookId,
                                                selectedNotebook.chapter,
                                                selectedNotebook.version || version
                                            );
                                            onOpenChange(false);
                                        }
                                        : undefined
                                }
                                bookId={selectedNotebook?.bookId ?? bookId}
                                chapter={selectedNotebook?.chapter ?? chapter}
                                version={selectedNotebook?.version ?? version}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col flex-1 min-h-0">
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
                                        {tab === "chapter" ? "Neste Capítulo" : "Todos"}
                                    </button>
                                ))}
                            </div>

                            {/* Campo de busca */}
                            <div className="px-4 pt-2.5 pb-1 shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-app-text-muted pointer-events-none" />
                                    <input
                                        type="search"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={activeTab === "chapter" ? "Buscar neste capítulo…" : "Buscar em todos…"}
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

                            {/* Lista */}
                            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                                <div className="px-4 py-2 space-y-2">
                                    {filtered.length === 0 ? (
                                        <div className="text-center py-8 space-y-1">
                                            {searchQuery ? (
                                                <>
                                                    <p className="text-[0.82rem] text-app-text-muted">
                                                        Nenhum resultado para "{searchQuery}".
                                                    </p>
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
                                                    <p className="text-[0.72rem] text-app-text-muted/60">Toque em "Novo caderno" para começar.</p>
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
                                                className="w-full text-left rounded-xl border border-border bg-app-surface p-3 space-y-1 hover:border-gold/40 active:bg-app-raised transition-colors"
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

                                <div className="px-4 py-3 border-t border-border">
                                    <Button
                                        type="button"
                                        onClick={handleCreateNew}
                                        className="w-full bg-gold text-black hover:bg-gold/90 font-medium gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Novo caderno
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DrawerPrimitive.Content>
            </DrawerPrimitive.Portal>
        </DrawerPrimitive.Root>
    );
}
