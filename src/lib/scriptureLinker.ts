// ─────────────────────────────────────────────────────────────────────────────
// scriptureLinker.ts — Bíblia Vive
//
// Identificador e gerador de links automáticos para citações bíblicas em artigos.
// Converte menções como "Romanos 11:36", "Lucas 24:27", "Salmo 23" em links
// interativos para a leitura do capítulo e destaque do versículo no Bíblia Vive.
// ─────────────────────────────────────────────────────────────────────────────

import { ALL_BOOKS, type Book } from "./books";

function normalizeAlias(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Mapa de sinônimos e nomes para os 66 livros da Bíblia
const bookMap = new Map<string, Book>();
const namesSet = new Set<string>();

// Preenche dados a partir dos livros canônicos
for (const b of ALL_BOOKS) {
  namesSet.add(b.name);
  namesSet.add(b.abbrev);
  bookMap.set(normalizeAlias(b.name), b);
  bookMap.set(normalizeAlias(b.slug), b);
  bookMap.set(normalizeAlias(b.abbrev), b);

  // Variantes para livros numerados (ex: 1 João, 1Jo, I João, IJo)
  if (b.name.startsWith("1 ") || b.name.startsWith("2 ") || b.name.startsWith("3 ")) {
    const num = b.name[0];
    const restName = b.name.slice(2);
    const restAbbrev = b.abbrev.replace(/^[1-3]/, "");
    const roman = num === "1" ? "I" : num === "2" ? "II" : "III";

    namesSet.add(`${num} ${restName}`);
    namesSet.add(`${num}${restName}`);
    namesSet.add(`${num} ${restAbbrev}`);
    namesSet.add(`${num}${restAbbrev}`);
    namesSet.add(`${roman} ${restName}`);
    namesSet.add(`${roman}${restName}`);
    namesSet.add(`${roman} ${restAbbrev}`);
    namesSet.add(`${roman}${restAbbrev}`);

    bookMap.set(normalizeAlias(`${num} ${restName}`), b);
    bookMap.set(normalizeAlias(`${num}${restName}`), b);
    bookMap.set(normalizeAlias(`${num} ${restAbbrev}`), b);
    bookMap.set(normalizeAlias(`${num}${restAbbrev}`), b);
    bookMap.set(normalizeAlias(`${roman} ${restName}`), b);
    bookMap.set(normalizeAlias(`${roman}${restName}`), b);
    bookMap.set(normalizeAlias(`${roman} ${restAbbrev}`), b);
    bookMap.set(normalizeAlias(`${roman}${restAbbrev}`), b);
  }
}

// Sinônimos populares adicionais na língua portuguesa
const extraSynonyms: [string, string][] = [
  ["Salmo", "sl"],
  ["Salmos", "sl"],
  ["Cantares", "ct"],
  ["Cântico", "ct"],
  ["Cânticos", "ct"],
  ["Filemon", "fm"],
  ["1Cor", "1co"],
  ["2Cor", "2co"],
  ["1Ts", "1ts"],
  ["2Ts", "2ts"],
  ["1Tm", "1tm"],
  ["2Tm", "2tm"],
  ["1Pe", "1pe"],
  ["2Pe", "2pe"],
  ["1Jo", "1jo"],
  ["2Jo", "2jo"],
  ["3Jo", "3jo"],
  ["Apoc", "ap"],
  ["Apocalipse", "ap"],
  ["Eclesiastes", "ec"],
  ["Provérbios", "pv"],
  ["Proverbios", "pv"],
];

for (const [name, slug] of extraSynonyms) {
  const b = ALL_BOOKS.find((x) => x.slug === slug);
  if (b) {
    namesSet.add(name);
    bookMap.set(normalizeAlias(name), b);
  }
}

// Ordena nomes do mais longo ao mais curto para que "1 Coríntios" case antes de "Coríntios"
const sortedNames = Array.from(namesSet).sort((a, b) => b.length - a.length);
const bookPattern = sortedNames.map((n) => n.replace(/\s+/g, "\\s+")).join("|");

// Regex para detectar: Livro + Capítulo + [Versículo opcional]
// Suporta: Romanos 11:36, Lucas 24:27, Salmo 23, 1 Coríntios 13:4-8, João 5.39
const SCRIPTURE_REGEX = new RegExp(
  `\\b(${bookPattern})\\s+(\\d+)(?:\\s*[:.]\\s*(\\d+)(?:\\s*[-–]\\s*\\d+)?)?\\b`,
  "gi"
);

/**
 * Resolve uma citação para a URL correspondente no Bíblia Vive.
 */
export function getScriptureUrl(
  rawBook: string,
  chapter: number,
  verse?: number,
  version = "acf"
): string | null {
  const book = bookMap.get(normalizeAlias(rawBook));
  if (!book) return null;
  if (chapter < 1 || chapter > book.chapters) return null;
  return `/${version}/${book.slug}/${chapter}${verse ? `#v${verse}` : ""}`;
}

/**
 * Substitui citações bíblicas em texto simples por links Markdown.
 */
function linkifyPlainText(text: string, version = "acf"): string {
  return text.replace(SCRIPTURE_REGEX, (match, rawBook, rawChap, rawVerse) => {
    const book = bookMap.get(normalizeAlias(rawBook));
    if (!book) return match;

    const chap = parseInt(rawChap, 10);
    if (isNaN(chap) || chap < 1 || chap > book.chapters) return match;

    const verse = rawVerse ? parseInt(rawVerse, 10) : undefined;
    const url = `/${version}/${book.slug}/${chap}${verse ? `#v${verse}` : ""}`;
    return `[${match}](${url})`;
  });
}

/**
 * Converte automaticamente referências bíblicas em links Markdown,
 * protegendo blocos de código, código inline, links pré-existentes e tags HTML.
 */
export function linkifyScriptureReferences(markdown: string, version = "acf"): string {
  if (!markdown) return "";

  const tokens: string[] = [];
  const placeholder = (idx: number) => `__BV_SCRIPTURE_TOKEN_${idx}__`;

  // 1. Proteger blocos de código cercados (fenced code blocks ```...```)
  let protectedMd = markdown.replace(/(```[\s\S]*?```)/g, (match) => {
    tokens.push(match);
    return placeholder(tokens.length - 1);
  });

  // 2. Proteger código inline (`...`)
  protectedMd = protectedMd.replace(/(`[^`]+`)/g, (match) => {
    tokens.push(match);
    return placeholder(tokens.length - 1);
  });

  // 3. Proteger links Markdown já existentes: [texto](url)
  protectedMd = protectedMd.replace(/(\[[^\]]+\]\([^)]+\))/g, (match) => {
    tokens.push(match);
    return placeholder(tokens.length - 1);
  });

  // 4. Proteger tags HTML: <a ...>...</a> ou <img ...>
  protectedMd = protectedMd.replace(/(<[^>]+>)/g, (match) => {
    tokens.push(match);
    return placeholder(tokens.length - 1);
  });

  // 5. Aplicar transformação de links bíblicos no texto livre
  let transformed = linkifyPlainText(protectedMd, version);

  // 6. Restaurar os trechos protegidos na ordem inversa
  for (let i = tokens.length - 1; i >= 0; i--) {
    transformed = transformed.replace(placeholder(i), () => tokens[i]);
  }

  return transformed;
}
