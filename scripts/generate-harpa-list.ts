import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const HARPA_DIR = path.join(PROJECT_ROOT, 'public', 'bible', 'harpa');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'src', 'data', 'harpa-hymns.json');

interface HarpaHymnEntry {
  numero: number;
  titulo: string;
  tituloFormatado: string;
  estrofes: number;
  hasAudio: boolean;
}

function toTitleCase(title: string): string {
  const minorWords = ["de", "da", "do", "das", "dos", "e", "o", "a", "os", "as", "em", "com", "para", "por", "p'ra"];
  return title
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (index > 0 && minorWords.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

const BASE_URL = 'https://audio.bibliavive.com.br/harpas';

async function checkAudioExists(numero: number, rawTitle: string): Promise<boolean> {
  const numStr = String(numero).padStart(3, "0");
  const formattedTitle = toTitleCase(rawTitle);

  const candidates = [
    `${numStr} - ${formattedTitle}.mp3`
  ];

  const words = formattedTitle.split(" ");
  if (words[0] && words[0].endsWith("s") && words[0].length > 1) {
    const singularFirst = words[0].slice(0, -1);
    const singularTitle = [singularFirst, ...words.slice(1)].join(" ");
    candidates.push(`${numStr} - ${singularTitle}.mp3`);
  }

  for (const candidate of candidates) {
    const testUrl = `${BASE_URL}/${encodeURIComponent(candidate)}`;
    try {
      const response = await fetch(testUrl, { method: 'HEAD' });
      if (response.ok) {
        return true;
      }
    } catch (err) {
      // ignore and try next candidate
    }
  }
  return false;
}

async function run() {
  try {
    console.log('Scanning directories in:', HARPA_DIR);
    const entries = await fs.readdir(HARPA_DIR, { withFileTypes: true });
    const numericDirs = entries
      .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
      .map((entry) => parseInt(entry.name, 10));

    console.log(`Found ${numericDirs.length} hymn directories.`);

    const tempHymns: Omit<HarpaHymnEntry, 'hasAudio'>[] = [];

    for (const numero of numericDirs) {
      const dirPath = path.join(HARPA_DIR, String(numero));
      const files = await fs.readdir(dirPath);
      
      // Filter only JSON files
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      const estrofesCount = jsonFiles.length;

      if (estrofesCount === 0) {
        console.warn(`Warning: Hymn folder ${numero} has no JSON files.`);
        continue;
      }

      // Sort json files numerically to find the first one
      jsonFiles.sort((a, b) => {
        const numA = parseInt(a.replace('.json', ''), 10);
        const numB = parseInt(b.replace('.json', ''), 10);
        return numA - numB;
      });

      const firstJsonFile = jsonFiles[0];
      const firstJsonPath = path.join(dirPath, firstJsonFile);
      try {
        const fileContent = await fs.readFile(firstJsonPath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        
        const rawTitle = parsed.titulo || '';
        const tituloFormatado = toTitleCase(rawTitle);

        tempHymns.push({
          numero,
          titulo: rawTitle,
          tituloFormatado,
          estrofes: estrofesCount
        });
      } catch (err) {
        console.error(`Error reading or parsing ${firstJsonPath}:`, err);
      }
    }

    // Sort by hymn number ascending
    tempHymns.sort((a, b) => a.numero - b.numero);

    console.log('Verifying audio availability on R2...');
    const hymns: HarpaHymnEntry[] = [];
    const concurrencyLimit = 30;

    for (let i = 0; i < tempHymns.length; i += concurrencyLimit) {
      const batch = tempHymns.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(
        batch.map(async (hymn) => {
          const hasAudio = await checkAudioExists(hymn.numero, hymn.titulo);
          return { ...hymn, hasAudio };
        })
      );
      hymns.push(...batchResults);
      console.log(`Checked ${Math.min(i + concurrencyLimit, tempHymns.length)} / ${tempHymns.length} hymns...`);
    }

    // Ensure output directory exists
    await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
    
    // Write JSON output
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(hymns, null, 2), 'utf-8');
    console.log(`Successfully generated ${OUTPUT_FILE} with ${hymns.length} hymns.`);
  } catch (err) {
    console.error('Failed to generate harpa list:', err);
    process.exit(1);
  }
}

run();

