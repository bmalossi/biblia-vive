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
    getMatchingEcho?(bookId?: string, chapter?: number): Promise<EchoResult | null>;
    markEchoed?(id: string): Promise<void>;
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

    async getMatchingEcho(bookId?: string, chapter?: number): Promise<EchoResult | null> {
        const all = await this.getAll();
        return selectBestEchoWithContext(all, bookId, chapter);
    }

    async markEchoed(id: string): Promise<void> {
        const now = new Date().toISOString();
        // Grava lastEchoAt diretamente na coluna metadata para não alterar updated_at
        // (não queremos que o "reencontro" mude a ordem de exibição na lista de memoriais)
        const { data: existing } = await supabase
            .from("user_notes")
            .select("metadata")
            .eq("id", id)
            .eq("user_id", this.userId)
            .maybeSingle();
        const currentMetadata = existing?.metadata || {};
        const { error } = await supabase
            .from("user_notes")
            .update({ metadata: { ...currentMetadata, last_echoed_at: now } })
            .eq("id", id)
            .eq("user_id", this.userId);
        if (error) console.warn("[Eco] markEchoed failed:", error.message);
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
//
// Hierarquia rígida de seleção (prioridade decrescente):
//   1. Vínculo Direto      — registro nascido neste exato livro+capítulo
//   2. Vínculo Histórico   — aniversário (6 meses ou 1 ano) de qualquer registro
//   3. Silêncio (default)  — não exibe nada, EXCETO sorteio de 20% para órfãos
//
// Cool-down: um registro apresentado no Eco não pode ser selecionado novamente
// pelos próximos 10 dias (controlado por `lastEchoAt` na entrada).
//
// Testemunhos sem referência direta ao capítulo atual NUNCA aparecem como
// "nascidos neste capítulo". A sinalização de contexto é responsabilidade do
// componente EchoBanner via prop `echoContext`.
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_PRIORITY: Record<MemorialCategory, number> = {
    prayer: 1,      // Orações em andamento têm máxima prioridade
    testimony: 2,
    reflection: 3,
    fasting: 4,
};

export type EchoContext = 'direct' | 'anniversary' | 'orphan';

export interface EchoResult {
    entry: MemorialEntry;
    context: EchoContext;
}

/** Cool-down: 10 dias em ms */
const COOLDOWN_MS = 10 * 24 * 60 * 60 * 1000;

function isOnCooldown(e: MemorialEntry): boolean {
    if (!e.lastEchoAt) return false;
    return Date.now() - new Date(e.lastEchoAt).getTime() < COOLDOWN_MS;
}

function rankEntry(a: MemorialEntry, b: MemorialEntry): number {
    // Orações não-respondidas têm topo absoluto
    const aUp = a.type === 'prayer' && a.status !== 'answered';
    const bUp = b.type === 'prayer' && b.status !== 'answered';
    if (aUp && !bUp) return -1;
    if (!aUp && bUp) return 1;
    // Desempate por categoria
    const pa = CATEGORY_PRIORITY[a.type] ?? 99;
    const pb = CATEGORY_PRIORITY[b.type] ?? 99;
    if (pa !== pb) return pa - pb;
    // Mais antigos primeiro (maior distância temporal = mais relevante para reencontro)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

export function selectBestEcho(
    entries: MemorialEntry[],
    currentBookId?: string,
    currentChapter?: number
): MemorialEntry | null {
    return selectBestEchoWithContext(entries, currentBookId, currentChapter)?.entry ?? null;
}

export function selectBestEchoWithContext(
    entries: MemorialEntry[],
    currentBookId?: string,
    currentChapter?: number
): EchoResult | null {
    if (!entries || entries.length === 0) return null;

    // Pool elegível: excluir entradas em cool-down
    const eligible = entries.filter(e => !isOnCooldown(e));
    if (eligible.length === 0) return null;

    // Índice de rotação diária — muda a cada meia-noite UTC, garantindo
    // que cada dia exiba um registro diferente do pool disponível.
    const DAY = 24 * 60 * 60 * 1000;
    const dayIndex = Math.floor(Date.now() / DAY);

    /** Seleciona um item do array usando rotação diária, priorizando orações. */
    function pickByDay<T extends MemorialEntry>(pool: T[]): T {
        if (pool.length === 1) return pool[0];
        // Orações em andamento têm slot prioritário no início do ciclo
        const prayers = pool.filter(e => e.type === 'prayer' && e.status !== 'answered');
        const others  = pool.filter(e => !(e.type === 'prayer' && e.status !== 'answered'));
        // Ordenamos cada sub-grupo de forma estável (por data de criação)
        prayers.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        others.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const ordered = [...prayers, ...others];
        return ordered[dayIndex % ordered.length];
    }

    // ── Prioridade 1: Vínculo Direto ─────────────────────────────────────────
    if (currentBookId && currentChapter !== undefined) {
        const direct = eligible.filter(
            e =>
                e.bookId.toLowerCase() === currentBookId.toLowerCase() &&
                Number(e.chapter) === Number(currentChapter)
        );
        if (direct.length > 0) {
            return { entry: pickByDay(direct), context: 'direct' };
        }
    }

    // ── Prioridade 2: Aniversário Histórico ───────────────────────────────────
    const now = Date.now();
    const ANNIVERSARY_WINDOWS = [
        { label: '1y', target: 365 * DAY, tolerance: 7 * DAY },
        { label: '6m', target: 180 * DAY, tolerance: 5 * DAY },
    ];

    for (const win of ANNIVERSARY_WINDOWS) {
        const matches = eligible.filter(e => {
            const age = now - new Date(e.createdAt).getTime();
            return Math.abs(age - win.target) <= win.tolerance;
        });
        if (matches.length > 0) {
            return { entry: pickByDay(matches), context: 'anniversary' };
        }
    }

    // ── Prioridade 3: Silêncio (default) ─────────────────────────────────────
    // Sorteio de 20% para registros órfãos (exceto testemunhos).
    // O sorteio usa o índice de dia para ser determinístico e não flicker
    // entre renders — mas muda a cada 5 dias para variar a frequência.
    const orphanPool = eligible.filter(e => e.type !== 'testimony');
    if (orphanPool.length === 0) return null;
    // A cada ciclo de 5 dias, 1 deles exibe o eco (20%). Usamos modulo determinístico.
    if ((dayIndex % 5) !== 0) return null;

    return { entry: pickByDay(orphanPool), context: 'orphan' };
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

    async getMatchingEcho(bookId?: string, chapter?: number): Promise<EchoResult | null> {
        const all = await this.getAll();
        return selectBestEchoWithContext(all, bookId, chapter);
    }

    async markEchoed(id: string): Promise<void> {
        const notes = readLocal();
        const idx = notes.findIndex(n => n.id === id);
        if (idx < 0) return;
        // Grava apenas lastEchoAt — não altera updatedAt para não perturbar ordenação
        notes[idx].lastEchoAt = new Date().toISOString();
        writeLocal(notes);
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
