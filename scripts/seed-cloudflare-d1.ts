import fs from "node:fs";
import path from "node:path";
import booksData from "../src/data/books.json";

const ROUTE_TO_LOCAL_ID: Record<string, string> = {
  jz: "jud",
  jo: "job",
  joa: "jo",
  atos: "act",
  "1rs": "1kgs",
  "2rs": "2kgs",
  "1cr": "1ch",
  "2cr": "2ch",
  sl: "ps",
  pv: "prv",
  ct: "so",
  os: "ho",
  mq: "mi",
  hc: "hk",
  sf: "zp",
  ag: "hg",
  mc: "mk",
  lc: "lk",
  ef: "eph",
  fp: "ph",
  tg: "jm",
  ap: "re",
  ed: "ezr",
  fm: "phm",
};

interface BookDef {
  id: string;
  slug: string;
  name: string;
  chapters: number;
  abbrev: string;
  testament: "VT" | "NT";
}

const ALL_BOOKS: BookDef[] = [
  ...booksData.old_testament.map((b) => ({ ...b, testament: "VT" as const })),
  ...booksData.new_testament.map((b) => ({ ...b, testament: "NT" as const })),
];

const VERSIONS = ["acf", "nvi", "arc", "kja", "aa"] as const;
type Version = (typeof VERSIONS)[number];

function stripHtml(content: string): string {
  return content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

export interface SeedOptions {
  versions?: Version[];
  outputDir?: string;
  batchSize?: number;
}

export function generateSeedSql(options: SeedOptions = {}) {
  const selectedVersions = options.versions || [...VERSIONS];
  const outputDir = options.outputDir || path.resolve(process.cwd(), "cloudflare/search-worker/seeds");
  const batchSize = options.batchSize || 250;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const results: Record<string, number> = {};

  for (const version of selectedVersions) {
    console.log(`\nGerando seed SQL para versão [${version.toUpperCase()}]...`);
    const versionDir = path.resolve(process.cwd(), `public/bible/pt-br/${version}`);
    if (!fs.existsSync(versionDir)) {
      console.warn(`Diretório não encontrado para versão ${version}: ${versionDir}`);
      continue;
    }

    const outputFile = path.join(outputDir, `seed_${version}.sql`);
    const writeStream = fs.createWriteStream(outputFile, { encoding: "utf-8" });

    writeStream.write(`-- Seed SQL para Bíblia Vive - Versão ${version.toUpperCase()}\n`);
    writeStream.write(`-- Gerado automaticamente em ${new Date().toISOString()}\n\n`);

    let totalVerses = 0;
    let currentBatch: string[] = [];

    const flushBatch = () => {
      if (currentBatch.length === 0) return;
      writeStream.write(
        `INSERT INTO bible_search_fts (version, book_id, book_name, testament, chapter, verse, text) VALUES\n`
      );
      writeStream.write(currentBatch.join(",\n") + ";\n\n");
      currentBatch = [];
    };

    for (const book of ALL_BOOKS) {
      const localId = ROUTE_TO_LOCAL_ID[book.slug] || book.slug;
      const jsonPath = path.join(versionDir, localId, `${localId}.json`);

      if (!fs.existsSync(jsonPath)) {
        console.warn(`Arquivo não encontrado: ${jsonPath}`);
        continue;
      }

      const raw = fs.readFileSync(jsonPath, "utf-8");
      const bookData = JSON.parse(raw) as { name: string; chapters: string[][] };
      const bookName = bookData.name || book.name;

      bookData.chapters.forEach((chapterVerses, cIndex) => {
        const chapterNum = cIndex + 1;
        chapterVerses.forEach((content, vIndex) => {
          const verseNum = vIndex + 1;
          const cleanText = stripHtml(content);
          if (!cleanText) return;

          totalVerses++;
          const rowSql = `  ('${version}', '${book.slug}', '${escapeSql(bookName)}', '${book.testament}', ${chapterNum}, ${verseNum}, '${escapeSql(cleanText)}')`;
          currentBatch.push(rowSql);

          if (currentBatch.length >= batchSize) {
            flushBatch();
          }
        });
      });
    }

    flushBatch();
    writeStream.end();

    results[version] = totalVerses;
    console.log(`Versão ${version.toUpperCase()}: ${totalVerses.toLocaleString()} versículos exportados para ${outputFile}`);
  }

  return results;
}

// Execução direta via CLI: npx tsx scripts/seed-cloudflare-d1.ts [acf|all]
const args = process.argv.slice(2);
const target = args[0]?.toLowerCase();

const versionsToRun: Version[] = target && VERSIONS.includes(target as Version)
  ? [target as Version]
  : [...VERSIONS];

generateSeedSql({ versions: versionsToRun });
