const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('palavras_de_jesus_completo.md', 'utf-8');
const lines = content.split('\n');

// Map Markdown Header -> App Slug
const bookMap = {
  'Matthew': 'mt',
  'Mark': 'mc',
  'Luke': 'lc',
  'John': 'joa',
  'Acts': 'atos',
  'Romans': 'rm',
  '1 Corinthians': '1co',
  '2 Corinthians': '2co',
  'Galatians': 'gl',
  'Ephesians': 'ef',
  'Philippians': 'fp',
  'Colossians': 'cl',
  '1 Thessalonians': '1ts',
  '2 Thessalonians': '2ts',
  '1 Timothy': '1tm',
  '2 Timothy': '2tm',
  'Titus': 'tt',
  'Philemon': 'fm',
  'Hebrews': 'hb',
  'James': 'tg',
  '1 Peter': '1pe',
  '2 Peter': '2pe',
  '1 John': '1jo',
  '2 John': '2jo',
  '3 John': '3jo',
  'Jude': 'jd',
  'Revelation': 'ap'
};

// Map App Slug -> KJV Data Folder Name
const kjvFolderMap = {
  'mt': 'mt',
  'mc': 'mk',
  'lc': 'lk',
  'joa': 'jo',
  'atos': 'act',
  'rm': 'rm',
  '1co': '1co',
  '2co': '2co',
  'gl': 'gl',
  'ef': 'eph',
  'fp': 'ph',
  'cl': 'cl',
  '1ts': '1ts',
  '2ts': '2ts',
  '1tm': '1tm',
  '2tm': '2tm',
  'tt': 'tt',
  'fm': 'phm',
  'hb': 'hb',
  'tg': 'jm',
  '1pe': '1pe',
  '2pe': '2pe',
  '1jo': '1jo',
  '2jo': '2jo',
  '3jo': '3jo',
  'jd': 'jd',
  'ap': 're'
};

let currentBook = null;
let currentChapter = null;

const result = {};

for (const line of lines) {
  const tLine = line.trim();
  if (!tLine) continue;

  if (tLine.startsWith('## ')) {
    const bName = tLine.substring(3).trim();
    currentBook = bookMap[bName] || bName;
    if (!result[currentBook]) result[currentBook] = {};
  } else if (tLine.startsWith('### Capítulo ')) {
    currentChapter = tLine.replace('### Capítulo ', '').trim();
    if (!result[currentBook][currentChapter]) result[currentBook][currentChapter] = [];
  } else if (!tLine.startsWith('>') && !tLine.startsWith('#')) {
    if (currentBook && currentChapter) {
      result[currentBook][currentChapter].push(tLine);
    }
  }
}

const kjvDir = path.join(__dirname, 'public', 'bible', 'en', 'kjv');
const verseMapping = {};

let totalFound = 0;

function cleanString(str) {
  // Normalize string for fuzzy comparison
  return str.replace(/[^a-zA-Z]/g, '').toLowerCase();
}

console.log('Starting cross-reference with KJV data...');

for (const [appSlug, chapters] of Object.entries(result)) {
  verseMapping[appSlug] = {};
  const folderName = kjvFolderMap[appSlug] || appSlug;
  const bookPath = path.join(kjvDir, folderName);

  if (!fs.existsSync(bookPath)) {
    console.warn(`Book directory not found: ${bookPath} (Slug: ${appSlug})`);
    continue;
  }

  for (const [chapter, snippets] of Object.entries(chapters)) {
    verseMapping[appSlug][chapter] = [];

    // Join all snippets for this chapter into one search string
    const giantChapterSnippet = cleanString(snippets.join(' '));

    const chPath = path.join(bookPath, chapter);
    if (!fs.existsSync(chPath)) {
      console.warn(`Chapter directory not found: ${chPath}`);
      continue;
    }

    const verseFiles = fs.readdirSync(chPath).filter(f => f.endsWith('.json'));

    for (const vFile of verseFiles) {
      const vNum = parseInt(vFile.replace('.json', ''));
      const verseStr = fs.readFileSync(path.join(chPath, vFile), 'utf-8');

      const cleanVerse = cleanString(verseStr);

      let found = false;
      const chunkSize = 25; // Good balance

      if (cleanVerse.length <= chunkSize) {
        if (giantChapterSnippet.includes(cleanVerse)) found = true;
      } else {
        // Check chunks to ensure we match even if punctuation/spacing differs slightly
        for (let i = 0; i <= cleanVerse.length - chunkSize; i += 10) {
          const chunk = cleanVerse.substring(i, i + chunkSize);
          if (giantChapterSnippet.includes(chunk)) {
            found = true;
            break;
          }
        }
      }

      if (found) {
        verseMapping[appSlug][chapter].push(vNum);
        totalFound++;
      }
    }
    verseMapping[appSlug][chapter].sort((a, b) => a - b);
  }
}

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

fs.writeFileSync(path.join(publicDir, 'red_letters_verses.json'), JSON.stringify(verseMapping, null, 2));
console.log(`Done! Found ${totalFound} verses representing Jesus words.`);
console.log(`Mapping saved to public/red_letters_verses.json`);
