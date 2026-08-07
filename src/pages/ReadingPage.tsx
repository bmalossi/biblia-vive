import Layout from "@/components/Layout";
import SettingsPanel from "@/components/SettingsPanel";
import StudyPanel from "@/components/StudyPanel";
import { prefetchLexicons, getLanguageLabel } from "@/lib/strongs";
import AudioPlayer from "@/components/AudioPlayer";
import WorshipCard from "@/components/WorshipCard";
import VerseToolbar from "@/components/VerseToolbar";
import NoteModal from "@/components/NoteModal";
import AuthModal from "@/components/AuthModal";
import NotePopover from "@/components/NotePopover";
import { RateLimitDialog } from "@/components/RateLimitDialog";
import CommentaryQuota from "@/components/CommentaryQuota";
import DailyReadingBadge from "@/components/DailyReadingBadge";
import VerseCardModal from "@/components/VerseCardModal";
import type { CardData } from "@/components/VerseCardTemplates";
import { diffVerses, type DiffToken } from "@/lib/textDiff";
import { useReadingPlan } from "@/hooks/useReadingPlan";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useNotesHighlights } from "@/hooks/useNotesHighlights";
import { createNoteStore, type MemorialEntry } from "@/lib/noteStore";
import EchoBanner from "@/components/EchoBanner";
import EchoModal from "@/components/EchoModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { HIGHLIGHT_CLASSES } from "@/components/HighlightPicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useReadingPreferences } from "@/hooks/useReadingPreferences";
import { useTTS } from "@/hooks/useTTS";
import { usePageMeta } from "@/hooks/usePageMeta";
import { toast } from "@/hooks/useToast";
import { useVerseActions } from "@/hooks/useVerseActions";
import { fetchChapter, getFriendlyApiError, type Chapter } from "@/lib/bibleApi";
import { findBookBySlug, findBookGlobally, getBooksForLocale, type Book } from "@/lib/books";
import { BibleVersion, getVersion, isBibleVersion, setVersion, VERSION_OPTIONS } from "@/lib/themes";
import { Maximize2, Minimize2, Monitor, Settings, FileText, Loader2, Lock } from "lucide-react";
import { useChurchMode } from "@/hooks/useChurchMode";
import type { ChurchVerse } from "@/lib/churchChannel";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { exportNotesToPDF } from "@/lib/notesHighlights";
import { cn } from "@/lib/utils";
import { BiblicalCommentary } from "@/components/BiblicalCommentary";
import { requestCommentary } from "@/lib/studyPanel";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotebookContext } from "@/contexts/NotebookContext";
import { useCommentaryQuota } from "@/hooks/useCommentaryQuota";

interface BookContextData {
  name: string;
  period: string;
  author: string;
  theme: string;
  summary: string;
}

const CHAPTER_CACHE_PREFIX = "bv-chapter-cache-v1";
const LAST_READ_KEY = "bv_last_read";
const NEXT_CHAPTER_PREFETCH_KEY = "bv-prefetch-next-chapter";

type VerseSelection = {
  anchorKey: string;
  reference: string;
  text: string;
  verseNumber: string;
  version: string;
};

interface VerseHighlightState {
  isHashHighlighted?: boolean;
  isHovered?: boolean;
  isSelected?: boolean;
  isTTSCurrent?: boolean;
}

const stripHtml = (content: string) => content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const getVerseNumber = (reference: string) => Number(reference.match(/:(\d+)/)?.[1] ?? "0");

const getVerseHighlightClass = ({ isSelected, isTTSCurrent, isHashHighlighted, isHovered }: VerseHighlightState) => {
  const classes: string[] = [];

  if (isSelected) classes.push("bg-gold-bg ring-2 ring-gold/55");
  else if (isTTSCurrent) classes.push("bg-gold-bg ring-2 ring-gold/60");
  else if (isHashHighlighted) classes.push("bg-gold-bg ring-1 ring-gold/35");
  else if (isHovered) classes.push("bg-app-raised ring-1 ring-border");

  return classes.join(" ");
};

const getChapterCacheKey = (version: string, bookId: string, chapter: number) =>
  `${CHAPTER_CACHE_PREFIX}:${version}:${bookId}:${chapter}`;

const readCachedChapter = (version: string, bookId: string, chapter: number) => {
  try {
    const raw = localStorage.getItem(getChapterCacheKey(version, bookId, chapter));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data?: Chapter };
    return parsed?.data ?? null;
  } catch {
    return null;
  }
};

const writeCachedChapter = (version: string, bookId: string, chapter: number, data: Chapter) => {
  try {
    localStorage.setItem(getChapterCacheKey(version, bookId, chapter), JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // ignore
  }
};

interface ChapterMemorialBlockProps {
  bookId: string;
  chapter: number;
  userId: string | null;
}

function ChapterMemorialBlock({ bookId, chapter, userId }: ChapterMemorialBlockProps) {
  const [entries, setEntries] = useState<MemorialEntry[]>([]);

  useEffect(() => {
    if (!userId || !bookId || !chapter) {
      setEntries([]);
      return;
    }
    const store = createNoteStore(userId);
    store.getByChapter(bookId, chapter).then((data) => {
      setEntries(data || []);
    }).catch(() => {
      setEntries([]);
    });
  }, [bookId, chapter, userId]);

  if (!userId || entries.length === 0) return null;

  const reflections = entries.filter((e) => e.type === 'reflection').length;
  const prayers = entries.filter((e) => e.type === 'prayer').length;
  const testimonies = entries.filter((e) => e.type === 'testimony').length;
  const fastings = entries.filter((e) => e.type === 'fasting').length;

  const formatCount = (count: number, singular: string, plural: string, isFeminine: boolean) => {
    if (count === 1) return `${isFeminine ? 'Uma' : 'Um'} ${singular}`;
    if (count === 2) return `${isFeminine ? 'Duas' : 'Dois'} ${plural}`;
    if (count === 3) return `Três ${plural}`;
    if (count === 4) return `Quatro ${plural}`;
    if (count === 5) return `Cinco ${plural}`;
    return `${count} ${plural}`;
  };

  const listItems: string[] = [];
  if (reflections > 0) listItems.push(formatCount(reflections, 'reflexão', 'reflexões', true));
  if (prayers > 0) listItems.push(formatCount(prayers, 'oração', 'orações', true));
  if (testimonies > 0) listItems.push(formatCount(testimonies, 'testemunho', 'testemunhos', false));
  if (fastings > 0) listItems.push(formatCount(fastings, 'propósito', 'propósitos', false));

  return (
    <section className="mt-12 pt-8 border-t border-border/50 space-y-4 animate-in fade-in duration-500">
      <div className="space-y-1">
        <h3 className="font-serif text-lg font-semibold text-app-text">
          O que nasceu desta leitura
        </h3>
        <p className="text-xs text-app-text-muted">
          Você registrou neste capítulo:
        </p>
      </div>

      <ul className="space-y-1.5 text-sm text-app-text font-serif">
        {listItems.map((txt) => (
          <li key={txt} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
            <span>{txt}</span>
          </li>
        ))}
      </ul>

      <div className="pt-2">
        <Link
          to={`/memorial?book=${bookId}&chapter=${chapter}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline"
        >
          Abrir Memorial →
        </Link>
      </div>
    </section>
  );
}

const saveLastRead = (version: string, bookSlug: string, chapter: number, userId?: string | null) => {
  try {
    localStorage.setItem(
      LAST_READ_KEY,
      JSON.stringify({
        versao: version,
        livro: bookSlug,
        capitulo: chapter,
        timestamp: Date.now(),
      }),
    );

    if (userId) {
      supabase
        .from("profiles")
        .update({
          last_read_book_id: bookSlug,
          last_read_chapter: chapter,
          last_read_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .then(({ error }) => {
          if (error) {
            console.warn("[saveLastRead] Failed to sync reading context:", error.message);
          }
        });
    }
  } catch {
    // ignore
  }
};

export default function ReadingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { version, book, chapter } = useParams();

  const selectedVersion = isBibleVersion(version) ? version : getVersion();
  const selectedBook = findBookGlobally(book);
  const chapterNumber = Number(chapter || "1");

  // True only when reading the original-language version AND the book is Hebrew (OT)
  const isHebrewReading = selectedVersion === "org" && !!selectedBook && getLanguageLabel(selectedBook.id) === "Hebraico";

  const [chapterData, setChapterData] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareData, setCompareData] = useState<Chapter | null>(null);
  const [showDiff, setShowDiff] = useState(true);
  const [compareVersion, setCompareVersion] = useState<BibleVersion>(selectedVersion === "acf" ? "nvi" : "acf");
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [hoveredVerseNumber, setHoveredVerseNumber] = useState<string | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<VerseSelection | null>(null);
  const [toolbarPosition, setToolbarPosition] = useState<{ left: number; top: number } | null>(null);
  const [isToolbarMobile, setIsToolbarMobile] = useState(false);
  const [isStudyPanelOpen, setIsStudyPanelOpen] = useState(false);
  const [rateLimitStatus, setRateLimitStatus] = useState<{ open: boolean, resetAt: number | null, limit: number }>({ open: false, resetAt: null, limit: 10 });
  const [studyVerse, setStudyVerse] = useState<number | null>(null);
  const [studyVerseText, setStudyVerseText] = useState<string>('');
  const [bookContext, setBookContext] = useState<BookContextData | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChapterPickerOpen, setIsChapterPickerOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [focusTopVisible, setFocusTopVisible] = useState(true);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardModalData, setCardModalData] = useState<CardData | null>(null);
  const [redLetterVerses, setRedLetterVerses] = useState<Record<string, Record<string, number[]>> | null>(null);
  const [cachedChapterCommentary, setCachedChapterCommentary] = useState<string | null>(null);
  const [isChapterCommentaryLoading, setIsChapterCommentaryLoading] = useState(false);
  const { remaining: freeChapterCommentaryCount, canUse: hasFreeChapterCommentary, consume: consumeFreeChapterCommentary, setRemaining: setRemainingFreeChapterCommentary } = useCommentaryQuota('chapter');
  const [hashHighlightedVerse, setHashHighlightedVerse] = useState<string | null>(null);

  // Estados do Eco do Memorial
  const [echoEntry, setEchoEntry] = useState<MemorialEntry | null>(null);
  const [isEchoModalOpen, setIsEchoModalOpen] = useState(false);

  const toolbarLayerRef = useRef<HTMLDivElement>(null);
  const chapterGridRef = useRef<HTMLDivElement>(null);
  const verseRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { copyState, copyVerse, shareState, shareVerse } = useVerseActions();
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const churchMode = useChurchMode();
  const { preferences, updatePreference, resetPreferences } = useReadingPreferences({ rootId: "reading-root" });
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const { isPro, isTemplo } = useSubscription();
  const { notes, getHighlightForVerse, getNoteForVerse, addHighlight, removeHighlight, saveNote, deleteNote } =
    useNotesHighlights(selectedBook?.id ?? '', chapterNumber);

  const isMobile = useIsMobile();

  const {
    isOpen: isNotebookOpen,
    setIsOpen: setIsNotebookOpen,
    setNotebookContext,
  } = useNotebookContext();

  useEffect(() => {
    if (selectedBook && chapterNumber) {
      setNotebookContext(selectedBook.id, chapterNumber, selectedVersion, selectedBook.name);
    }
  }, [selectedBook?.id, chapterNumber, selectedVersion, selectedBook?.name, setNotebookContext]);

  const handleOpenNotebook = useCallback(() => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsNotebookOpen(true);
  }, [user]);

  const { activePlan, todayDayIndex, todayRefs, todayReadRefs, isTodayCompleted, markRefRead } = useReadingPlan(user?.id ?? null);

  const currentRef = selectedBook ? `${selectedBook.slug}/${chapterNumber}` : "";
  const isPartOfTodayReading = activePlan && todayRefs.includes(currentRef);

  // Load book context
  useEffect(() => {
    if (!selectedBook) return;
    prefetchLexicons(selectedBook.id);
    fetch("/bible/book-contexts.json")
      .then((res) => res.json())
      .then((data: Record<string, any>) => {
        const bookData = data[selectedBook.id.toUpperCase()];
        if (bookData) {
          setBookContext({
            name: bookData.name,
            period: bookData.period_written,
            author: bookData.author,
            theme: bookData.theme,
            summary: bookData.summary,
          });
        } else {
          setBookContext(null);
        }
      })
      .catch(() => setBookContext(null));
  }, [selectedBook?.id]);

  // Load red letter verses map
  useEffect(() => {
    fetch(`/red_letters_verses.json?v=${new Date().getTime()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load red letters: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log(`[RedLetters] Loaded mapping for ${Object.keys(data).length} books`);
        setRedLetterVerses(data);
      })
      .catch((err) => {
        console.error("[RedLetters] Error:", err);
        setRedLetterVerses(null);
      });
  }, []);

  // Pre-load chapter commentary (AI cache + manual commentaries merged)
  useEffect(() => {
    if (!selectedBook) return;
    setCachedChapterCommentary(null); // Reset when chapter changes
    let isMounted = true;
    const fetchCachedCommentary = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        const lang = String(locale).startsWith("pt") ? "pt" : "en";
        const baseId = `${selectedBook.id.toUpperCase()}.${chapterNumber}.ALL`;
        const verseId = lang !== 'en' ? `${baseId}:${lang}` : baseId;

        // Busca em paralelo: cache de IA + manuais
        const [aiResult, manualResult] = await Promise.all([
          supabase
            .from('ai_study_cache')
            .select('response')
            .eq('verse_id', verseId)
            .eq('question_type', 'chapter_commentary')
            .maybeSingle(),
          supabase
            .from('manual_commentaries')
            .select('author, era, tradition, work, year, original_language, text, source_url')
            .eq('verse_id', baseId)
            .eq('question_type', 'chapter_commentary')
            .eq('language', lang),
        ]);

        if (!isMounted) return;

        // Parse comentários da IA
        let aiCommentaries: any[] = [];
        if (aiResult.data?.response && aiResult.data.response !== "[]") {
          try {
            const parsed = JSON.parse(aiResult.data.response);
            aiCommentaries = Array.isArray(parsed)
              ? parsed
              : Array.isArray(parsed?.commentaries)
                ? parsed.commentaries
                : [];
          } catch {
            // ignora parse error
          }
        }

        // Formata manuais
        const manualCommentaries = (manualResult.data ?? []).map((row: any) => ({
          author:            row.author ?? '',
          era:               row.era ?? '',
          tradition:         row.tradition ?? '',
          work:              row.work ?? '',
          year:              row.year ?? '',
          original_language: row.original_language ?? '',
          text:              row.text ?? '',
          source_url:        row.source_url ?? null,
          isManual:          true,
        }));

        // Apenas exibe os comentários mesclados se já existir comentário gerado pela IA (evita mostrar apenas manuais antes da busca da IA)
        if (aiCommentaries.length > 0) {
          const merged = [...aiCommentaries, ...manualCommentaries];
          setCachedChapterCommentary(JSON.stringify(merged));
        }
      } catch {
        // Silently ignore cache check failures
      }
    };
    fetchCachedCommentary();
    return () => { isMounted = false; };
  }, [selectedBook?.id, chapterNumber]);

  const tts = useTTS(preferences.ttsRate);

  const setVerseRef = useCallback(
    (key: string) => (element: HTMLDivElement | null) => {
      verseRefs.current[key] = element;
    },
    [],
  );

  const chapterVerses = useMemo(
    () =>
      (chapterData?.verses ?? []).map((verse, index) => {
        const verseNumber = verse.number ?? (getVerseNumber(verse.reference) || index + 1);
        return {
          id: verse.id,
          number: verseNumber,
          text: verse.text ?? stripHtml(verse.content),
          reference: verse.reference,
        };
      }),
    [chapterData],
  );

  const currentTTSVerse = tts.currentVerseIndex !== null ? chapterVerses[tts.currentVerseIndex] : null;
  const shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const updateToolbarPosition = useCallback(
    (anchorKey: string) => {
      const verseElement = verseRefs.current[anchorKey];
      const layer = toolbarLayerRef.current;
      if (!verseElement || !layer) return;

      const verseRect = verseElement.getBoundingClientRect();
      const layerRect = layer.getBoundingClientRect();
      const padding = 12;

      if (isToolbarMobile) {
        setToolbarPosition({
          left: 12,
          top: verseRect.bottom - layerRect.top + 8,
        });
      } else {
        const toolbarWidth = 360;
        const preferredLeft = verseRect.left - layerRect.left;
        const maxLeft = Math.max(padding, layerRect.width - toolbarWidth - padding);

        setToolbarPosition({
          left: Math.min(Math.max(preferredLeft, padding), maxLeft),
          top: verseRect.bottom - layerRect.top + 8,
        });
      }
    },
    [isToolbarMobile],
  );

  useEffect(() => {
    const syncToolbarBreakpoint = () => {
      setIsToolbarMobile(window.matchMedia("(max-width: 639px)").matches);
    };

    syncToolbarBreakpoint();
    window.addEventListener("resize", syncToolbarBreakpoint);
    return () => window.removeEventListener("resize", syncToolbarBreakpoint);
  }, []);

  useEffect(() => {
    if (!selectedBook || Number.isNaN(chapterNumber)) {
      setLoading(false);
      setError(t("reading.invalidReference"));
      return;
    }

    const cached = readCachedChapter(selectedVersion, selectedBook.id, chapterNumber);
    if (cached) {
      setChapterData(cached);
      setError(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    fetchChapter(selectedVersion, selectedBook.id, String(chapterNumber))
      .then((data) => {
        if (!active) return;
        setChapterData(data);
        writeCachedChapter(selectedVersion, selectedBook.id, chapterNumber, data);
      })
      .catch((apiError) => {
        if (!active) return;
        setError(getFriendlyApiError(apiError));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [chapterNumber, reloadToken, selectedBook, selectedVersion]);

  useEffect(() => {
    if (!compareEnabled || !selectedBook || Number.isNaN(chapterNumber)) {
      setCompareData(null);
      setCompareError(null);
      setCompareLoading(false);
      return;
    }

    const cached = readCachedChapter(compareVersion, selectedBook.id, chapterNumber);
    if (cached) {
      setCompareData(cached);
      setCompareError(null);
      setCompareLoading(false);
      return;
    }

    let active = true;
    setCompareLoading(true);
    setCompareError(null);

    fetchChapter(compareVersion, selectedBook.id, String(chapterNumber))
      .then((data) => {
        if (!active) return;
        setCompareData(data);
        writeCachedChapter(compareVersion, selectedBook.id, chapterNumber, data);
      })
      .catch((apiError) => {
        if (!active) return;
        setCompareError(getFriendlyApiError(apiError));
      })
      .finally(() => {
        if (!active) return;
        setCompareLoading(false);
      });

    return () => {
      active = false;
    };
  }, [chapterNumber, compareEnabled, compareVersion, selectedBook]);

  useEffect(() => {
    if (!selectedBook) return;

    const onKeyDown = (event: KeyboardEvent) => {
      // Guard: event.key can be undefined in synthetic/extension-dispatched events
      if (!event.key) return;
      const target = event.target as HTMLElement | null;
      const typingInField = target && (
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName) ||
        target.isContentEditable ||
        (target.closest && target.closest('[contenteditable="true"]') !== null)
      );

      if (event.key.toLowerCase() === "f" && !typingInField) {
        event.preventDefault();
        updatePreference("focusMode", !preferences.focusMode);
        return;
      }

      if (event.key === "Escape") {
        if (selectedVerse) {
          setSelectedVerse(null);
          return;
        }

        if (preferences.focusMode) {
          updatePreference("focusMode", false);
        }
        return;
      }

      if (isChapterPickerOpen || isSettingsOpen || isNoteModalOpen || isNotebookOpen || typingInField) return;

      if (event.key === "ArrowLeft" && chapterNumber > 1) {
        event.preventDefault();
        navigate(`/${selectedVersion}/${selectedBook.slug}/${chapterNumber - 1}`);
        window.scrollTo({ top: 0, behavior: "auto" });
      }

      if (event.key === "ArrowRight" && chapterNumber < selectedBook.chapters) {
        event.preventDefault();
        navigate(`/${selectedVersion}/${selectedBook.slug}/${chapterNumber + 1}`);
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    chapterNumber,
    isChapterPickerOpen,
    isSettingsOpen,
    isNoteModalOpen,
    isNotebookOpen,
    navigate,
    preferences.focusMode,
    selectedBook,
    selectedVerse,
    selectedVersion,
    updatePreference,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Meta") setIsCtrlPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Meta") setIsCtrlPressed(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!preferences.focusMode) return;

    window.history.pushState({ focusMode: true }, "", window.location.href);
    const onPopState = () => updatePreference("focusMode", false);
    window.addEventListener("popstate", onPopState);

    return () => window.removeEventListener("popstate", onPopState);
  }, [preferences.focusMode, updatePreference]);

  useEffect(() => {
    let previousY = window.scrollY;

    if (!preferences.focusMode) {
      setFocusTopVisible(true);
      return;
    }

    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY > previousY + 8) setFocusTopVisible(false);
      if (currentY < previousY - 8) setFocusTopVisible(true);
      previousY = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [preferences.focusMode]);

  useEffect(() => {
    setSelectedVerse(null);
    setToolbarPosition(null);
    setHoveredVerseNumber(null);
    setCachedChapterCommentary(null);
    tts.stop();
  }, [chapterNumber, compareEnabled, compareVersion, selectedVersion, tts.stop]);

  useEffect(() => {
    if (!selectedVerse) return;
    updateToolbarPosition(selectedVerse.anchorKey);
    const onResize = () => updateToolbarPosition(selectedVerse.anchorKey);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isToolbarMobile, selectedVerse, updateToolbarPosition]);

  useEffect(() => {
    if (!chapterData) return;

    const hashMatch = location.hash.match(/^#v(\d+)$/i);
    if (!hashMatch) return;

    const verseNumber = hashMatch[1];
    const target = verseRefs.current[`main-${verseNumber}`];
    if (!target) return;

    setSelectedVerse(null);
    setHashHighlightedVerse(verseNumber);
    target.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth", block: "center" });

    const timer = window.setTimeout(() => {
      setHashHighlightedVerse((current) => (current === verseNumber ? null : current));
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [chapterData, location.hash, location.key, shouldReduceMotion]);

  useEffect(() => {
    if (!selectedBook) return;
    saveLastRead(selectedVersion, selectedBook.slug, chapterNumber, user?.id);
  }, [chapterNumber, selectedBook, selectedVersion, user?.id]);

  // Store estável para o Eco do Memorial (evita recriar a cada render)
  const echoStore = useMemo(() => createNoteStore(user?.id ?? null), [user?.id]);

  // Efeito para carregar o Eco do Memorial no capítulo atual
  const refreshEcho = useCallback(async () => {
    if (!selectedBook) return;
    try {
      if (echoStore.getMatchingEcho) {
        const found = await echoStore.getMatchingEcho(selectedBook.id, chapterNumber);
        setEchoEntry(found);
      }
    } catch {
      setEchoEntry(null);
    }
  }, [echoStore, selectedBook, chapterNumber]);

  useEffect(() => {
    refreshEcho();
  }, [refreshEcho]);

  useEffect(() => {
    if (!selectedBook) return;
    const interval = window.setInterval(() => {
      saveLastRead(selectedVersion, selectedBook.slug, chapterNumber, user?.id);
    }, 30000);

    return () => window.clearInterval(interval);
  }, [chapterNumber, selectedBook, selectedVersion, user?.id]);

  useEffect(() => {
    if (!selectedBook) return;

    let timeoutId: number | null = null;
    const onScroll = () => {
      if (timeoutId) return;
      timeoutId = window.setTimeout(() => {
        saveLastRead(selectedVersion, selectedBook.slug, chapterNumber, user?.id);
        timeoutId = null;
      }, 400);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [chapterNumber, selectedBook, selectedVersion]);

  useEffect(
    () => () => {
      localStorage.setItem("bv_focus_mode", "false");
      tts.stop();
    },
    [tts.stop],
  );

  useEffect(() => {
    if (!chapterVerses.length || tts.currentVerseIndex === null) return;
    const verse = chapterVerses[tts.currentVerseIndex];
    const target = verseRefs.current[`main-${verse.number}`];
    if (target) target.scrollIntoView({ behavior: shouldReduceMotion ? "auto" : "smooth", block: "center" });
  }, [chapterVerses, shouldReduceMotion, tts.currentVerseIndex]);

  useEffect(() => {
    if (!selectedBook || chapterNumber >= selectedBook.chapters) return;
    const timer = window.setTimeout(() => {
      void fetchChapter(selectedVersion, selectedBook.id, String(chapterNumber + 1)).then((data) => {
        writeCachedChapter(selectedVersion, selectedBook.id, chapterNumber + 1, data);
        sessionStorage.setItem(NEXT_CHAPTER_PREFETCH_KEY, `${selectedVersion}:${selectedBook.id}:${chapterNumber + 1}`);
      });
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [chapterNumber, selectedBook, selectedVersion]);

  useEffect(() => {
    if (!selectedBook) return;
    const key = `bv-scroll:${location.pathname}`;
    const saved = sessionStorage.getItem(key);
    if (saved) window.scrollTo({ top: Number(saved), behavior: "auto" });

    const onScroll = () => sessionStorage.setItem(key, String(window.scrollY));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname, selectedBook]);

  useEffect(() => {
    if (!isChapterPickerOpen || !chapterGridRef.current) return;
    const currentButton = chapterGridRef.current.querySelector<HTMLButtonElement>(`button[data-chapter='${chapterNumber}']`);
    currentButton?.scrollIntoView({ block: "center", behavior: shouldReduceMotion ? "auto" : "smooth" });
  }, [chapterNumber, isChapterPickerOpen, shouldReduceMotion]);

  const goToChapter = (nextChapter: number, bookSlug?: string) => {
    const slug = bookSlug || selectedBook?.slug;
    if (!slug) return;
    navigate(`/${selectedVersion}/${slug}/${nextChapter}`);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  // Resolves the next and previous chapter/book context across the entire Bible
  const nextChapterInfo = useMemo(() => {
    if (!selectedBook) return null;
    const { allBooks } = getBooksForLocale(locale);
    const bookIndex = allBooks.findIndex((b) => b.id === selectedBook.id);

    if (chapterNumber < selectedBook.chapters) {
      return { book: selectedBook, chapter: chapterNumber + 1 };
    } else if (bookIndex !== -1 && bookIndex < allBooks.length - 1) {
      return { book: allBooks[bookIndex + 1], chapter: 1 };
    }
    return null; // Revelation 22
  }, [selectedBook, chapterNumber, locale]);

  const prevChapterInfo = useMemo(() => {
    if (!selectedBook) return null;
    const { allBooks } = getBooksForLocale(locale);
    const bookIndex = allBooks.findIndex((b) => b.id === selectedBook.id);

    if (chapterNumber > 1) {
      return { book: selectedBook, chapter: chapterNumber - 1 };
    } else if (bookIndex > 0) {
      const prevBook = allBooks[bookIndex - 1];
      return { book: prevBook, chapter: prevBook.chapters };
    }
    return null; // Genesis 1
  }, [selectedBook, chapterNumber, locale]);

  // Sticky chapter title and scroll progress tracking
  useEffect(() => {
    if (!selectedBook) return;

    const titleText = `${selectedBook.name} ${chapterNumber}`;

    const handleScrollUpdates = () => {
      // 1. Calculate Sticky Title visibility
      const titleElement = document.querySelector("#reading-root h1");
      if (titleElement) {
        const rect = titleElement.getBoundingClientRect();
        // If the bottom of the H1 title is above the header (60px), it is scrolled past!
        const isSticky = rect.bottom < 60;
        window.dispatchEvent(
          new CustomEvent("bv-sticky-title", {
            detail: {
              title: titleText,
              visible: isSticky,
            },
          })
        );
      } else {
        window.dispatchEvent(
          new CustomEvent("bv-sticky-title", {
            detail: {
              title: titleText,
              visible: false,
            },
          })
        );
      }

      // 2. Calculate Reading Progress of <article>
      const article = document.querySelector("#reading-root article");
      if (!article) return;

      const rect = article.getBoundingClientRect();
      const articleHeight = rect.height;
      const windowHeight = window.innerHeight;
      
      const start = (article as HTMLElement).offsetTop;
      const end = start + articleHeight - windowHeight;
      const current = window.scrollY;

      let progress = 0;
      if (end > start) {
        progress = Math.max(0, Math.min(100, ((current - start) / (end - start)) * 100));
      } else {
        progress = current >= start ? 100 : 0;
      }

      window.dispatchEvent(
        new CustomEvent("bv-scroll-progress", {
          detail: { progress },
        })
      );
    };

    window.addEventListener("scroll", handleScrollUpdates, { passive: true });
    handleScrollUpdates();

    return () => {
      window.removeEventListener("scroll", handleScrollUpdates);
      // Clean up header state
      window.dispatchEvent(
        new CustomEvent("bv-sticky-title", {
          detail: { title: "", visible: false },
        })
      );
      window.dispatchEvent(
        new CustomEvent("bv-scroll-progress", {
          detail: { progress: null },
        })
      );
    };
  }, [selectedBook, chapterNumber, location.pathname]);

  const handleVersionChange = (nextVersion: BibleVersion) => {
    setVersion(nextVersion);
    if (!selectedBook) {
      navigate("/");
      return;
    }

    navigate(`/${nextVersion}/${selectedBook.slug}/${chapterNumber}`);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const handleVerseClick = (payload: { anchorKey: string; verseNumber: string; text: string; version: string }) => {
    setHashHighlightedVerse(null);
    setSelectedVerse((current) => {
      if (current?.anchorKey === payload.anchorKey) return null;
      return {
        anchorKey: payload.anchorKey,
        reference: `${selectedBook?.name ?? t("reading.book")} ${chapterNumber}:${payload.verseNumber}`,
        text: payload.text,
        verseNumber: payload.verseNumber,
        version: payload.version,
      };
    });
  };

  const handleChurchCheckbox = (verse: { number: number; text: string; version: string }) => {
    const verseData: ChurchVerse = {
      number: verse.number,
      text: verse.text,
      reference: `${selectedBook?.name ?? t("reading.book")} ${chapterNumber}:${verse.number}`,
      version: verse.version.toUpperCase(),
    };
    const isChecked = churchMode.selectedVerses.some(v => v.number === verseData.number);
    if (isChecked) {
      churchMode.removeVerse(verseData.number);
    } else {
      churchMode.addVerse(verseData);
    }
  };

  const handleShare = () => {
    if (!selectedVerse || !selectedBook) return;
    setCardModalData({
      verseNumber: Number(selectedVerse.verseNumber),
      verseText: selectedVerse.text,
      bookName: selectedBook.name,
      chapter: chapterNumber,
      version: selectedVerse.version ?? selectedVersion,
    });
    setIsCardModalOpen(true);
  };

  const handleCopy = useCallback(async () => {
    if (!selectedVerse || !selectedBook) return;
    await copyVerse({
      chapter: chapterNumber,
      pathname: location.pathname,
      reference: selectedVerse.reference,
      text: selectedVerse.text,
      verseNumber: selectedVerse.verseNumber,
      version: selectedVerse.version
    });
  }, [selectedVerse, copyVerse, chapterNumber, location.pathname, selectedBook]);

  const handleStudy = () => {
    if (!selectedVerse) return;
    setStudyVerse(Number(selectedVerse.verseNumber));
    setStudyVerseText(selectedVerse.text);
    // Always open (never toggle-close) so clicking "Estudar" for a new verse
    // while the panel is already open does not accidentally close it.
    setIsStudyPanelOpen(true);
  };

  const handleChapterCommentary = async () => {
    if (!isPro && !hasFreeChapterCommentary && !cachedChapterCommentary) {
      navigate('/pro');
      return;
    }
    if (!selectedBook) return;

    if (cachedChapterCommentary) {
      document.getElementById('chapter-commentary-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setIsChapterCommentaryLoading(true);
    try {
      const { commentaries, remaining: serverRemaining } = await requestCommentary({
        bookId: selectedBook.id,
        chapter: chapterNumber,
        verse: null,
        verseText: "",
        version: selectedVersion,
        language: String(locale).startsWith("pt") ? "pt" : "en",
      });
      setCachedChapterCommentary(JSON.stringify(commentaries));
      if (!isPro) {
        if (serverRemaining !== undefined) {
          setRemainingFreeChapterCommentary(serverRemaining);
        } else {
          consumeFreeChapterCommentary();
        }
      }
      toast({ message: "Comentário teológico gerado com sucesso.", type: "prompt", duration: Infinity });
      setTimeout(() => {
        document.getElementById('chapter-commentary-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (e: any) {
      if (e.code === 'RATE_LIMITED') {
        if (!isPro) {
          setRemainingFreeChapterCommentary(0);
        }
        const finalLimit = !isPro ? 3 : e.limit;
        setRateLimitStatus({ open: true, resetAt: e.reset_at, limit: finalLimit });
      } else {
        toast({ message: "Erro: " + e.message, type: "error" });
      }
    } finally {
      setIsChapterCommentaryLoading(false);
    }
  };

  const chapterLabel = useMemo(() => {
    if (!selectedBook) return "";
    return `${selectedVersion.toUpperCase()} › ${selectedBook.name} › ${t("home.chapter")} ${chapterNumber}`;
  }, [chapterNumber, selectedBook, selectedVersion, t]);

  const hasPrev = !!selectedBook && chapterNumber > 1;
  const hasNext = !!selectedBook && chapterNumber < (selectedBook?.chapters ?? 1);
  const chapterGrid = Array.from({ length: selectedBook?.chapters ?? 0 }, (_, index) => index + 1);

  // Computed early so usePageMeta can inject noindex for invalid routes.
  // Must be computed before the hook call (hooks must be unconditional).
  const isInvalidRoute =
    !selectedBook ||
    (!Number.isNaN(chapterNumber) && (chapterNumber < 1 || chapterNumber > (selectedBook?.chapters ?? 1)));

  const chapterTitle = selectedBook 
    ? `${selectedBook.name} ${chapterNumber} — ${selectedVersion.toUpperCase()} — Bíblia Vive`
    : `Livro não encontrado — Bíblia Vive`;

  const versesText = chapterVerses.slice(0, 3).map(v => v.text).join(" ").trim();
  const chapterDescription = (versesText && versesText.length > 0)
    ? (versesText.length > 157 ? versesText.substring(0, 157) + "..." : versesText)
    : `Leia o capítulo ${chapterNumber} do livro de ${selectedBook?.name ?? ""} na versão ${selectedVersion.toUpperCase()} com dezenas de marcações exclusivas. Estudo online grátis.`;

  usePageMeta({
    title: chapterTitle,
    description: chapterDescription,
    canonical: `/${selectedVersion}/${selectedBook?.slug ?? "gn"}/${chapterNumber}`,
    robots: isInvalidRoute ? "noindex, nofollow" : undefined,
    ogType: "website",
    ogImage: "/og-default.png",
    jsonLd: selectedBook && chapterVerses.length > 0 ? [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Início", "item": window.location.origin },
          { "@type": "ListItem", "position": 2, "name": selectedBook.name, "item": `${window.location.origin}/${selectedVersion}/${selectedBook.slug}` },
          { "@type": "ListItem", "position": 3, "name": `Capítulo ${chapterNumber}`, "item": `${window.location.origin}/${selectedVersion}/${selectedBook.slug}/${chapterNumber}` }
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "Chapter",
        "name": `${selectedBook.name} ${chapterNumber}`,
        "text": chapterVerses.map(v => `${v.number} ${v.text}`).join(" "),
        "inLanguage": "pt-BR"
      },
      ...(cachedChapterCommentary ? [{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": `Qual o contexto e significado de ${selectedBook.name} capítulo ${chapterNumber}?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": ((commentariesStr) => {
                try {
                  const items = Array.isArray(JSON.parse(commentariesStr)) ? JSON.parse(commentariesStr) : JSON.parse(commentariesStr).commentaries;
                  return items?.map((c: any) => c.text).join(" ") || "";
                } catch {
                  return "";
                }
              })(cachedChapterCommentary)
            }
          }
        ]
      }] : [])
    ] : undefined
  });

  const copyLabel = copyState === "copied" ? t("verse.copied") : t("verse.copy");
  const shareLabel = shareState === "link-copied" ? t("verse.linkCopied") : shareState === "shared" ? t("verse.shared") : t("verse.share");

  const LoadingLines = () => (
    <div className="min-h-[520px] space-y-3.5 pt-1">
      {[100, 94, 97, 89, 92, 96, 84, 91].map((width, index) => (
        <Skeleton className="h-7 bg-app-raised" key={index} style={{ width: `${width}%` }} />
      ))}
    </div>
  );

  const renderVerseText = (tokens: DiffToken[] | null, plainText: string, vNumStr: string | number) => {
    if (!tokens) {
      if (preferences.wordsOfGod && selectedBook && redLetterVerses) {
        const bookData = redLetterVerses[selectedBook.slug];
        const chapterDataForRed = bookData?.[chapterNumber.toString()];
        const isRedLetter = Array.isArray(chapterDataForRed) && chapterDataForRed.includes(Number(vNumStr));

        if (isRedLetter) {
          // Heuristic 1: If quote marks or dialogue dashes are present
          const regex = /([“”"«»].*?[“”"«»]|—.*?(?=$|—))/g;
          const hasQuotes = regex.test(plainText);

          if (hasQuotes) {
            // Re-run split since we consumed test
            const parts = plainText.split(/([“”"«»].*?[“”"«»]|—.*?(?=$|—))/g);
            return (
              <span>
                {parts.map((part, i) =>
                  i % 2 === 1 ? (
                    <span className="text-[#c13030] dark:text-[#ff8f8f] transition-colors" key={i}>{part}</span>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
              </span>
            );
          } else {
            // Heuristic 2: For ACF/ARC format where dialogue starts after a colon (e.g. Jesus disse: Eu sou)
            const colonSplit = plainText.split(/:(.+)/s);
            if (colonSplit.length > 1) {
              return (
                <span>
                  <span>{colonSplit[0]}:</span>
                  <span className="text-[#c13030] dark:text-[#ff8f8f] transition-colors">{colonSplit[1]}</span>
                </span>
              );
            } else {
              // If no delimiter is found but it is a red letter verse, color it completely.
              return <span className="text-[#c13030] dark:text-[#ff8f8f] transition-colors">{plainText}</span>;
            }
          }
        }
      }
      return <span>{plainText}</span>;
    }
    return (
      <span>
        {tokens.map((tok, ti) => (
          <span key={ti}>{tok.type === "different" ? (
            <mark
              style={{
                background: "hsl(var(--gold) / 0.18)",
                color: "inherit",
                borderRadius: "3px",
                padding: "0 1px",
              }}
            >
              {tok.word}
            </mark>
          ) : tok.word}{" "}</span>
        ))}
      </span>
    );
  };

  // ─── Guard: livro não reconhecido ─────────────────────────────────────────
  // Renders a clear 404 page with noindex so the Googlebot never sees a blank
  // page and classifies the URL as soft 404.
  if (!selectedBook) {
    return (
      <Layout>
        {/* noindex injected via usePageMeta — declared at top of component */}
        <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-6 text-center px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-app-surface text-3xl">
            📖
          </div>
          <div>
            <h1 className="font-serif text-2xl text-app-text">Livro não encontrado</h1>
            <p className="mt-2 font-sans text-sm text-app-text-muted">
              A abreviação <code className="rounded bg-app-raised px-1 py-0.5 font-mono text-xs">{book}</code>{" "}
              não corresponde a nenhum livro bíblico reconhecido.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-app-bg hover:bg-gold/90 transition-colors"
          >
            Voltar ao início
          </Link>
        </div>
      </Layout>
    );
  }

  // ─── Guard: capítulo fora do intervalo válido ──────────────────────────────
  // e.g. /acf/gn/74 (Genesis tem 50 cap), /acf/sl/151 (Salmos tem 150 cap).
  // Returns noindex + clear message instead of blank page / infinite skeleton.
  const isChapterOutOfRange =
    !Number.isNaN(chapterNumber) &&
    (chapterNumber < 1 || chapterNumber > selectedBook.chapters);

  if (isChapterOutOfRange) {
    return (
      <Layout>
        <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-6 text-center px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-app-surface text-3xl">
            📄
          </div>
          <div>
            <h1 className="font-serif text-2xl text-app-text">Capítulo não existe</h1>
            <p className="mt-2 font-sans text-sm text-app-text-muted">
              {selectedBook.name} tem {selectedBook.chapters}{" "}
              {selectedBook.chapters === 1 ? "capítulo" : "capítulos"}.{" "}
              O capítulo {chapterNumber} não existe neste livro.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to={`/${selectedVersion}/${selectedBook.slug}/1`}
              className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-app-bg hover:bg-gold/90 transition-colors"
            >
              Ir para o capítulo 1
            </Link>
            <Link
              to={`/${selectedVersion}/${selectedBook.slug}/${selectedBook.chapters}`}
              className="inline-flex items-center gap-2 rounded-full border border-gold/60 px-6 py-2.5 text-sm font-medium text-gold hover:bg-gold-bg transition-colors"
            >
              Último capítulo ({selectedBook.chapters})
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideHeader={false} hideMobileNav={preferences.focusMode}>
      <div
        className={cn(
          "relative transition-[padding-left] duration-300",
          isNotebookOpen && !isMobile && "lg:pl-[clamp(320px,28vw,440px)]"
        )}
        id="reading-root"
        ref={toolbarLayerRef}
      >

        {!preferences.focusMode && (
          <>
            <section className={`mx-auto w-full max-w-6xl px-4 md:px-6`}>
              {chapterData?.fallbackNotice && (
                <Alert className="mb-4 border-gold/40 bg-gold-bg/20 text-app-text">
                  <AlertTitle className="font-medium text-gold flex items-center gap-2">
                    <span>📡 Modo OfflineAtivo</span>
                  </AlertTitle>
                  <AlertDescription className="text-xs text-app-text-muted">
                    {chapterData.fallbackNotice}
                  </AlertDescription>
                </Alert>
              )}
              {churchMode.isActive && (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gold/30 bg-gold-bg/10 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-gold" />
                    <span className="text-sm font-medium text-gold">Modo Igreja ativo</span>
                    {churchMode.selectedVerses.length > 1 && (
                      <span className="ml-2 text-xs text-app-text-muted">
                        {churchMode.selectedVerses.length} versículos selecionados
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {churchMode.selectedVerses.length > 0 && (
                      <button
                        type="button"
                        onClick={churchMode.clearSelection}
                        className="text-xs text-app-text-muted hover:text-app-text underline"
                      >
                        Limpar seleção
                      </button>
                    )}
                    <Label htmlFor="church-auto-send" className="text-xs text-app-text-muted">
                      Envio automático
                    </Label>
                    <Switch
                      id="church-auto-send"
                      checked={churchMode.autoSend}
                      onCheckedChange={churchMode.toggleAutoSend}
                    />
                    <Button
                      onClick={() => churchMode.sendFullChapter(chapterVerses.map(v => ({
                        number: v.number,
                        text: v.text,
                        reference: `${selectedBook?.name ?? t("reading.book")} ${chapterNumber}:${v.number}`,
                        version: selectedVersion.toUpperCase()
                      })))}
                      size="sm"
                      type="button"
                      variant="outline"
                      className="h-7 text-xs border-gold/40 text-gold hover:bg-gold-bg/20"
                    >
                      Enviar capítulo
                    </Button>
                  </div>
                </div>
              )}
              <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Breadcrumb>
                  <BreadcrumbList className="leading-none">
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <button className="inline-flex items-center font-sans uppercase leading-none tracking-[0.08em]" onClick={() => setIsSettingsOpen(true)} type="button">
                          {selectedVersion.toUpperCase()}
                        </button>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {selectedBook ? (
                        <BreadcrumbLink asChild>
                          <Link className="inline-flex items-center leading-none" to={`/${selectedVersion}/${selectedBook.slug}`}>
                            {selectedBook.name}
                          </Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{t("reading.book")}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <Dialog onOpenChange={setIsChapterPickerOpen} open={isChapterPickerOpen}>
                        <DialogTrigger asChild>
                          <button className="inline-flex items-center font-sans leading-none" type="button">
                            {t("home.chapter")} {chapterNumber}
                          </button>
                        </DialogTrigger>
                        <DialogContent aria-label={t("reading.selectChapter")} className="max-w-xl border-border bg-app-surface sm:rounded-2xl" role="dialog">
                          <DialogHeader>
                            <DialogTitle>{t("reading.selectChapter")}</DialogTitle>
                            <DialogDescription>
                              {selectedBook ? t("reading.chooseChapterBook", { book: selectedBook.name }) : t("reading.chooseChapter")}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="grid max-h-[60vh] grid-cols-5 gap-2 overflow-y-auto pr-1 sm:grid-cols-7" ref={chapterGridRef}>
                            {chapterGrid.map((item) => {
                              const active = item === chapterNumber;
                              return (
                                <Button
                                  aria-current={active ? "true" : undefined}
                                  className={active ? "border-gold bg-gold-bg text-gold hover:bg-gold-bg" : ""}
                                  data-chapter={item}
                                  key={item}
                                  onClick={() => {
                                    goToChapter(item);
                                    setIsChapterPickerOpen(false);
                                  }}
                                  size="sm"
                                  type="button"
                                  variant="outline"
                                >
                                  {item}
                                </Button>
                              );
                            })}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <div className="hidden items-center gap-3 flex-shrink-0 rounded-md h-10 border border-border bg-app-surface px-4 sm:flex">
                    <Label className="text-xs text-app-text-muted cursor-pointer font-medium" htmlFor="compare-toggle-inline">
                      {t("reading.compare")}
                    </Label>
                    <Switch checked={compareEnabled} id="compare-toggle-inline" onCheckedChange={setCompareEnabled} />
                    {compareEnabled && (
                      <>
                        <Select onValueChange={(value) => setCompareVersion(value as BibleVersion)} value={compareVersion}>
                          <SelectTrigger className="h-8 w-20 border-border bg-app-raised text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VERSION_OPTIONS.filter((item) => item !== selectedVersion).map((item) => (
                              <SelectItem key={item} value={item}>
                                {item.toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-border/50">
                          <Label className="text-[0.65rem] text-gold/80 uppercase tracking-wider cursor-pointer" htmlFor="diff-toggle">
                            Difs
                          </Label>
                          <Switch checked={showDiff} id="diff-toggle" onCheckedChange={setShowDiff} className="data-[state=checked]:bg-gold/80" />
                        </div>
                      </>
                    )}
                  </div>

                  <AudioPlayer
                    bookId={selectedBook?.id}
                    chapter={chapterNumber}
                    version={selectedVersion}
                  />

                  <Button
                    aria-label={t("reading.toggleFocusMode")}
                    onClick={() => updatePreference("focusMode", !preferences.focusMode)}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    {preferences.focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>

                  {notes.length > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          aria-label="Baixar Notas do Capítulo (PDF)"
                          size="icon"
                          type="button"
                          variant="outline"
                          title={`Baixar Anotações de ${selectedBook?.name} ${chapterNumber} (PDF)`}
                          className="text-gold border-gold/40 hover:bg-gold/10"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-app-bg border-border text-app-text sm:max-w-md w-[95vw] rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {isPro ? "Gerar PDF de Anotações?" : "Recurso Premium"}
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-app-text-muted">
                            {isPro
                              ? "Esta ação compilará todas as suas notas deste capítulo em um documento PDF formatado. Deseja iniciar o download?"
                              : "A exportação avançada de cadernos de estudo em brochuras de PDF é um recurso exclusivo do Bíblia Vive PRO. Assine hoje para apoiar o projeto e desbloquear esta funcionalidade."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4">
                          <AlertDialogCancel className="border-border text-app-text hover:bg-app-surface rounded-lg">Cancelar</AlertDialogCancel>
                          {isPro ? (
                            <AlertDialogAction
                              onClick={() => exportNotesToPDF(notes, true)}
                              className="bg-gold text-app-bg hover:bg-gold/90 rounded-lg"
                            >
                              Sim, Baixar PDF
                            </AlertDialogAction>
                          ) : (
                            <AlertDialogAction
                              onClick={() => navigate("/pro")}
                              className="bg-gold text-app-bg hover:bg-gold/90 rounded-lg"
                            >
                              Conhecer Premium
                            </AlertDialogAction>
                          )}
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  <Button
                    aria-label={churchMode.isActive ? "Desativar Modo Igreja" : "Ativar Modo Igreja"}
                    title={churchMode.isActive ? "Desativar Modo Igreja" : isTemplo ? "Modo Igreja — projeta versículos em outra aba" : "Modo Igreja (Exclusivo Plano Templo)"}
                    onClick={() => {
                      if (isTemplo) {
                        churchMode.toggleChurchMode();
                      } else {
                        navigate('/pro');
                      }
                    }}
                    size="icon"
                    type="button"
                    variant="outline"
                    className={churchMode.isActive ? "border-gold/50 text-gold bg-gold-bg/20 shadow-gold-glow" : !isTemplo ? "opacity-60" : ""}
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>

                  <Button
                    aria-label={t("reading.openSettings")}
                    className={isSettingsOpen ? "text-gold transition-transform duration-200 rotate-12" : ""}
                    onClick={() => setIsSettingsOpen(true)}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </section>

            <SettingsPanel
              hasPortugueseVoice={tts.hasPortugueseVoice}
              onOpenChange={setIsSettingsOpen}
              onReset={() => {
                resetPreferences();
                toast({ message: t("reading.preferencesRestored"), type: "info" });
              }}
              open={isSettingsOpen}
              preferences={preferences}
              updatePreference={updatePreference}
            />
          </>
        )}

        {error ? (
          <div className="mx-auto flex min-h-[360px] w-full max-w-[680px] flex-col items-center justify-center px-4 text-center md:px-6">
            <Alert className="w-full border-border bg-app-surface">
              <AlertTitle>{t("reading.loadErrorTitle")}</AlertTitle>
              <AlertDescription>{t("reading.loadErrorDesc")}</AlertDescription>
            </Alert>
            <Button className="mt-4" onClick={() => setReloadToken((value) => value + 1)} type="button" variant="outline">
              {t("reading.retry")}
            </Button>
            {error !== "Não foi possível carregar este capítulo. Tente novamente." && (
              <p className="mt-2 text-sm text-app-text-muted">{error}</p>
            )}
          </div>
        ) : (
          <div className="mx-auto w-full flex items-start justify-center gap-4 xl:gap-10">
            <article
              aria-busy={loading}
              aria-live="polite"
              className="w-full shrink-0 rounded-2xl border border-border bg-app-surface px-4 py-7 md:px-6"
              style={{ maxWidth: compareEnabled ? "1120px" : "var(--column-width)" }}
            >
              <h1 className="mb-4 text-2xl text-app-text">{selectedBook?.name} — {t("home.chapter")} {chapterNumber}</h1>
              {chapterData?.fallbackNotice && (
                <Alert className="mb-4 border-gold/40 bg-gold/10 text-gold-dark dark:text-gold-light">
                  <AlertTitle className="flex items-center gap-2 font-semibold text-sm">
                    ⚡ Modo Offline — Bíblia em Cache
                  </AlertTitle>
                  <AlertDescription className="text-xs opacity-90">
                    {chapterData.fallbackNotice}
                  </AlertDescription>
                </Alert>
              )}
              <WorshipCard bookId={selectedBook?.id} chapter={chapterNumber} />

              {/* Eco do Memorial — banner sóbrio mostrado quando o leitor já possui uma memória neste capítulo */}
              {!loading && !error && echoEntry && (
                <EchoBanner
                  entry={echoEntry}
                  onOpenModal={() => setIsEchoModalOpen(true)}
                />
              )}

              <div className={compareEnabled ? "grid gap-6 lg:grid-cols-2" : "block"}>
                <section>
                  {!preferences.focusMode && (
                    <p className="mb-3 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-app-text-muted">{selectedVersion.toUpperCase()}</p>
                  )}
                  {loading ? (
                    <div aria-label={t("reading.loadingChapter")}>
                      <LoadingLines />
                    </div>
                  ) : (
                    <div role="list">
                      {chapterVerses.map((verse, index) => {
                        const verseNumber = String(verse.number);
                        const anchorKey = `main-${verseNumber}`;
                        const isHovered = hoveredVerseNumber === verseNumber;
                        const isSelected = selectedVerse?.anchorKey === anchorKey;
                        const isHashHighlighted = hashHighlightedVerse === verseNumber;
                        const isTTSCurrent = currentTTSVerse?.number === verse.number;
                        const highlightClass = getVerseHighlightClass({
                          isHashHighlighted,
                          isHovered,
                          isSelected,
                          isTTSCurrent,
                        });

                        const userHighlightColor = getHighlightForVerse(verse.number);
                        const userHighlightClass = userHighlightColor ? HIGHLIGHT_CLASSES[userHighlightColor] : "";
                        const verseNote = getNoteForVerse(verse.number);

                        // Compute word-level diff tokens for primary column
                        const primaryText = verse.text ?? "";
                        const compareVerseText = compareEnabled
                          ? (compareData?.verses?.[index]?.text ?? "")
                          : null;
                        const primaryDiffTokens: DiffToken[] | null =
                          compareEnabled && showDiff && primaryText && compareVerseText
                            ? diffVerses(primaryText, compareVerseText).tokensA
                            : null;

                        const isChurchChecked = churchMode.selectedVerses.some(
                          v => v.number === verse.number
                        );

                        const verseContent = (
                          <div
                            aria-label={`${t("reading.verse")} ${verseNumber}: ${primaryText.split(" ").slice(0, 20).join(" ")}...`}
                            aria-selected={isSelected}
                            className={`group w-full cursor-pointer rounded-md px-1 py-1 transition-colors ${highlightClass} ${userHighlightClass} ${verseNote ? "border-l-0 pl-0" : ""} ${isChurchChecked ? "ring-1 ring-gold/40 bg-gold/5" : ""}`}
                            data-verse-item="true"
                            id={`v${verseNumber}`}
                            key={verse.id}
                            onClick={() =>
                              handleVerseClick({
                                anchorKey,
                                text: primaryText,
                                verseNumber,
                                version: selectedVersion,
                              })
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                handleVerseClick({
                                  anchorKey,
                                  text: primaryText,
                                  verseNumber,
                                  version: selectedVersion,
                                });
                              }
                            }}
                            onPointerEnter={() => setHoveredVerseNumber(verseNumber)}
                            onPointerLeave={() => setHoveredVerseNumber((current) => (current === verseNumber ? null : current))}
                            onMouseEnter={() => setHoveredVerseNumber(verseNumber)}
                            onMouseLeave={() => setHoveredVerseNumber((current) => (current === verseNumber ? null : current))}
                            onFocus={() => setHoveredVerseNumber(verseNumber)}
                            onBlur={() => setHoveredVerseNumber((current) => (current === verseNumber ? null : current))}
                            ref={setVerseRef(anchorKey)}
                            role="listitem"
                            tabIndex={0}
                            style={{ marginBottom: "var(--verse-spacing)" }}
                          >
                            <p
                              className={cn("text-app-text flex items-start gap-2", isHebrewReading && "font-hebrew")}
                              dir={isHebrewReading ? "rtl" : undefined}
                              style={{
                                fontFamily: isHebrewReading ? "var(--font-hebrew)" : "var(--font-reading)",
                                fontSize: "var(--font-size-reading)",
                                lineHeight: "1.85",
                              }}
                            >
                              {/* Church Mode Checkbox */}
                              {churchMode.isActive && (
                                <span
                                  className="flex-shrink-0 mt-[0.35rem]"
                                  onClick={(e) => { e.stopPropagation(); handleChurchCheckbox({ number: verse.number, text: primaryText, version: selectedVersion }); }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChurchChecked}
                                    readOnly
                                    className="h-4 w-4 rounded cursor-pointer accent-gold"
                                    aria-label={`Selecionar versículo ${verseNumber} para projeção`}
                                  />
                                </span>
                              )}
                              <span className="mr-2 inline-block w-6 align-top font-mono text-[0.65rem] text-gold transition-opacity duration-100 group-hover:opacity-100" style={{ opacity: isHovered ? 1 : 0.6, flexShrink: 0 }}>
                                {verseNumber}
                              </span>
                              {renderVerseText(primaryDiffTokens, primaryText, verseNumber)}
                            </p>
                          </div>
                        );

                        return verseNote ? (
                          <NotePopover
                            key={verse.id}
                            note={verseNote}
                            onEditClick={() => {
                              setSelectedVerse({
                                anchorKey,
                                reference: `${selectedBook?.name ?? t("reading.book")} ${chapterNumber}:${verseNumber}`,
                                text: primaryText,
                                verseNumber,
                                version: selectedVersion,
                              });
                              setHashHighlightedVerse(null);
                              setIsNoteModalOpen(true);
                            }}
                          >
                            {verseContent}
                          </NotePopover>
                        ) : verseContent;
                      })}                    </div>
                  )}
                </section>

                {compareEnabled && (
                  <section className="border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                    <p className="mb-3 font-mono text-[0.68rem] uppercase tracking-[0.08em] text-app-text-muted">{compareVersion.toUpperCase()}</p>
                    {compareError && (
                      <Alert className="mb-4 border-border bg-app-surface">
                        <AlertTitle>{t("reading.compareUnavailable")}</AlertTitle>
                        <AlertDescription>{compareError}</AlertDescription>
                      </Alert>
                    )}
                    {compareLoading ? (
                      <LoadingLines />
                    ) : (
                      <div role="list">
                        {(compareData?.verses ?? []).map((verse, index) => {
                          const verseNumber = String(verse.number ?? (getVerseNumber(verse.reference) || index + 1));
                          const anchorKey = `compare-${verseNumber}`;
                          const cleanedContent = verse.text ?? "";
                          const isHovered = hoveredVerseNumber === verseNumber;
                          const isSelected = selectedVerse?.anchorKey === anchorKey;
                          const highlightClass = getVerseHighlightClass({ isHovered, isSelected });

                          // Compute word-level diff tokens for compare column
                          const primaryVerseText = chapterVerses[index]?.text ?? "";
                          const compareDiffTokens: DiffToken[] | null =
                            showDiff && primaryVerseText && cleanedContent
                              ? diffVerses(cleanedContent, primaryVerseText).tokensA
                              : null;

                          return (
                            <div
                              aria-selected={isSelected}
                              className={`group w-full cursor-pointer rounded-md px-1 py-1 transition-colors ${highlightClass}`}
                              data-verse-item="true"
                              key={verse.id}
                              onClick={() =>
                                handleVerseClick({
                                  anchorKey,
                                  text: cleanedContent,
                                  verseNumber,
                                  version: compareVersion,
                                })
                              }
                              onPointerEnter={() => setHoveredVerseNumber(verseNumber)}
                              onPointerLeave={() => setHoveredVerseNumber((current) => (current === verseNumber ? null : current))}
                              onMouseEnter={() => setHoveredVerseNumber(verseNumber)}
                              onMouseLeave={() => setHoveredVerseNumber((current) => (current === verseNumber ? null : current))}
                              onFocus={() => setHoveredVerseNumber(verseNumber)}
                              onBlur={() => setHoveredVerseNumber((current) => (current === verseNumber ? null : current))}
                              ref={setVerseRef(anchorKey)}
                              role="listitem"
                              tabIndex={0}
                              style={{ marginBottom: "var(--verse-spacing)" }}
                            >
                              <p
                                className={cn("text-app-text", compareVersion === "org" && !!selectedBook && getLanguageLabel(selectedBook.id) === "Hebraico" && "font-hebrew")}
                                dir={compareVersion === "org" && !!selectedBook && getLanguageLabel(selectedBook.id) === "Hebraico" ? "rtl" : undefined}
                                style={{
                                  fontFamily: compareVersion === "org" && !!selectedBook && getLanguageLabel(selectedBook.id) === "Hebraico" ? "var(--font-hebrew)" : "var(--font-reading)",
                                  fontSize: "var(--font-size-reading)",
                                  lineHeight: "1.85",
                                }}
                              >
                                <span className="mr-2 inline-block w-6 align-top font-mono text-[0.65rem] text-gold">{verseNumber}</span>
                                {renderVerseText(compareDiffTokens, cleanedContent, verseNumber)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}
              </div>

              {/* Removido do bottom conforme o pedido do usuário para jogar para sidebar direita */}

              {!loading && !error && isPartOfTodayReading && activePlan && (
                <DailyReadingBadge
                  planName={activePlan.name}
                  todayDayIndex={todayDayIndex}
                  isTodayCompleted={isTodayCompleted}
                  isRefCompleted={todayReadRefs?.includes(currentRef) ?? false}
                  totalRefs={todayRefs?.length ?? 0}
                  completedRefs={todayReadRefs?.length ?? 0}
                  onMarkComplete={() => markRefRead(currentRef)}
                />
              )}

              {/* Bloco "O que nasceu desta leitura" */}
              {selectedBook && (
                <ChapterMemorialBlock
                  bookId={selectedBook.id}
                  chapter={Number(chapterNumber)}
                  userId={user?.id ?? null}
                />
              )}
            </article>

            {/* Sticky Chapter Sidebar on Desktop */}
            {!compareEnabled && selectedBook && (
              <aside className={cn(
                "hidden lg:block shrink-0 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar pl-4 pr-4 transition-[width] duration-500",
                cachedChapterCommentary ? "w-[320px] xl:w-[380px] 2xl:w-[420px]" : "w-[140px] xl:w-[180px] 2xl:w-[220px]"
              )}>
                <div className="flex flex-col items-center pb-8 pt-2 w-full">
                  {!preferences.focusMode && (
                    <span className="text-[0.6rem] font-mono text-app-text-muted uppercase tracking-widest mb-4 opacity-70">
                      Capítulos
                    </span>
                  )}
                  <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2 xl:gap-2.5 w-full justify-items-center">
                    {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => goToChapter(c)}
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-[0.85rem] font-medium transition-all duration-200 cursor-pointer",
                          c === Number(chapterNumber)
                            ? "bg-gold text-white font-bold shadow-md shadow-gold/30 scale-110"
                            : "text-app-text-muted hover:bg-gold-bg/60 hover:text-gold bg-app-raised/30"
                        )}
                        aria-label={`${t("home.chapter")} ${c}`}
                        aria-current={c === Number(chapterNumber) ? "page" : undefined}
                      >
                        {c}
                      </button>
                    ))}
                  </div>

                  {/* Chapter Commentary Button in Sidebar */}
                  <div className="w-full mt-8 border-t border-border/50 pt-6 flex flex-col items-center justify-center">
                    {isPro && <CommentaryQuota compact className="w-full mb-4 px-2" />}
                    {!isPro && freeChapterCommentaryCount === 0 && !cachedChapterCommentary ? (
                      <div className="w-full rounded-xl border border-gold/20 bg-gold-bg/10 p-5 text-center space-y-3 animate-in fade-in">
                        <div className="mx-auto w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                          <Lock className="h-5 w-5 text-gold" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xs font-semibold text-app-text">Recurso Exclusivo PRO</h3>
                          <p className="text-[0.7rem] text-app-text-muted leading-relaxed">
                            Você já utilizou seus 3 comentários gratuitos de capítulos. Assine para ter acesso ilimitado a comentários de capítulos e versículos por hora.
                          </p>
                        </div>
                        <Button
                          className="w-full bg-gold text-app-bg hover:bg-gold/90 font-bold text-xs py-2 h-auto"
                          onClick={() => navigate('/pro')}
                        >
                          Assinar Plano Premium
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          onClick={handleChapterCommentary}
                          disabled={isChapterCommentaryLoading}
                          type="button"
                          className={cn(
                            "w-full h-auto py-3 px-4 text-center rounded-xl transition-all shadow-xs border-0",
                            isChapterCommentaryLoading
                              ? "bg-app-raised border border-border cursor-not-allowed text-app-text-muted"
                              : "bg-gold text-black font-semibold hover:bg-gold/90"
                          )}
                        >
                          {isChapterCommentaryLoading && (
                            <Loader2 className="h-4 w-4 animate-spin text-app-text-muted mr-2 inline-block" />
                          )}
                          <span className={cn(
                            "text-[0.72rem] font-medium tracking-wide leading-tight",
                            isChapterCommentaryLoading && "opacity-70 text-app-text-muted"
                          )}>
                            {isChapterCommentaryLoading ? "Analisando..." : cachedChapterCommentary ? "Ver Comentários" : "Comentários do Capítulo"}
                          </span>
                        </Button>
                        {!isPro && !cachedChapterCommentary && (
                          <p className="text-[0.68rem] text-app-text-muted mt-2 text-center">
                            Você tem <strong className="text-gold">{freeChapterCommentaryCount}</strong> {freeChapterCommentaryCount === 1 ? 'comentário gratuito de capítulo disponível' : 'comentários gratuitos de capítulos disponíveis'}.
                          </p>
                        )}
                      </>
                    )}

                    {cachedChapterCommentary && (
                      <div id="chapter-commentary-section" className="w-full mt-8 animate-in fade-in duration-700">
                        <div className="flex flex-col items-center text-center gap-2 mb-6">
                          <div className="flex justify-center w-full mt-2">
                            <div className="h-0.5 w-12 bg-gold/30 rounded-full mb-4"></div>
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold shadow-sm ring-1 ring-gold/20">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-serif text-[1.1rem] font-bold text-app-text leading-tight mt-1">Acervo Teológico</h3>
                            <p className="text-[0.65rem] text-app-text-muted uppercase tracking-widest font-mono mt-1">
                              {selectedBook?.name} {chapterNumber}
                            </p>
                          </div>
                        </div>
                        <div className="pb-8">
                          <BiblicalCommentary
                            commentaries={(function () {
                              try {
                                const parsed = JSON.parse(cachedChapterCommentary);
                                return Array.isArray(parsed) ? parsed : (parsed.commentaries || []);
                              } catch {
                                return [];
                              }
                            })()}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            )}

          </div>
        )}
        {/* Floating batch-send button (Church Mode, autoSend OFF) */}
        {churchMode.isActive && !churchMode.autoSend && churchMode.selectedVerses.length > 0 && (
          <div className="fixed bottom-20 right-4 z-50 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                churchMode.sendToDisplay(churchMode.selectedVerses);
                churchMode.clearSelection();
              }}
              className="flex items-center gap-2 rounded-full bg-gold text-app-bg px-4 py-2.5 text-sm font-semibold shadow-lg hover:bg-gold/90 transition-colors"
            >
              <Monitor className="h-4 w-4" />
              Enviar {churchMode.selectedVerses.length} versículo{churchMode.selectedVerses.length !== 1 ? 's' : ''}
            </button>
            <button
              type="button"
              onClick={churchMode.clearSelection}
              aria-label="Limpar seleção"
              className="h-9 w-9 rounded-full bg-app-surface border border-border text-app-text-muted flex items-center justify-center hover:bg-app-raised transition-colors"
            >
              ×
            </button>
          </div>
        )}

        <VerseToolbar
          ariaReference={selectedVerse?.reference ?? ""}
          copyLabel={copyLabel}
          isMobile={isToolbarMobile}
          onCopy={handleCopy}
          onShare={handleShare}
          onStudy={handleStudy}
          onHighlight={(color) => {
            if (!selectedVerse) return;
            void addHighlight(Number(selectedVerse.verseNumber), color);
          }}
          onRemoveHighlight={() => {
            if (!selectedVerse) return;
            void removeHighlight(Number(selectedVerse.verseNumber));
          }}
          onNote={() => {
            if (!selectedVerse) return;
            setIsNoteModalOpen(true);
          }}
          onClose={() => setSelectedVerse(null)}
          activeHighlight={selectedVerse ? getHighlightForVerse(Number(selectedVerse.verseNumber)) : null}
          hasNote={selectedVerse ? !!getNoteForVerse(Number(selectedVerse.verseNumber)) : false}
          position={toolbarPosition}
          shareLabel={shareLabel}
          studyOpen={studyVerse !== null}
          visible={!!selectedVerse}
        />

        <NoteModal
          isOpen={isNoteModalOpen}
          onClose={() => setIsNoteModalOpen(false)}
          reference={selectedVerse?.reference ?? ''}
          verseText={selectedVerse?.text ?? ''}
          existingNote={selectedVerse ? getNoteForVerse(Number(selectedVerse.verseNumber)) : null}
          onSave={(content) => {
            if (!selectedVerse || !selectedBook) return;
            saveNote({
              bookId: selectedBook.id,
              bookName: selectedBook.name,
              chapter: chapterNumber,
              verse: Number(selectedVerse.verseNumber),
              content,
              version: selectedVersion,
              verseText: selectedVerse.text,
            }).then(({ error }) => {
              if (error) {
                toast({ message: `Erro ao salvar anotação: ${error}`, type: 'error' });
              }
            });
          }}
          onDelete={() => {
            if (!selectedVerse) return;
            void deleteNote(Number(selectedVerse.verseNumber));
          }}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />


        {selectedBook && !preferences.focusMode && (
          <footer className="mx-auto mt-6 mb-12 flex w-full max-w-[680px] flex-col items-center justify-center gap-4 px-4 py-8 md:px-6" role="contentinfo">
            <div className="flex w-full items-center justify-center gap-3">
              {prevChapterInfo && (
                <Button
                  className="group flex-1 max-w-[300px] h-10 text-xs sm:text-sm"
                  onClick={() => goToChapter(prevChapterInfo.chapter, prevChapterInfo.book.slug)}
                  type="button"
                  variant="outline"
                >
                  ← {t("reading.backTo", { reference: `${prevChapterInfo.book.name} ${prevChapterInfo.chapter}` })}
                </Button>
              )}

              {nextChapterInfo ? (
                <Button
                  className="group flex-1 max-w-[300px] h-10 text-xs sm:text-sm"
                  onClick={() => goToChapter(nextChapterInfo.chapter, nextChapterInfo.book.slug)}
                  type="button"
                  variant="outline"
                >
                  {t("reading.continueTo", { reference: `${nextChapterInfo.book.name} ${nextChapterInfo.chapter}` })} →
                </Button>
              ) : (
                <Button
                  className="group flex-1 max-w-[300px] h-10 text-xs sm:text-sm"
                  onClick={() => navigate("/")}
                  type="button"
                  variant="outline"
                >
                  Concluir Leitura ✓
                </Button>
              )}
            </div>
          </footer>
        )}

        {selectedBook && preferences.focusMode && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
            <Button className="h-8 px-3 text-xs bg-app-surface border-border hover:bg-app-raised" onClick={() => updatePreference("focusMode", false)} type="button" variant="outline">
              {t("reading.exitFocus")}
            </Button>
            <Button
              className="h-8 px-3 text-xs bg-app-surface border-border hover:bg-app-raised"
              disabled={!prevChapterInfo}
              onClick={() => prevChapterInfo && goToChapter(prevChapterInfo.chapter, prevChapterInfo.book.slug)}
              type="button"
              variant="outline"
              aria-label="Capítulo anterior"
            >
              ←
            </Button>
            <Button
              className="h-8 px-3 text-xs bg-app-surface border-border hover:bg-app-raised"
              disabled={!nextChapterInfo}
              onClick={() => nextChapterInfo && goToChapter(nextChapterInfo.chapter, nextChapterInfo.book.slug)}
              type="button"
              variant="outline"
              aria-label="Próximo capítulo"
            >
              →
            </Button>
          </div>
        )}
        {cardModalData && (
          <VerseCardModal
            isOpen={isCardModalOpen}
            onClose={() => { setIsCardModalOpen(false); setCardModalData(null); }}
            data={cardModalData}
          />
        )}

        {/* Eco do Memorial — modal de reencontro espiritual */}
        {echoEntry && (
          <EchoModal
            isOpen={isEchoModalOpen}
            onClose={() => setIsEchoModalOpen(false)}
            entry={echoEntry}
            store={echoStore}
            onRefresh={refreshEcho}
          />
        )}

        {isStudyPanelOpen && studyVerse && selectedBook && (
          <StudyPanel
            bookId={selectedBook.id}
            chapter={chapterNumber}
            verse={studyVerse}
            verseText={studyVerseText}
            version={selectedVersion}
            onClose={() => setIsStudyPanelOpen(false)}
          />
        )}

        <RateLimitDialog
          open={rateLimitStatus.open}
          onOpenChange={(open) => setRateLimitStatus(prev => ({ ...prev, open }))}
          resetAt={rateLimitStatus.resetAt}
          limit={rateLimitStatus.limit}
        />

        {/* O caderno e o botão flutuante são renderizados globalmente em GlobalNotebookContainer */}
      </div>
    </Layout>
  );
}
