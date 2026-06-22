import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useNotebooks, type SaveStatus } from "@/hooks/useNotebooks";
import type { ChapterNotebook } from "@/lib/notebookStore";

interface NotebookContextType {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    bookId: string | null;
    chapter: number | null;
    version: string | null;
    bookName: string | null;
    setNotebookContext: (bookId: string, chapter: number, version: string, bookName: string) => void;
    notebooks: ChapterNotebook[];
    allNotebooks: ChapterNotebook[];
    loading: boolean;
    saveStatus: SaveStatus;
    syncError: string | null;
    saveNotebook: (notebook: { id?: string; title: string | null; content: string; bookId: string; chapter: number; version: string }, immediate?: boolean) => void;
    deleteNotebook: (id: string) => Promise<void>;
    getLocalDraft: (notebookId: string) => { title: string; content: string; updatedAt: string } | null;
    getNewLocalDraft: (bId: string, chap: number) => { title: string; content: string; updatedAt: string } | null;
    activeNotebook: ChapterNotebook | null;
    setActiveNotebook: (notebook: ChapterNotebook | null) => void;
    isCreatingNew: boolean;
    setIsCreatingNew: (creating: boolean) => void;
    refresh: () => Promise<void>;
    refreshAll: () => Promise<void>;
}

const NotebookContext = createContext<NotebookContextType | undefined>(undefined);

export function NotebookProvider({ children }: { children: React.ReactNode }) {
    const location = useLocation();

    // LocalStorage fallback para lembrar do último livro lido
    const [bookId, setBookId] = useState<string | null>(() => localStorage.getItem("bv_last_book_id") || "gen");
    const [chapter, setChapter] = useState<number | null>(() => {
        const cached = localStorage.getItem("bv_last_chapter");
        return cached ? Number(cached) : 1;
    });
    const [version, setVersion] = useState<string | null>(() => localStorage.getItem("bv_last_version") || "acf");
    const [bookName, setBookName] = useState<string | null>(() => localStorage.getItem("bv_last_book_name") || "Gênesis");

    const [isOpen, setIsOpen] = useState(false);

    // Contexto de persistência do caderno para o livro e capítulo ativos
    const notebookData = useNotebooks(bookId || undefined, chapter || undefined);

    const setNotebookContext = useCallback((bId: string, chap: number, ver: string, bName: string) => {
        setBookId(bId);
        setChapter(chap);
        setVersion(ver);
        setBookName(bName);
        localStorage.setItem("bv_last_book_id", bId);
        localStorage.setItem("bv_last_chapter", String(chap));
        localStorage.setItem("bv_last_version", ver);
        localStorage.setItem("bv_last_book_name", bName);
    }, []);

    // Fechar automaticamente se voltar para a home page
    useEffect(() => {
        if (location.pathname === "/") {
            setIsOpen(false);
        }
    }, [location.pathname]);

    return (
        <NotebookContext.Provider
            value={{
                isOpen,
                setIsOpen,
                bookId,
                chapter,
                version,
                bookName,
                setNotebookContext,
                ...notebookData,
            }}
        >
            {children}
        </NotebookContext.Provider>
    );
}

export function useNotebookContext() {
    const context = useContext(NotebookContext);
    if (!context) {
        throw new Error("useNotebookContext must be used within a NotebookProvider");
    }
    return context;
}
