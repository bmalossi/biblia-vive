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
  'Jos': 'JOS', 'Jdg': 'JDG', 'Rut': 'RUT', '1Sa': 'SA1', '2Sa': 'SA2',
  '1Ki': 'KG1', '2Ki': 'KG2', '1Ch': 'CH1', '2Ch': 'CH2', 'Ezr': 'EZR',
  'Neh': 'NEH', 'Est': 'EST', 'Job': 'JOB', 'Psa': 'PSA', 'Pro': 'PRO',
  'Ecc': 'ECC', 'Sol': 'SOL', 'Isa': 'ISA', 'Jer': 'JER', 'Lam': 'LAM',
  'Eze': 'EZE', 'Dan': 'DAN', 'Hos': 'HOS', 'Joe': 'JOE', 'Amo': 'AMO',
  'Oba': 'OBA', 'Jon': 'JON', 'Mic': 'MIC', 'Nah': 'NAH', 'Hab': 'HAB',
  'Zep': 'ZEP', 'Hag': 'HAG', 'Zec': 'ZAC', 'Mal': 'MAL',
  'Mat': 'MAT', 'Mrk': 'MAR', 'Luk': 'LUK', 'Jhn': 'JOH', 'Act': 'ACT',
  'Rom': 'ROM', '1Co': 'CO1', '2Co': 'CO2', 'Gal': 'GAL', 'Eph': 'EPH',
  'Php': 'PHI', 'Col': 'COL', '1Th': 'TH1', '2Th': 'TH2', '1Ti': 'TI1',
  '2Ti': 'TI2', 'Tit': 'TIT', 'Phm': 'PLM', 'Heb': 'HEB', 'Jas': 'JAM',
  '1Pe': 'PE1', '2Pe': 'PE2', '1Jn': 'JO1', '2Jn': 'JO2', '3Jn': 'JO3',
  'Jud': 'JDE', 'Rev': 'REV',
};

// Aliases irregulares vindos do JSON (inglês/OpenBible) para o formato API
const EXTENDED_ALIASES: Record<string, string> = {
  'TITUS': 'TIT', '1TIM': 'TI1', '2TIM': 'TI2', 'ZEPH': 'ZEP', '1CHR': 'CH1', '2CHR': 'CH2',
  'PS': 'PSA', 'EZEK': 'EZE', 'MATT': 'MAT', 'EZRA': 'EZR', 'JOSH': 'JOS', 'DEUT': 'DEU',
  '1COR': 'CO1', '2COR': 'CO2', '1SAM': 'SA1', '2SAM': 'SA2', '1KGS': 'KG1', '2KGS': 'KG2',
  'PROV': 'PRO', 'ECCL': 'ECC', 'SONG': 'SOL', 'CANT': 'SOL', 'IS': 'ISA', 'JONAH': 'JON',
  'MICAH': 'MIC', 'NAHUM': 'NAH', 'MARK': 'MAR', 'LUKE': 'LUK', 'JOHN': 'JOH', 'ACTS': 'ACT',
  'PHIL': 'PHI', '1THESS': 'TH1', '2THESS': 'TH2', 'PHILEM': 'PLM', 'JAMES': 'JAM',
  '1PET': 'PE1', '2PET': 'PE2', '1JOHN': 'JO1', '2JOHN': 'JO2', '3JOHN': 'JO3', 'JUDE': 'JDE',
  'EXOD': 'EXO', 'JUDG': 'JDG', 'RUTH': 'RUT', 'ESTH': 'EST', 'OBAD': 'OBA'
};

// Mapeamento inverso: API.Bible → OpenBible
export const API_TO_OPENBIBLE: Record<string, string> = Object.fromEntries(
  Object.entries(OPENBIBLE_TO_API).map(([k, v]) => [v, k])
);

// Nomes em português para exibição no painel
export const BOOK_NAMES_PT: Record<string, string> = {
  GEN: 'Gênesis', EXO: 'Êxodo', LEV: 'Levítico', NUM: 'Números', DEU: 'Deuteronômio',
  JOS: 'Josué', JDG: 'Juízes', RUT: 'Rute', 'SA1': '1 Samuel', 'SA2': '2 Samuel',
  'KG1': '1 Reis', 'KG2': '2 Reis', 'CH1': '1 Crônicas', 'CH2': '2 Crônicas',
  EZR: 'Esdras', NEH: 'Neemias', EST: 'Ester', JOB: 'Jó', PSA: 'Salmos',
  PRO: 'Provérbios', ECC: 'Eclesiastes', SOL: 'Cantares', ISA: 'Isaías',
  JER: 'Jeremias', LAM: 'Lamentações', EZE: 'Ezequiel', DAN: 'Daniel',
  HOS: 'Oséias', JOE: 'Joel', AMO: 'Amós', OBA: 'Obadias', JON: 'Jonas',
  MIC: 'Miquéias', NAH: 'Naum', HAB: 'Habacuque', ZEP: 'Sofonias',
  HAG: 'Ageu', ZAC: 'Zacarias', MAL: 'Malaquias',
  MAT: 'Mateus', MAR: 'Marcos', LUK: 'Lucas', JOH: 'João', ACT: 'Atos',
  ROM: 'Romanos', 'CO1': '1 Coríntios', 'CO2': '2 Coríntios', GAL: 'Gálatas',
  EPH: 'Efésios', PHI: 'Filipenses', COL: 'Colossenses', 'TH1': '1 Tessalonicenses',
  'TH2': '2 Tessalonicenses', 'TI1': '1 Timóteo', 'TI2': '2 Timóteo',
  TIT: 'Tito', PLM: 'Filemom', HEB: 'Hebreus', JAM: 'Tiago',
  'PE1': '1 Pedro', 'PE2': '2 Pedro', 'JO1': '1 João', 'JO2': '2 João',
  'JO3': '3 João', JDE: 'Judas', REV: 'Apocalipse',
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
