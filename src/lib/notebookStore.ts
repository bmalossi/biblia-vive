// ─────────────────────────────────────────────────────────────────────────────
// notebookStore.ts — Bíblia Vive
//
// NotebookStore interface + Supabase adapter for Chapter Notebooks.
// Este recurso persiste no banco de dados para Leitores autenticados.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "./supabase";

export interface ChapterNotebook {
    id: string;
    userId: string;
    title: string | null;
    content: string;
    bookId: string;
    chapter: number;
    version: string;
    createdAt: string;
    updatedAt: string;
}

export interface NotebookStore {
    getByChapter(bookId: string, chapter: number): Promise<ChapterNotebook[]>;
    getAll(): Promise<ChapterNotebook[]>;
    save(notebook: Omit<ChapterNotebook, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<ChapterNotebook>;
    delete(id: string): Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): ChapterNotebook {
    return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        content: row.content,
        bookId: row.book_id,
        chapter: row.chapter,
        version: row.version,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export class SupabaseNotebookStore implements NotebookStore {
    constructor(private readonly userId: string) {}

    async getByChapter(bookId: string, chapter: number): Promise<ChapterNotebook[]> {
        const { data, error } = await supabase
            .from("chapter_notebooks")
            .select("*")
            .eq("user_id", this.userId)
            .eq("book_id", bookId)
            .eq("chapter", chapter)
            .order("updated_at", { ascending: false });

        if (error) throw new Error(error.message);
        return (data ?? []).map(mapRow);
    }

    async getAll(): Promise<ChapterNotebook[]> {
        const { data, error } = await supabase
            .from("chapter_notebooks")
            .select("*")
            .eq("user_id", this.userId)
            .order("updated_at", { ascending: false });

        if (error) throw new Error(error.message);
        return (data ?? []).map(mapRow);
    }

    async save(notebook: Omit<ChapterNotebook, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<ChapterNotebook> {
        if (notebook.id) {
            // Update
            const { data, error } = await supabase
                .from("chapter_notebooks")
                .update({
                    title: notebook.title,
                    content: notebook.content,
                    book_id: notebook.bookId,
                    chapter: notebook.chapter,
                    version: notebook.version,
                })
                .eq("id", notebook.id)
                .eq("user_id", this.userId)
                .select()
                .single();

            if (error) throw new Error(error.message);
            return mapRow(data);
        } else {
            // Insert
            const { data, error } = await supabase
                .from("chapter_notebooks")
                .insert({
                    user_id: this.userId,
                    title: notebook.title,
                    content: notebook.content,
                    book_id: notebook.bookId,
                    chapter: notebook.chapter,
                    version: notebook.version,
                })
                .select()
                .single();

            if (error) throw new Error(error.message);
            return mapRow(data);
        }
    }

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from("chapter_notebooks")
            .delete()
            .eq("id", id)
            .eq("user_id", this.userId);

        if (error) throw new Error(error.message);
    }
}

export function createNotebookStore(userId: string | null): NotebookStore | null {
    return userId ? new SupabaseNotebookStore(userId) : null;
}
