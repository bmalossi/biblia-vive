// ─────────────────────────────────────────────────────────────────────────────
// notesHighlights.ts — Bíblia Vive
//
// BARREL DE RE-EXPORT (ADR-0005).
//
// Este arquivo foi refatorado em módulos independentes:
//   - noteStore.ts       — NoteStore interface + adapters dual-mode
//   - highlightStore.ts  — HighlightStore interface + adapters dual-mode
//   - notesExport.ts     — exportNotesToTXT, exportNotesToPDF
//   - notesMigration.ts  — migrateVerseDataToCloud
//
// Mantido como barrel para não quebrar os callers existentes enquanto
// as importações são atualizadas incrementalmente.
// Deletar quando todos os callers apontarem para os módulos acima.
// ─────────────────────────────────────────────────────────────────────────────

export type { VerseNote } from "./noteStore";
export type { VerseHighlight, VerseHighlightFull, HighlightColor } from "./highlightStore";
export { createNoteStore } from "./noteStore";
export { createHighlightStore } from "./highlightStore";
export { exportNotesToTXT, exportNotesToPDF } from "./notesExport";
export { migrateVerseDataToCloud as migrateLocalToSupabase } from "./notesMigration";

// ── Legacy function exports for callers not yet migrated ──────────────────────
// These wrap the new stores using the old (userId | null) signature.

import { createNoteStore } from "./noteStore";
import { createHighlightStore } from "./highlightStore";
import type { HighlightColor, VerseHighlight, VerseHighlightFull } from "./highlightStore";
import type { VerseNote } from "./noteStore";

export async function getChapterHighlights(userId: string | null, bookId: string, chapter: number): Promise<VerseHighlight[]> {
    return createHighlightStore(userId).getByChapter(bookId, chapter);
}

export async function getAllHighlights(userId: string | null): Promise<VerseHighlightFull[]> {
    return createHighlightStore(userId).getAll();
}

export async function setHighlight(userId: string | null, bookId: string, chapter: number, verse: number, color: HighlightColor, meta?: { bookName?: string; version?: string; verseText?: string }): Promise<void> {
    return createHighlightStore(userId).set(bookId, chapter, verse, color, meta);
}

export async function removeHighlight(userId: string | null, bookId: string, chapter: number, verse: number): Promise<void> {
    return createHighlightStore(userId).remove(bookId, chapter, verse);
}

export async function getChapterNotes(userId: string | null, bookId: string, chapter: number): Promise<VerseNote[]> {
    return createNoteStore(userId).getByChapter(bookId, chapter);
}

export async function getAllNotes(userId: string | null): Promise<VerseNote[]> {
    return createNoteStore(userId).getAll();
}

export async function saveNote(userId: string | null, note: Omit<VerseNote, "id" | "createdAt" | "updatedAt">): Promise<void> {
    return createNoteStore(userId).save(note);
}

export async function deleteNote(userId: string | null, bookId: string, chapter: number, verse: number): Promise<void> {
    return createNoteStore(userId).delete(bookId, chapter, verse);
}
