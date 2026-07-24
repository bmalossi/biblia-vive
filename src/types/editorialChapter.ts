export interface EditorialChapter {
    id: string;
    series_name: string;
    series_order: number;
    chapter_number: number;
    title: string;
    intro_text: string;
    book_slug: string;
    book_name: string;
    chapter: number;
    verse_start?: number | null;
    verse_end?: number | null;
    publish_date: string;
    status: 'rascunho' | 'publicado';
    created_at: string;
}

/**
 * Auxiliar para construir o link interno formatado e âncora (se houver versículo)
 */
export function getEditorialChapterLink(chapter: Pick<EditorialChapter, 'book_slug' | 'chapter' | 'verse_start'>, versionSlug: string = 'nvi'): string {
    const basePath = `/${versionSlug}/${chapter.book_slug.toLowerCase()}/${chapter.chapter}`;
    if (chapter.verse_start) {
        return `${basePath}#v${chapter.verse_start}`;
    }
    return basePath;
}

/**
 * Auxiliar para construir a referência bíblica em texto (ex: "João 15:1-5" ou "Salmo 1")
 */
export function getEditorialChapterReferenceText(chapter: Pick<EditorialChapter, 'book_name' | 'chapter' | 'verse_start' | 'verse_end'>): string {
    const base = `${chapter.book_name} ${chapter.chapter}`;
    if (chapter.verse_start && chapter.verse_end) {
        return `${base}:${chapter.verse_start}-${chapter.verse_end}`;
    }
    if (chapter.verse_start) {
        return `${base}:${chapter.verse_start}`;
    }
    return base;
}
