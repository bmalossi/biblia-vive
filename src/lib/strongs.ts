// ─────────────────────────────────────────────────────────────────────────────
// strongs.ts — Bíblia Viva · Sprint 6
// Carrega os léxicos de Strong (grego e hebraico) e mapeia versículos → palavras
// ─────────────────────────────────────────────────────────────────────────────

import { API_TO_OPENBIBLE } from './crossReferences';

// Cache em memória separado para grego e hebraico
let greekCache: Record<string, StrongsEntry> | null = null;
let hebrewCache: Record<string, StrongsEntry> | null = null;
let verseStrongsCache: Record<string, VerseWord[]> | null = null;

// Cache para os textos originais completos
let originalHebrewTextCache: any[] | null = null;
let originalGreekTextCache: any[] | null = null;

export interface StrongsEntry {
  number: string;        // "G2316" ou "H430"
  word: string;          // "θεός" ou "אֱלֹהִים"
  translit: string;      // "theos" ou "elohim"
  definition: string;    // Definição em inglês (original do dataset)
  definition_pt?: string; // Tradução para PT-BR
  definition_es?: string; // Tradução para ES
  occurrences?: number;  // Quantas vezes aparece na Bíblia
}

export interface VerseWord {
  text: string;           // Texto da palavra como aparece na Bíblia PT
  strongs: string | null; // "G2316" ou null se palavra funcional (artigos, preposições)
  index: number;          // Posição na frase
}

async function loadGreek(): Promise<Record<string, StrongsEntry>> {
  if (greekCache) return greekCache;
  try {
    const res = await fetch('/data/strongs_greek.json');
    if (!res.ok) throw new Error('Greek lexicon unavailable');
    greekCache = await res.json();
    return greekCache!;
  } catch (error) {
    console.warn('Greek lexicon unavailable:', error);
    return {};
  }
}

async function loadHebrew(): Promise<Record<string, StrongsEntry>> {
  if (hebrewCache) return hebrewCache;
  try {
    const res = await fetch('/data/strongs_hebrew.json');
    if (!res.ok) throw new Error('Hebrew lexicon unavailable');
    hebrewCache = await res.json();
    return hebrewCache!;
  } catch (error) {
    console.warn('Hebrew lexicon unavailable:', error);
    return {};
  }
}

async function loadVerseStrongs(): Promise<Record<string, VerseWord[]>> {
  if (verseStrongsCache) return verseStrongsCache;
  try {
    const res = await fetch('/data/verse_strongs_map.json');
    if (!res.ok) throw new Error('Verse Strongs map unavailable');
    verseStrongsCache = await res.json();
    return verseStrongsCache!;
  } catch (error) {
    console.warn('Verse Strongs map unavailable:', error);
    return {};
  }
}

/**
 * Retorna a entrada do léxico de Strong para um número dado.
 * Aceita "G2316" (grego) ou "H430" (hebraico).
 */
export async function getStrongsEntry(strongsNumber: string): Promise<StrongsEntry | null> {
  if (!strongsNumber) return null;
  const isGreek = strongsNumber.startsWith('G');

  const lexicon = isGreek ? await loadGreek() : await loadHebrew();
  const entry = lexicon?.[strongsNumber] ?? null;

  if (!entry) return null;
  return { ...entry, number: strongsNumber };
}

/**
 * Retorna as palavras do versículo (apenas código Strong no mapeamento atual)
 * Chave JSON: OpenBible format, ex: "Jhn.3.16"
 * Retorna array formatado como VerseWord[].
 */
export async function getVerseWords(
  bookId: string,
  chapter: number | string,
  verse: number | string
): Promise<VerseWord[]> {
  const map = await loadVerseStrongs();
  const openBibleBook = API_TO_OPENBIBLE[bookId.toUpperCase()] || bookId;
  const key = `${openBibleBook}.${chapter}.${verse}`;

  // O JSON de Strongs do usuário vem apenas como arrays de string, ex: ["H9003", "H7225"]
  const rawStrongs = map?.[key] as unknown as string[];
  if (!rawStrongs || !Array.isArray(rawStrongs)) return [];

  return rawStrongs.map((strongCode, index) => ({
    text: '', // mapping não tem o texto final em pt-BR
    strongs: strongCode,
    index
  }));
}

/**
 * Determina se um livro é do Novo Testamento (grego) ou Antigo (hebraico).
 */
export function isNewTestament(bookId: string): boolean {
  const ntBooks = [
    'MAT', 'MAR', 'LUK', 'JOH', 'ACT', 'ROM', 'CO1', 'CO2', 'GAL', 'EPH',
    'PHI', 'COL', 'TH1', 'TH2', 'TI1', 'TI2', 'TIT', 'PLM', 'HEB', 'JAM',
    'PE1', 'PE2', 'JO1', 'JO2', 'JO3', 'JDE', 'REV',
  ];
  return ntBooks.includes(bookId.toUpperCase());
}

/**
 * Retorna o nome do idioma original do livro.
 */
export function getLanguageLabel(bookId: string): 'Grego' | 'Hebraico' {
  return isNewTestament(bookId) ? 'Grego' : 'Hebraico';
}

/**
 * Lê o texto original (Grego/Hebraico) de um versículo específico nos novos JSONs.
 */
export async function getOriginalVerseText(bookId: string, chapter: number, verse: number): Promise<string | null> {
  const isNt = isNewTestament(bookId);
  const url = isNt ? '/bible/novo_testamento_grego.json' : '/bible/antigo_testamento_hebraico.json';

  try {
    let dataList = isNt ? originalGreekTextCache : originalHebrewTextCache;

    if (!dataList) {
      const res = await fetch(url);
      if (!res.ok) return null;
      dataList = await res.json();
      if (isNt) originalGreekTextCache = dataList;
      else originalHebrewTextCache = dataList;
    }

    // O bookId vem como 'GEN', 'EXO', 'MAT', etc.
    // Os JSONs têm nomes completos em inglês ("book": "Genesis"). 
    // Mapeamento simples de IDs da API para os nomes usados nos JSONs.
    const bookMap: Record<string, string> = {
      'GEN': 'Genesis', 'EXO': 'Exodus', 'LEV': 'Leviticus', 'NUM': 'Numbers', 'DEU': 'Deuteronomy',
      'JOS': 'Joshua', 'JDG': 'Judges', 'RUT': 'Ruth', 'SA1': '1 Samuel', 'SA2': '2 Samuel',
      'KG1': '1 Kings', 'KG2': '2 Kings', 'CH1': '1 Chronicles', 'CH2': '2 Chronicles',
      'EZR': 'Ezra', 'NEH': 'Nehemiah', 'EST': 'Esther', 'JOB': 'Job', 'PSA': 'Psalms',
      'PRO': 'Proverbs', 'ECC': 'Ecclesiastes', 'SOL': 'Song of Solomon', 'ISA': 'Isaiah',
      'JER': 'Jeremiah', 'LAM': 'Lamentations', 'EZE': 'Ezekiel', 'DAN': 'Daniel',
      'HOS': 'Hosea', 'JOE': 'Joel', 'AMO': 'Amos', 'OBA': 'Obadiah', 'JON': 'Jonah',
      'MIC': 'Micah', 'NAH': 'Nahum', 'HAB': 'Habakkuk', 'ZEP': 'Zephaniah', 'HAG': 'Haggai',
      'ZAC': 'Zechariah', 'MAL': 'Malachi',
      'MAT': 'Matthew', 'MAR': 'Mark', 'LUK': 'Luke', 'JOH': 'John', 'ACT': 'Acts',
      'ROM': 'Romans', 'CO1': '1 Corinthians', 'CO2': '2 Corinthians', 'GAL': 'Galatians',
      'EPH': 'Ephesians', 'PHI': 'Philippians', 'COL': 'Colossians', 'TH1': '1 Thessalonians',
      'TH2': '2 Thessalonians', 'TI1': '1 Timothy', 'TI2': '2 Timothy', 'TIT': 'Titus',
      'PLM': 'Philemon', 'HEB': 'Hebrews', 'JAM': 'James', 'PE1': '1 Peter', 'PE2': '2 Peter',
      'JO1': '1 John', 'JO2': '2 John', 'JO3': '3 John', 'JDE': 'Jude', 'REV': 'Revelation'
    };

    const englishName = bookMap[bookId.toUpperCase()];
    if (!englishName) return null;

    const bookData = dataList?.find((b: any) => b.book === englishName);
    if (!bookData) return null;

    const chapterData = bookData.chapters.find((c: any) => c.chapter === chapter);
    if (!chapterData) return null;

    const verseData = chapterData.verses.find((v: any) => v.verse === verse);
    return verseData ? verseData.text : null;
  } catch (error) {
    console.warn('Failed to load original verse text:', error);
    return null;
  }
}

/**
 * Pré-carrega os léxicos em background (chamar na inicialização da ReadingPage).
 * Isso garante que os dados estejam em cache quando o usuário abrir o painel.
 */
export function prefetchLexicons(bookId: string): void {
  if (isNewTestament(bookId)) {
    loadGreek();
    // Inicia silenciosamente o fetch do texto original em background
    if (!originalGreekTextCache) { fetch('/bible/novo_testamento_grego.json').then(r => r.json()).then(d => originalGreekTextCache = d).catch(() => { }); }
  } else {
    loadHebrew();
    if (!originalHebrewTextCache) { fetch('/bible/antigo_testamento_hebraico.json').then(r => r.json()).then(d => originalHebrewTextCache = d).catch(() => { }); }
  }
}
