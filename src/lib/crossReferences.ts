// ─────────────────────────────────────────────────────────────────────────────
// crossReferences.ts — Bíblia Viva · Sprint 6
// Carrega o dataset do OpenBible.info e expõe referências cruzadas por versículo
// ─────────────────────────────────────────────────────────────────────────────

// Cache em memória para não re-fetchar a cada versículo
let crossRefCache: Record<string, Array<{ ref: string; strength: number }>> | null = null;

// Mapeamento do formato OpenBible → formato da API.Bible
import { findBookById } from './books';
const OPENBIBLE_TO_API: Record<string, string> = {
  'Gen': 'GEN', 'Exo': 'EXO', 'Lev': 'LEV', 'Num': 'NUM', 'Deu': 'DEU',
  'Jos': 'JOS', 'Jdg': 'JDG', 'Rut': 'RUT', '1Sa': '1SA', '2Sa': '2SA',
  '1Ki': '1KI', '2Ki': '2KI', '1Ch': '1CH', '2Ch': '2CH', 'Ezr': 'EZR',
  'Neh': 'NEH', 'Est': 'EST', 'Job': 'JOB', 'Psa': 'PSA', 'Pro': 'PRO',
  'Ecc': 'ECC', 'Sol': 'SNG', 'Isa': 'ISA', 'Jer': 'JER', 'Lam': 'LAM',
  'Eze': 'EZK', 'Dan': 'DAN', 'Hos': 'HOS', 'Joe': 'JOL', 'Amo': 'AMO',
  'Oba': 'OBA', 'Jon': 'JON', 'Mic': 'MIC', 'Nah': 'NAM', 'Hab': 'HAB',
  'Zep': 'ZEP', 'Hag': 'HAG', 'Zec': 'ZEC', 'Mal': 'MAL',
  'Mat': 'MAT', 'Mrk': 'MRK', 'Luk': 'LUK', 'Jhn': 'JHN', 'Act': 'ACT',
  'Rom': 'ROM', '1Co': '1CO', '2Co': '2CO', 'Gal': 'GAL', 'Eph': 'EPH',
  'Php': 'PHP', 'Col': 'COL', '1Th': '1TH', '2Th': '2TH', '1Ti': '1TI',
  '2Ti': '2TI', 'Tit': 'TIT', 'Phm': 'PHM', 'Heb': 'HEB', 'Jas': 'JAS',
  '1Pe': '1PE', '2Pe': '2PE', '1Jn': '1JN', '2Jn': '2JN', '3Jn': '3JN',
  'Jud': 'JUD', 'Rev': 'REV',
};

// Aliases irregulares vindos do JSON (inglês/OpenBible) para o formato API
const EXTENDED_ALIASES: Record<string, string> = {
  'TITUS': 'TIT', '1TIM': '1TI', '2TIM': '2TI', 'ZEPH': 'ZEP', '1CHR': '1CH', '2CHR': '2CH',
  'PS': 'PSA', 'EZEK': 'EZK', 'MATT': 'MAT', 'EZRA': 'EZR', 'JOSH': 'JOS', 'DEUT': 'DEU',
  '1COR': '1CO', '2COR': '2CO', '1SAM': '1SA', '2SAM': '2SA', '1KGS': '1KI', '2KGS': '2KI',
  'PROV': 'PRO', 'ECCL': 'ECC', 'SONG': 'SNG', 'CANT': 'SNG', 'IS': 'ISA', 'JONAH': 'JON',
  'MICAH': 'MIC', 'NAHUM': 'NAM', 'MARK': 'MRK', 'LUKE': 'LUK', 'JOHN': 'JHN', 'ACTS': 'ACT',
  'PHIL': 'PHP', '1THESS': '1TH', '2THESS': '2TH', 'PHILEM': 'PHM', 'JAMES': 'JAS',
  '1PET': '1PE', '2PET': '2PE', '1JOHN': '1JN', '2JOHN': '2JN', '3JOHN': '3JN', 'JUDE': 'JUD',
  'EXOD': 'EXO', 'JUDG': 'JDG', 'RUTH': 'RUT', 'ESTH': 'EST', 'OBAD': 'OBA'
};

// Mapeamento inverso: API.Bible → OpenBible
export const API_TO_OPENBIBLE: Record<string, string> = Object.fromEntries(
  Object.entries(OPENBIBLE_TO_API).map(([k, v]) => [v, k])
);

// Nomes em português para exibição no painel
export const BOOK_NAMES_PT: Record<string, string> = {
  GEN: 'Gênesis', EXO: 'Êxodo', LEV: 'Levítico', NUM: 'Números', DEU: 'Deuteronômio',
  JOS: 'Josué', JDG: 'Juízes', RUT: 'Rute', '1SA': '1 Samuel', '2SA': '2 Samuel',
  '1KI': '1 Reis', '2KI': '2 Reis', '1CH': '1 Crônicas', '2CH': '2 Crônicas',
  EZR: 'Esdras', NEH: 'Neemias', EST: 'Ester', JOB: 'Jó', PSA: 'Salmos',
  PRO: 'Provérbios', ECC: 'Eclesiastes', SNG: 'Cantares', ISA: 'Isaías',
  JER: 'Jeremias', LAM: 'Lamentações', EZK: 'Ezequiel', DAN: 'Daniel',
  HOS: 'Oséias', JOL: 'Joel', AMO: 'Amós', OBA: 'Obadias', JON: 'Jonas',
  MIC: 'Miquéias', NAM: 'Naum', HAB: 'Habacuque', ZEP: 'Sofonias',
  HAG: 'Ageu', ZEC: 'Zacarias', MAL: 'Malaquias',
  MAT: 'Mateus', MRK: 'Marcos', LUK: 'Lucas', JHN: 'João', ACT: 'Atos',
  ROM: 'Romanos', '1CO': '1 Coríntios', '2CO': '2 Coríntios', GAL: 'Gálatas',
  EPH: 'Efésios', PHP: 'Filipenses', COL: 'Colossenses', '1TH': '1 Tessalonicenses',
  '2TH': '2 Tessalonicenses', '1TI': '1 Timóteo', '2TI': '2 Timóteo',
  TIT: 'Tito', PHM: 'Filemom', HEB: 'Hebreus', JAS: 'Tiago',
  '1PE': '1 Pedro', '2PE': '2 Pedro', '1JN': '1 João', '2JN': '2 João',
  '3JN': '3 João', JUD: 'Judas', REV: 'Apocalipse',
};

// Helper to normalize a reference into a consistent string (e.g. "Luke.10.18" -> "LUK.10.18")
function normalizeKey(ref: string): string {
  if (!ref) return '';
  const parts = ref.split('.');
  if (parts.length < 3) return ref;
  const book = parts[0];
  const upper = book.toUpperCase();
  const bookId = OPENBIBLE_TO_API[book] ?? EXTENDED_ALIASES[upper] ?? upper;
  return `${bookId}.${parts[1]}.${parts[2]}`;
}

// Expands "Gen.1.1-Gen.1.3" -> ["Gen.1.1", "Gen.1.2", "Gen.1.3"]
function expandRange(ref: string): string[] {
  if (!ref.includes('-')) return [ref];
  const [start, end] = ref.split('-');
  const startParts = start.split('.');
  const endParts = end.split('.');

  if (startParts.length < 3 || endParts.length < 3) return [ref];

  const book = startParts[0];
  const chapter = startParts[1];
  const startVerse = parseInt(startParts[2]);
  const endVerse = parseInt(endParts[2]);

  if (isNaN(startVerse) || isNaN(endVerse)) return [ref];

  const expanded = [];
  for (let v = startVerse; v <= endVerse; v++) {
    expanded.push(`${book}.${chapter}.${v}`);
  }
  return expanded;
}

async function loadCrossRefs() {
  if (crossRefCache) return crossRefCache;
  try {
    const res = await fetch('/data/cross_references.json');
    if (!res.ok) throw new Error('Failed to load cross references');
    const rawData = await res.json();

    // Converte para bidirecional em tempo de execução com chaves normalizadas
    const bidirectional: Record<string, Array<{ ref: string; strength: number }>> = {};

    for (const [sourceKey, refs] of Object.entries(rawData)) {
      const canonicalSource = normalizeKey(sourceKey);
      if (!bidirectional[canonicalSource]) bidirectional[canonicalSource] = [];

      for (const r of (refs as Array<{ ref: string; strength: number }>)) {
        // Forward (keep original ref for display/parsing)
        bidirectional[canonicalSource].push(r);

        // Reverse: expand range if needed and add back to each verse
        const targets = expandRange(r.ref);
        for (const target of targets) {
          const canonicalTarget = normalizeKey(target);
          if (!bidirectional[canonicalTarget]) bidirectional[canonicalTarget] = [];

          // Use the NON-NORMALIZED sourceKey as the ref for the reverse link to maintain parsing compatibility
          if (!bidirectional[canonicalTarget].some(existing => existing.ref === sourceKey)) {
            bidirectional[canonicalTarget].push({ ref: sourceKey, strength: r.strength });
          }
        }
      }
    }

    crossRefCache = bidirectional;
    return crossRefCache;
  } catch (error) {
    console.warn('Cross references unavailable:', error);
    return {};
  }
}

// Converte "JHN.3.16" (API format) → "Jhn.3.16" (OpenBible format)
function toOpenBibleKey(bookId: string, chapter: string, verse: string): string {
  const obBook = API_TO_OPENBIBLE[bookId.toUpperCase()] ?? bookId;
  return `${obBook}.${chapter}.${verse}`;
}

// Converte "Jhn.3.16" (OpenBible) → objeto estruturado para o painel
function parseOpenBibleRef(ref: string): {
  bookId: string;
  chapter: number;
  verse: number;
  label: string;
} | null {
  const parts = ref.split('.');
  if (parts.length < 3) return null;
  const rawId = parts[0];
  const upperId = rawId.toUpperCase();

  // Resolve o ID do livro (direto do mapa original, ou do mapa estendido, ou fallback uppercase)
  let bookId = OPENBIBLE_TO_API[rawId]
    ?? EXTENDED_ALIASES[upperId]
    ?? upperId;

  const chapter = parseInt(parts[1]);
  const verse = parseInt(parts[2]);
  const bookName = BOOK_NAMES_PT[bookId] ?? bookId;
  return { bookId, chapter, verse, label: `${bookName} ${chapter}:${verse}` };
}

export interface CrossReference {
  bookId: string;
  chapter: number;
  verse: number;
  label: string;    // "João 3:16"
  strength: number; // 1–50
  url: string;      // "/acf/jhn/3#v16"
}

export async function getCrossRefs(
  bookId: string,
  chapter: number | string,
  verse: number | string,
  version: string = 'acf',
  limit: number = 8
): Promise<CrossReference[]> {
  const refs = await loadCrossRefs();
  // Usa o formato canônico para o lookup: "LUK.10.18"
  const key = `${bookId.toUpperCase()}.${chapter}.${verse}`;
  const raw = (refs as Record<string, Array<{ ref: string; strength: number }>>)[key] ?? [];

  return raw
    .sort((a, b) => b.strength - a.strength)
    .slice(0, limit)
    .map(r => {
      const parsed = parseOpenBibleRef(r.ref);
      if (!parsed) return null;
      const slug = findBookById(parsed.bookId)?.slug || parsed.bookId.toLowerCase();
      return {
        ...parsed,
        strength: r.strength,
        url: `/${version}/${slug}/${parsed.chapter}#v${parsed.verse}`,
      };
    })
    .filter(Boolean) as CrossReference[];
}
