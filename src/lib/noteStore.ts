// ─────────────────────────────────────────────────────────────────────────────
// noteStore.ts — Bíblia Vive
//
// NoteStore interface + dual-mode adapters (ADR-0005).
// SupabaseNoteStore: persiste no banco para Leitores autenticados.
// LocalNoteStore: persiste em localStorage para Visitantes.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "./supabase";

export interface VerseNote {
    id: string;
    bookId: string;
    bookName: string;
    chapter: number;
    verse: number;
    content: string;
    version: string;
    verseText: string;
    createdAt: string;
    updatedAt: string;
}

export interface NoteStore {
    getByChapter(bookId: string, chapter: number): Promise<VerseNote[]>;
    getAll(): Promise<VerseNote[]>;
    save(note: Omit<VerseNote, "id" | "createdAt" | "updatedAt">): Promise<void>;
    delete(bookId: string, chapter: number, verse: number): Promise<void>;
}

// ─── Row mapper ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): VerseNote {
    return {
        id: row.id,
        bookId: row.book_id,
        bookName: row.book_name ?? row.book_id,
        chapter: row.chapter,
        verse: row.verse,
        content: row.content,
        version: row.version ?? "",
        verseText: row.verse_text ?? "",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// ─── SupabaseNoteStore ────────────────────────────────────────────────────────

export class SupabaseNoteStore implements NoteStore {
    constructor(private readonly userId: string) { }

    async getByChapter(bookId: string, chapter: number): Promise<VerseNote[]> {
        const { data } = await supabase
            .from("user_notes")
            .select("*")
            .eq("user_id", this.userId)
            .eq("book_id", bookId)
            .eq("chapter", chapter)
            .order("verse", { ascending: true });
        return (data ?? []).map(mapRow);
    }

    async getAll(): Promise<VerseNote[]> {
        const { data } = await supabase
            .from("user_notes")
            .select("*")
            .eq("user_id", this.userId)
            .order("updated_at", { ascending: false });
        return (data ?? []).map(mapRow);
    }

    async save(note: Omit<VerseNote, "id" | "createdAt" | "updatedAt">): Promise<void> {
        const { data: existing, error: selectError } = await supabase
            .from("user_notes")
            .select("id")
            .eq("user_id", this.userId)
            .eq("book_id", note.bookId)
            .eq("chapter", note.chapter)
            .eq("verse", note.verse)
            .maybeSingle();

        if (selectError) throw new Error(selectError.message);

        if (existing) {
            const { error } = await supabase
                .from("user_notes")
                .update({ content: note.content, book_name: note.bookName, version: note.version, verse_text: note.verseText })
                .eq("id", existing.id);
            if (error) {
                const { error: fb } = await supabase.from("user_notes").update({ content: note.content }).eq("id", existing.id);
                if (fb) throw new Error(fb.message);
            }
        } else {
            const verse_id = `${note.bookId.toUpperCase()}.${note.chapter}.${note.verse}`;
            const { error } = await supabase.from("user_notes").insert({
                user_id: this.userId, book_id: note.bookId, chapter: note.chapter,
                verse: note.verse, verse_id, content: note.content,
                book_name: note.bookName, version: note.version, verse_text: note.verseText,
            });
            if (error) {
                const { error: fb } = await supabase.from("user_notes").insert({
                    user_id: this.userId, book_id: note.bookId, chapter: note.chapter,
                    verse: note.verse, verse_id, content: note.content,
                });
                if (fb) throw new Error(fb.message);
            }
        }
    }

    async delete(bookId: string, chapter: number, verse: number): Promise<void> {
        await supabase.from("user_notes").delete()
            .eq("user_id", this.userId).eq("book_id", bookId).eq("chapter", chapter).eq("verse", verse);
    }
}

// ─── LocalNoteStore ───────────────────────────────────────────────────────────

const NT_KEY = "bv_notes";

function readLocal(): VerseNote[] {
    try { return JSON.parse(localStorage.getItem(NT_KEY) || "[]"); }
    catch { return []; }
}

function writeLocal(notes: VerseNote[]) {
    localStorage.setItem(NT_KEY, JSON.stringify(notes));
}

export class LocalNoteStore implements NoteStore {
    async getByChapter(bookId: string, chapter: number): Promise<VerseNote[]> {
        return readLocal().filter(n => n.bookId === bookId && n.chapter === chapter);
    }

    async getAll(): Promise<VerseNote[]> {
        return [...readLocal()].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    }

    async save(note: Omit<VerseNote, "id" | "createdAt" | "updatedAt">): Promise<void> {
        const notes = readLocal();
        const idx = notes.findIndex(n => n.bookId === note.bookId && n.chapter === note.chapter && n.verse === note.verse);
        const now = new Date().toISOString();
        if (idx >= 0) {
            notes[idx] = { ...notes[idx], ...note, updatedAt: now };
        } else {
            notes.push({ ...note, id: crypto.randomUUID(), createdAt: now, updatedAt: now });
        }
        writeLocal(notes);
    }

    async delete(bookId: string, chapter: number, verse: number): Promise<void> {
        writeLocal(readLocal().filter(n => !(n.bookId === bookId && n.chapter === chapter && n.verse === verse)));
    }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createNoteStore(userId: string | null): NoteStore {
    return userId ? new SupabaseNoteStore(userId) : new LocalNoteStore();
}
