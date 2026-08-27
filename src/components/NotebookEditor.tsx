// ─────────────────────────────────────────────────────────────────────────────
// NotebookEditor.tsx — Bíblia Vive
//
// Componente de edição de caderno individual, utilizado tanto pelo
// NotebookWorkspace (desktop) quanto pelo NotebookSheet (mobile).
// Contém: título, linha de contexto, editor de texto e ações de exclusão.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ChapterNotebook } from "@/lib/notebookStore";
import type { SaveStatus } from "@/hooks/useNotebooks";
import { exportNotebooksToPDF, exportNotebooksToWord } from "@/lib/notebookExport";
import { SaveMemorialButton } from "@/components/SaveMemorialButton";

interface NotebookEditorProps {
    notebook: ChapterNotebook | null; // null = novo caderno em branco
    contextLabel: string; // ex: "Romanos 8 - ACF"
    saveStatus: SaveStatus;
    syncError: string | null;
    onSave: (data: { id?: string; title: string | null; content: string }, immediate?: boolean) => void;
    onDelete: (id: string) => Promise<void>;
    onBack: () => void;
    /** Se definido, exibe botão "Ir para o capítulo" no header (útil quando vindo da aba Todos) */
    onNavigateToChapter?: () => void;
    bookId?: string;
    chapter?: number;
    version?: string;
}

const SAVE_STATUS_LABELS: Record<string, string> = {
    saving: "Salvando...",
    saved: "Salvo automaticamente",
    local: "Salvo localmente",
    error: "Falha ao sincronizar",
};

export default function NotebookEditor({
    notebook,
    contextLabel,
    saveStatus,
    syncError,
    onSave,
    onDelete,
    onBack,
    onNavigateToChapter,
    bookId,
    chapter,
    version,
}: NotebookEditorProps) {
    const [title, setTitle] = useState(notebook?.title || "");
    const [content, setContent] = useState(notebook?.content || "");
    const [isDeleting, setIsDeleting] = useState(false);
    const titleRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLTextAreaElement>(null);

    const handleExportPDF = async () => {
        const docNotebook: ChapterNotebook = {
            id: notebook?.id ?? "novo",
            userId: notebook?.userId ?? "",
            title: title || null,
            content: content,
            bookId: notebook?.bookId ?? bookId ?? "",
            chapter: notebook?.chapter ?? chapter ?? 1,
            version: notebook?.version ?? version ?? "acf",
            createdAt: notebook?.createdAt ?? new Date().toISOString(),
            updatedAt: notebook?.updatedAt ?? new Date().toISOString(),
        };
        const titleLabel = title ? `Estudo: ${title}` : "Estudo Bíblico";
        await exportNotebooksToPDF([docNotebook], titleLabel, title || "Estudo_Biblico");
    };

    const handleExportWord = () => {
        const docNotebook: ChapterNotebook = {
            id: notebook?.id ?? "novo",
            userId: notebook?.userId ?? "",
            title: title || null,
            content: content,
            bookId: notebook?.bookId ?? bookId ?? "",
            chapter: notebook?.chapter ?? chapter ?? 1,
            version: notebook?.version ?? version ?? "acf",
            createdAt: notebook?.createdAt ?? new Date().toISOString(),
            updatedAt: notebook?.updatedAt ?? new Date().toISOString(),
        };
        const titleLabel = title ? `Estudo: ${title}` : "Estudo Bíblico";
        exportNotebooksToWord([docNotebook], titleLabel, title || "Estudo_Biblico");
    };

    // Atualiza quando muda o caderno selecionado (ao trocar de caderno)
    useEffect(() => {
        setTitle(notebook?.title || "");
        setContent(notebook?.content || "");
    }, [notebook?.id]);

    // Focus no título ao montar um novo caderno
    useEffect(() => {
        if (!notebook?.id) {
            setTimeout(() => titleRef.current?.focus(), 50);
        }
    }, [notebook?.id]);

    const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setTitle(value);
        onSave({ id: notebook?.id, title: value || null, content });
    }, [notebook?.id, content, onSave]);

    const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setContent(value);
        onSave({ id: notebook?.id, title: title || null, content: value });
    }, [notebook?.id, title, onSave]);

    const handleDelete = async () => {
        if (!notebook?.id) return;
        setIsDeleting(true);
        try {
            await onDelete(notebook.id);
            onBack();
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSaveAndClose = useCallback(() => {
        onSave({ id: notebook?.id, title: title || null, content }, true);
        onBack();
    }, [notebook?.id, title, content, onSave, onBack]);

    const statusColor =
        saveStatus === "saved"
            ? "text-green-500"
            : saveStatus === "local"
            ? "text-amber-500"
            : saveStatus === "error"
            ? "text-destructive"
            : "text-app-text-muted";

    return (
        <div className="flex flex-col h-full gap-0">
            {/* Header do editor */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 shrink-0">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-[0.75rem] text-app-text-muted hover:text-app-text transition-colors underline"
                >
                    ← Voltar
                </button>
                <div className="flex items-center gap-2">
                    {/* Botão ir para o capítulo (apenas quando editando caderno de outro capítulo) */}
                    {onNavigateToChapter && (
                        <button
                            type="button"
                            onClick={onNavigateToChapter}
                            title="Ir para o capítulo deste caderno"
                            className="flex items-center gap-1 text-[0.72rem] text-gold hover:text-gold/80 font-medium transition-colors"
                        >
                            Ir ao capítulo
                            <ArrowRight className="h-3 w-3" />
                        </button>
                    )}
                    {/* Botão exportar */}
                    {content.trim() && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    aria-label="Exportar caderno"
                                    title="Exportar caderno"
                                    className="p-1.5 rounded-md text-app-text-muted hover:text-gold hover:bg-gold/10 transition-colors"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px] bg-app-bg border-border text-app-text">
                                <DropdownMenuItem
                                    onClick={handleExportPDF}
                                    className="text-xs hover:bg-gold/10 hover:text-gold cursor-pointer"
                                >
                                    Exportar para PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={handleExportWord}
                                    className="text-xs hover:bg-gold/10 hover:text-gold cursor-pointer"
                                >
                                    Exportar para Word
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    {/* Botão excluir (apenas para cadernos existentes) */}
                    {notebook?.id && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button
                                    type="button"
                                    aria-label="Excluir caderno"
                                    className="p-1.5 rounded-md text-app-text-muted hover:text-destructive hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-app-bg border-border text-app-text w-[95vw] max-w-sm rounded-2xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir caderno?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-app-text-muted">
                                        Esta ação é permanente e não pode ser desfeita.
                                        O conteúdo do caderno será perdido.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="bg-red-500 hover:bg-red-600 text-white"
                                    >
                                        {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                                        Excluir
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>

            {/* Corpo do editor */}
            <div className="flex flex-col flex-1 min-h-0 px-4 py-3 gap-2">
                {/* Contexto do capítulo (read-only) */}
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-gold shrink-0">
                    {contextLabel}
                </p>

                {/* Título */}
                <input
                    ref={titleRef}
                    id="notebook-title-input"
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Título do caderno (opcional)"
                    maxLength={150}
                    className="w-full bg-transparent text-app-text text-[0.95rem] font-semibold placeholder:text-app-text-muted/50 focus:outline-none border-0 shrink-0"
                    aria-label="Título do caderno"
                />

                <div className="h-px bg-border/40 shrink-0" />

                {/* Área de conteúdo */}
                <textarea
                    ref={contentRef}
                    id="notebook-content-textarea"
                    value={content}
                    onChange={handleContentChange}
                    placeholder="Escreva suas reflexões e estudos sobre este capítulo..."
                    className="flex-1 min-h-0 w-full resize-none bg-transparent text-app-text text-[0.88rem] leading-relaxed placeholder:text-app-text-muted/40 focus:outline-none border-0 custom-scrollbar"
                    aria-label="Conteúdo do caderno"
                    aria-multiline="true"
                    style={{ fontFamily: "var(--font-reading, inherit)" }}
                />

                {/* Erro de sincronização */}
                {saveStatus === "error" && syncError && (
                    <p className="text-[0.72rem] text-destructive shrink-0">
                        {syncError}. Seu rascunho está seguro localmente.
                    </p>
                )}

                {/* Metadata de datas */}
                {notebook?.id && (
                    <p className="text-[0.68rem] text-app-text-muted/50 shrink-0">
                        Atualizado{" "}
                        {new Date(notebook.updatedAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                        })}
                    </p>
                )}
            </div>

            {/* Rodapé do editor com botão Salvar e status */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-app-surface/20 shrink-0 gap-3">
                <div className="flex items-center">
                    {saveStatus && (
                        <span className={cn("text-[0.72rem] flex items-center gap-1 transition-colors", statusColor)}>
                            {saveStatus === "saving" && <Loader2 className="h-3 w-3 animate-spin" />}
                            {SAVE_STATUS_LABELS[saveStatus]}
                        </span>
                    )}
                </div>
                <div className="w-[180px]">
                    <SaveMemorialButton
                        className="py-1.5 px-3 text-xs rounded-lg"
                        idleText="Salvar Caderno"
                        savingText="Gravando..."
                        successText="Caderno Salvo"
                        onSave={async () => {
                            try {
                                onSave({ id: notebook?.id, title: title || null, content }, true);
                                return true;
                            } catch {
                                return false;
                            }
                        }}
                        onSuccessComplete={onBack}
                    />
                </div>
            </div>
        </div>
    );
}
