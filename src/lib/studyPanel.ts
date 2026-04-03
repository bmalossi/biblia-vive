// ─────────────────────────────────────────────────────────────────────────────
// studyPanel.ts — Bíblia Viva · Sprint 6
// Orquestra todas as fontes de dados do painel de estudo
// ─────────────────────────────────────────────────────────────────────────────

import { getCrossRefs, CrossReference } from './crossReferences';
import { getVerseWords, VerseWord } from './strongs';

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
  aiExplanation: string | null; // null = ainda não foi solicitado
  commentaries: Commentary[] | null; // Novo: múltiplos comentários teológicos
  isLoadingAI: boolean;
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
  try {
    const { supabase } = await import('@/lib/supabase');
    return supabase;
  } catch {
    return null;
  }
}

async function getCachedAIResponse(
  verseId: string,
  questionType: 'explain' | 'history' | 'application' | 'commentary'
): Promise<string | null> {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) return null;
    const { data } = await supabase
      .from('ai_study_cache')
      .select('response')
      .eq('verse_id', verseId)
      .eq('question_type', questionType)
      .maybeSingle();

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

export async function cacheAIResponse(
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
    console.warn('Failed to cache AI response:', error);
  }
}

/**
 * Chama o backend (/api/commentary) para gerar um novo comentário teológico.
 * Requer assinatura PRO validada no server-side.
 */
export async function requestCommentary(
  params: {
    bookId: string;
    chapter: number;
    verse: number;
    verseText: string;
    version: string;
    language?: string;
  }
): Promise<{ response: string; cached: boolean }> {
  const { supabase } = await import('./supabase');
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch('/api/commentary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': session ? `Bearer ${session.access_token}` : '',
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error! status: ${res.status}`);
  }

  const result = await res.json();
  try {
    return {
      commentaries: JSON.parse(result.response),
      cached: result.cached
    };
  } catch {
    return {
      commentaries: [],
      cached: result.cached
    };
  }
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
  const [crossReferences, verseWords, aiExplanation, commentaries, bookContexts] = await Promise.all([
    getCrossRefs(bookIdUpper, chapter, verse, version),
    getVerseWords(bookIdUpper, chapter, verse),
    getCachedAIResponse(verseId, 'explain'),
    getCachedAIResponse(verseId, 'commentary'),
    loadBookContexts(),
  ]);

  return {
    crossReferences,
    bookContext: bookContexts[bookIdUpper] ?? null,
    chapterHighlight: getChapterHighlight(bookContexts, bookIdUpper, chapter),
    verseWords,
    aiExplanation,
    commentaries: Array.isArray(commentaries) ? commentaries : null,
    isLoadingAI: false,
  };
}

// ─── Hook React ──────────────────────────────────────────────────────────────
// Disponível para usar diretamente nos componentes

import { useState, useEffect } from 'react';

export function useStudyData(
  bookId: string,
  chapter: number,
  verse: number | null,
  version: string
) {
  const [data, setData] = useState<StudyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!verse) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    getStudyData(bookId, chapter, verse, version)
      .then(setData)
      .catch(() => setError('Não foi possível carregar os dados de estudo.'))
      .finally(() => setLoading(false));
  }, [bookId, chapter, verse, version]);

  return { data, loading, error };
}
