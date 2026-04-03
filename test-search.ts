
import { searchLocalBible } from './src/lib/bibleApi';
import { ALL_BOOKS } from './src/lib/books';

async function test() {
    console.log("--- Testing General Search ('amor') ---");
    const results = await searchLocalBible('acf', 'amor', 5);
    console.log(`Total: ${results.total}`);
    results.verses.forEach(v => console.log(`[${v.reference}] ${v.text.substring(0, 50)}...`));

    console.log("\n--- Testing Scoped Search ('amor em gn') ---");
    const scoped = await searchLocalBible('acf', 'amor em gn', 5);
    console.log(`Total: ${scoped.total}`);
    scoped.verses.forEach(v => console.log(`[${v.reference}] ${v.text.substring(0, 50)}...`));

    const onlyGn = scoped.verses.every(v => v.bookId === 'gn' || v.bookId === 'genesis');
    console.log(`Is strictly Genesis? ${onlyGn}`);
}

test().catch(console.error);
