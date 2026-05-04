// ─────────────────────────────────────────────────────────────────────────────
// chapterAdapters.ts — Bíblia Vive
//
// Adapters para leitura de capítulos bíblicos, seguindo o padrão definido em
// ADR-0004. Cada adapter implementa ChapterSourceAdapter:
//   - fetch() retorna Chapter | null
//     - null  = miss permanente (livro/versão não existe nesta fonte) → próximo adapter
//     - throw = falha transiente (rede, timeout) → orquestrador propaga
//   - slug é pré-resolvido pelo orquestrador (bookResolver.ts)
//   - cache interno à instância — singleton em produção, instância fresh em testes
// ─────────────────────────────────────────────────────────────────────────────

import { findBookGlobally, OLD_TESTAMENT } from "@/lib/books";
import { getVersionLangPath } from "@/lib/themes";
import {
    getLocalId,
    ORIG_LANG_NAME_TO_SLUG,
    GITHUB_VERSION_SLUGS,
    GITHUB_LANG_PATHS,
} from "@/lib/bookResolver";
import type { Chapter } from "@/lib/bibleApi";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const stripHtml = (content: string) =>
    content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

interface LocalBook {
    id: string;
    name: string;
    chapters: string[][];
}

function buildChapter(
    bookSlug: string,
    chapterNum: string,
    bookName: string,
    versesText: string[],
    source: Chapter["source"]
): Chapter {
    return {
        id: `${bookSlug}.${chapterNum}`,
        bookId: bookSlug,
        number: chapterNum,
        reference: `${bookName} ${chapterNum}`,
        source,
        verses: versesText.map((content, index) => ({
            id: `${bookSlug}.${chapterNum}.${index + 1}`,
            orgId: source ?? "local",
            bookId: bookSlug,
            chapterId: `${bookSlug}.${chapterNum}`,
            content,
            reference: `${bookName} ${chapterNum}:${index + 1}`,
            number: index + 1,
            text: stripHtml(content),
        })),
    };
}

// ─── ChapterSourceAdapter interface ──────────────────────────────────────────

export interface ChapterSourceAdapter {
    readonly name: "local" | "api" | "github" | "original-language";
    /**
     * @param slug - Pre-resolved route slug (e.g. "sl", "joa") from bookResolver
     * @param version - Bible version sigla (e.g. "acf", "kjv")
     * @param chapter - Chapter number as string
     * @returns Chapter if found, null if this source doesn't have it (permanent miss)
     * @throws on transient failure (network error, timeout)
     */
    fetch(slug: string, version: string, chapter: string): Promise<Chapter | null>;
}

// ─── LocalJsonAdapter ─────────────────────────────────────────────────────────

export class LocalJsonAdapter implements ChapterSourceAdapter {
    readonly name = "local" as const;
    private readonly cache = new Map<string, Promise<LocalBook>>();

    private fetchBook(slug: string, version: string): Promise<LocalBook> {
        const langPath = getVersionLangPath(version as any);
        const localId = getLocalId(slug);
        const key = `${langPath}:${version}:${localId}`;

        if (!this.cache.has(key)) {
            const loader = (async () => {
                const url = `/bible/${langPath}/${version}/${localId}/${localId}.json`;
                const res = await fetch(url);
                if (!res.ok) {
                    // 404 = permanent miss for this version/book combo
                    if (res.status === 404) return null as any;
                    throw new Error(`Local fetch failed: HTTP ${res.status}`);
                }
                return res.json() as Promise<LocalBook>;
            })();
            this.cache.set(key, loader);
        }

        return this.cache.get(key)!;
    }

    async fetch(slug: string, version: string, chapter: string): Promise<Chapter | null> {
        const book = await this.fetchBook(slug, version);
        if (!book) return null; // permanent miss

        const chapterIndex = Number(chapter) - 1;
        if (Number.isNaN(chapterIndex) || chapterIndex < 0 || chapterIndex >= book.chapters.length) {
            return null; // chapter out of range = permanent miss
        }

        const versesText = book.chapters[chapterIndex] ?? [];
        return buildChapter(slug, chapter, book.name, versesText, "local");
    }
}

// ─── ScriptureApiAdapter ──────────────────────────────────────────────────────

const VERSION_IDS: Record<string, string> = {
    acf: "bc70ef1b3b4ee1f3-01",
    arc: "a6a28cf2a6c7f48e-01",
    nvi: "5091c557b5b4c3e5-01",
    kjv: "de4e12af7f28f599-02",
};
const API_BASE = "https://api.scripture.api.bible/v1";
const API_KEY = import.meta.env.VITE_BIBLE_API_KEY;

const extractVerseNumber = (reference: string, fallback: number) => {
    const match = reference.match(/:(\d+)$/);
    return match ? Number(match[1]) : fallback;
};

export class ScriptureApiAdapter implements ChapterSourceAdapter {
    readonly name = "api" as const;

    async fetch(slug: string, version: string, chapter: string): Promise<Chapter | null> {
        const bibleId = VERSION_IDS[version];
        if (!API_KEY || !bibleId) return null; // not available for this version

        const chapterId = `${slug}.${chapter}`;
        const url = `${API_BASE}/bibles/${bibleId}/chapters/${chapterId}?content-type=json&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`;

        const res = await fetch(url, { headers: { "api-key": API_KEY } });
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`Scripture API failed: HTTP ${res.status}`);

        const payload = await res.json() as { data: Chapter };
        const raw = payload.data;
        return {
            ...raw,
            source: "api",
            verses: [...(raw.verses ?? [])]
                .map((v, i) => ({
                    ...v,
                    number: extractVerseNumber(v.reference, i + 1),
                    text: stripHtml(v.content),
                }))
                .sort((a, b) => (a.number ?? 0) - (b.number ?? 0)),
        };
    }
}

// ─── GitHubAdapter ────────────────────────────────────────────────────────────

const GITHUB_BASE = "https://raw.githubusercontent.com/MaatheusGois/bible/main";

const normalize = (value: string) =>
    value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

type GitHubBook = { id: string; name: string; chapters: string[][] };

export class GitHubAdapter implements ChapterSourceAdapter {
    readonly name = "github" as const;
    private readonly indexCache = new Map<string, Promise<GitHubBook[]>>();
    private readonly bookCache = new Map<string, Promise<GitHubBook>>();

    private fetchIndex(version: string): Promise<GitHubBook[]> {
        const vSlug = GITHUB_VERSION_SLUGS[version] ?? "acf";
        const lang = GITHUB_LANG_PATHS[version] ?? "pt-br";
        const key = `${lang}:${vSlug}`;
        if (!this.indexCache.has(key)) {
            this.indexCache.set(key, fetch(`${GITHUB_BASE}/versions/${lang}/${vSlug}.json`).then(r => r.json()));
        }
        return this.indexCache.get(key)!;
    }

    private async fetchBook(slug: string, version: string): Promise<GitHubBook | null> {
        const vSlug = GITHUB_VERSION_SLUGS[version] ?? "acf";
        const lang = GITHUB_LANG_PATHS[version] ?? "pt-br";
        const localId = getLocalId(slug);
        const key = `${lang}:${vSlug}:${localId}`;

        if (!this.bookCache.has(key)) {
            const loader = (async () => {
                const index = await this.fetchIndex(version);
                const ids = [slug, localId].map(v => normalize(String(v)));
                const match = index.find(b => ids.includes(normalize(b.id)));
                if (!match) return null;
                const res = await fetch(`${GITHUB_BASE}/versions/${lang}/${vSlug}/${match.id}/${match.id}.json`);
                if (!res.ok) throw new Error(`GitHub fetch failed: HTTP ${res.status}`);
                return res.json() as Promise<GitHubBook>;
            })();
            this.bookCache.set(key, loader);
        }

        return this.bookCache.get(key)!;
    }

    async fetch(slug: string, version: string, chapter: string): Promise<Chapter | null> {
        const book = await this.fetchBook(slug, version);
        if (!book) return null;

        const chapterIndex = Number(chapter) - 1;
        if (Number.isNaN(chapterIndex) || chapterIndex < 0 || chapterIndex >= book.chapters.length) {
            return null;
        }

        return buildChapter(slug, chapter, book.name, book.chapters[chapterIndex] ?? [], "github");
    }
}

// ─── OriginalLanguageAdapter ──────────────────────────────────────────────────

type OrigLangVerse = { verse: number; text: string };
type OrigLangBook = { book: string; chapters: { chapter: number; verses: OrigLangVerse[] }[] };

export class OriginalLanguageAdapter implements ChapterSourceAdapter {
    readonly name = "original-language" as const;
    private hebrew: OrigLangBook[] | null = null;
    private greek: OrigLangBook[] | null = null;

    private async getdata(slug: string): Promise<{ data: OrigLangBook[]; langLabel: string } | null> {
        const book = findBookGlobally(slug);
        if (!book) return null;

        const isOT = OLD_TESTAMENT.some(b => b.id === book.id);

        if (isOT) {
            if (!this.hebrew) {
                const res = await fetch("/bible/antigo_testamento_hebraico.json");
                if (!res.ok) throw new Error("Could not load Hebrew data");
                this.hebrew = await res.json() as OrigLangBook[];
            }
            return { data: this.hebrew, langLabel: "Hebraico" };
        } else {
            if (!this.greek) {
                const res = await fetch("/bible/novo_testamento_grego.json");
                if (!res.ok) throw new Error("Could not load Greek data");
                this.greek = await res.json() as OrigLangBook[];
            }
            return { data: this.greek, langLabel: "Grego" };
        }
    }

    async fetch(slug: string, _version: string, chapter: string): Promise<Chapter | null> {
        const result = await this.getdata(slug);
        if (!result) return null;

        const { data, langLabel } = result;
        const book = findBookGlobally(slug);
        const bookName = book?.name ?? slug;

        const entry =
            data.find(b => ORIG_LANG_NAME_TO_SLUG[b.book] === slug) ??
            data.find(b => b.book.toLowerCase().includes(slug.toLowerCase()));

        if (!entry) return null;

        const chapterNum = Number(chapter);
        const chapterEntry = entry.chapters.find(c => c.chapter === chapterNum);
        if (!chapterEntry) return null;

        return {
            id: `${slug}.${chapter}`,
            bookId: slug,
            number: chapter,
            reference: `${bookName} ${chapter} (${langLabel})`,
            source: "local",
            verses: chapterEntry.verses.map(v => ({
                id: `${slug}.${chapter}.${v.verse}`,
                orgId: "original-lang",
                bookId: slug,
                chapterId: `${slug}.${chapter}`,
                content: v.text,
                reference: `${bookName} ${chapter}:${v.verse}`,
                number: v.verse,
                text: v.text,
            })),
        };
    }
}

// ─── Singleton instances (production) ────────────────────────────────────────

export const localAdapter = new LocalJsonAdapter();
export const apiAdapter = new ScriptureApiAdapter();
export const githubAdapter = new GitHubAdapter();
export const originalLanguageAdapter = new OriginalLanguageAdapter();
