// ─────────────────────────────────────────────────────────────────────────────
// notesMigration.ts — Bíblia Vive
//
// Migração de Notas e Destaques do localStorage (Visitante) para o Supabase
// (Leitor) após login. Função standalone disparada no evento SIGNED_IN.
// Orquestra os dois stores sem acoplá-los entre si (ADR-0005).
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "./supabase";

const HL_KEY = "bv_highlights";
const NT_KEY = "bv_notes";

/**
 * Migrates all Notas and Destaques from localStorage to Supabase for a newly
 * authenticated Leitor. Clears localStorage after successful upload.
 */
export async function migrateVerseDataToCloud(userId: string): Promise<void> {
    await Promise.all([migrateHighlights(userId), migrateNotes(userId)]);
}

async function migrateHighlights(userId: string): Promise<void> {
    try {
        const raw = localStorage.getItem(HL_KEY);
        if (!raw) return;

        const highlights: Record<string, string> = JSON.parse(raw);
        const rows = Object.entries(highlights).map(([key, color]) => {
            const [bookId, chapter, verse] = key.split(".");
            return { user_id: userId, book_id: bookId, chapter: parseInt(chapter), verse: parseInt(verse), color };
        });

        if (rows.length === 0) return;

        await supabase.from("user_highlights").upsert(rows, { onConflict: "user_id,book_id,chapter,verse" });
        localStorage.removeItem(HL_KEY);
    } catch (err) {
        console.warn("[notesMigration] Failed to migrate highlights:", err);
    }
}

async function migrateNotes(userId: string): Promise<void> {
    try {
        const raw = localStorage.getItem(NT_KEY);
        if (!raw) return;

        const notes = JSON.parse(raw) as Array<{
            bookId: string; bookName: string; chapter: number; verse: number;
            content: string; version: string; verseText: string;
        }>;

        if (notes.length === 0) return;

        const rows = notes.map(n => ({
            user_id: userId,
            book_id: n.bookId,
            chapter: n.chapter,
            verse: n.verse,
            verse_id: `${n.bookId.toUpperCase()}.${n.chapter}.${n.verse}`,
            content: n.content,
            book_name: n.bookName,
            version: n.version,
            verse_text: n.verseText,
        }));

        await supabase.from("user_notes").upsert(rows, { onConflict: "user_id,book_id,chapter,verse" });
        localStorage.removeItem(NT_KEY);
    } catch (err) {
        console.warn("[notesMigration] Failed to migrate notes:", err);
    }
}
