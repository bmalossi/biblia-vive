// ─────────────────────────────────────────────────────────────────────────────
// useNotebooks.ts — Bíblia Vive
//
// Hook para gerenciar os cadernos do capítulo do usuário, incluindo:
//   - Carregamento de dados via Supabase
//   - Rascunhos locais resilientes (localStorage por userId)
//   - Autosave debounced com controle de concorrência e status visuais
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import { createNotebookStore, type ChapterNotebook } from "@/lib/notebookStore";

export type SaveStatus = "saved" | "saving" | "local" | "error" | null;

// Helpers para gerenciamento de rascunhos em localStorage
const getDraftKey = (userId: string, notebookId: string) => `bv_draft_${userId}_${notebookId}`;
const getNewDraftKey = (userId: string, bookId: string, chapter: number) => `bv_draft_${userId}_new_${bookId}_${chapter}`;

interface DraftData {
    title: string;
    content: string;
    updatedAt: string;
}

export function useNotebooks(bookId?: string, chapter?: number) {
    const { user } = useAuth();
    const userId = user?.id ?? null;

    const [notebooks, setNotebooks] = useState<ChapterNotebook[]>([]);
    const [allNotebooks, setAllNotebooks] = useState<ChapterNotebook[]>([]);
    const [loading, setLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>(null);
    const [syncError, setSyncError] = useState<string | null>(null);

    const [activeNotebook, setActiveNotebook] = useState<ChapterNotebook | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);

    // Referências para controlar timers de debounce e valores mais recentes para evitar race conditions
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const pendingSaveRef = useRef<(() => Promise<void>) | null>(null);
    const store = useMemo(() => createNotebookStore(userId), [userId]);

    // Carregar cadernos do capítulo atual
    const loadChapterNotebooks = useCallback(async () => {
        if (!userId || !store || !bookId || !chapter) return;
        setLoading(true);
        try {
            const data = await store.getByChapter(bookId, chapter);
            setNotebooks(data);
        } catch (err: any) {
            console.error("[useNotebooks] Error loading chapter notebooks:", err);
        } finally {
            setLoading(false);
        }
    }, [userId, store, bookId, chapter]);

    // Carregar todos os cadernos do usuário (para listagem global e aba "Todos os cadernos")
    const loadAllNotebooks = useCallback(async () => {
        if (!userId || !store) return;
        setLoading(true);
        try {
            const data = await store.getAll();
            setAllNotebooks(data);
        } catch (err: any) {
            console.error("[useNotebooks] Error loading all notebooks:", err);
        } finally {
            setLoading(false);
        }
    }, [userId, store]);

    useEffect(() => {
        if (userId) {
            loadChapterNotebooks();
            loadAllNotebooks();
        } else {
            setNotebooks([]);
            setAllNotebooks([]);
        }
        // Limpar caderno ativo ao mudar de capítulo
        setActiveNotebook(null);
        setIsCreatingNew(false);
    }, [userId, bookId, chapter, loadChapterNotebooks, loadAllNotebooks]);

    // Buscar rascunho local
    const getLocalDraft = useCallback((notebookId: string): DraftData | null => {
        if (!userId) return null;
        try {
            const data = localStorage.getItem(getDraftKey(userId, notebookId));
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }, [userId]);

    const getNewLocalDraft = useCallback((bId: string, chap: number): DraftData | null => {
        if (!userId) return null;
        try {
            const data = localStorage.getItem(getNewDraftKey(userId, bId, chap));
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }, [userId]);

    // Salvar rascunho local
    const saveLocalDraft = useCallback((notebookId: string, title: string, content: string) => {
        if (!userId) return;
        try {
            const draft: DraftData = { title, content, updatedAt: new Date().toISOString() };
            localStorage.setItem(getDraftKey(userId, notebookId), JSON.stringify(draft));
        } catch (e) {
            console.warn("[useNotebooks] Failed to save local draft:", e);
        }
    }, [userId]);

    const saveNewLocalDraft = useCallback((bId: string, chap: number, title: string, content: string) => {
        if (!userId) return;
        try {
            const draft: DraftData = { title, content, updatedAt: new Date().toISOString() };
            localStorage.setItem(getNewDraftKey(userId, bId, chap), JSON.stringify(draft));
        } catch (e) {
            console.warn("[useNotebooks] Failed to save new local draft:", e);
        }
    }, [userId]);

    // Limpar rascunhos locais
    const clearLocalDraft = useCallback((notebookId: string) => {
        if (!userId) return;
        localStorage.removeItem(getDraftKey(userId, notebookId));
    }, [userId]);

    const clearNewLocalDraft = useCallback((bId: string, chap: number) => {
        if (!userId) return;
        localStorage.removeItem(getNewDraftKey(userId, bId, chap));
    }, [userId]);

    // Executar salvamento imediato pendente (Flush)
    const flushPendingSave = useCallback(async () => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
        if (pendingSaveRef.current) {
            const saveFn = pendingSaveRef.current;
            pendingSaveRef.current = null;
            await saveFn();
        }
    }, []);

    // Sincronizar caderno com o Supabase (com debounce interno)
    const saveNotebook = useCallback((
        notebook: { id?: string; title: string | null; content: string; bookId: string; chapter: number; version: string },
        immediate?: boolean
    ) => {
        if (!userId || !store) return;

        setSaveStatus("saving");
        setSyncError(null);

        // Salvar imediatamente no rascunho local
        if (notebook.id) {
            saveLocalDraft(notebook.id, notebook.title || "", notebook.content);
        } else {
            saveNewLocalDraft(notebook.bookId, notebook.chapter, notebook.title || "", notebook.content);
        }

        // Função que efetua o salvamento real no banco
        const executeSave = async () => {
            try {
                const saved = await store.save({ ...notebook, userId });

                // Sucesso: atualizar estados locais
                setNotebooks(prev => {
                    const filtered = prev.filter(n => n.id !== saved.id && n.id !== notebook.id);
                    return [saved, ...filtered];
                });
                setAllNotebooks(prev => {
                    const filtered = prev.filter(n => n.id !== saved.id && n.id !== notebook.id);
                    return [saved, ...filtered];
                });

                // Atualizar o caderno ativo se for o atual sendo editado
                setActiveNotebook((currentActive) => {
                    if (currentActive?.id === notebook.id || (!notebook.id && isCreatingNew)) {
                        return saved;
                    }
                    return currentActive;
                });
                setIsCreatingNew((currentCreating) => {
                    if (!notebook.id && currentCreating) {
                        return false;
                    }
                    return currentCreating;
                });

                // Limpar rascunho local após sincronização confirmada
                if (notebook.id) {
                    clearLocalDraft(notebook.id);
                } else {
                    clearNewLocalDraft(notebook.bookId, notebook.chapter);
                }

                setSaveStatus("saved");
            } catch (err: any) {
                console.error("[useNotebooks] Error saving to Supabase:", err);
                setSaveStatus("local"); // Salvo apenas localmente devido a erro
                setSyncError(err.message || "Erro de sincronização");
                throw err;
            }
        };

        if (immediate) {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
            pendingSaveRef.current = null;
            executeSave().catch(() => {});
        } else {
            // Guardar para possível flush síncrono
            pendingSaveRef.current = executeSave;

            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
                debounceTimerRef.current = null;
                if (pendingSaveRef.current === executeSave) {
                    pendingSaveRef.current = null;
                    executeSave().catch(() => {});
                }
            }, 1500);
        }
    }, [userId, store, isCreatingNew, saveLocalDraft, saveNewLocalDraft, clearLocalDraft, clearNewLocalDraft]);

    // Deletar caderno
    const deleteNotebook = useCallback(async (id: string) => {
        if (!userId || !store) return;
        try {
            await store.delete(id);
            setNotebooks(prev => prev.filter(n => n.id !== id));
            setAllNotebooks(prev => prev.filter(n => n.id !== id));
            clearLocalDraft(id);
            if (activeNotebook?.id === id) {
                setActiveNotebook(null);
                setIsCreatingNew(false);
            }
        } catch (err: any) {
            console.error("[useNotebooks] Error deleting notebook:", err);
            throw err;
        }
    }, [userId, store, activeNotebook, clearLocalDraft]);

    // Flush de segurança ao desmontar o hook
    useEffect(() => {
        return () => {
            if (pendingSaveRef.current) {
                // Tenta salvar de forma assíncrona imediata no encerramento
                const saveFn = pendingSaveRef.current;
                saveFn().catch(() => {});
            }
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, []);

    return {
        notebooks,
        allNotebooks,
        loading,
        saveStatus,
        syncError,
        saveNotebook,
        deleteNotebook,
        getLocalDraft,
        getNewLocalDraft,
        clearLocalDraft,
        clearNewLocalDraft,
        flushPendingSave,
        activeNotebook,
        setActiveNotebook,
        isCreatingNew,
        setIsCreatingNew,
        refresh: loadChapterNotebooks,
        refreshAll: loadAllNotebooks,
    };
}
