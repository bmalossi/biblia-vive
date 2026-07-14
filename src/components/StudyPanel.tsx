import { useEffect, useRef, useState } from "react";
import { useCommentaryQuota } from "@/hooks/useCommentaryQuota";
import { X, Book, Link2, Languages, Loader2, AlignLeft, Info, Hash, HelpCircle, Lock, Quote, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { useNavigate } from "react-router-dom";
import { useStudyData } from "@/hooks/useStudyData";
import { requestCommentary } from "@/lib/studyPanel";

import { getStrongsEntry, getLanguageLabel, getOriginalVerseText, type StrongsEntry } from "@/lib/strongs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchChapter } from "@/lib/bibleApi";
import type { CrossReference } from "@/lib/crossReferences";
import { useSubscription } from "@/hooks/useSubscription";
import { BiblicalCommentary } from "./BiblicalCommentary";
import { toast } from "@/hooks/useToast";
import CommentaryQuota from "./CommentaryQuota";
import { RateLimitDialog } from "./RateLimitDialog";

// Helper to strip Greek and Hebrew diacritics/vowels for pure consonant matching
function normalizeText(text: string) {
    return text.normalize("NFD").replace(/[\u0300-\u036f\u0591-\u05C7]/g, "").toLowerCase();
}

// ─── Hebrew-specific matching helpers ────────────────────────────────────────
// Common Hebrew proclitic prefixes (single consonants that weld to the next word):
// ב (in/with), ו (and), ה (the/interrogative), ל (to/for), כ (as/like), מ (from), ש (that/who)
const HEB_PREFIXES = ['\u05D1', '\u05D5', '\u05D4', '\u05DC', '\u05DB', '\u05DE', '\u05E9'];

/**
 * Normalizes final (sofit) letter forms to their medial equivalents.
 * Hebrew has five letters with distinct word-final shapes:
 *   ף (pe-sofit U+05E3)  → פ (pe U+05E4)
 *   ם (mem-sofit U+05DD) → מ (mem U+05DE)
 *   ן (nun-sofit U+05DF) → נ (nun U+05E0)
 *   ך (kaf-sofit U+05DA) → כ (kaf U+05DB)
 *   ץ (tsadi-sofit U+05E5) → צ (tsadi U+05E6)
 * The lexicon stores lemmas with sofit forms at the end, but when a word takes a
 * suffix (e.g. ו, ים) the letter is no longer final, so the text uses the medial form.
 */
function normalizeFinalLetters(word: string): string {
    return word
        .replace(/\u05E3/g, '\u05E4')  // ף → פ
        .replace(/\u05DD/g, '\u05DE')  // ם → מ
        .replace(/\u05DF/g, '\u05E0')  // ן → נ
        .replace(/\u05DA/g, '\u05DB')  // ך → כ
        .replace(/\u05E5/g, '\u05E6'); // ץ → צ
}

/**
 * Returns the search lemma with interior vav (ו), yod (י), and alef (א) removed.
 * These letters often act as matres lectionis (vowel carriers) in the full
 * lexicon form but are absent in the consonant-only text stored in the JSON.
 * Examples:
 *   "בוא" (bet-vav-alef) → "בא" (bet-alef)  — defective form of 'to come'
 *   "יזרעאלית" → "יזרעלית"                    — alef mater in proper name Jezreel
 * Only removes interior occurrences (not first or last char) to avoid over-stripping.
 */
function stripMatresLectionis(word: string): string {
    if (word.length <= 2) return word;
    let result = word[0];
    for (let i = 1; i < word.length - 1; i++) {
        const cp = word.charCodeAt(i);
        // Skip interior ו (vav), י (yod), or א (alef) — common matres lectionis
        if (cp === 0x05D5 || cp === 0x05D9 || cp === 0x05D0) continue;
        result += word[i];
    }
    result += word[word.length - 1];
    return result;
}

/**
 * Prepare all forms of a search lemma for matching:
 *  - normalize final letters (sofit → medial)
 *  - strip matres lectionis
 * Returns [normalizedFull, defective]
 */
function prepareLemmaForms(searchLemma: string): [string, string] {
    const normalized = normalizeFinalLetters(searchLemma);
    const defective = stripMatresLectionis(normalized);
    return [normalized, defective];
}

/**
 * Pass 2: For a given search lemma (already stripped of niqqud) and a text token,
 * returns true when the token "contains" the lemma accounting for:
 * 1. Exact token match (e.g. "דוד" === "דוד")
 * 2. Token with one or more leading proclitic prefixes stripped matches the lemma
 *    (e.g. token "ודוד" → strip "ו" → "דוד" === "דוד")
 * 3. Any of the above using the defective form of the lemma (matres stripped)
 *    (e.g. lemma "בוא" → defective "בא"; token "בבא" → strip "ב" → "בא" === "בא")
 * 4. Final-letter normalization applied to both sides
 *
 * Matching is ALWAYS at full-token level to prevent false positives from substring search.
 */
function hebrewTokenMatches(token: string, searchLemma: string): boolean {
    const [normalized, defective] = prepareLemmaForms(searchLemma);
    const normToken = normalizeFinalLetters(token);

    // Build all prefix-stripped variants of the token (strip up to 3 leading prefixes)
    const tokenVariants: string[] = [normToken];
    let cur = normToken;
    for (let i = 0; i < 3 && cur.length > 1; i++) {
        if (HEB_PREFIXES.includes(cur[0])) {
            cur = cur.slice(1);
            tokenVariants.push(cur);
        } else break;
    }

    for (const variant of tokenVariants) {
        const defVariant = stripMatresLectionis(variant);
        if (
            variant === normalized || 
            variant === defective ||
            defVariant === defective ||
            defVariant === normalized
        ) return true;
    }
    return false;
}

/**
 * Pass 3: substring containment — checks if the lemma's consonants appear
 * as a contiguous substring within the text token (handles verb conjugations
 * with prefixes + suffixes, e.g. "שרף" inside "וישרפו").
 * Only applies to lemmas with ≥ 3 consonants to avoid false positives.
 */
function hebrewTokenContains(token: string, searchLemma: string): boolean {
    if (searchLemma.length < 3) return false;
    const [normalized, defective] = prepareLemmaForms(searchLemma);
    const normToken = normalizeFinalLetters(token);
    const defToken = stripMatresLectionis(normToken);
    return (
        normToken.includes(normalized) || 
        (defective.length >= 3 && normToken.includes(defective)) ||
        (defective.length >= 3 && defToken.includes(defective))
    );
}



function HighlightOriginalText({ text, hoveredWord, clickedWord, isHebrew }: { text: string, hoveredWord: string | null, clickedWord: string | null, isHebrew: boolean }) {
    // FONT SIZE: Change 'text-[0.9rem]' below to adjust the original text size.
    // File: src/components/StudyPanel.tsx — function HighlightOriginalText
    if (!hoveredWord && !clickedWord) return <p className={cn("text-app-text leading-relaxed text-[0.9rem]", isHebrew && "font-hebrew")}>{text}</p>;

    const wordsToHighlight = [hoveredWord, clickedWord].filter(Boolean) as string[];
    let parts: { text: string, type: 'normal' | 'hover' | 'click' }[] = [{ text: text, type: 'normal' }];

    for (const hw of wordsToHighlight) {
        // Strip only diacritics (not the base chars themselves) for matching
        const cleanHw = hw.normalize("NFD").replace(/[\u0300-\u036f\u0591-\u05C7]/g, "");
        if (!cleanHw || cleanHw.length < 1) continue;

        const escaped = cleanHw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const newParts: typeof parts = [];
        for (const part of parts) {
            if (part.type !== 'normal') {
                newParts.push(part);
                continue;
            }

            // ── Pass 1: existing substring search ──────────────────────────
            // Normalize the source text the same way
            const normalizedPart = part.text.normalize("NFD").replace(/[\u0300-\u036f\u0591-\u05C7]/g, "");
            const regex = new RegExp(`(${escaped})`, 'gi');
            const matches = [...normalizedPart.matchAll(regex)];

            if (matches.length > 0) {
                // Re-build from original text using match indices
                let lastIndex = 0;
                for (const match of matches) {
                    const start = match.index!;
                    const end = start + match[0].length;
                    if (start > lastIndex) newParts.push({ text: part.text.slice(lastIndex, start), type: 'normal' });
                    newParts.push({ text: part.text.slice(start, end), type: hw === clickedWord ? 'click' : 'hover' });
                    lastIndex = end;
                }
                if (lastIndex < part.text.length) newParts.push({ text: part.text.slice(lastIndex), type: 'normal' });
                continue;
            }

            // ── Pass 2: Hebrew token-level matching (prefix + defective spelling) ──
            // Only runs when Pass 1 found nothing AND we are in a Hebrew context.
            if (isHebrew) {
                // Split on whitespace, preserving offsets in the original part.text
                const tokenRegex = /\S+/g;
                let tokenMatch: RegExpExecArray | null;
                // Collect all matching token ranges first, then rebuild
                const tokenHits: Array<{ start: number; end: number }> = [];
                while ((tokenMatch = tokenRegex.exec(normalizedPart)) !== null) {
                    const tokenStr = tokenMatch[0];
                    if (hebrewTokenMatches(tokenStr, cleanHw)) {
                        tokenHits.push({ start: tokenMatch.index, end: tokenMatch.index + tokenMatch[0].length });
                    }
                }

                if (tokenHits.length > 0) {
                    let lastIndex = 0;
                    for (const { start, end } of tokenHits) {
                        if (start > lastIndex) newParts.push({ text: part.text.slice(lastIndex, start), type: 'normal' });
                        newParts.push({ text: part.text.slice(start, end), type: hw === clickedWord ? 'click' : 'hover' });
                        lastIndex = end;
                    }
                    if (lastIndex < part.text.length) newParts.push({ text: part.text.slice(lastIndex), type: 'normal' });
                    continue;
                }

                // ── Pass 3: Hebrew substring containment (verb conjugations & possessive suffixes) ──
                // Handles cases where the root consonants appear inside a longer conjugated form,
                // e.g. lemma "שרף" found inside "וישרפו", lemma "אנוש"/"אנש" inside "ואנשיו".
                // Only runs for lemmas with ≥ 3 consonants to prevent false positives.
                const tokenHits3: Array<{ start: number; end: number }> = [];
                const tokenRegex3 = /\S+/g;
                let tokenMatch3: RegExpExecArray | null;
                while ((tokenMatch3 = tokenRegex3.exec(normalizedPart)) !== null) {
                    if (hebrewTokenContains(tokenMatch3[0], cleanHw)) {
                        tokenHits3.push({ start: tokenMatch3.index, end: tokenMatch3.index + tokenMatch3[0].length });
                    }
                }

                if (tokenHits3.length > 0) {
                    let lastIndex = 0;
                    for (const { start, end } of tokenHits3) {
                        if (start > lastIndex) newParts.push({ text: part.text.slice(lastIndex, start), type: 'normal' });
                        newParts.push({ text: part.text.slice(start, end), type: hw === clickedWord ? 'click' : 'hover' });
                        lastIndex = end;
                    }
                    if (lastIndex < part.text.length) newParts.push({ text: part.text.slice(lastIndex), type: 'normal' });
                    continue;
                }
            }

            // No match at all — keep part unchanged
            newParts.push(part);
        }
        parts = newParts;
    }

    return (
        <p className={cn("text-app-text leading-relaxed text-[0.9rem]", isHebrew && "font-hebrew")}>
            {parts.map((p, i) => {
                if (p.type === 'click') {
                    return <mark key={i} className={cn("bg-gold text-app-bg font-bold rounded-sm px-0.5", isHebrew && "inline-block")}>{p.text}</mark>;
                }
                if (p.type === 'hover') {
                    return <mark key={i} className={cn("bg-gold-bg/60 text-gold-foreground rounded-sm px-0.5", isHebrew && "inline-block")}>{p.text}</mark>;
                }
                return <span key={i}>{p.text}</span>;
            })}
        </p>
    );
}

type TabId = "context" | "crossref" | "language" | "commentary";

export interface StudyPanelProps {
    bookId: string;
    chapter: number;
    verse: number;
    verseText: string;
    version: string;
    onClose: () => void;
}

export default function StudyPanel({ bookId, chapter, verse, verseText, version, onClose }: StudyPanelProps) {
    const { t, locale } = useTranslation();
    const navigate = useNavigate();
    const { isPro } = useSubscription();
    const currentLang = String(locale).startsWith("pt")
        ? "pt"
        : String(locale).startsWith("es")
            ? "es"
            : "en";
    const { data, loading, error } = useStudyData(bookId, chapter, verse!, version, currentLang);

    const [activeTab, setActiveTab] = useState<TabId>("context");
    const [isGenerating, setIsGenerating] = useState(false);
    const [rateLimitStatus, setRateLimitStatus] = useState<{ open: boolean, resetAt: number | null, limit: number }>({ open: false, resetAt: null, limit: 10 });
    const [localCommentary, setLocalCommentary] = useState<string | null>(null);
    const { remaining: freeCommentaryCount, canUse: hasFreeCommentary, consume: consumeFreeCommentary, setRemaining: setRemainingFreeCommentary } = useCommentaryQuota('verse');
    const [strongsCache, setStrongsCache] = useState<Record<string, StrongsEntry>>({});
    const [strongsLoading, setStrongsLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const [selectedRef, setSelectedRef] = useState<CrossReference | null>(null);
    const [refText, setRefText] = useState<string>("");
    const [refLoading, setRefLoading] = useState(false);

    const [originalText, setOriginalText] = useState<string | null>(null);
    const [originalTextLoading, setOriginalTextLoading] = useState(false);
    const [hoveredWord, setHoveredWord] = useState<string | null>(null);
    const [clickedWord, setClickedWord] = useState<string | null>(null);
    const [isLexiconExpanded, setIsLexiconExpanded] = useState(false);



    const handleRefClick = async (ref: CrossReference) => {
        setSelectedRef(ref);
        setRefLoading(true);
        setRefText("");
        try {
            const chapterData = await fetchChapter(version, ref.bookId, String(ref.chapter));
            const targetVerse = chapterData.verses.find(v => v.number === ref.verse);
            if (targetVerse) {
                // Remove HTML tags for clean display in popup
                const cleanText = targetVerse.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
                setRefText(cleanText || targetVerse.text);
            } else {
                setRefText(t("reading.loadErrorDesc"));
            }
        } catch {
            setRefText(t("reading.loadErrorDesc"));
        } finally {
            setRefLoading(false);
        }
    };


    // Fetch Strong's definitions automatically when words are loaded
    useEffect(() => {
        if (!data?.verseWords) return;
        const fetchStrongs = async () => {
            const uniqueKeys = Array.from(new Set(data.verseWords.filter(w => w.strongs).map(w => w.strongs as string)));
            if (uniqueKeys.length === 0) return;
            setStrongsLoading(true);
            const newEntries: Record<string, StrongsEntry> = { ...strongsCache };
            let updated = false;

            for (const str of uniqueKeys) {
                if (!newEntries[str]) {
                    const entry = await getStrongsEntry(str);
                    if (entry) {
                        newEntries[str] = entry;
                        updated = true;
                    }
                }
            }
            if (updated) setStrongsCache(newEntries);
            setStrongsLoading(false);
        };

        fetchStrongs();
    }, [data?.verseWords, bookId, chapter, verse]); // Reset if verse changes

    // Load original text for the language tab
    useEffect(() => {
        if (activeTab === "language" && bookId && chapter && verse) {
            setOriginalTextLoading(true);
            setClickedWord(null); // Reset click state when changing verse/tab
            setIsLexiconExpanded(false); // Reset accordion state
            getOriginalVerseText(bookId, chapter, verse)
                .then(text => setOriginalText(text))
                .catch(() => setOriginalText(null))
                .finally(() => setOriginalTextLoading(false));
        }
    }, [activeTab, bookId, chapter, verse]);

    // Handle escape key to close
    useEffect(() => {
        panelRef.current?.focus();
    }, []);

    const tabs: { id: TabId; icon: React.ReactNode; label: string }[] = [
        { id: "context", label: t("study.tabContext"), icon: <Info className="h-3 w-3" /> },
        { id: "crossref", label: t("study.tabRefs"), icon: <Hash className="h-3 w-3" /> },
        { id: "language", label: t("study.tabLanguage"), icon: <Languages className="h-3 w-3" /> },
        { id: "commentary", label: t("study.tabCommentary"), icon: <Quote className="h-3 w-3" /> },
    ];

    const handleGenerateCommentary = async () => {
        if (!isPro && !hasFreeCommentary) {
            navigate('/pro');
            return;
        }

        try {
            setIsGenerating(true);
            const { commentaries, remaining: serverRemaining } = await requestCommentary({
                bookId,
                chapter,
                verse: verse!,
                verseText,
                version,
                language: String(locale).startsWith('pt') ? 'pt' : 'en'
            });

            setLocalCommentary(JSON.stringify(commentaries));

            if (!isPro) {
                if (serverRemaining !== undefined) {
                    setRemainingFreeCommentary(serverRemaining);
                } else {
                    consumeFreeCommentary();
                }
            }

            toast({ message: "Comentário teológico gerado com sucesso.", type: "prompt", duration: Infinity });
        } catch (err: any) {
            console.error(err);
            if (err.code === 'RATE_LIMITED') {
                if (!isPro) {
                    setRemainingFreeCommentary(0);
                }
                const finalLimit = !isPro ? 3 : err.limit;
                setRateLimitStatus({ open: true, resetAt: err.reset_at, limit: finalLimit });
            } else {
                toast({ message: "Erro ao gerar comentários: " + err.message, type: "error" });
            }
        } finally {
            setIsGenerating(false);
        }
    };

    // Reset local commentary when verse changes
    useEffect(() => {
        setLocalCommentary(null);
    }, [bookId, chapter, verse]);

    return (
        <>
            {/* Backdrop on mobile */}
            <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] lg:hidden animate-in fade-in"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <aside
                ref={panelRef}
                tabIndex={-1}
                className={cn(
                    "fixed bottom-0 right-0 z-50 flex flex-col",
                    "w-full max-w-full border-t border-border bg-app-bg shadow-2xl",
                    "lg:top-[60px] lg:bottom-0 lg:border-l lg:border-t-0 lg:w-[320px] lg:max-h-[calc(100vh-60px)]",
                    "transition-transform duration-300 ease-out",
                    "max-h-[75vh] lg:max-h-none",
                    "animate-in slide-in-from-bottom-4 lg:slide-in-from-right-4",
                )}
                aria-label={t("study.panelLabel")}
                role="complementary"
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
                    <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-app-text-muted">
                        {t("study.panelTitle")}
                    </p>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-app-text-muted hover:text-app-text"
                        onClick={onClose}
                        aria-label={t("study.closePanel")}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Selected verse preview */}
                <div className="shrink-0 border-b border-border bg-gold-bg/20 px-4 py-3">
                    <p className="mb-1 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-gold">
                        {bookId} {chapter}:{verse} · {version.toUpperCase()}
                    </p>
                    <p className={cn(version === "org" && getLanguageLabel(bookId) === "Hebraico" ? "font-hebrew" : "font-serif", "text-[0.88rem] italic leading-relaxed text-app-text line-clamp-3")}>
                        "{verseText}"
                    </p>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-4 shrink-0 border-b border-border">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center justify-center gap-1 px-0.5 py-2.5 text-[0.62rem] font-medium transition-colors border-b-2 leading-none",
                                activeTab === tab.id
                                    ? "border-gold text-gold"
                                    : "border-transparent text-app-text-muted hover:text-app-text",
                            )}
                            aria-selected={activeTab === tab.id}
                            role="tab"
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 pb-28 lg:pb-8 space-y-5" role="tabpanel">

                    {loading ? (
                        <div className="flex justify-center items-center py-10 opacity-60">
                            <Loader2 className="w-6 h-6 animate-spin text-gold" />
                        </div>
                    ) : error ? (
                        <div className="rounded-lg border border-red-900/20 bg-red-500/10 px-3 py-4 text-center">
                            <p className="text-[0.8rem] text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    ) : (
                        <>
                            {/* Context Tab */}
                            {activeTab === "context" && (
                                <div className="space-y-4">
                                    {data?.bookContext ? (
                                        <>
                                            {data.chapterHighlight && (
                                                <div className="rounded-lg border border-border bg-gold-bg/10 px-3 py-2.5 mb-4">
                                                    <p className="mb-1 flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-widest text-gold">
                                                        Destaque do Capítulo
                                                    </p>
                                                    <p className="text-[0.82rem] text-app-text leading-relaxed">{data.chapterHighlight}</p>
                                                </div>
                                            )}

                                            <div>
                                                <p className="mb-1 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-gold">
                                                    {t("study.sectionTheme")}
                                                </p>
                                                <p className="text-[0.82rem] leading-relaxed text-app-text-muted">{data.bookContext.theme}</p>
                                            </div>

                                            <div>
                                                <p className="mb-1 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-gold">
                                                    {t("study.sectionHistory")}
                                                </p>
                                                <p className="text-[0.82rem] leading-relaxed text-app-text-muted">{data.bookContext.summary}</p>
                                            </div>

                                            <div className="rounded-lg border border-border bg-app-raised px-3 py-2.5 space-y-1.5">
                                                <div className="flex items-baseline justify-between">
                                                    <span className="font-mono text-[0.58rem] uppercase tracking-widest text-app-text-muted">{t("study.author")}</span>
                                                    <span className="text-[0.78rem] text-app-text">{data.bookContext.author}</span>
                                                </div>
                                                <div className="flex items-baseline justify-between">
                                                    <span className="font-mono text-[0.58rem] uppercase tracking-widest text-app-text-muted">{t("study.period")}</span>
                                                    <span className="text-[0.78rem] text-app-text">{data.bookContext.period_written}</span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-[0.82rem] text-app-text-muted">{t("study.noContext")}</p>
                                    )}
                                </div>
                            )}

                            {/* Cross References Tab */}
                            {activeTab === "crossref" && (
                                <div className="space-y-3">
                                    <p className="text-[0.75rem] text-app-text-muted">{t("study.refsIntro")}</p>
                                    {data?.crossReferences && data.crossReferences.length > 0 ? (
                                        data.crossReferences.map((ref) => {
                                            const relevance = ref.strength >= 60 ? { label: "Alta", color: "text-green-600 dark:text-green-400" } :
                                                ref.strength >= 15 ? { label: "Média", color: "text-gold" } :
                                                    { label: "Baixa", color: "text-app-text-muted" };

                                            return (
                                                <button
                                                    key={ref.url}
                                                    type="button"
                                                    onClick={() => handleRefClick(ref)}
                                                    className="w-full text-left rounded-lg border border-border bg-app-surface px-3 py-2.5 hover:border-gold/50 hover:bg-gold-bg/20 transition-colors group"
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="flex items-center gap-1.5 font-mono text-[0.68rem] text-gold group-hover:text-gold uppercase tracking-tight">
                                                            <Link2 className="h-3 w-3 shrink-0" />
                                                            {ref.label}
                                                        </p>

                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div
                                                                    className="flex items-center gap-1 cursor-help"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <span className={cn("text-[0.6rem] font-medium", relevance.color)}>
                                                                        {relevance.label}
                                                                    </span>
                                                                    <HelpCircle className="h-2.5 w-2.5 text-app-text-muted opacity-50" />
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" align="end" className="text-[0.7rem] max-w-[200px]">
                                                                A relevância indica o nível de confirmação desta referência por diferentes fontes e estudos bíblicos históricos.
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                    <p className="text-[0.75rem] text-app-text-muted leading-snug mt-0.5">
                                                        Clique para ver o versículo
                                                    </p>
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <div className="rounded-lg border border-border bg-app-raised px-3 py-4 text-center">
                                            <p className="text-[0.8rem] text-app-text-muted">{t("study.noRefs")}</p>
                                            <p className="mt-1 text-[0.72rem] text-app-text-muted/70">{t("study.noRefsHint")}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Language Tab */}
                            {activeTab === "language" && (
                                <div className="space-y-4">
                                    {/* Sticky header for Language tab */}
                                    <div className="sticky -top-4 z-10 bg-app-bg pt-2 pb-4 -mx-4 px-4 border-b border-border/40 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)]">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-mono uppercase tracking-widest",
                                                getLanguageLabel(bookId) === 'Grego'
                                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                                            )}>
                                                <Languages className="h-3 w-3" />
                                                {t("study.originalLanguage")}: {getLanguageLabel(bookId)}
                                            </span>
                                        </div>

                                        {originalTextLoading ? (
                                            <div className="animate-pulse h-12 bg-app-raised rounded-xl" />
                                        ) : originalText ? (
                                            <div
                                                className="p-4 rounded-xl bg-app-raised/40 border border-border font-serif transition-colors"
                                                dir={getLanguageLabel(bookId) === 'Hebraico' ? 'rtl' : 'ltr'}
                                            >
                                                <HighlightOriginalText
                                                    text={originalText}
                                                    hoveredWord={hoveredWord}
                                                    clickedWord={clickedWord}
                                                    isHebrew={getLanguageLabel(bookId) === 'Hebraico'}
                                                />
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="pt-2">
                                        <p className="text-[0.75rem] leading-relaxed text-app-text-muted mb-2">
                                            {t("study.languageIntro")}
                                        </p>
                                    </div>

                                    {strongsLoading ? (
                                        <div className="flex justify-center items-center py-6 opacity-60">
                                            <Loader2 className="w-5 h-5 animate-spin text-gold" />
                                            <span className="ml-2 text-[0.75rem] text-app-text-muted">Carregando léxico...</span>
                                        </div>
                                    ) : (function () {
                                        const validWords = (data?.verseWords || []).filter(w => {
                                            if (!w.strongs) return false;
                                            if (w.strongs.startsWith('H')) {
                                                const num = parseInt(w.strongs.substring(1));
                                                return num < 9000;
                                            }
                                            return true;
                                        });

                                        if (validWords.length === 0) {
                                            return (
                                                <div className="rounded-lg border border-border bg-app-raised px-3 py-4 text-center">
                                                    <AlignLeft className="h-5 w-5 text-app-text-muted/40 mx-auto mb-2" />
                                                    <p className="text-[0.8rem] text-app-text-muted">{t("study.noStrongs")}</p>
                                                    <p className="mt-1 text-[0.72rem] text-app-text-muted/70">{t("study.noStrongsHint")}</p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="space-y-3">
                                                {validWords.map((word, index) => {
                                                    const entry = strongsCache[word.strongs!];
                                                    const isGreek = word.strongs?.startsWith('G');
                                                    // Use entry.word (Greek/Hebrew chars) as the highlight target.
                                                    // Fallback to null if word is empty (functional words with no original text)
                                                    const wordOriginalText = (entry?.word && entry.word.trim().length > 0) ? entry.word.trim() : null;
                                                    const isSelected = wordOriginalText !== null && clickedWord === wordOriginalText;

                                                    return (
                                                        <div
                                                            key={`${word.strongs}-${index}`}
                                                            className={cn(
                                                                "rounded-lg border px-3 py-3 space-y-2 transition-all cursor-pointer",
                                                                isSelected
                                                                    ? "border-gold bg-gold-bg/10 shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                                                                    : "border-border bg-app-surface hover:border-gold/40"
                                                            )}
                                                            onClick={() => {
                                                                if (wordOriginalText) {
                                                                    setClickedWord(isSelected ? null : wordOriginalText);
                                                                    setIsLexiconExpanded(false);
                                                                }
                                                            }}
                                                            onMouseEnter={() => { if (wordOriginalText) setHoveredWord(wordOriginalText); }}
                                                            onMouseLeave={() => setHoveredWord(null)}
                                                        >
                                                            {/* Word + code badge */}
                                                            <div className="flex items-start justify-between gap-2">
                                                                <p className={cn(
                                                                    "leading-tight transition-transform",
                                                                    isGreek ? "font-mono tracking-wider" : "font-hebrew",
                                                                    isSelected ? "text-[1.2rem] text-gold" : "text-[0.95rem]",
                                                                    !isSelected && (isGreek ? "text-blue-600 dark:text-blue-400" : "text-amber-700 dark:text-amber-400")
                                                                )}>
                                                                    {wordOriginalText}
                                                                </p>
                                                                <span className={cn(
                                                                    "shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-mono",
                                                                    isSelected ? "bg-gold text-app-bg font-bold" : "bg-app-raised text-app-text-muted"
                                                                )}>
                                                                    {word.strongs}
                                                                </span>
                                                            </div>

                                                            {/* Transliteration */}
                                                            {entry?.translit && (
                                                                <p className="text-[0.75rem] font-medium italic text-app-text-muted">
                                                                    <span className="not-italic font-normal mr-1.5 text-[0.68rem] uppercase tracking-wide opacity-60">{t("study.transliteration")}:</span>
                                                                    {entry.translit}
                                                                </p>
                                                            )}

                                                            {/* Localized definition */}
                                                            {entry && (entry.definition_pt || entry.definition_es || entry.definition) && (
                                                                <div className="border-t border-border/50 pt-2 mt-2">
                                                                    <p className="text-[0.68rem] uppercase tracking-wide text-app-text-muted/60 mb-1">{t("study.meaning")}</p>
                                                                    <p className="text-[0.79rem] leading-relaxed text-app-text">
                                                                        {String(locale).startsWith('pt') && entry.definition_pt
                                                                            ? entry.definition_pt
                                                                            : String(locale).startsWith('es') && entry.definition_es
                                                                                ? entry.definition_es
                                                                                : entry.definition}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Occurrences chip */}
                                                            {entry?.occurrences && (
                                                                <p className="text-[0.65rem] text-app-text-muted/50 mt-1">
                                                                    Aparece {entry.occurrences}x na Bíblia
                                                                </p>
                                                            )}

                                                            {/* Accordion Lexical */}
                                                            {isSelected && entry && (entry.root || entry.word_group || entry.usage_tags || entry.bdb_short) && (
                                                                <div 
                                                                    className="mt-3 border-t border-border/40 pt-2"
                                                                    onClick={(e) => e.stopPropagation()} // Prevent toggling selection
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setIsLexiconExpanded(!isLexiconExpanded)}
                                                                        className="flex items-center justify-between w-full py-1 text-[0.72rem] font-medium text-gold hover:text-gold/80 transition-colors"
                                                                    >
                                                                        <span>{isLexiconExpanded ? t("study.hideMore") : t("study.showMore")}</span>
                                                                        <span className={cn("transition-transform duration-200 text-[0.8rem] leading-none", isLexiconExpanded ? "rotate-180" : "")}>▾</span>
                                                                    </button>

                                                                    {isLexiconExpanded && (
                                                                        <div className="mt-2.5 space-y-3 pl-1 text-[0.75rem] text-app-text-muted animate-in fade-in slide-in-from-top-1 duration-200">
                                                                            {/* Raiz */}
                                                                            {entry.root && (
                                                                                <div className="flex items-baseline gap-2">
                                                                                    <span className="font-mono text-[0.65rem] uppercase tracking-wide opacity-60 shrink-0">{t("study.lexicalRoot")}:</span>
                                                                                    <span className="font-serif text-[0.95rem] text-amber-700 dark:text-amber-400 font-bold" dir="rtl">{entry.root}</span>
                                                                                </div>
                                                                            )}

                                                                            {/* Família Lexical */}
                                                                            {entry.word_group && (
                                                                                <div className="flex items-baseline gap-2">
                                                                                    <span className="font-mono text-[0.65rem] uppercase tracking-wide opacity-60 shrink-0">{t("study.lexicalFamily")}:</span>
                                                                                    <span className="font-medium text-app-text capitalize">
                                                                                        {locale.startsWith('pt')
                                                                                            ? (entry.word_group_pt || entry.word_group)
                                                                                            : locale.startsWith('es')
                                                                                                ? (entry.word_group_es || entry.word_group)
                                                                                                : entry.word_group}
                                                                                    </span>
                                                                                </div>
                                                                            )}

                                                                            {/* Usos */}
                                                                            {entry.usage_tags && entry.usage_tags.length > 0 && (
                                                                                <div className="space-y-1">
                                                                                    <span className="font-mono text-[0.65rem] uppercase tracking-wide opacity-60 block">{t("study.usages")}:</span>
                                                                                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                                                                                        {(locale.startsWith('pt')
                                                                                            ? (entry.usage_tags_pt || entry.usage_tags)
                                                                                            : locale.startsWith('es')
                                                                                                ? (entry.usage_tags_es || entry.usage_tags)
                                                                                                : entry.usage_tags
                                                                                        ).map((tag, tIdx) => (
                                                                                            <span 
                                                                                                key={tIdx} 
                                                                                                className="inline-flex items-center rounded bg-app-raised/80 px-2 py-0.5 text-[0.65rem] font-medium text-app-text border border-border/30 hover:border-gold/30 transition-colors"
                                                                                            >
                                                                                                {tag}
                                                                                            </span>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {/* Resumo BDB */}
                                                                            {entry.bdb_short && (function() {
                                                                                const bdbText =
                                                                                    locale.startsWith('pt')
                                                                                        ? (entry.bdb_short_pt || entry.bdb_short)
                                                                                        : locale.startsWith('es')
                                                                                            ? (entry.bdb_short_es || entry.bdb_short)
                                                                                            : entry.bdb_short;
                                                                                const isOriginal = locale.startsWith('pt')
                                                                                    ? !entry.bdb_short_pt
                                                                                    : locale.startsWith('es')
                                                                                        ? !entry.bdb_short_es
                                                                                        : false;
                                                                                return (
                                                                                    <div className="space-y-1 border-t border-border/20 pt-2.5 mt-2">
                                                                                        <div className="flex items-baseline justify-between">
                                                                                            <span className="font-mono text-[0.65rem] uppercase tracking-wide opacity-60 block">{t("study.bdbSummary")}:</span>
                                                                                            {isOriginal && (
                                                                                                <span className="text-[0.55rem] font-mono opacity-40 uppercase tracking-widest">{locale.startsWith("es") ? "fuente en inglés" : "fonte em inglês"}</span>
                                                                                            )}
                                                                                        </div>
                                                                                        <p className="text-[0.74rem] leading-relaxed text-app-text-muted/90 italic font-serif">
                                                                                            "{bdbText}"
                                                                                        </p>
                                                                                    </div>
                                                                                );
                                                                            })()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                <p className="text-[0.68rem] text-app-text-muted/60 mt-2">{t("study.strongsSource")}</p>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* Commentary Tab */}
                            {activeTab === "commentary" && (
                                <div className="space-y-4">
                                    {(!isPro && !hasFreeCommentary) && !(data?.commentaries || localCommentary) ? (
                                        <div className="rounded-xl border border-gold/20 bg-gold-bg/10 p-6 text-center space-y-4 animate-in fade-in">
                                            <div className="mx-auto w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                                                <Lock className="h-6 w-6 text-gold" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <h3 className="text-sm font-semibold text-app-text">Recurso Exclusivo PRO</h3>
                                                <p className="text-[0.75rem] text-app-text-muted leading-relaxed">
                                                    Você já utilizou seus 3 comentários teológicos gratuitos. Assine para ter acesso a 10 comentários por hora de teólogos históricos e renomados.
                                                </p>
                                            </div>
                                            <Button
                                                className="w-full bg-gold text-app-bg hover:bg-gold/90 font-bold"
                                                onClick={() => navigate('/pro')}
                                            >
                                                Assinar Plano Premium
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                            {isPro && <CommentaryQuota className="mb-2" />}
                                            {(data?.commentaries || localCommentary) ? (
                                                <BiblicalCommentary
                                                    commentaries={(function () {
                                                        try {
                                                            const parsed = localCommentary ? JSON.parse(localCommentary) : (data?.commentaries || []);
                                                            return Array.isArray(parsed) ? parsed : (parsed.commentaries || []);
                                                        } catch {
                                                            return [];
                                                        }
                                                    })()}
                                                />
                                            ) : (
                                                <div className="p-8 text-center space-y-4 bg-app-surface/40 rounded-2xl border border-border/50">
                                                    <div className="w-14 h-14 bg-gold/10 rounded-full flex items-center justify-center mx-auto">
                                                        <MessageSquare className="h-7 w-7 text-gold" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-bold text-app-text">
                                                            {t("study.commentaryIntro")}
                                                        </p>
                                                        <p className="text-[0.75rem] text-app-text-muted leading-relaxed">
                                                            Acesse perspectivas bíblicas de teólogos renomados sobre este versículo específico. {(!isPro && freeCommentaryCount > 0) && <strong className="text-gold block mt-2">Você tem {freeCommentaryCount} {freeCommentaryCount === 1 ? 'comentário gratuito disponível' : 'comentários gratuitos disponíveis'}.</strong>}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        className="w-full bg-gold text-app-bg hover:bg-gold/90 font-bold shadow-lg shadow-gold/20"
                                                        onClick={handleGenerateCommentary}
                                                        disabled={isGenerating}
                                                    >
                                                        {isGenerating ? (
                                                            <div className="flex flex-col items-center py-1">
                                                                <div className="flex items-center">
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    Analisando teologia...
                                                                </div>
                                                                <span className="text-[0.65rem] opacity-80 mt-0.5 font-normal tracking-wide">
                                                                    Isto pode levar entre 60 e 90 segundos
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            t("study.getCommentary")
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                </div>
            </aside>

            {/* Reference Popup Dialog */}
            <Dialog open={!!selectedRef} onOpenChange={(open) => !open && setSelectedRef(null)}>
                <DialogContent className="sm:max-w-md w-[95vw] rounded-2xl mx-auto top-[50%] overflow-hidden">
                    <DialogHeader className="pt-2 text-left space-y-2">
                        <DialogTitle className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-gold mt-1">
                            <Book className="h-4 w-4" />
                            {selectedRef?.label} <span className="text-app-text-muted/50 ml-1">• {version.toUpperCase()}</span>
                        </DialogTitle>
                        <DialogDescription className="sr-only">Reference verse details</DialogDescription>
                    </DialogHeader>

                    <div className="py-5 min-h-[100px] flex items-center justify-center -mx-6 px-6 bg-app-raised/30">
                        {refLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-gold/60" />
                        ) : (
                            <p className="font-serif text-[1rem] leading-relaxed text-app-text text-center italic">
                                "{refText}"
                            </p>
                        )}
                    </div>

                    <div className="flex justify-between items-center mt-2">
                        <Button
                            variant="ghost"
                            className="text-app-text-muted hover:text-app-text text-xs uppercase"
                            onClick={() => setSelectedRef(null)}
                        >
                            Fechar
                        </Button>
                        <Button
                            variant="outline"
                            className="text-xs uppercase bg-gold-bg/30 border-gold/40 text-gold hover:bg-gold-bg/60 shadow-sm"
                            onClick={() => {
                                if (selectedRef) {
                                    navigate(selectedRef.url);
                                    setSelectedRef(null);
                                    onClose();
                                }
                            }}
                        >
                            <Link2 className="h-3.5 w-3.5 mr-1.5" />
                            Ler Capítulo
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <RateLimitDialog
                open={rateLimitStatus.open}
                onOpenChange={(open) => setRateLimitStatus(prev => ({ ...prev, open }))}
                resetAt={rateLimitStatus.resetAt}
                limit={rateLimitStatus.limit}
            />
        </>
    );
}
