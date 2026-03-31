import { useEffect, useRef, useState } from "react";
import { X, Book, Link2, Languages, Loader2, AlignLeft, Info, HelpCircle, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { useNavigate } from "react-router-dom";
import { useStudyData } from "@/lib/studyPanel";
import { getStrongsEntry, getLanguageLabel, getOriginalVerseText, type StrongsEntry } from "@/lib/strongs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchChapter } from "@/lib/bibleApi";
import type { CrossReference } from "@/lib/crossReferences";
import { useSubscription } from "@/hooks/useSubscription";

// Helper to strip Greek and Hebrew diacritics/vowels for pure consonant matching
function normalizeText(text: string) {
    return text.normalize("NFD").replace(/[\u0300-\u036f\u0591-\u05C7]/g, "").toLowerCase();
}

function HighlightOriginalText({ text, hoveredWord, clickedWord, isHebrew }: { text: string, hoveredWord: string | null, clickedWord: string | null, isHebrew: boolean }) {
    if (!hoveredWord && !clickedWord) return <p className="text-app-text leading-relaxed text-[1.2rem]">{text}</p>;

    const wordsToHighlight = [hoveredWord, clickedWord].filter(Boolean) as string[];
    // create a normalized mapping to find matching substrings
    let parts: { text: string, type: 'normal' | 'hover' | 'click' }[] = [{ text: text, type: 'normal' }];

    // Apply splits iteratively for clicked then hovered
    for (const hw of wordsToHighlight) {
        const cleanHw = normalizeText(hw);
        if (!cleanHw || cleanHw.length < 2) continue;

        const escaped = cleanHw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const newParts: typeof parts = [];
        for (const part of parts) {
            if (part.type !== 'normal') {
                newParts.push(part);
                continue;
            }

            // We find all occurrences of cleanHw in part.text (ignoring case)
            const regex = new RegExp(`(${escaped})`, 'gi');
            const subParts = part.text.split(regex);

            subParts.forEach((sp) => {
                if (!sp) return;
                if (normalizeText(sp) === cleanHw) {
                    newParts.push({ text: sp, type: hw === clickedWord ? 'click' : 'hover' });
                } else {
                    newParts.push({ text: sp, type: 'normal' });
                }
            });
        }
        parts = newParts;
    }

    return (
        <p className="text-app-text leading-relaxed text-[1.2rem]">
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

type TabId = "context" | "crossref" | "language" | "ai";

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
    const [activeTab, setActiveTab] = useState<TabId>("context");
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

    const { data, loading, error } = useStudyData(bookId, chapter, verse, version);

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
        { id: "context", icon: <Book className="h-3.5 w-3.5" />, label: t("study.tabContext") },
        { id: "crossref", icon: <Link2 className="h-3.5 w-3.5" />, label: t("study.tabRefs") },
        { id: "language", icon: <Languages className="h-3.5 w-3.5" />, label: t("study.tabLanguage") },
        { id: "ai", icon: <Sparkles className="h-3.5 w-3.5" />, label: "Assistente IA" },
    ];

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
                    <p className="font-serif text-[0.88rem] italic leading-relaxed text-app-text line-clamp-3">
                        "{verseText}"
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex shrink-0 border-b border-border">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-[0.7rem] font-medium transition-colors border-b-2",
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
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5" role="tabpanel">

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
                                                    <p className="font-medium text-[0.85rem] text-app-text mb-1">{data.chapterHighlight.title}</p>
                                                    <p className="text-[0.8rem] text-app-text-muted leading-relaxed">{data.chapterHighlight.summary}</p>
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
                                    {/* Language badge */}
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-mono uppercase tracking-widest",
                                            getLanguageLabel(bookId) === 'Grego'
                                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                                : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                                        )}>
                                            <Languages className="h-3 w-3" />
                                            Idioma original: {getLanguageLabel(bookId)}
                                        </span>
                                    </div>

                                    {originalTextLoading ? (
                                        <div className="animate-pulse h-12 bg-app-raised rounded-xl mt-2 mb-4" />
                                    ) : originalText ? (
                                        <div
                                            className="mt-3 mb-5 p-4 rounded-xl bg-app-raised/40 border border-border font-serif transition-colors"
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

                                    <p className="text-[0.75rem] leading-relaxed text-app-text-muted mb-2">
                                        {t("study.languageIntro")}
                                    </p>

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
                                                    const wordOriginalText = entry?.word || word.text;
                                                    const isSelected = clickedWord === wordOriginalText;

                                                    return (
                                                        <div
                                                            key={`${word.strongs}-${index}`}
                                                            className={cn(
                                                                "rounded-lg border px-3 py-3 space-y-2 transition-all cursor-pointer",
                                                                isSelected
                                                                    ? "border-gold bg-gold-bg/10 shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                                                                    : "border-border bg-app-surface hover:border-gold/40"
                                                            )}
                                                            onClick={() => setClickedWord(isSelected ? null : wordOriginalText)}
                                                            onMouseEnter={() => setHoveredWord(wordOriginalText)}
                                                            onMouseLeave={() => setHoveredWord(null)}
                                                        >
                                                            {/* Word + code badge */}
                                                            <div className="flex items-start justify-between gap-2">
                                                                <p className={cn(
                                                                    "font-mono tracking-wider leading-tight transition-transform",
                                                                    isSelected ? "text-[1.2rem] text-gold" : "text-[1.1rem]",
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
                                                                    <span className="not-italic font-normal mr-1.5 text-[0.68rem] uppercase tracking-wide opacity-60">Transliteração:</span>
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
                                                        </div>
                                                    );
                                                })}
                                                <p className="text-[0.68rem] text-app-text-muted/60 mt-2">{t("study.strongsSource")}</p>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* AI Assistant Tab */}
                            {activeTab === "ai" && (
                                <div className="space-y-4">
                                    {!isPro ? (
                                        <div className="rounded-xl border border-gold/20 bg-gold-bg/10 p-6 text-center space-y-4">
                                            <div className="mx-auto w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                                                <Lock className="h-6 w-6 text-gold" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <h3 className="text-sm font-semibold text-app-text">Recurso Exclusivo PRO</h3>
                                                <p className="text-[0.75rem] text-app-text-muted leading-relaxed">
                                                    Tenha acesso a explicações profundas e estudos teológicos instantâneos gerados por nossa Inteligência Artificial Premium.
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
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="flex -space-x-1">
                                                    <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                                                        <Sparkles className="h-2.5 w-2.5 text-blue-500" />
                                                    </div>
                                                </div>
                                                <span className="text-[0.65rem] font-bold uppercase tracking-widest text-blue-500">
                                                    Estudo com IA Ativo
                                                </span>
                                            </div>

                                            {data?.aiExplanation ? (
                                                <div className="rounded-lg border border-border bg-app-surface p-4 space-y-3">
                                                    <p className="text-[0.85rem] leading-relaxed text-app-text whitespace-pre-wrap italic">
                                                        {data.aiExplanation}
                                                    </p>
                                                    <p className="text-[0.6rem] text-app-text-muted/50 text-right uppercase">
                                                        Fonte: Bíblia Vive AI Assistant
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center space-y-3">
                                                    <div className="w-12 h-12 bg-app-raised rounded-full flex items-center justify-center mx-auto opacity-40">
                                                        <Sparkles className="h-6 w-6 text-gold" />
                                                    </div>
                                                    <p className="text-[0.8rem] text-app-text-muted">
                                                        Solicite uma análise profunda deste versículo baseado em contextos históricos e linguísticos.
                                                    </p>
                                                    <Button className="bg-app-raised text-app-text border-border hover:bg-app-raised/80">
                                                        Gerar Estudo (Em Breve)
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
        </>
    );
}
