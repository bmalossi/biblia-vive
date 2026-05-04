// ─────────────────────────────────────────────────────────────────────────────
// studyPanel.ts — Bíblia Viva · Sprint 6
// Orquestra todas as fontes de dados do painel de estudo
// ─────────────────────────────────────────────────────────────────────────────

import { getCrossRefs, CrossReference } from './crossReferences';
import { getVerseWords, VerseWord } from './strongs';
import { supabase } from './supabase';
import { getSession } from './auth';

// ─── Tipos do book-contexts.json (Pacote A) ──────────────────────────────────

export interface ChapterHighlight {
  title: string;
  summary: string;
  type?: string;
  author_note?: string;
}

export interface BookContext {
  author: string;
  period_written: string;
  period_events?: string;
  audience: string;
  theme: string;
  summary: string;
  key_themes: string[];
  key_verses: string[];
  key_people?: string[];
  key_places?: string[];
  chapters: number;
  testament: 'AT' | 'NT';
  genre?: string;
  chapter_highlights?: Record<string, string>;
}

export interface Commentary {
  author: string;
  era: string;
  work: string;
  year: string;
  text: string;
  source_url: string | null;
}

export interface StudyData {
  crossReferences: CrossReference[];
  bookContext: BookContext | null;
  chapterHighlight: string | null;
  verseWords: VerseWord[];
  theologicalExplanation: string | null; // null = ainda não foi solicitado
  commentaries: Commentary[] | null; // Novo: múltiplos comentários teológicos
  isLoadingStudy: boolean;
}

// ─── Cache do book-contexts.json ─────────────────────────────────────────────
let bookContextsCache: Record<string, BookContext> | null = null;

async function loadBookContexts(): Promise<Record<string, BookContext>> {
  if (bookContextsCache) return bookContextsCache;
  try {
    // Importação dinâmica do JSON estático em src/data/
    const module = await import('@/data/book-contexts.json');
    bookContextsCache = module.default as Record<string, BookContext>;
    return bookContextsCache;
  } catch (error) {
    console.warn('book-contexts.json not found:', error);
    return {};
  }
}

// ─── Supabase — cache de IA ───────────────────────────────────────────────────
// Importa o cliente Supabase do projeto (ajuste o caminho se necessário)
async function getSupabaseClient() {
  return supabase;
}

async function getCachedStudyResponse(
  verseId: string,
  questionType: 'explain' | 'history' | 'application' | 'commentary'
): Promise<string | null> {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) return null;
    const { data } = await Promise.race([
      supabase
        .from('ai_study_cache')
        .select('response')
        .eq('verse_id', verseId)
        .eq('question_type', questionType)
        .maybeSingle(),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
    ]);

    if (!data?.response) return null;

    // Tentamos parsear se for comentário para retornar o array,
    // caso contrário retornamos a string normal.
    if (questionType === 'commentary') {
      try {
        return JSON.parse(data.response);
      } catch {
        return data.response; // Fallback se o cache antigo não for JSON
      }
    }

    return data.response;
  } catch {
    return null;
  }
}

export async function cacheStudyResponse(
  verseId: string,
  questionType: 'explain' | 'history' | 'application' | 'commentary',
  response: string
): Promise<void> {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) return;
    await supabase
      .from('ai_study_cache')
      .upsert({ verse_id: verseId, question_type: questionType, response, created_at: new Date().toISOString() });
  } catch (error) {
    console.warn('Failed to cache Study response:', error);
  }
}

const QUOTA_STORAGE_KEY = 'bv_commentary_quota';

function persistQuota(response: Response): void {
  try {
    const limitHeader = response.headers.get('X-RateLimit-Limit');
    if (!limitHeader) return;

    const limit = Number(limitHeader);
    const remaining = Number(response.headers.get('X-RateLimit-Remaining') ?? limit);
    const resetAt = Number(response.headers.get('X-RateLimit-Reset') ?? (Date.now() + 3600000));
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify({
      limit,
      remaining,
      resetAt,
      updatedAt: Date.now(),
    }));
  } catch {
    // ignore storage errors
  }
}

export async function requestCommentary(
  params: {
    bookId: string;
    chapter: number;
    verse?: number | null;
    verseText?: string;
    version: string;
    language?: string;
  }
): Promise<{ commentaries: Commentary[]; cached: boolean }> {
  const timeoutPromise = new Promise<any>((_, reject) => {
    setTimeout(() => {
      reject(new Error('A geração do comentário demorou mais que o esperado (Timeout de 1m30s). Verifique sua conexão ou tente novamente.'));
    }, 90000);
  });

  return Promise.race([
    (async () => {
      // NOTE: We bypass supabase.functions.invoke entirely because Supabase-js v2
      // has an internal queue/lock mechanism bug that hangs on edge function invocations.
      // We manually construct the fetch request and use the hardened getSession.
      const session = await getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const response = await fetch(`${supabaseUrl}/functions/v1/commentary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify(params)
      });

      // Persist quota info from headers (available on all non-cached responses)
      persistQuota(response);

      const result = await response.json();

      // Handle rate limit
      if (response.status === 429) {
        const err = new Error(result?.message || 'Limite de comentários atingido') as any;
        err.code = 'RATE_LIMITED';
        err.reset_at = result?.reset_at ?? (Date.now() + 3600000);
        err.limit = result?.limit ?? 10;
        throw err;
      }

      if (!response.ok || result?.error) {
        throw new Error(result?.error || result?.message || `Erro HTTP ${response.status} na chamada da API`);
      }

      try {
        const parsed = JSON.parse(result.response || "[]");
        return {
          commentaries: Array.isArray(parsed)
            ? parsed.filter((c: any) => c && typeof c === 'object' && c.author)
            : Array.isArray(parsed?.commentaries)
              ? parsed.commentaries.filter((c: any) => c && typeof c === 'object' && c.author)
              : [],
          cached: result.cached || false
        };
      } catch (parseError) {
        console.error("Erro ao fazer parse dos comentários", parseError);
        return { commentaries: [], cached: false };
      }
    })(),
    timeoutPromise
  ]);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Monta o ID canônico do versículo: "JHN.3.16"
 */
export function buildVerseId(
  bookId: string,
  chapter: number | string,
  verse: number | string
): string {
  return `${bookId.toUpperCase()}.${chapter}.${verse}`;
}

/**
 * Pega o highlight do capítulo atual (se existir no book-contexts.json)
 */
function getChapterHighlight(
  contexts: Record<string, BookContext>,
  bookId: string,
  chapter: number | string
): string | null {
  const ctx = contexts[bookId.toUpperCase()];
  if (!ctx?.chapter_highlights) return null;
  return ctx.chapter_highlights[String(chapter)] ?? null;
}

// ─── Função principal ─────────────────────────────────────────────────────────

/**
 * Carrega todos os dados do painel de estudo em paralelo.
 * Versículo: bookId="JHN", chapter=3, verse=16, version="acf"
 */
export async function getStudyData(
  bookId: string,
  chapter: number | string,
  verse: number | string,
  version: string = 'acf'
): Promise<StudyData> {
  const verseId = buildVerseId(bookId, chapter, verse);
  const bookIdUpper = bookId.toUpperCase();

  // Carregar tudo em paralelo para velocidade máxima
  const [crossReferences, verseWords, theologicalExplanation, commentaries, bookContexts] = await Promise.all([
    getCrossRefs(bookIdUpper, chapter, verse, version),
    getVerseWords(bookIdUpper, chapter, verse),
    getCachedStudyResponse(verseId, 'explain'),
    getCachedStudyResponse(verseId, 'commentary'),
    loadBookContexts(),
  ]);

  return {
    crossReferences,
    bookContext: bookContexts[bookIdUpper] ?? null,
    chapterHighlight: getChapterHighlight(bookContexts, bookIdUpper, chapter),
    verseWords,
    theologicalExplanation,
    commentaries: Array.isArray(commentaries) ? commentaries : null,
    isLoadingStudy: false,
  };
}


