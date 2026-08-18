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
  tradition?: string;
  work: string;
  year: string;
  original_language?: string;
  text: string;
  source_url: string | null;
  isManual?: boolean;
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

/**
 * Busca em lote todos os números de versículos do capítulo que possuem comentários em cache (IA ou manuais).
 */
export async function getChapterCachedVerseNumbers(
  bookId: string,
  chapter: number | string,
  language: string = 'pt'
): Promise<Set<number>> {
  const cachedVerses = new Set<number>();
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) return cachedVerses;

    const bookUpper = bookId.toUpperCase();
    const prefix = `${bookUpper}.${chapter}.`;

    const [aiRes, manualRes] = await Promise.all([
      supabase
        .from('ai_study_cache')
        .select('verse_id')
        .eq('question_type', 'commentary')
        .like('verse_id', `${prefix}%`),
      supabase
        .from('manual_commentaries')
        .select('verse_id')
        .eq('question_type', 'commentary')
        .like('verse_id', `${prefix}%`)
    ]);

    const processRows = (rows: { verse_id: string }[] | null) => {
      if (!rows) return;
      for (const row of rows) {
        if (!row.verse_id) continue;
        const cleanId = row.verse_id.split(':')[0]; // Remove sufixo de idioma como :pt
        const parts = cleanId.split('.');
        if (parts.length >= 3) {
          const vNum = parseInt(parts[2], 10);
          if (!isNaN(vNum) && vNum > 0) {
            cachedVerses.add(vNum);
          }
        }
      }
    };

    processRows(aiRes.data);
    processRows(manualRes.data);
  } catch (error) {
    console.warn('Error fetching chapter cached verse numbers:', error);
  }
  return cachedVerses;
}

// ─── Comentários Manuais ─────────────────────────────────────────────────────

/**
 * Busca comentários inseridos manualmente pelo admin na tabela `manual_commentaries`.
 * Retorna array vazio se não houver nenhum (nunca lança erro).
 */
async function getManualCommentaries(
  bookId: string,
  chapter: number,
  verse: number | null | undefined,
  language: string
): Promise<Commentary[]> {
  try {
    const isChapterLevel = verse === null || verse === undefined || verse === 0;
    const baseId = isChapterLevel
      ? `${bookId.toUpperCase()}.${chapter}.ALL`
      : `${bookId.toUpperCase()}.${chapter}.${verse}`;
    const questionType = isChapterLevel ? 'chapter_commentary' : 'commentary';
    const lang = (language || 'pt').toLowerCase();

    const { data, error } = await supabase
      .from('manual_commentaries')
      .select('author, era, tradition, work, year, original_language, text, source_url')
      .eq('verse_id', baseId)
      .eq('question_type', questionType)
      .eq('language', lang);

    if (error || !data) return [];

    return data.map((row: any) => ({
      author:            row.author ?? '',
      era:               row.era ?? '',
      tradition:         row.tradition ?? '',
      work:              row.work ?? '',
      year:              row.year ?? '',
      original_language: row.original_language ?? '',
      text:              row.text ?? '',
      source_url:        row.source_url ?? null,
      isManual:          true,
    }));
  } catch {
    return [];
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
): Promise<{ commentaries: Commentary[]; cached: boolean; remaining?: number }> {
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
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Always include the apikey (anon key) so Supabase doesn't block with 401.
      // If the user is logged in, also send the Authorization bearer token so the
      // edge function can identify them and grant PRO access.
      const response = await fetch(`${supabaseUrl}/functions/v1/commentary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : { Authorization: `Bearer ${supabaseAnonKey}` }
          ),
        },
        body: JSON.stringify(params)
      });

      // Persist quota info from headers (available on all non-cached responses)
      persistQuota(response);

      const remainingHeader = response.headers.get('X-RateLimit-Remaining');
      const remaining = remainingHeader ? Number(remainingHeader) : undefined;

      const result = await response.json();

      // Handle rate limit
      if (response.status === 429) {
        const err = new Error(result?.message || 'Limite de comentários atingido') as any;
        err.code = 'RATE_LIMITED';
        err.reset_at = result?.reset_at ?? (Date.now() + 3600000);
        const limitHeader = response.headers.get('X-RateLimit-Limit');
        err.limit = limitHeader ? Number(limitHeader) : (result?.limit ?? 10);
        err.remaining = 0;
        throw err;
      }

      if (!response.ok || result?.error) {
        throw new Error(result?.error || result?.message || `Erro HTTP ${response.status} na chamada da API`);
      }

      // Busca manuais em paralelo com o parse do resultado da IA
      let aiCommentaries: Commentary[] = [];
      try {
        const parsed = JSON.parse(result.response || "[]");
        aiCommentaries = Array.isArray(parsed)
          ? parsed.filter((c: any) => c && typeof c === 'object' && c.author)
          : Array.isArray(parsed?.commentaries)
            ? parsed.commentaries.filter((c: any) => c && typeof c === 'object' && c.author)
            : [];
      } catch (parseError) {
        console.error("Erro ao fazer parse dos comentários", parseError);
      }

      // Merge aditivo: comentários da IA primeiro, manuais depois
      const manualCommentaries = await getManualCommentaries(
        params.bookId,
        params.chapter,
        params.verse ?? null,
        params.language ?? 'pt'
      );

      return {
        commentaries: [...aiCommentaries, ...manualCommentaries],
        cached: result.cached || false,
        remaining
      };
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

/**
 * Carrega todos os dados do painel de estudo em paralelo.
 * Versículo: bookId="JHN", chapter=3, verse=16, version="acf"
 *
 * NOTA: Comentários manuais NÃO são incluídos aqui intencionalmente.
 * Eles só aparecem após o usuário clicar em "Buscar comentários",
 * que chama requestCommentary() — o qual faz o merge aditivo com a IA.
 * Isso garante que o botão de busca sempre seja exibido quando não há
 * cache de IA, mesmo que existam comentários manuais cadastrados.
 */
export async function getStudyData(
  bookId: string,
  chapter: number | string,
  verse: number | string,
  version: string = 'acf',
  language: string = 'pt'
): Promise<StudyData> {
  const baseId = buildVerseId(bookId, chapter, verse);
  const bookIdUpper = bookId.toUpperCase();
  const lang = (language || 'pt').toLowerCase();
  const verseId = lang !== 'en' ? `${baseId}:${lang}` : baseId;

  // Carregar tudo em paralelo para velocidade máxima
  const [
    crossReferences,
    verseWords,
    theologicalExplanation,
    commentariesResult,
    bookContexts,
  ] = await Promise.all([
    getCrossRefs(bookIdUpper, chapter, verse, version),
    getVerseWords(bookIdUpper, chapter, verse),
    getCachedStudyResponse(verseId, 'explain'),
    getCachedStudyResponse(verseId, 'commentary'),
    loadBookContexts(),
  ]);

  // Parse comentários do cache de IA (apenas IA — sem manuais)
  let aiCommentaries: Commentary[] = [];
  if (commentariesResult) {
    if (Array.isArray(commentariesResult)) {
      aiCommentaries = commentariesResult;
    } else if (typeof commentariesResult === 'object') {
      const resObj = commentariesResult as any;
      if (Array.isArray(resObj.commentaries)) {
        aiCommentaries = resObj.commentaries;
      } else if (Array.isArray(resObj.response)) {
        aiCommentaries = resObj.response;
      }
    } else if (typeof commentariesResult === 'string') {
      try {
        const parsed = JSON.parse(commentariesResult);
        aiCommentaries = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.commentaries)
            ? parsed.commentaries
            : [];
      } catch {
        // ignore parse error
      }
    }
  }

  // Se houver cache de IA, mescla com os comentários manuais correspondentes
  let finalCommentaries: Commentary[] | null = null;
  if (aiCommentaries.length > 0) {
    const manualCommentaries = await getManualCommentaries(
      bookId,
      Number(chapter),
      Number(verse),
      language
    );
    finalCommentaries = [...aiCommentaries, ...manualCommentaries];
  }

  return {
    crossReferences,
    bookContext: bookContexts[bookIdUpper] ?? null,
    chapterHighlight: getChapterHighlight(bookContexts, bookIdUpper, chapter),
    verseWords,
    theologicalExplanation,
    // null = nenhum cache de IA → botão "Buscar" aparece no painel
    commentaries: finalCommentaries,
    isLoadingStudy: false,
  };
}


