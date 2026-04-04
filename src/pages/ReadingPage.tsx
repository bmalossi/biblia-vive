import Layout from "@/components/Layout";
import SettingsPanel from "@/components/SettingsPanel";
import StudyPanel from "@/components/StudyPanel";
import { prefetchLexicons } from "@/lib/strongs";
import AudioPlayer from "@/components/AudioPlayer";
import VerseToolbar from "@/components/VerseToolbar";
import NoteModal from "@/components/NoteModal";
import AuthModal from "@/components/AuthModal";
import NotePopover from "@/components/NotePopover";
import DailyReadingBadge from "@/components/DailyReadingBadge";
import VerseCardModal from "@/components/VerseCardModal";
import type { CardData } from "@/components/VerseCardTemplates";
import { diffVerses, type DiffToken } from "@/lib/textDiff";
import { useReadingPlan } from "@/hooks/useReadingPlan";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useNotesHighlights } from "@/hooks/useNotesHighlights";
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
import { findBookBySlug } from "@/lib/books";
import { BibleVersion, getVersion, isBibleVersion, setVersion, VERSION_OPTIONS } from "@/lib/themes";
import { Maximize2, Minimize2, Settings, FileText, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { exportNotesToPDF } from "@/lib/notesHighlights";
import { cn } from "@/lib/utils";
import { BiblicalCommentary } from "@/components/BiblicalCommentary";
import { requestCommentary } from "@/lib/studyPanel";

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

  if (isSelected) classes.push("bg-gold-bg/80 ring-2 ring-gold/55");
  else if (isTTSCurrent) classes.push("bg-gold-bg/90 ring-2 ring-gold/60");
  else if (isHashHighlighted) classes.push("bg-gold-bg/75 ring-1 ring-gold/35");

  if (isHovered) classes.push("bg-gold-bg/85 ring-2 ring-gold/65");

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

const saveLastRead = (version: string, bookSlug: string, chapter: number) => {
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
  } catch {
    // ignore
  }
};

export default function ReadingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { version, book, chapter } = useParams();

  const selectedVersion = isBibleVersion(version) ? version : getVersion();
  const selectedBook = findBookBySlug(book);
  const chapterNumber = Number(chapter || "1");

  const [chapterData, setChapterData] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [showDiff, setShowDiff] = useState(true);
  const [compareVersion, setCompareVersion] = useState<BibleVersion>(selectedVersion === "acf" ? "nvi" : "acf");
  const [compareData, setCompareData] = useState<Chapter | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [hoveredVerseNumber, setHoveredVerseNumber] = useState<string | null>(null);
  const [hashHighlightedVerse, setHashHighlightedVerse] = useState<string | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<VerseSelection | null>(null);
  const [toolbarPosition, setToolbarPosition] = useState<{ left: number; top: number } | null>(null);
  const [isToolbarMobile, setIsToolbarMobile] = useState(false);
  const [isStudyPanelOpen, setIsStudyPanelOpen] = useState(false);
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
  const [localChapterCommentary, setLocalChapterCommentary] = useState<string | null>(null);
  const [isChapterCommentaryLoading, setIsChapterCommentaryLoading] = useState(false);

  const toolbarLayerRef = useRef<HTMLDivElement>(null);
  const chapterGridRef = useRef<HTMLDivElement>(null);
  const verseRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { copyState, copyVerse, shareState, shareVerse } = useVerseActions();
  const { preferences, updatePreference, resetPreferences } = useReadingPreferences({ rootId: "reading-root" });
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const { notes, getHighlightForVerse, getNoteForVerse, addHighlight, removeHighlight, saveNote, deleteNote } =
    useNotesHighlights(selectedBook?.id ?? '', chapterNumber);

  const { activePlan, todayDayIndex, todayRefs, isTodayCompleted, markTodayComplete } = useReadingPlan();

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

  usePageMeta({
    canonical: selectedBook ? `/${selectedVersion}/${selectedBook.slug}/${chapterNumber}` : window.location.pathname,
    description: selectedBook
      ? `Leia ${selectedBook.name} capítulo ${chapterNumber} na versão ${selectedVersion.toUpperCase()}. ${chapterVerses[0]?.text?.slice(0, 140) ?? ""}...`
      : "Leia capítulos bíblicos com foco, áudio e comparação de versões.",
    jsonLd: selectedBook
      ? {
        "@context": "https://schema.org",
        "@type": "Article",
        name: `${selectedBook.name} Capítulo ${chapterNumber}`,
        headline: `${selectedBook.name} ${chapterNumber} — ${selectedVersion.toUpperCase()}`,
        description: chapterVerses[0]?.text ?? "Leitura bíblica em português.",
        inLanguage: "pt-BR",
        isPartOf: {
          "@type": "Book",
          name: "Bíblia Sagrada",
          inLanguage: "pt-BR",
        },
        publisher: {
          "@type": "Organization",
          name: "Bíblia Vive",
        },
      }
      : undefined,
    title: selectedBook ? `${selectedBook.name} ${chapterNumber} — ${selectedVersion.toUpperCase()} | ${t("app.name")}` : `${t("reading.title")} | ${t("app.name")}`,
    type: "article",
  });

  const updateToolbarPosition = useCallback(
    (anchorKey: string) => {
      if (isToolbarMobile) {
        setToolbarPosition(null);
        return;
      }

      const verseElement = verseRefs.current[anchorKey];
      const layer = toolbarLayerRef.current;
      if (!verseElement || !layer) return;

      const verseRect = verseElement.getBoundingClientRect();
      const layerRect = layer.getBoundingClientRect();
      const toolbarWidth = 360;
      const padding = 12;
      const preferredLeft = verseRect.left - layerRect.left;
      const maxLeft = Math.max(padding, layerRect.width - toolbarWidth - padding);

      setToolbarPosition({
        left: Math.min(Math.max(preferredLeft, padding), maxLeft),
        top: verseRect.bottom - layerRect.top + 8,
      });
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
      const target = event.target as HTMLElement | null;
      const typingInField = target && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName);

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

      if (isChapterPickerOpen || isSettingsOpen) return;

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
    navigate,
    preferences.focusMode,
    selectedBook,
    selectedVerse,
    selectedVersion,
    updatePreference,
  ]);

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
    setLocalChapterCommentary(null);
    tts.stop();
  }, [chapterNumber, compareEnabled, compareVersion, selectedVersion, tts.stop]);

  useEffect(() => {
    if (!selectedVerse || isToolbarMobile) return;
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
    saveLastRead(selectedVersion, selectedBook.slug, chapterNumber);
  }, [chapterNumber, selectedBook, selectedVersion]);

  useEffect(() => {
    if (!selectedBook) return;
    const interval = window.setInterval(() => {
      saveLastRead(selectedVersion, selectedBook.slug, chapterNumber);
    }, 30000);

    return () => window.clearInterval(interval);
  }, [chapterNumber, selectedBook, selectedVersion]);

  useEffect(() => {
    if (!selectedBook) return;

    let timeoutId: number | null = null;
    const onScroll = () => {
      if (timeoutId) return;
      timeoutId = window.setTimeout(() => {
        saveLastRead(selectedVersion, selectedBook.slug, chapterNumber);
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

  const goToChapter = (nextChapter: number) => {
    if (!selectedBook) return;
    navigate(`/${selectedVersion}/${selectedBook.slug}/${nextChapter}`);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

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

  const handleCopy = () => {
    if (!selectedVerse) return;
    void copyVerse({
      chapter: chapterNumber,
      pathname: location.pathname,
      reference: selectedVerse.reference,
      text: selectedVerse.text,
      verseNumber: selectedVerse.verseNumber,
      version: selectedVerse.version,
    });
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

  const handleStudy = () => {
    if (!selectedVerse) return;
    setStudyVerse(Number(selectedVerse.verseNumber));
    setStudyVerseText(selectedVerse.text);
    setIsStudyPanelOpen((prev) => !prev);
  };

  const handleChapterCommentary = async () => {
    if (!isPro) {
      navigate('/pro');
      return;
    }
    if (!selectedBook) return;
    setIsChapterCommentaryLoading(true);
    try {
      const { commentaries } = await requestCommentary({
        bookId: selectedBook.id,
        chapter: chapterNumber,
        verse: null,
        verseText: "",
        version: selectedVersion,
        language: String(locale).startsWith("pt") ? "pt" : "en",
      });
      setLocalChapterCommentary(JSON.stringify(commentaries));
    } catch (e: any) {
      toast({ message: "Erro: " + e.message, type: "error" });
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

  return (
    <Layout hideHeader={preferences.focusMode} hideMobileNav={preferences.focusMode}>
      <div className="relative" id="reading-root" ref={toolbarLayerRef}>
        {preferences.focusMode && selectedBook && (
          <div
            className={`sticky top-0 z-40 mx-auto mb-3 flex w-full max-w-3xl items-center justify-between rounded-full border border-border bg-app-surface px-4 py-2 transition-all duration-200 ${focusTopVisible ? "opacity-100" : "-translate-y-2 opacity-0"
              }`}
          >
            <span className="text-sm text-app-text">{selectedBook.name} {chapterNumber}</span>
            <Button onClick={() => updatePreference("focusMode", false)} size="sm" type="button" variant="ghost">
              {t("reading.exitFocus")}
            </Button>
          </div>
        )}

        {!preferences.focusMode && (
          <>
            <section className={`mx-auto w-full max-w-6xl px-4 md:px-6`}>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="mb-2 font-sans text-xs uppercase tracking-[0.08em] text-app-text-muted">{chapterLabel}</p>
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
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="hidden items-center gap-2 rounded-full border border-border bg-app-surface px-3 py-1 sm:flex">
                    <Label className="text-xs text-app-text-muted" htmlFor="compare-toggle-inline">
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
                    text={chapterVerses.map(v => v.text).join(" ")}
                    slug={`${selectedVersion}-${selectedBook?.slug}-${chapterNumber}`}
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

                        const verseContent = (
                          <div
                            aria-label={`${t("reading.verse")} ${verseNumber}: ${primaryText.split(" ").slice(0, 20).join(" ")}...`}
                            aria-selected={isSelected}
                            className={`group w-full cursor-pointer rounded-md px-1 py-1 transition-colors ${highlightClass} ${userHighlightClass} ${verseNote ? "border-l-0 pl-0" : ""}`}
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
                              className="text-app-text"
                              style={{
                                fontFamily: "var(--font-reading)",
                                fontSize: "var(--font-size-reading)",
                                lineHeight: "1.85",
                              }}
                            >
                              <span className="mr-2 inline-block w-6 align-top font-mono text-[0.65rem] text-gold transition-opacity duration-100 group-hover:opacity-100" style={{ opacity: isHovered ? 1 : 0.6 }}>
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
                              handleVerseClick({
                                anchorKey,
                                text: verse.text,
                                verseNumber,
                                version: selectedVersion,
                              });
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
                                className="text-app-text"
                                style={{
                                  fontFamily: "var(--font-reading)",
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
                  onMarkComplete={markTodayComplete}
                />
              )}
            </article>

            {/* Sticky Chapter Sidebar on Desktop */}
            {!compareEnabled && selectedBook && (
              <aside className="hidden lg:block shrink-0 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar pl-4 pr-4 w-[140px] xl:w-[180px] 2xl:w-[220px]">
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
                    <Button
                      onClick={handleChapterCommentary}
                      disabled={isChapterCommentaryLoading}
                      type="button"
                      className={cn(
                        "w-full h-auto py-3.5 flex-col gap-2 text-center rounded-xl transition-all shadow-sm",
                        isChapterCommentaryLoading
                          ? "bg-app-raised/50 border border-border cursor-not-allowed"
                          : "bg-gold-bg/20 text-gold hover:bg-gold-bg/40 border-gold/30 border hover:border-gold/50"
                      )}
                      variant="outline"
                    >
                      {isChapterCommentaryLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-app-text-muted" />
                      ) : (
                        <FileText className="h-5 w-5" />
                      )}
                      <span className={cn(
                        "text-[0.68rem] uppercase tracking-wide leading-tight",
                        isChapterCommentaryLoading && "opacity-70 text-app-text-muted"
                      )}>
                        {isChapterCommentaryLoading ? "Analisando..." : "Comentário do Capítulo"}
                      </span>
                    </Button>
                  </div>
                </div>
              </aside>
            )}

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
          activeHighlight={selectedVerse ? getHighlightForVerse(Number(selectedVerse.verseNumber)) : null}
          hasNote={selectedVerse ? !!getNoteForVerse(Number(selectedVerse.verseNumber)) : false}
          position={toolbarPosition}
          shareLabel={shareLabel}
          studyOpen={studyVerse !== null}
          visible={!!selectedVerse}
        />

        {studyVerse !== null && selectedBook && (
          <StudyPanel
            bookId={selectedBook.id}
            chapter={chapterNumber}
            verse={studyVerse}
            verseText={studyVerseText}
            version={selectedVersion}
            onClose={() => {
              setStudyVerse(null);
              setStudyVerseText('');
            }}
          />
        )}

        <NoteModal
          isOpen={isNoteModalOpen}
          onClose={() => setIsNoteModalOpen(false)}
          reference={selectedVerse?.reference ?? ''}
          verseText={selectedVerse?.text ?? ''}
          existingNote={selectedVerse ? getNoteForVerse(Number(selectedVerse.verseNumber)) : null}
          onSave={(content) => {
            if (!selectedVerse || !selectedBook) return;
            void saveNote({
              bookId: selectedBook.id,
              bookName: selectedBook.name,
              chapter: chapterNumber,
              verse: Number(selectedVerse.verseNumber),
              content,
              version: selectedVersion,
              verseText: selectedVerse.text,
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
          <footer className="mx-auto mt-2 flex w-full max-w-[680px] flex-col items-center justify-center gap-4 px-4 py-12 md:px-6" role="contentinfo">
            <div className="flex w-full items-center justify-center gap-3">
              <Button className="group" disabled={!hasPrev} onClick={() => goToChapter(chapterNumber - 1)} type="button" variant="outline">
                {t("reading.prevChapter")}
              </Button>
              <Button className="group" disabled={!hasNext} onClick={() => goToChapter(chapterNumber + 1)} type="button" variant="outline">
                {t("reading.nextChapter")}
              </Button>
            </div>
            <span className="font-sans text-sm text-app-text-muted">
              {chapterNumber} / {selectedBook.chapters}
            </span>
          </footer>
        )}

        {selectedBook && preferences.focusMode && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
            <Button className="h-8 px-3 text-xs" onClick={() => updatePreference("focusMode", false)} type="button" variant="outline">
              {t("reading.exitFocus")}
            </Button>
            <Button className="h-8 px-3 text-xs" disabled={!hasPrev} onClick={() => goToChapter(chapterNumber - 1)} type="button" variant="outline">
              ←
            </Button>
            <Button className="h-8 px-3 text-xs" disabled={!hasNext} onClick={() => goToChapter(chapterNumber + 1)} type="button" variant="outline">
              →
            </Button>
          </div>
        )}
      </div>
      {
        cardModalData && (
          <VerseCardModal
            isOpen={isCardModalOpen}
            onClose={() => { setIsCardModalOpen(false); setCardModalData(null); }}
            data={cardModalData}
          />
        )
      }

      {/* Chapter Commentary overlay - shown as popover below the sidebar button, not in a Dialog to avoid nested Radix Dialog issues */}
      {localChapterCommentary && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setLocalChapterCommentary(null)}>
          <div
            className="ml-auto mr-[156px] xl:mr-[196px] 2xl:mr-[236px] mt-24 max-h-[calc(100vh-120px)] w-[380px] bg-app-surface border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-gold/5 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gold" />
                <span className="font-serif font-semibold text-app-text">Acervo Teológico do Capítulo</span>
              </div>
              <button
                type="button"
                onClick={() => setLocalChapterCommentary(null)}
                className="h-7 w-7 rounded-full hover:bg-app-raised flex items-center justify-center text-app-text-muted hover:text-app-text transition-colors"
              >✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <p className="text-[0.72rem] text-app-text-muted mb-4 font-mono uppercase tracking-wide">{selectedBook?.name} {chapterNumber}</p>
              <BiblicalCommentary commentaries={JSON.parse(localChapterCommentary)} />
            </div>
          </div>
        </div>
      )}
    </Layout >
  );
}
