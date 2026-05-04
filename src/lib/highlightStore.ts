// ─────────────────────────────────────────────────────────────────────────────
// highlightStore.ts — Bíblia Vive
//
// HighlightStore interface + dual-mode adapters (ADR-0005).
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "./supabase";

export type HighlightColor = "yellow" | "blue" | "green" | "pink" | "purple";

export interface VerseHighlight {
    verse: number;
    color: HighlightColor;
}

export interface VerseHighlightFull {
    id: string;
    bookId: string;
    bookName: string;
    chapter: number;
    verse: number;
    color: HighlightColor;
    version: string;
    verseText: string;
    createdAt: string;
}

export interface HighlightStore {
    getByChapter(bookId: string, chapter: number): Promise<VerseHighlight[]>;
    getAll(): Promise<VerseHighlightFull[]>;
    set(bookId: string, chapter: number, verse: number, color: HighlightColor, meta?: { bookName?: string; version?: string; verseText?: string }): Promise<void>;
    remove(bookId: string, chapter: number, verse: number): Promise<void>;
}

// ─── Row mapper ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): VerseHighlightFull {
    return {
        id: row.id,
        bookId: row.book_id,
        bookName: row.book_name ?? row.book_id,
        chapter: row.chapter,
        verse: row.verse,
        color: row.color as HighlightColor,
        version: row.version ?? "",
        verseText: row.verse_text ?? "",
        createdAt: row.created_at,
    };
}

// ─── SupabaseHighlightStore ───────────────────────────────────────────────────

export class SupabaseHighlightStore implements HighlightStore {
    constructor(private readonly userId: string) { }

    async getByChapter(bookId: string, chapter: number): Promise<VerseHighlight[]> {
        const { data } = await supabase
            .from("user_highlights")
            .select("verse, color")
            .eq("user_id", this.userId)
            .eq("book_id", bookId)
            .eq("chapter", chapter);
        return (data ?? []) as VerseHighlight[];
    }

    async getAll(): Promise<VerseHighlightFull[]> {
        const { data } = await supabase
            .from("user_highlights")
            .select("*")
            .eq("user_id", this.userId)
            .order("created_at", { ascending: false });
        return (data ?? []).map(mapRow);
    }

    async set(bookId: string, chapter: number, verse: number, color: HighlightColor, meta?: { bookName?: string; version?: string; verseText?: string }): Promise<void> {
        await supabase.from("user_highlights").upsert(
            { user_id: this.userId, book_id: bookId, chapter, verse, color, book_name: meta?.bookName, version: meta?.version, verse_text: meta?.verseText },
            { onConflict: "user_id,book_id,chapter,verse" }
        );
    }

    async remove(bookId: string, chapter: number, verse: number): Promise<void> {
        await supabase.from("user_highlights").delete()
            .eq("user_id", this.userId).eq("book_id", bookId).eq("chapter", chapter).eq("verse", verse);
    }
}

// ─── LocalHighlightStore ──────────────────────────────────────────────────────

const HL_KEY = "bv_highlights";

function hlKey(bookId: string, chapter: number, verse: number) {
    return `${bookId}.${chapter}.${verse}`;
}

function readLocal(): Record<string, HighlightColor> {
    try { return JSON.parse(localStorage.getItem(HL_KEY) || "{}"); }
    catch { return {}; }
}

function writeLocal(data: Record<string, HighlightColor>) {
    localStorage.setItem(HL_KEY, JSON.stringify(data));
}

export class LocalHighlightStore implements HighlightStore {
    async getByChapter(bookId: string, chapter: number): Promise<VerseHighlight[]> {
        const all = readLocal();
        const prefix = `${bookId}.${chapter}.`;
        return Object.entries(all)
            .filter(([k]) => k.startsWith(prefix))
            .map(([k, color]) => ({ verse: parseInt(k.split(".")[2]), color }));
    }

    async getAll(): Promise<VerseHighlightFull[]> {
        const all = readLocal();
        return Object.entries(all)
            .map(([key, color]) => {
                const parts = key.split(".");
                const bookId = parts.slice(0, -2).join(".");
                const chapter = parseInt(parts[parts.length - 2]);
                const verse = parseInt(parts[parts.length - 1]);
                return { id: key, bookId, bookName: bookId, chapter, verse, color, version: "", verseText: "", createdAt: new Date().toISOString() };
            })
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    async set(bookId: string, chapter: number, verse: number, color: HighlightColor): Promise<void> {
        const all = readLocal();
        all[hlKey(bookId, chapter, verse)] = color;
        writeLocal(all);
    }

    async remove(bookId: string, chapter: number, verse: number): Promise<void> {
        const all = readLocal();
        delete all[hlKey(bookId, chapter, verse)];
        writeLocal(all);
    }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createHighlightStore(userId: string | null): HighlightStore {
    return userId ? new SupabaseHighlightStore(userId) : new LocalHighlightStore();
}
