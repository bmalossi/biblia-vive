import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

const LOCAL_KEY_PREFIX = "bv-chapter-views";

// ── Helpers localStorage ───────────────────────────────────────────────────────

function localKey(bookId: string, chapter: number) {
  return `${LOCAL_KEY_PREFIX}:${bookId}:${chapter}`;
}

function readLocal(bookId: string, chapter: number): Date | null {
  try {
    const raw = localStorage.getItem(localKey(bookId, chapter));
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function writeLocal(bookId: string, chapter: number, date: Date) {
  try {
    localStorage.setItem(localKey(bookId, chapter), date.toISOString());
  } catch {
    // ignore
  }
}

/**
 * Retorna todas as entradas localStorage para um livro inteiro.
 * Formato: { [chapter: number]: Date }
 */
function readLocalForBook(bookId: string): Record<number, Date> {
  const result: Record<number, Date> = {};
  try {
    const prefix = `${LOCAL_KEY_PREFIX}:${bookId}:`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(prefix)) continue;
      const chapterStr = key.slice(prefix.length);
      const chapter = Number(chapterStr);
      if (!Number.isInteger(chapter) || chapter < 1) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const d = new Date(raw);
      if (!isNaN(d.getTime())) result[chapter] = d;
    }
  } catch {
    // ignore
  }
  return result;
}

// ── Supabase helpers (lazy import para não aumentar bundle inicial) ─────────────

async function upsertRemote(userId: string, bookId: string, chapter: number, viewedAt: Date) {
  try {
    const { supabase } = await import("@/lib/supabase");
    await supabase.from("chapter_views").upsert(
      { user_id: userId, book_id: bookId, chapter, viewed_at: viewedAt.toISOString() },
      { onConflict: "user_id,book_id,chapter" }
    );
  } catch {
    // silencioso — local já gravado
  }
}

async function fetchRemoteForBook(
  userId: string,
  bookId: string
): Promise<Record<number, Date>> {
  try {
    const { supabase } = await import("@/lib/supabase");
    const { data, error } = await supabase
      .from("chapter_views")
      .select("chapter, viewed_at")
      .eq("user_id", userId)
      .eq("book_id", bookId);
    if (error || !data) return {};
    const result: Record<number, Date> = {};
    for (const row of data) {
      const d = new Date(row.viewed_at);
      if (!isNaN(d.getTime())) result[row.chapter] = d;
    }
    return result;
  } catch {
    return {};
  }
}

async function fetchRemoteSingle(
  userId: string,
  bookId: string,
  chapter: number
): Promise<Date | null> {
  try {
    const { supabase } = await import("@/lib/supabase");
    const { data, error } = await supabase
      .from("chapter_views")
      .select("viewed_at")
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .eq("chapter", chapter)
      .maybeSingle();
    if (error || !data) return null;
    const d = new Date(data.viewed_at);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

// ── Formatador pt-BR ───────────────────────────────────────────────────────────

export function formatViewedAt(date: Date): string {
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Hook principal ─────────────────────────────────────────────────────────────

/**
 * useChapterViews
 *
 * - `record(bookId, chapter)` — registra visita agora (local + remoto)
 * - `getPreviousViewedAt(bookId, chapter)` — retorna data da visita anterior (antes da atual sessão)
 * - `loadForBook(bookId)` — retorna map completo de capítulos visitados (local + remoto merged)
 */
export function useChapterViews() {
  const { user } = useAuth();
  // Guarda o timestamp "anterior" (antes de registrar a visita atual) por chave
  const previousRef = useRef<Record<string, Date | null>>({});

  /**
   * Registra uma visita. Salva a data anterior antes de sobrescrever.
   */
  const record = useCallback(
    (bookId: string, chapter: number) => {
      if (!bookId || chapter < 1) return;

      const key = `${bookId}:${chapter}`;
      // Captura "anterior" antes de gravar nova data
      if (!(key in previousRef.current)) {
        previousRef.current[key] = readLocal(bookId, chapter);
      }

      const now = new Date();
      writeLocal(bookId, chapter, now);

      if (user?.id) {
        upsertRemote(user.id, bookId, chapter, now);
      }
    },
    [user?.id]
  );

  /**
   * Retorna a data de visita **anterior** à sessão atual (para exibir no h1).
   * Tenta local primeiro; se não houver e user autenticado, busca remoto.
   */
  const getPreviousViewedAt = useCallback(
    async (bookId: string, chapter: number): Promise<Date | null> => {
      const key = `${bookId}:${chapter}`;
      // Se já capturado no ref, usa direto
      if (key in previousRef.current) {
        return previousRef.current[key];
      }
      // Fallback: busca remoto
      if (user?.id) {
        return fetchRemoteSingle(user.id, bookId, chapter);
      }
      return null;
    },
    [user?.id]
  );

  /**
   * Carrega mapa completo de visualizações de um livro.
   * Merge: remoto sobrescreve local quando mais recente.
   */
  const loadForBook = useCallback(
    async (bookId: string): Promise<Record<number, Date>> => {
      const local = readLocalForBook(bookId);
      if (!user?.id) return local;

      const remote = await fetchRemoteForBook(user.id, bookId);

      // Merge: para cada capítulo, usa a data mais recente entre local e remoto
      const merged: Record<number, Date> = { ...local };
      for (const [chStr, remoteDate] of Object.entries(remote)) {
        const ch = Number(chStr);
        const localDate = local[ch];
        if (!localDate || remoteDate > localDate) {
          merged[ch] = remoteDate;
          // Sincroniza local com o valor remoto mais recente
          writeLocal(bookId, ch, remoteDate);
        }
      }
      return merged;
    },
    [user?.id]
  );

  return { record, getPreviousViewedAt, loadForBook };
}
