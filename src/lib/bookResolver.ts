// ─────────────────────────────────────────────────────────────────────────────
// bookResolver.ts — Bíblia Vive
//
// Único ponto de resolução de livro bíblico. Centraliza os três mapas de slug
// que antes viviam espalhados em bibleApi.ts (SLUG_TO_LOCAL_ID, ORIG_LANG_NAME_MAP,
// GITHUB_VERSION_SLUGS/GITHUB_LANG_PATHS).
//
// Recebe qualquer identificador (slug de rota, sigla, nome em inglês) e devolve
// o identificador canônico para cada fonte de dados.
// ─────────────────────────────────────────────────────────────────────────────

import { findBookGlobally, OLD_TESTAMENT } from "@/lib/books";

// ─── Local JSON slug map ──────────────────────────────────────────────────────
// Maps route slugs (from books.json) to bible-main directory names where they differ.
const ROUTE_TO_LOCAL_ID: Record<string, string> = {
    jz: "jud",    // Juízes
    jo: "job",    // Jó
    joa: "jo",    // João
    atos: "act",  // Atos
    "1rs": "1kgs",
    "2rs": "2kgs",
    "1cr": "1ch",
    "2cr": "2ch",
    sl: "ps",     // Salmos
    pv: "prv",    // Provérbios
    ct: "so",     // Cânticos
    os: "ho",     // Oséias
    mq: "mi",     // Miquéias
    hc: "hk",     // Habacuque
    sf: "zp",     // Sofonias
    ag: "hg",     // Ageu
    mc: "mk",     // Marcos
    lc: "lk",     // Lucas
    ef: "eph",    // Efésios
    fp: "ph",     // Filipenses
    tg: "jm",     // Tiago
    ap: "re",     // Apocalipse
    ed: "ezr",    // Esdras
    fm: "phm",    // Filemom
};

// ─── Original language book name map ─────────────────────────────────────────
// Maps English book names (as in Hebrew/Greek JSON) to route slugs.
export const ORIG_LANG_NAME_TO_SLUG: Record<string, string> = {
    Genesis: "gn", Exodus: "ex", Leviticus: "lv", Numbers: "nm", Deuteronomy: "dt",
    Joshua: "js", Judges: "jz", Ruth: "rt", "1 Samuel": "1sm", "2 Samuel": "2sm",
    "1 Kings": "1rs", "2 Kings": "2rs", "1 Chronicles": "1cr", "2 Chronicles": "2cr",
    Ezra: "ed", Nehemiah: "ne", Esther: "et", Job: "jo", Psalms: "sl",
    Proverbs: "pv", Ecclesiastes: "ec", "Song of Solomon": "ct", Isaiah: "is",
    Jeremiah: "jr", Lamentations: "lm", Ezekiel: "ez", Daniel: "dn",
    Hosea: "os", Joel: "jl", Amos: "am", Obadiah: "ob", Jonah: "jn",
    Micah: "mq", Nahum: "na", Habakkuk: "hc", Zephaniah: "sf", Haggai: "ag",
    Zechariah: "zc", Malachi: "ml",
    Matthew: "mt", Mark: "mc", Luke: "lc", John: "joa", Acts: "atos",
    Romans: "rm", "1 Corinthians": "1co", "2 Corinthians": "2co",
    Galatians: "gl", Ephesians: "ef", Philippians: "fp", Colossians: "cl",
    "1 Thessalonians": "1ts", "2 Thessalonians": "2ts",
    "1 Timothy": "1tm", "2 Timothy": "2tm",
    Titus: "tt", Philemon: "fm", Hebrews: "hb", James: "tg",
    "1 Peter": "1pe", "2 Peter": "2pe",
    "1 John": "1jo", "2 John": "2jo", "3 John": "3jo",
    Jude: "jd", Revelation: "ap",
};

// ─── GitHub version/lang map ──────────────────────────────────────────────────
export const GITHUB_VERSION_SLUGS: Record<string, string> = {
    acf: "acf", arc: "arc", nvi: "nvi",
    aa: "aa", kja: "kja", kjv: "kjv", bbe: "bbe", rvr: "rvr",
};

export const GITHUB_LANG_PATHS: Record<string, string> = {
    acf: "pt-br", arc: "pt-br", nvi: "pt-br",
    aa: "pt-br", kja: "pt-br",
    kjv: "en", bbe: "en",
    rvr: "es",
};

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ResolvedBook {
    /** Route slug used in URL (e.g. "sl", "joa") */
    routeSlug: string;
    /** ID used in local public/bible JSON files (e.g. "ps", "jo") */
    localId: string;
    /** Display name in the current locale */
    name: string;
    /** Whether this book is in the Old Testament */
    isOldTestament: boolean;
}

/**
 * Resolves any book identifier (route slug, bookId from Supabase, etc.)
 * to a canonical ResolvedBook. Returns null if the book cannot be found.
 */
export function resolveBook(bookId: string): ResolvedBook | null {
    const book = findBookGlobally(bookId);
    if (!book) return null;

    const routeSlug = book.slug;
    const localId = ROUTE_TO_LOCAL_ID[routeSlug] ?? routeSlug;

    return {
        routeSlug,
        localId,
        name: book.name,
        isOldTestament: OLD_TESTAMENT.some((b) => b.id === book.id),
    };
}

/**
 * Returns the localId for a given route slug.
 * Used by adapters that read from public/bible/ files.
 */
export function getLocalId(routeSlug: string): string {
    return ROUTE_TO_LOCAL_ID[routeSlug] ?? routeSlug;
}
