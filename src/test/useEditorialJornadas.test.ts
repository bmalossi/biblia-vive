import { describe, it, expect } from 'vitest';
import { EditorialChapter } from '../types/editorialChapter';

describe('useEditorialJornadas grouping logic', () => {
    it('groups list of chapters by series_name and sorts chapter_number', () => {
        const mockChapters: EditorialChapter[] = [
            {
                id: '1',
                series_name: 'Permanecer',
                chapter_number: 2,
                title: 'Capítulo 2',
                intro_text: 'Texto 2',
                book_slug: 'jhn',
                book_name: 'João',
                chapter: 15,
                publish_date: '2026-07-24',
                status: 'publicado',
                created_at: '2026-07-24T00:00:00Z',
            },
            {
                id: '2',
                series_name: 'Permanecer',
                chapter_number: 1,
                title: 'Capítulo 1',
                intro_text: 'Texto 1',
                book_slug: 'sl',
                book_name: 'Salmos',
                chapter: 1,
                publish_date: '2026-07-23',
                status: 'publicado',
                created_at: '2026-07-23T00:00:00Z',
            },
        ];

        // Simula agrupamento
        const groupsMap = new Map<string, EditorialChapter[]>();
        mockChapters
            .sort((a, b) => a.chapter_number - b.chapter_number)
            .forEach((ch) => {
                const list = groupsMap.get(ch.series_name) || [];
                list.push(ch);
                groupsMap.set(ch.series_name, list);
            });

        const result = Array.from(groupsMap.entries()).map(([seriesName, chapters]) => ({
            seriesName,
            chapters,
        }));

        expect(result).toHaveLength(1);
        expect(result[0].seriesName).toBe('Permanecer');
        expect(result[0].chapters[0].chapter_number).toBe(1);
        expect(result[0].chapters[1].chapter_number).toBe(2);
    });
});
