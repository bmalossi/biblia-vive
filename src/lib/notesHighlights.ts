// ─────────────────────────────────────────────────────────────────────────────
// notesHighlights.ts — Bíblia Viva · Sprint 7
// Serviço CRUD dual-mode: Supabase (logado) + localStorage (anônimo)
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from './supabase';

export type HighlightColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple';

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

// ── localStorage keys ─────────────────────────────────────────────────────────
const HL_KEY = 'bv_highlights';
const NT_KEY = 'bv_notes';

// ── Helpers ───────────────────────────────────────────────────────────────────
function readLocalHighlights(): Record<string, HighlightColor> {
    try { return JSON.parse(localStorage.getItem(HL_KEY) || '{}'); }
    catch { return {}; }
}

function writeLocalHighlights(data: Record<string, HighlightColor>) {
    localStorage.setItem(HL_KEY, JSON.stringify(data));
}

function hlKey(bookId: string, chapter: number, verse: number) {
    return `${bookId}.${chapter}.${verse}`;
}

function readLocalNotes(): VerseNote[] {
    try { return JSON.parse(localStorage.getItem(NT_KEY) || '[]'); }
    catch { return []; }
}

function writeLocalNotes(notes: VerseNote[]) {
    localStorage.setItem(NT_KEY, JSON.stringify(notes));
}

// ── HIGHLIGHTS ────────────────────────────────────────────────────────────────

export async function getChapterHighlights(
    userId: string | null,
    bookId: string,
    chapter: number
): Promise<VerseHighlight[]> {
    if (userId) {
        const { data } = await supabase
            .from('user_highlights')
            .select('verse, color')
            .eq('user_id', userId)
            .eq('book_id', bookId)
            .eq('chapter', chapter);
        return (data ?? []) as VerseHighlight[];
    }
    // Anonymous: read from localStorage, filter by chapter
    const all = readLocalHighlights();
    const prefix = `${bookId}.${chapter}.`;
    return Object.entries(all)
        .filter(([k]) => k.startsWith(prefix))
        .map(([k, color]) => ({ verse: parseInt(k.split('.')[2]), color }));
}

export async function setHighlight(
    userId: string | null,
    bookId: string,
    chapter: number,
    verse: number,
    color: HighlightColor,
    meta?: { bookName?: string; version?: string; verseText?: string }
): Promise<void> {
    if (userId) {
        await supabase.from('user_highlights').upsert(
            {
                user_id: userId,
                book_id: bookId,
                chapter,
                verse,
                color,
                book_name: meta?.bookName,
                version: meta?.version,
                verse_text: meta?.verseText,
            },
            { onConflict: 'user_id,book_id,chapter,verse' }
        );
        return;
    }
    const all = readLocalHighlights();
    all[hlKey(bookId, chapter, verse)] = color;
    writeLocalHighlights(all);
}

export async function removeHighlight(
    userId: string | null,
    bookId: string,
    chapter: number,
    verse: number
): Promise<void> {
    if (userId) {
        await supabase.from('user_highlights')
            .delete()
            .eq('user_id', userId)
            .eq('book_id', bookId)
            .eq('chapter', chapter)
            .eq('verse', verse);
        return;
    }
    const all = readLocalHighlights();
    delete all[hlKey(bookId, chapter, verse)];
    writeLocalHighlights(all);
}

// ── HIGHLIGHTS GLOBAL ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapHighlightRow(row: any): VerseHighlightFull {
    return {
        id: row.id,
        bookId: row.book_id,
        bookName: row.book_name ?? row.book_id,
        chapter: row.chapter,
        verse: row.verse,
        color: row.color as HighlightColor,
        version: row.version ?? '',
        verseText: row.verse_text ?? '',
        createdAt: row.created_at,
    };
}

export async function getAllHighlights(userId: string | null): Promise<VerseHighlightFull[]> {
    if (userId) {
        const { data } = await supabase
            .from('user_highlights')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        return (data ?? []).map(mapHighlightRow);
    }
    // Anônimo: lê localStorage, reconstrói estrutura
    const all = readLocalHighlights();
    return Object.entries(all).map(([key, color]) => {
        const parts = key.split('.');
        const bookId = parts.slice(0, -2).join('.');
        const chapter = parseInt(parts[parts.length - 2]);
        const verse = parseInt(parts[parts.length - 1]);
        return {
            id: key,
            bookId,
            bookName: bookId, // sem metadados no localStorage; fallback
            chapter,
            verse,
            color,
            version: '',
            verseText: '',
            createdAt: new Date().toISOString(),
        };
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ── NOTES ─────────────────────────────────────────────────────────────────────

export async function getChapterNotes(
    userId: string | null,
    bookId: string,
    chapter: number
): Promise<VerseNote[]> {
    if (userId) {
        const { data } = await supabase
            .from('user_notes')
            .select('*')
            .eq('user_id', userId)
            .eq('book_id', bookId)
            .eq('chapter', chapter)
            .order('verse', { ascending: true });
        return (data ?? []).map(mapRow);
    }
    return readLocalNotes().filter(n => n.bookId === bookId && n.chapter === chapter);
}

export async function getAllNotes(userId: string | null): Promise<VerseNote[]> {
    if (userId) {
        const { data } = await supabase
            .from('user_notes')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });
        return (data ?? []).map(mapRow);
    }
    return [...readLocalNotes()].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

export async function saveNote(
    userId: string | null,
    note: Omit<VerseNote, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
    if (userId) {
        // Check if note already exists for this verse
        const { data: existing, error: selectError } = await supabase
            .from('user_notes')
            .select('id')
            .eq('user_id', userId)
            .eq('book_id', note.bookId)
            .eq('chapter', note.chapter)
            .eq('verse', note.verse)
            .maybeSingle();

        if (selectError) throw new Error(selectError.message);

        if (existing) {
            // Update existing note — try with optional fields first
            const { error: updateError } = await supabase
                .from('user_notes')
                .update({
                    content: note.content,
                    book_name: note.bookName,
                    version: note.version,
                    verse_text: note.verseText,
                })
                .eq('id', existing.id);

            if (updateError) {
                // Fallback: update only the required content field
                const { error: fallbackError } = await supabase
                    .from('user_notes')
                    .update({ content: note.content })
                    .eq('id', existing.id);
                if (fallbackError) throw new Error(fallbackError.message);
            }
        } else {
            // Compute verse_id in the format used by the DB: "BOOKID.CHAPTER.VERSE"
            const verse_id = `${note.bookId.toUpperCase()}.${note.chapter}.${note.verse}`;

            // Insert new note — try with all fields first
            const { error: insertError } = await supabase
                .from('user_notes')
                .insert({
                    user_id: userId,
                    book_id: note.bookId,
                    chapter: note.chapter,
                    verse: note.verse,
                    verse_id,
                    content: note.content,
                    book_name: note.bookName,
                    version: note.version,
                    verse_text: note.verseText,
                });

            if (insertError) {
                // Fallback: insert only the core required fields
                const { error: fallbackError } = await supabase
                    .from('user_notes')
                    .insert({
                        user_id: userId,
                        book_id: note.bookId,
                        chapter: note.chapter,
                        verse: note.verse,
                        verse_id,
                        content: note.content,
                    });
                if (fallbackError) throw new Error(fallbackError.message);
            }
        }
        return;
    }
    const notes = readLocalNotes();
    const idx = notes.findIndex(
        n => n.bookId === note.bookId && n.chapter === note.chapter && n.verse === note.verse
    );
    const now = new Date().toISOString();
    if (idx >= 0) {
        notes[idx] = { ...notes[idx], ...note, updatedAt: now };
    } else {
        notes.push({ ...note, id: crypto.randomUUID(), createdAt: now, updatedAt: now });
    }
    writeLocalNotes(notes);
}

export async function deleteNote(
    userId: string | null,
    bookId: string,
    chapter: number,
    verse: number
): Promise<void> {
    if (userId) {
        await supabase.from('user_notes')
            .delete()
            .eq('user_id', userId)
            .eq('book_id', bookId)
            .eq('chapter', chapter)
            .eq('verse', verse);
        return;
    }
    const notes = readLocalNotes().filter(
        n => !(n.bookId === bookId && n.chapter === chapter && n.verse === verse)
    );
    writeLocalNotes(notes);
}

// ── MIGRATION ─────────────────────────────────────────────────────────────────

export async function migrateLocalToSupabase(userId: string): Promise<void> {
    // Migrate highlights
    const highlights = readLocalHighlights();
    const hlRows = Object.entries(highlights).map(([key, color]) => {
        const [bookId, chapter, verse] = key.split('.');
        return { user_id: userId, book_id: bookId, chapter: parseInt(chapter), verse: parseInt(verse), color };
    });
    if (hlRows.length > 0) {
        await supabase.from('user_highlights').upsert(hlRows, { onConflict: 'user_id,book_id,chapter,verse' });
        localStorage.removeItem(HL_KEY);
    }

    // Migrate notes
    const notes = readLocalNotes();
    if (notes.length > 0) {
        const noteRows = notes.map(n => ({
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
        await supabase.from('user_notes').upsert(noteRows, { onConflict: 'user_id,book_id,chapter,verse' });
        localStorage.removeItem(NT_KEY);
    }
}

// ── EXPORT ────────────────────────────────────────────────────────────────────

export function exportNotesToTXT(notes: VerseNote[]): void {
    const lines = notes.map(n =>
        `${n.bookName} ${n.chapter}:${n.verse}\n"${n.verseText}"\n\n${n.content}\n\n---\n`
    );
    const blob = new Blob([`BÍBLIA VIVE — MINHAS NOTAS\n${'='.repeat(40)}\n\n`, ...lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'minhas-notas-biblia-vive.txt';
    a.click();
    URL.revokeObjectURL(url);
}

export async function exportNotesToPDF(notes: VerseNote[], isSingleChapter = false): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Helper: centered text
    const centerText = (text: string, currentY: number) => {
        const textWidth = doc.getTextWidth(text);
        doc.text(text, (pageWidth - textWidth) / 2, currentY);
    };

    // --- COVER / HEADER ---
    doc.setFillColor(252, 251, 248); // off-white
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setTextColor(40, 40, 40);
    doc.setFont('times', 'normal');

    y = 40;
    doc.setFontSize(16);
    centerText('BÍBLIA VIVE', y);
    y += 15;

    doc.setFont('times', 'italic');
    doc.setFontSize(28);
    doc.setTextColor(190, 160, 100); // gold-ish
    if (isSingleChapter && notes.length > 0) {
        centerText(`Anotações: ${notes[0].bookName} ${notes[0].chapter}`, y);
    } else {
        centerText('Minhas Anotações', y);
    }

    y += 20;
    doc.setDrawColor(210, 190, 140);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 20, y, pageWidth / 2 + 20, y);
    y += 15;

    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const dateStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    centerText(`Gerado em ${dateStr}`, y);

    y += 30;

    // --- BODY ---
    for (const note of notes) {
        if (y > pageHeight - 40) {
            doc.addPage();
            doc.setFillColor(252, 251, 248);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');
            y = margin + 10;
        }

        doc.setFont('times', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(50, 50, 50);
        doc.text(`${note.bookName} ${note.chapter}:${note.verse}`, margin, y);
        y += 6;

        if (note.verseText) {
            doc.setFont('times', 'italic');
            doc.setFontSize(11);
            doc.setTextColor(120, 120, 120);
            const wrappedVerse = doc.splitTextToSize(`"${note.verseText}"`, contentWidth - 10);

            // Draw a subtle left border for the verse quote
            doc.setDrawColor(220, 210, 190);
            doc.setLineWidth(1);
            doc.line(margin, y - 4, margin, y + (wrappedVerse.length * 5) - 2);

            doc.text(wrappedVerse, margin + 4, y);
            y += wrappedVerse.length * 6 + 4;
        } else {
            y += 2;
        }

        doc.setFont('times', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        const noteLines = doc.splitTextToSize(note.content, contentWidth);

        if (y + noteLines.length * 6 > pageHeight - margin) {
            doc.addPage();
            doc.setFillColor(252, 251, 248);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');
            y = margin + 10;
        }

        doc.text(noteLines, margin, y);
        y += noteLines.length * 6 + 12;

        // Subtle separator
        doc.setDrawColor(240, 235, 225);
        doc.setLineWidth(0.5);
        doc.line(margin + 20, y, pageWidth - margin - 20, y);
        y += 10;
    }

    const filename = isSingleChapter && notes.length > 0
        ? `Anotacoes_${notes[0].bookName}_${notes[0].chapter}.pdf`
        : 'Minhas_Anotacoes_Biblia_Viva.pdf';

    doc.save(filename.replace(/\s+/g, '_'));
}

// ── DB Row mapper ─────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): VerseNote {
    return {
        id: row.id,
        bookId: row.book_id,
        bookName: row.book_name ?? row.book_id,
        chapter: row.chapter,
        verse: row.verse,
        content: row.content,
        version: row.version ?? '',
        verseText: row.verse_text ?? '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
