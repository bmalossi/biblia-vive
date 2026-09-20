// ─────────────────────────────────────────────────────────────────────────────
// scriptureThread.ts — Bíblia Vive
//
// Módulo de cliente do Fio da Escritura (ScriptureThread).
// Implementa:
//   - Seleção Híbrida Tripla de Registros do Memorial (15 recentes + 10 favoritas + 5 afinidade)
//   - Cache Reativo por Versão do Memorial (localStorage event-driven)
//   - Invalidação de versão disparada por mutações
//   - Heurística de eleição da Nota Candidata
// ─────────────────────────────────────────────────────────────────────────────

import type { MemorialEntry } from "@/lib/noteStore";
import { findBookGlobally, getTestament } from "@/lib/books";

export type ScriptureThreadCategory =
  | "Cumprimento_Profetico"
  | "Eco_de_Linguagem"
  | "Contraste_de_Alianca"
  | "Resposta_de_Oracao";

export interface ScriptureThreadResult {
  category: ScriptureThreadCategory;
  confidence: number;
  relevanceScore: number;
  matchedNoteId?: string;
  matchedNoteExcerpt?: string;
  evaluatedAt: string;
  notesVersion: string;
}

export const STORAGE_KEY_NOTES_VERSION = "bv_notes_version";
export const EVENT_NOTES_VERSION_UPDATED = "bv-notes-version-updated";

let versionCounter = 0;

/**
 * Obtém a versão atual do acervo de notas gravada no navegador.
 * Se ainda não existir, inicializa com o timestamp atual.
 */
export function getNotesVersion(): string {
  if (typeof window === "undefined" || !window.localStorage) {
    return "0";
  }
  let v = window.localStorage.getItem(STORAGE_KEY_NOTES_VERSION);
  if (!v) {
    v = `${Date.now()}-${++versionCounter}`;
    window.localStorage.setItem(STORAGE_KEY_NOTES_VERSION, v);
  }
  return v;
}

/**
 * Incrementa a versão local do acervo de notas e emite evento reativo.
 * Invalida imediatamente o cache de todos os capítulos no navegador.
 */
export function bumpNotesVersion(): string {
  if (typeof window === "undefined" || !window.localStorage) {
    return "0";
  }
  const next = `${Date.now()}-${++versionCounter}`;
  window.localStorage.setItem(STORAGE_KEY_NOTES_VERSION, next);
  window.dispatchEvent(new CustomEvent(EVENT_NOTES_VERSION_UPDATED, { detail: { version: next } }));
  return next;
}

/**
 * Chave padronizada de cache do Fio da Escritura por capítulo e usuário.
 */
function getThreadCacheKey(bookId: string, chapter: number, userId: string | null): string {
  const cleanBook = (bookId || "unknown").toLowerCase();
  const cleanUser = userId || "local";
  return `st:${cleanBook}:${chapter}:${cleanUser}`;
}

/**
 * Recupera o resultado em cache caso exista E a versão das notas não tenha mudado.
 */
export function getCachedThreadResult(
  bookId: string,
  chapter: number,
  userId: string | null
): ScriptureThreadResult | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  const key = getThreadCacheKey(bookId, chapter, userId);
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { result: ScriptureThreadResult; notesVersion: string };
    const currentVersion = getNotesVersion();

    // Invalidação por versão: se o usuário adicionou/editou nota, o cache é descartado
    if (!parsed?.notesVersion || parsed.notesVersion !== currentVersion) {
      window.localStorage.removeItem(key);
      return null;
    }

    return parsed.result;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

/**
 * Salva o resultado do JEV no cache associado à versão atual do acervo.
 */
export function setCachedThreadResult(
  bookId: string,
  chapter: number,
  userId: string | null,
  result: ScriptureThreadResult
): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  const key = getThreadCacheKey(bookId, chapter, userId);
  const notesVersion = getNotesVersion();

  const payload = {
    result: { ...result, notesVersion },
    notesVersion,
    savedAt: Date.now(),
  };

  try {
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    console.warn("[scriptureThread] Falha ao gravar cache no localStorage:", err);
  }
}

/**
 * Seleção Híbrida Tripla:
 * Extrai até `maxNotes` registros do Memorial balanceando:
 *  1. 15 notas mais recentes (updatedAt DESC)
 *  2. 10 notas favoritas (favorite === true)
 *  3. 5 notas com afinidade canônica (mesmo livro primeiro, depois mesmo testamento)
 * Mescla e deduplica de forma determinística por ID.
 */
export function buildHybridNotePool(
  notes: MemorialEntry[],
  currentBookId: string,
  maxNotes = 30
): MemorialEntry[] {
  if (!notes || notes.length === 0) return [];
  if (notes.length <= maxNotes) {
    // Se o usuário tem menos notas que o limite, basta ordenar por data
    const map = new Map<string, MemorialEntry>();
    for (const n of notes) {
      if (!map.has(n.id)) map.set(n.id, n);
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  const currentBook = findBookGlobally(currentBookId);
  const currentTestament = getTestament(currentBook);
  const cleanCurrentBookId = currentBook?.id?.toLowerCase() || currentBookId.toLowerCase();

  // Ordenação base decrescente por updatedAt
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // 1. 15 mais recentes
  const recentSlice = sortedNotes.slice(0, 15);

  // 2. 10 favoritas
  const favoriteSlice = sortedNotes.filter((n) => Boolean(n.favorite)).slice(0, 10);

  // 3. 5 com afinidade bíblica (mesmo livro primeiro, depois mesmo testamento)
  const sameBookNotes: MemorialEntry[] = [];
  const sameTestamentNotes: MemorialEntry[] = [];

  for (const n of sortedNotes) {
    const noteBook = findBookGlobally(n.bookId);
    const isSameBook =
      n.bookId.toLowerCase() === cleanCurrentBookId ||
      (noteBook && currentBook && noteBook.id === currentBook.id);

    if (isSameBook) {
      sameBookNotes.push(n);
    } else if (noteBook && getTestament(noteBook) === currentTestament) {
      sameTestamentNotes.push(n);
    }
  }

  const affinitySlice = [...sameBookNotes, ...sameTestamentNotes].slice(0, 5);

  // Mesclagem com deduplicação preservando prioridade
  const selectedMap = new Map<string, MemorialEntry>();

  const addEntries = (entries: MemorialEntry[]) => {
    for (const e of entries) {
      if (selectedMap.size >= maxNotes) break;
      if (!selectedMap.has(e.id)) {
        selectedMap.set(e.id, e);
      }
    }
  };

  addEntries(recentSlice);
  addEntries(favoriteSlice);
  addEntries(affinitySlice);

  // Se ainda houver vagas, completa a partir da lista geral ordenada
  if (selectedMap.size < maxNotes) {
    addEntries(sortedNotes);
  }

  return Array.from(selectedMap.values());
}

/**
 * Heurística local pós-JEV para eleger a Nota Candidata a ser apresentada no modal:
 *  1ª prioridade: nota do mesmo livro bíblico do capítulo lido.
 *  2ª prioridade: nota do mesmo testamento bíblico (AT ou NT).
 *  3ª prioridade: nota mais recente do leitor.
 */
export function rankCandidateNote(
  notes: MemorialEntry[],
  currentBookId: string
): MemorialEntry | null {
  if (!notes || notes.length === 0) return null;

  const currentBook = findBookGlobally(currentBookId);
  const currentTestament = getTestament(currentBook);
  const cleanCurrentBookId = currentBook?.id?.toLowerCase() || currentBookId.toLowerCase();

  // 1. Mesmo livro
  const sameBook = notes
    .filter((n) => {
      const noteBook = findBookGlobally(n.bookId);
      return (
        n.bookId.toLowerCase() === cleanCurrentBookId ||
        (noteBook && currentBook && noteBook.id === currentBook.id)
      );
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  if (sameBook.length > 0) return sameBook[0];

  // 2. Mesmo testamento
  const sameTestament = notes
    .filter((n) => {
      const noteBook = findBookGlobally(n.bookId);
      return noteBook && getTestament(noteBook) === currentTestament;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  if (sameTestament.length > 0) return sameTestament[0];

  // 3. Mais recente geral
  const mostRecent = [...notes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  return mostRecent[0] || null;
}

/**
 * Avalia de forma assíncrona se existe um Fio da Escritura para o capítulo atual.
 * Consulta primeiro o cache reativo; se miss, orquestra a Seleção Híbrida e
 * aciona a Vercel Function /api/scripture-thread com fallback seguro.
 */
export async function evaluateScriptureThread(params: {
  chapterText: string;
  chapterRef: string;
  bookId: string;
  chapter: number;
  allNotes: MemorialEntry[];
  userId: string | null;
  userToken?: string | null;
}): Promise<{
  result: ScriptureThreadResult | null;
  candidateNote: MemorialEntry | null;
}> {
  const { chapterText, chapterRef, bookId, chapter, allNotes, userId, userToken } = params;

  if (!chapterText || !allNotes || allNotes.length === 0) {
    return { result: null, candidateNote: null };
  }

  // 1. Checagem do Cache Reativo
  const cached = getCachedThreadResult(bookId, chapter, userId);
  if (cached) {
    const candidate = cached.matchedNoteId
      ? allNotes.find((n) => n.id === cached.matchedNoteId) || rankCandidateNote(allNotes, bookId)
      : rankCandidateNote(allNotes, bookId);
    return { result: cached, candidateNote: candidate };
  }

  // 2. Checagem rápida de configuração global
  const { getScriptureThreadConfig } = await import("./appConfig");
  const config = await getScriptureThreadConfig();
  if (!config.enabled) {
    return { result: null, candidateNote: null };
  }

  // 3. Montagem do pool híbrido de até config.maxNotes
  const hybridPool = buildHybridNotePool(allNotes, bookId, config.maxNotes);
  if (hybridPool.length === 0) {
    return { result: null, candidateNote: null };
  }

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (userToken) {
      headers["Authorization"] = `Bearer ${userToken}`;
    }

    const payload = {
      chapterText,
      chapterRef,
      bookId,
      chapter,
      notes: hybridPool.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        content: n.content,
        bookName: n.bookName,
        chapter: n.chapter,
        verse: n.verse,
      })),
    };

    const res = await fetch("/api/scripture-thread", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { result: null, candidateNote: null };
    }

    const data = await res.json().catch(() => ({}));
    const threadData = data?.thread;

    if (!threadData || !threadData.category) {
      return { result: null, candidateNote: null };
    }

    // 4. Eleição da Nota Candidata
    const candidate = rankCandidateNote(hybridPool, bookId);

    const threadResult: ScriptureThreadResult = {
      category: threadData.category,
      confidence: threadData.confidence ?? 0.85,
      relevanceScore: threadData.relevanceScore ?? 8,
      matchedNoteId: candidate?.id,
      matchedNoteExcerpt: candidate?.content?.slice(0, 300),
      evaluatedAt: threadData.evaluatedAt || new Date().toISOString(),
      notesVersion: getNotesVersion(),
    };

    // 5. Armazena no cache reativo
    setCachedThreadResult(bookId, chapter, userId, threadResult);

    return { result: threadResult, candidateNote: candidate };
  } catch (err) {
    console.warn("[scriptureThread] Falha silenciosa na avaliação:", err);
    return { result: null, candidateNote: null };
  }
}
