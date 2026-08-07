// ─────────────────────────────────────────────────────────────────────────────
// noteStore.ts — Bíblia Vive
//
// NoteStore / MemorialStore interface + dual-mode adapters (ADR-0005, ADR-0008).
// SupabaseNoteStore: persiste no banco para Leitores autenticados.
// LocalNoteStore: persiste em localStorage para Visitantes.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "./supabase";

export type MemorialCategory = 'reflection' | 'prayer' | 'testimony' | 'fasting';

export interface MemorialMetadata {
    // Reflexão (SOAP)
    soap?: {
        scripture?: string;
        observation?: string;
        application?: string;
        prayer?: string;
    };
    // Oração
    motivo?: string;
    pedido?: string;
    entrega?: string;
    // Testemunho
    oQueAconteceu?: string;
    comoDeusSustentou?: string;
    dataFato?: string;
    // Jejum / Propósito
    objetivo?: string;
    dataInicio?: string;
    dataPrevista?: string;
    acompanhamentos?: string[];
    // Extensível para anexos futuros (fotos, áudios, etc)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export interface MemorialEntry {
    id: string;
    type: MemorialCategory;
    title?: string;
    content: string;
    bookId: string;
    bookName: string;
    chapter: number;
    verse?: number | null;
    version: string;
    verseText?: string;
    status?: string;
    favorite?: boolean;
    answeredAt?: string | null;
    answeredNote?: string | null;
    lastEchoAt?: string | null;
    tags?: string[];
    metadata?: MemorialMetadata;
    createdAt: string;
    updatedAt: string;
}

// Retrocompatibilidade para chamadores legados
export type VerseNote = MemorialEntry;

export interface NoteFilterOptions {
    type?: MemorialCategory | 'all';
    search?: string;
    favoriteOnly?: boolean;
    answeredOnly?: boolean;
}

export interface NoteStore {
    getByChapter(bookId: string, chapter: number): Promise<MemorialEntry[]>;
    getAll(filters?: NoteFilterOptions): Promise<MemorialEntry[]>;
    save(entry: Omit<MemorialEntry, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<void>;
    delete(idOrBookId: string, chapter?: number, verse?: number): Promise<void>;
    toggleFavorite?(id: string): Promise<boolean>;
    markAnswered?(id: string, answeredNote?: string): Promise<void>;
    getMatchingEcho?(bookId?: string, chapter?: number): Promise<MemorialEntry | null>;
    addEcoUpdate?(id: string, text: string): Promise<void>;
}

// ─── Row mapper ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): MemorialEntry {
    return {
        id: row.id,
        type: (row.type as MemorialCategory) || 'reflection',
        title: row.title ?? '',
        content: row.content ?? '',
        bookId: row.book_id ?? row.bookId,
        bookName: row.book_name ?? row.bookName ?? row.book_id ?? row.bookId,
        chapter: Number(row.chapter),
        verse: row.verse !== undefined && row.verse !== null ? Number(row.verse) : null,
        version: row.version ?? '',
        verseText: row.verse_text ?? row.verseText ?? '',
        status: row.status ?? '',
        favorite: Boolean(row.favorite),
        answeredAt: row.answered_at ?? row.answeredAt ?? null,
        answeredNote: row.answered_note ?? row.answeredNote ?? null,
        lastEchoAt: row.last_echo_at ?? row.lastEchoAt ?? null,
        tags: Array.isArray(row.tags) ? row.tags : [],
        metadata: row.metadata ?? {},
        createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
        updatedAt: row.updated_at ?? row.updatedAt ?? new Date().toISOString(),
    };
}

// ─── SupabaseNoteStore ────────────────────────────────────────────────────────

export class SupabaseNoteStore implements NoteStore {
    constructor(private readonly userId: string) { }

    async getByChapter(bookId: string, chapter: number): Promise<MemorialEntry[]> {
        const { data } = await supabase
            .from("user_notes")
            .select("*")
            .eq("user_id", this.userId)
            .eq("book_id", bookId)
            .eq("chapter", chapter)
            .order("created_at", { ascending: true });
        return (data ?? []).map(mapRow);
    }

    async getAll(filters?: NoteFilterOptions): Promise<MemorialEntry[]> {
        let query = supabase
            .from("user_notes")
            .select("*")
            .eq("user_id", this.userId);

        if (filters?.type && filters.type !== 'all') {
            query = query.eq("type", filters.type);
        }

        if (filters?.favoriteOnly) {
            query = query.eq("favorite", true);
        }

        if (filters?.answeredOnly) {
            query = query.not("answered_at", "is", null);
        }

        query = query.order("updated_at", { ascending: false });

        const { data } = await query;
        let results = (data ?? []).map(mapRow);

        if (filters?.search && filters.search.trim()) {
            const term = filters.search.trim().toLowerCase();
            results = results.filter(entry =>
                (entry.title && entry.title.toLowerCase().includes(term)) ||
                (entry.content && entry.content.toLowerCase().includes(term)) ||
                (entry.bookName && entry.bookName.toLowerCase().includes(term)) ||
                (entry.tags && entry.tags.some(t => t.toLowerCase().includes(term)))
            );
        }

        return results;
    }

    async save(entry: Omit<MemorialEntry, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<void> {
        const payload = {
            user_id: this.userId,
            type: entry.type || 'reflection',
            title: entry.title || null,
            content: entry.content || '',
            book_id: entry.bookId,
            book_name: entry.bookName || entry.bookId,
            chapter: entry.chapter,
            verse: entry.verse ?? null,
            version: entry.version || '',
            verse_text: entry.verseText || '',
            status: entry.status || null,
            favorite: entry.favorite ?? false,
            answered_at: entry.answeredAt ?? null,
            answered_note: entry.answeredNote ?? null,
            tags: entry.tags || [],
            metadata: entry.metadata || {},
        };

        if (entry.id) {
            const { error } = await supabase
                .from("user_notes")
                .update(payload)
                .eq("id", entry.id)
                .eq("user_id", this.userId);
            if (error) throw new Error(error.message);
            return;
        }

        // Se for um versículo específico sem ID prévio, verificar se já existe registro legado por versículo
        if (entry.verse !== undefined && entry.verse !== null) {
            const { data: existing } = await supabase
                .from("user_notes")
                .select("id")
                .eq("user_id", this.userId)
                .eq("book_id", entry.bookId)
                .eq("chapter", entry.chapter)
                .eq("verse", entry.verse)
                .maybeSingle();

            if (existing) {
                const { error } = await supabase
                    .from("user_notes")
                    .update(payload)
                    .eq("id", existing.id);
                if (error) throw new Error(error.message);
                return;
            }
        }

        const verse_id = entry.verse !== null && entry.verse !== undefined
            ? `${entry.bookId.toUpperCase()}.${entry.chapter}.${entry.verse}`
            : `${entry.bookId.toUpperCase()}.${entry.chapter}`;

        const { error } = await supabase.from("user_notes").insert({
            ...payload,
            verse_id,
        });

        if (error) throw new Error(error.message);
    }

    async delete(idOrBookId: string, chapter?: number, verse?: number): Promise<void> {
        if (chapter !== undefined && verse !== undefined) {
            await supabase.from("user_notes").delete()
                .eq("user_id", this.userId)
                .eq("book_id", idOrBookId)
                .eq("chapter", chapter)
                .eq("verse", verse);
        } else {
            await supabase.from("user_notes").delete()
                .eq("id", idOrBookId)
                .eq("user_id", this.userId);
        }
    }

    async toggleFavorite(id: string): Promise<boolean> {
        const { data: existing } = await supabase
            .from("user_notes")
            .select("favorite")
            .eq("id", id)
            .eq("user_id", this.userId)
            .maybeSingle();

        const newFav = !existing?.favorite;

        const { error } = await supabase
            .from("user_notes")
            .update({ favorite: newFav })
            .eq("id", id)
            .eq("user_id", this.userId);

        if (error) throw new Error(error.message);
        return newFav;
    }

    async markAnswered(id: string, answeredNote?: string): Promise<void> {
        const { error } = await supabase
            .from("user_notes")
            .update({
                status: 'answered',
                answered_at: new Date().toISOString(),
                answered_note: answeredNote || null,
            })
            .eq("id", id)
            .eq("user_id", this.userId);

        if (error) throw new Error(error.message);
    }

    async getMatchingEcho(bookId?: string, chapter?: number): Promise<MemorialEntry | null> {
        const all = await this.getAll();
        return selectBestEcho(all, bookId, chapter);
    }

    async addEcoUpdate(id: string, text: string): Promise<void> {
        const { data: existing } = await supabase
            .from("user_notes")
            .select("metadata")
            .eq("id", id)
            .eq("user_id", this.userId)
            .maybeSingle();

        const currentMetadata = existing?.metadata || {};
        const currentUpdates = Array.isArray(currentMetadata.eco_updates) ? currentMetadata.eco_updates : [];
        const newUpdate = { text, date: new Date().toISOString() };
        const updatedMetadata = {
            ...currentMetadata,
            eco_updates: [...currentUpdates, newUpdate],
        };

        const { error } = await supabase
            .from("user_notes")
            .update({
                metadata: updatedMetadata,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("user_id", this.userId);

        if (error) throw new Error(error.message);
    }
}

// ─── Utility: Motor de Seleção do Eco ─────────────────────────────────────────

const CATEGORY_PRIORITY: Record<MemorialCategory, number> = {
    prayer: 1,      // Orações (especialmente em acompanhamento/não respondidas)
    testimony: 2,   // Testemunhos
    reflection: 3,  // Reflexões
    fasting: 4,     // Propósito / Jejum
};

export function selectBestEcho(
    entries: MemorialEntry[],
    currentBookId?: string,
    currentChapter?: number
): MemorialEntry | null {
    if (!entries || entries.length === 0) return null;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Filtrar trava de 7 dias anti-repetição
    const eligible = entries.filter((e) => {
        if (!e.lastEchoAt) return true;
        return new Date(e.lastEchoAt) < sevenDaysAgo;
    });

    if (eligible.length === 0) return null;

    const rankEntry = (a: MemorialEntry, b: MemorialEntry): number => {
        // Priorizar Orações em acompanhamento (status != 'answered')
        const aIsUnansweredPrayer = a.type === 'prayer' && a.status !== 'answered';
        const bIsUnansweredPrayer = b.type === 'prayer' && b.status !== 'answered';
        if (aIsUnansweredPrayer && !bIsUnansweredPrayer) return -1;
        if (!aIsUnansweredPrayer && bIsUnansweredPrayer) return 1;

        // Desempate por tipo
        const prioA = CATEGORY_PRIORITY[a.type] ?? 99;
        const prioB = CATEGORY_PRIORITY[b.type] ?? 99;
        if (prioA !== prioB) return prioA - prioB;

        // Distância temporal (mais antigos primeiro)
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    };

    // 1. Prioridade Máxima: Contexto de Leitura Atual
    if (currentBookId && currentChapter) {
        const chapterEntries = eligible.filter(
            (e) => e.bookId.toLowerCase() === currentBookId.toLowerCase() && Number(e.chapter) === Number(currentChapter)
        );
        if (chapterEntries.length > 0) {
            chapterEntries.sort(rankEntry);
            return chapterEntries[0];
        }
    }

    // 2. Marcos Temporais (1 sem, 1 mês, 3 meses, 6 meses, 1 ano)
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const TIME_WINDOWS = [
        { name: '1w', target: 7 * DAY, tolerance: 3 * DAY },
        { name: '1m', target: 30 * DAY, tolerance: 7 * DAY },
        { name: '3m', target: 90 * DAY, tolerance: 15 * DAY },
        { name: '6m', target: 180 * DAY, tolerance: 20 * DAY },
        { name: '1y', target: 365 * DAY, tolerance: 30 * DAY },
    ];

    for (const window of TIME_WINDOWS) {
        const matchingWindow = eligible.filter((e) => {
            const age = now - new Date(e.createdAt).getTime();
            return Math.abs(age - window.target) <= window.tolerance;
        });

        if (matchingWindow.length > 0) {
            matchingWindow.sort(rankEntry);
            return matchingWindow[0];
        }
    }

    // 3. Fallback Geral: qualquer registro antigo elegível ordenado por relevância
    const sorted = [...eligible].sort(rankEntry);
    return sorted[0] ?? null;
}

// ─── LocalNoteStore ───────────────────────────────────────────────────────────

const NT_KEY = "bv_notes";

function readLocal(): MemorialEntry[] {
    try {
        const raw = JSON.parse(localStorage.getItem(NT_KEY) || "[]");
        return (raw ?? []).map(mapRow);
    } catch {
        return [];
    }
}

function writeLocal(notes: MemorialEntry[]) {
    localStorage.setItem(NT_KEY, JSON.stringify(notes));
}

export class LocalNoteStore implements NoteStore {
    async getByChapter(bookId: string, chapter: number): Promise<MemorialEntry[]> {
        return readLocal().filter(n => n.bookId === bookId && n.chapter === chapter);
    }

    async getAll(filters?: NoteFilterOptions): Promise<MemorialEntry[]> {
        let list = readLocal();

        if (filters?.type && filters.type !== 'all') {
            list = list.filter(n => n.type === filters.type);
        }

        if (filters?.favoriteOnly) {
            list = list.filter(n => n.favorite);
        }

        if (filters?.answeredOnly) {
            list = list.filter(n => Boolean(n.answeredAt));
        }

        if (filters?.search && filters.search.trim()) {
            const term = filters.search.trim().toLowerCase();
            list = list.filter(entry =>
                (entry.title && entry.title.toLowerCase().includes(term)) ||
                (entry.content && entry.content.toLowerCase().includes(term)) ||
                (entry.bookName && entry.bookName.toLowerCase().includes(term)) ||
                (entry.tags && entry.tags.some(t => t.toLowerCase().includes(term)))
            );
        }

        return [...list].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    }

    async save(entry: Omit<MemorialEntry, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<void> {
        const notes = readLocal();
        const now = new Date().toISOString();

        if (entry.id) {
            const idx = notes.findIndex(n => n.id === entry.id);
            if (idx >= 0) {
                notes[idx] = {
                    ...notes[idx],
                    ...entry,
                    type: entry.type || notes[idx].type || 'reflection',
                    updatedAt: now,
                };
                writeLocal(notes);
                return;
            }
        }

        // Se tiver versículo e não tiver ID, tentar atualizar registro prévio no mesmo versículo
        if (entry.verse !== undefined && entry.verse !== null && !entry.id) {
            const idx = notes.findIndex(n => n.bookId === entry.bookId && n.chapter === entry.chapter && n.verse === entry.verse);
            if (idx >= 0) {
                notes[idx] = {
                    ...notes[idx],
                    ...entry,
                    type: entry.type || notes[idx].type || 'reflection',
                    updatedAt: now,
                };
                writeLocal(notes);
                return;
            }
        }

        // Criar novo registro
        const newEntry: MemorialEntry = {
            id: entry.id || crypto.randomUUID(),
            type: entry.type || 'reflection',
            title: entry.title || '',
            content: entry.content || '',
            bookId: entry.bookId,
            bookName: entry.bookName || entry.bookId,
            chapter: entry.chapter,
            verse: entry.verse ?? null,
            version: entry.version || '',
            verseText: entry.verseText || '',
            status: entry.status || '',
            favorite: entry.favorite ?? false,
            answeredAt: entry.answeredAt ?? null,
            answeredNote: entry.answeredNote ?? null,
            tags: entry.tags || [],
            metadata: entry.metadata || {},
            createdAt: now,
            updatedAt: now,
        };

        notes.push(newEntry);
        writeLocal(notes);
    }

    async delete(idOrBookId: string, chapter?: number, verse?: number): Promise<void> {
        const notes = readLocal();
        if (chapter !== undefined && verse !== undefined) {
            writeLocal(notes.filter(n => !(n.bookId === idOrBookId && n.chapter === chapter && n.verse === verse)));
        } else {
            writeLocal(notes.filter(n => n.id !== idOrBookId));
        }
    }

    async toggleFavorite(id: string): Promise<boolean> {
        const notes = readLocal();
        const idx = notes.findIndex(n => n.id === id);
        if (idx < 0) return false;
        notes[idx].favorite = !notes[idx].favorite;
        notes[idx].updatedAt = new Date().toISOString();
        writeLocal(notes);
        return notes[idx].favorite;
    }

    async markAnswered(id: string, answeredNote?: string): Promise<void> {
        const notes = readLocal();
        const idx = notes.findIndex(n => n.id === id);
        if (idx < 0) return;
        notes[idx].status = 'answered';
        notes[idx].answeredAt = new Date().toISOString();
        notes[idx].answeredNote = answeredNote || null;
        notes[idx].updatedAt = new Date().toISOString();
        writeLocal(notes);
    }

    async getMatchingEcho(bookId?: string, chapter?: number): Promise<MemorialEntry | null> {
        const all = await this.getAll();
        return selectBestEcho(all, bookId, chapter);
    }

    async addEcoUpdate(id: string, text: string): Promise<void> {
        const notes = readLocal();
        const idx = notes.findIndex(n => n.id === id);
        if (idx < 0) return;
        const currentMetadata = notes[idx].metadata || {};
        const currentUpdates = Array.isArray(currentMetadata.eco_updates) ? currentMetadata.eco_updates : [];
        const newUpdate = { text, date: new Date().toISOString() };
        notes[idx].metadata = {
            ...currentMetadata,
            eco_updates: [...currentUpdates, newUpdate],
        };
        notes[idx].updatedAt = new Date().toISOString();
        writeLocal(notes);
    }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createNoteStore(userId: string | null): NoteStore {
    return userId ? new SupabaseNoteStore(userId) : new LocalNoteStore();
}
