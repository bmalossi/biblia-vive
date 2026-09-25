import Layout from "@/components/Layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SearchResultCard from "@/components/SearchResultCard";
import { checkVerseExists, getFriendlyApiError, searchVerses, type Verse } from "@/lib/bibleApi";
import { searchBibleWorker } from "@/lib/bibleSearchClient";
import { BOOK_ALIASES, normalizeBookAlias } from "@/lib/bookAliases";
import { ALL_BOOKS, findBookById, findBookBySlug, findBookGlobally, type Book } from "@/lib/books";
import { formatParsedReferenceLabel, parseReference } from "@/lib/referenceParser";
import { getVersion, isBibleVersion } from "@/lib/themes";
import { useTranslation } from "@/i18n";
import { usePageMeta } from "@/hooks/usePageMeta";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronDown,
  FileText,
  Loader2,
  Search,
  SearchX,
  Sparkles,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

type SearchMode = "text" | "reference";

interface SuggestedReference {
  book: Book;
  chapter?: number;
  verse?: number;
  label: string;
}

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const normalizeCompact = (value: string) => normalizeBookAlias(normalizeText(value));

const onlyBookText = (value: string) => /[a-zà-ÿ]/i.test(value) && !/\d/.test(value);

const getBookFromText = (value: string) => {
  const compact = normalizeCompact(value);
  const bookId = BOOK_ALIASES[compact];
  return bookId ? findBookById(bookId) : undefined;
};

const levenshtein = (source: string, target: string) => {
  if (source === target) return 0;
  if (!source.length) return target.length;
  if (!target.length) return source.length;

  const matrix = Array.from({ length: source.length + 1 }, (_, index) => [index]);
  for (let column = 0; column <= target.length; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row <= source.length; row += 1) {
    for (let column = 1; column <= target.length; column += 1) {
      const cost = source[row - 1] === target[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost
      );
    }
  }

  return matrix[source.length][target.length];
};

const getClosestBook = (term: string) => {
  const normalizedTerm = normalizeCompact(term);
  if (!normalizedTerm) return null;

  const ranked = ALL_BOOKS.map((book) => {
    const candidates = [book.name, book.abbrev, book.slug, book.id].map((item) =>
      normalizeCompact(String(item))
    );
    const score = Math.min(...candidates.map((candidate) => levenshtein(normalizedTerm, candidate)));
    return { book, score };
  }).sort((a, b) => a.score - b.score);

  const best = ranked[0];
  if (!best) return null;

  const threshold = Math.max(2, Math.floor(normalizedTerm.length * 0.35));
  return best.score <= threshold ? best.book : null;
};

export default function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const queryParam = params.get("q") ?? "";
  const versionParam = params.get("v");
  const selectedVersion =
    versionParam === "all" || isBibleVersion(versionParam) ? versionParam : getVersion();
  const modeParam = params.get("mode") === "reference" ? "reference" : "text";

  const [query, setQuery] = useState(queryParam);
  const [mode, setMode] = useState<SearchMode>(modeParam);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Verse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { t } = useTranslation();

  const parsedReference = useMemo(() => parseReference(query), [query]);
  const referenceLabel = useMemo(
    () => (parsedReference ? formatParsedReferenceLabel(parsedReference) : ""),
    [parsedReference]
  );
  const queryBookMatch = useMemo(() => {
    if (!queryParam.trim() || !onlyBookText(queryParam)) return undefined;
    return getBookFromText(queryParam);
  }, [queryParam]);

  const instantBookSuggestions = useMemo(() => {
    const normalized = normalizeCompact(query);
    if (!normalized || normalized.length < 2) return [];

    return ALL_BOOKS.filter((book) => {
      const haystack = [book.name, book.abbrev, book.slug, book.id].map((value) =>
        normalizeCompact(String(value))
      );
      return haystack.some((value) => value.includes(normalized));
    }).slice(0, 4);
  }, [query]);

  const similarReference = useMemo<SuggestedReference | null>(() => {
    if (!query.trim() || parsedReference) return null;

    const normalized = normalizeText(query);
    const scopeMatch = normalized.match(/^(.+?)\s+(?:em|in|en)\s+([a-z0-9]+(?:\s+[a-z0-9]+)?)$/);
    let searchTerm = normalized;

    if (scopeMatch) {
      const potentialTerm = scopeMatch[1].trim();
      const rawScope = scopeMatch[2].trim().replace(/\s+/g, "");

      const normalizedScope = normalizeText(rawScope);
      const bookId = BOOK_ALIASES[normalizedScope];

      if (bookId) {
        searchTerm = potentialTerm;
      }
    }

    const chunks = searchTerm.match(/^(.+?)\s+(\d+)(?:\s*[:.]\s*(\d+))?$/);
    const rawBookTerm = chunks?.[1] ?? searchTerm;
    const chapter = chunks?.[2] ? Number(chunks[2]) : undefined;
    const verse = chunks?.[3] ? Number(chunks[3]) : undefined;

    const book = getClosestBook(rawBookTerm);
    if (!book) return null;

    const boundedChapter = chapter ? Math.min(Math.max(chapter, 1), book.chapters) : undefined;
    const label = `${book.name}${boundedChapter ? ` ${boundedChapter}` : ""}${verse ? `:${verse}` : ""}`;

    return {
      book,
      chapter: boundedChapter,
      verse,
      label,
    };
  }, [parsedReference, query]);

  const [referenceExists, setReferenceExists] = useState<boolean | null>(null);

  useEffect(() => {
    if (parsedReference) {
      checkVerseExists(
        selectedVersion,
        parsedReference.slug,
        parsedReference.chapter,
        parsedReference.verse
      ).then(setReferenceExists);
    } else {
      setReferenceExists(null);
    }
  }, [parsedReference, selectedVersion]);

  const chapterPreview = useMemo(() => {
    const primary = instantBookSuggestions[0];
    if (!primary) return [];
    return Array.from({ length: Math.min(primary.chapters, 8) }, (_, index) => index + 1);
  }, [instantBookSuggestions]);

  const resolveChapterRoute = (book: Book, chapter: number, verse?: number) => {
    const safeChapter = Math.max(1, Math.min(chapter, book.chapters));
    const hash = verse ? `#v${verse}` : "";
    const versionPath = selectedVersion === "all" ? "acf" : selectedVersion;
    return `/${versionPath}/${book.slug}/${safeChapter}${hash}`;
  };

  const goToBookChapter = (book: Book, chapter: number, verse?: number) => {
    navigate(resolveChapterRoute(book, chapter, verse));
  };

  useEffect(() => {
    setQuery(queryParam);
    setMode(modeParam);
    setCurrentPage(1);
  }, [modeParam, queryParam]);

  useEffect(() => {
    if (mode !== "text" || !queryParam.trim() || queryBookMatch) {
      setResults([]);
      setTotalCount(0);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);

      searchBibleWorker({
        query: queryParam,
        version: selectedVersion,
        limit: 1000,
        offset: 0,
        signal: controller.signal,
      })
        .then((data) => {
          const mapped: Verse[] = data.verses.map((v) => ({
            id: v.id,
            orgId: "cloudflare-d1",
            bookId: v.bookId,
            chapterId: `${v.bookId}.${v.chapter}`,
            content: v.text,
            reference: v.reference,
            number: v.verse,
            text: v.text,
            version: v.version,
          }));
          setResults(mapped);
          setTotalCount(data.total);
        })
        .catch(async (apiError) => {
          if ((apiError as DOMException)?.name === "AbortError") return;
          try {
            const fallbackData = await searchVerses(
              selectedVersion,
              queryParam,
              100,
              controller.signal
            );
            setResults(fallbackData);
            setTotalCount(fallbackData.length);
          } catch {
            setError(getFriendlyApiError(apiError));
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [mode, queryBookMatch, queryParam, reloadToken, selectedVersion]);

  const goToReference = () => {
    if (!parsedReference) return;
    const hash = parsedReference.verse ? `#v${parsedReference.verse}` : "";
    const versionPath = selectedVersion === "all" ? "acf" : selectedVersion;
    navigate(`/${versionPath}/${parsedReference.slug}/${parsedReference.chapter}${hash}`);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();

    if (!value) {
      navigate(`/busca?v=${selectedVersion}&mode=${mode}`);
      return;
    }

    if (parsedReference) {
      goToReference();
      return;
    }

    if (mode === "reference" && similarReference?.chapter) {
      goToBookChapter(similarReference.book, similarReference.chapter, similarReference.verse);
      return;
    }

    navigate(`/busca?q=${encodeURIComponent(value)}&v=${selectedVersion}&mode=${mode}`);
  };

  const getResultRoute = (verse: Verse) => {
    const [rawBookId, chapterId] = (verse.chapterId || "").split(".");
    const refBookName = verse.reference.replace(/\s+\d+:\d+.*$/, "").trim();
    const candidateId = rawBookId || verse.bookId;

    const matchedBook =
      findBookGlobally(refBookName) ||
      findBookBySlug(candidateId) ||
      findBookById(candidateId) ||
      getBookFromText(candidateId) ||
      findBookGlobally(candidateId);

    const chapter = chapterId || "1";
    const verseNumber = verse.reference.match(/:(\d+)/)?.[1] ?? "1";
    const targetVersion =
      (verse as any).version || (selectedVersion === "all" ? "acf" : selectedVersion);
    return `/${targetVersion}/${matchedBook?.slug ?? "gn"}/${chapter}#v${verseNumber}`;
  };

  const isExactQuery = queryParam.startsWith('"') && queryParam.endsWith('"');
  const cleanQueryDisplay = isExactQuery ? queryParam.slice(1, -1) : queryParam;

  const memoizedResults = useMemo(() => results, [results]);
  const totalPages = Math.ceil(memoizedResults.length / pageSize);
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return memoizedResults.slice(startIndex, startIndex + pageSize);
  }, [memoizedResults, currentPage, pageSize]);

  const hasQuery = Boolean(queryParam.trim());

  usePageMeta({
    canonical: "/busca",
    description: t("search.searchDescription"),
    robots: hasQuery ? "noindex,follow" : "index,follow",
    title: hasQuery
      ? `Resultados para '${queryParam}' — ${t("app.name")}`
      : `${t("nav.search")} | ${t("app.name")}`,
    ogType: "website",
  });

  return (
    <Layout maxWidthClassName="max-w-5xl">
      <div className="w-full pb-20 pt-1 font-sans">
        {/* ── BOTÃO VOLTAR PARA INÍCIO ── */}
        <Link
          to="/"
          data-testid="search-back-link"
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-app-text-muted hover:text-gold transition-colors mb-3 sm:mb-4 group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Início</span>
        </Link>

        {/* ── CABEÇALHO EDITORIAL ── */}
        <div className="space-y-1">
          <h1 className="font-serif text-3xl sm:text-4xl text-[#F4EFEA] font-normal tracking-tight">
            Buscar na Bíblia
          </h1>
          <p className="font-sans text-sm text-app-text-muted">
            Encontre uma palavra, expressão ou referência.
          </p>
        </div>

        {/* ── BARRA DE BUSCA EM PÍLULA COM SELETOR DE VERSÃO INTEGRADO ── */}
        <form onSubmit={handleSubmit} className="mt-6 sm:mt-7">
          <div className="relative flex items-center rounded-full border border-border/80 bg-[#161412]/80 px-4 sm:px-6 py-2.5 sm:py-3 shadow-inner hover:border-gold/50 focus-within:border-gold/70 transition-all">
            <Search className="h-5 w-5 text-app-text-muted/70 shrink-0 mr-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === "reference"
                  ? "Ex: João 3:16, Salmo 23..."
                  : "Ex: há grande júbilo..."
              }
              aria-label="Buscar na Bíblia"
              className="w-full bg-transparent border-0 outline-hidden text-app-text placeholder:text-app-text-muted/50 text-base sm:text-lg font-sans pr-3"
            />

            {/* Botão de buscar exibido quando há termo digitado */}
            {Boolean(query.trim()) && (
              <button
                type="submit"
                aria-label="Buscar"
                data-testid="search-submit-btn"
                className="mr-3 inline-flex items-center gap-1.5 rounded-full bg-gold px-3.5 py-1 text-xs sm:text-sm font-medium text-[#121110] hover:bg-gold-light transition-all shadow-xs shrink-0 cursor-pointer animate-in fade-in zoom-in-95 duration-150"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Buscar</span>
              </button>
            )}

            {/* Seletor de versão dentro da pílula */}
            <div className="relative flex items-center shrink-0 pl-3 border-l border-border/40">
              <select
                aria-label="Selecionar versão bíblica para busca"
                value={selectedVersion}
                onChange={(e) => {
                  const nextVersion = e.target.value;
                  navigate(`/busca?q=${encodeURIComponent(query)}&v=${nextVersion}&mode=${mode}`);
                }}
                className="appearance-none bg-transparent pr-5 py-1 text-xs sm:text-sm font-sans font-medium uppercase text-app-text-muted hover:text-gold cursor-pointer outline-hidden transition-colors"
              >
                <option value="kja" className="bg-[#1a1715] text-app-text">
                  KJA
                </option>
                <option value="nvi" className="bg-[#1a1715] text-app-text">
                  NVI
                </option>
                <option value="acf" className="bg-[#1a1715] text-app-text">
                  ACF
                </option>
                <option value="arc" className="bg-[#1a1715] text-app-text">
                  ARC
                </option>
                <option value="aa" className="bg-[#1a1715] text-app-text">
                  AA
                </option>
                <option value="all" className="bg-[#1a1715] text-app-text">
                  Todas
                </option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-0 h-3.5 w-3.5 text-app-text-muted" />
            </div>
          </div>
        </form>

        {/* ── ABAS DE MODO: TEXTO / REFERÊNCIA ── */}
        <div
          data-testid="search-mode-tabs"
          className="mt-5 border-b border-border/40 flex items-center gap-6"
        >
          <button
            type="button"
            onClick={() => {
              setMode("text");
              navigate(`/busca?q=${encodeURIComponent(query)}&v=${selectedVersion}&mode=text`);
            }}
            className={cn(
              "inline-flex items-center gap-2 pb-2.5 text-sm font-medium transition-all cursor-pointer border-b-2 -mb-px",
              mode === "text"
                ? "border-gold text-gold"
                : "border-transparent text-app-text-muted hover:text-app-text"
            )}
          >
            <FileText className="h-4 w-4" />
            <span>Texto</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("reference");
              navigate(`/busca?q=${encodeURIComponent(query)}&v=${selectedVersion}&mode=reference`);
            }}
            className={cn(
              "inline-flex items-center gap-2 pb-2.5 text-sm font-medium transition-all cursor-pointer border-b-2 -mb-px",
              mode === "reference"
                ? "border-gold text-gold"
                : "border-transparent text-app-text-muted hover:text-app-text"
            )}
          >
            <BookOpen className="h-4 w-4" />
            <span>Referência</span>
          </button>
        </div>

        {/* ── SUGESTÕES INSTANTÂNEAS OU "VOCÊ QUIS DIZER" ── */}
        {!!query.trim() && (
          <div className="mt-4 space-y-3">
            {similarReference && !parsedReference && (
              <button
                className="flex w-full items-center justify-between rounded-xl border border-border/80 bg-[#161412]/80 px-4 py-3 text-left text-sm text-app-text transition-colors hover:border-gold"
                onClick={() =>
                  goToBookChapter(
                    similarReference.book,
                    similarReference.chapter ?? 1,
                    similarReference.verse
                  )
                }
                type="button"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gold" />
                  {t("search.didYouMean")} <strong>{similarReference.label}</strong>
                </span>
                <ArrowRight className="h-4 w-4 text-gold" />
              </button>
            )}

            {instantBookSuggestions.length > 0 && (
              <div className="rounded-xl border border-border/80 bg-[#161412]/80 p-3">
                <p className="font-sans text-xs uppercase tracking-[0.08em] text-app-text-muted">
                  {t("search.instantSuggestions")}
                </p>
                {instantBookSuggestions.map((book, index) => (
                  <div
                    className="mt-3 rounded-lg border border-border/60 bg-app-raised/60 p-3"
                    key={book.id}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex items-center gap-2 font-serif text-base text-app-text">
                        <BookOpen className="h-4 w-4 text-gold" />
                        {book.name}
                      </p>
                      <Button
                        onClick={() =>
                          navigate(
                            `/busca?q=${encodeURIComponent(book.name)}&v=${selectedVersion}&mode=text`
                          )
                        }
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        {t("search.viewChapters")}
                      </Button>
                    </div>

                    {index === 0 && chapterPreview.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {chapterPreview.map((chapter) => (
                          <Button
                            className="h-8 min-w-8"
                            key={`${book.id}-${chapter}`}
                            onClick={() => goToBookChapter(book, chapter)}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            {chapter}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── REFERÊNCIA PARSEADA (ATALHO DIRETO) ── */}
        {parsedReference && (
          <button
            className={`mt-4 flex w-full items-center justify-between rounded-xl border border-border/80 bg-[#161412]/80 px-4 py-3 text-left text-sm text-app-text transition-colors hover:border-gold ${
              referenceExists === false ? "opacity-90" : ""
            }`}
            onClick={() => {
              if (referenceExists === false) {
                navigate(
                  `/${selectedVersion}/${parsedReference.slug}/${parsedReference.chapter}`
                );
              } else {
                goToReference();
              }
            }}
            type="button"
          >
            <span className="flex items-center gap-2">
              {referenceExists === false ? (
                <>
                  <SearchX className="h-4 w-4 text-app-text-muted" />
                  <span>
                    {t("search.verseNotFound", {
                      verse: parsedReference.verse,
                      book: findBookById(parsedReference.bookId)?.name || parsedReference.bookId,
                      chapter: parsedReference.chapter,
                      chapterRef: `${findBookById(parsedReference.bookId)?.name || parsedReference.bookId} ${parsedReference.chapter}`,
                    })}
                  </span>
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 text-gold" />
                  {t("search.goTo", { reference: referenceLabel })}
                </>
              )}
            </span>
            <ArrowRight className="h-4 w-4 text-gold" />
          </button>
        )}

        {/* ── ERRO DE BUSCA ── */}
        {error && (
          <Alert className="mt-6 border-border bg-[#161412]/80" variant="destructive">
            <AlertTitle>{t("search.errorTitle")}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button
              className="mt-3"
              onClick={() => setReloadToken((value) => value + 1)}
              size="sm"
              type="button"
              variant="outline"
            >
              {t("reading.retry")}
            </Button>
          </Alert>
        )}

        {/* ── SUGESTÕES POPULARES (QUANDO NÃO HÁ QUERY) ── */}
        {!queryParam && !loading && !error && (
          <div className="mt-8 rounded-2xl border border-border/80 bg-[#161412]/50 p-5 sm:p-6">
            <p className="font-sans text-xs uppercase tracking-wider text-app-text-muted">
              {t("search.popularToday")}
            </p>
            <div
              className="mt-3 flex flex-wrap gap-2.5"
              id="search-page-suggestions"
              role="listbox"
            >
              {["João 3:16", "Salmos 23:1", "Filipenses 4:13", "Romanos 8:28", "Jeremias 29:11"].map(
                (suggestion) => (
                  <Button
                    key={suggestion}
                    onClick={() => {
                      setQuery(suggestion);
                      navigate(
                        `/busca?q=${encodeURIComponent(suggestion)}&v=${selectedVersion}&mode=text`
                      );
                    }}
                    role="option"
                    size="sm"
                    type="button"
                    variant="outline"
                    className="border-border/70 hover:border-gold hover:text-gold transition-colors"
                  >
                    {suggestion}
                  </Button>
                )
              )}
            </div>
          </div>
        )}

        {/* ── CARREGANDO (SKELETONS) ── */}
        {loading && mode === "text" && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-2 px-1 text-sm text-app-text-muted">
              <Loader2 className="h-4 w-4 animate-spin text-gold" />
              <span>{t("search.searching")}</span>
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="border-b border-border/30 py-6 space-y-2.5">
                  <Skeleton className="h-5 w-32 bg-app-surface" />
                  <Skeleton className="h-16 w-full bg-app-surface" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── RESULTADOS DA BUSCA ── */}
        {!loading && !!queryParam && !error && mode === "text" && (
          <div className="mt-6 space-y-2">
            {queryBookMatch ? (
              <div className="rounded-xl border border-border/80 bg-[#161412]/80 p-5">
                <p className="font-serif text-xl text-app-text">{queryBookMatch.name}</p>
                <p className="mt-1 font-sans text-xs text-app-text-muted">
                  {t("search.chooseChapter")}
                </p>
                <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                  {Array.from({ length: queryBookMatch.chapters }, (_, index) => index + 1).map(
                    (chapter) => (
                      <Button
                        className="h-9"
                        key={`${queryBookMatch.id}-${chapter}`}
                        onClick={() => goToBookChapter(queryBookMatch, chapter)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {chapter}
                      </Button>
                    )
                  )}
                </div>
              </div>
            ) : memoizedResults.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-border/80 bg-[#161412]/50 px-4 text-center">
                <SearchX className="h-8 w-8 text-app-text-muted" />
                <p className="mt-3 font-sans text-sm text-app-text-muted">
                  {t("search.noResults", { query: queryParam })}
                </p>
                <p className="mt-1 font-sans text-xs text-app-text-muted">
                  {t("search.noResultsHint")}
                </p>
              </div>
            ) : (
              <>
                {/* ── BARRA DE CONTAGEM E ALTERNADOR CORRESPONDÊNCIA / FRASE EXATA ── */}
                <div
                  data-testid="search-results-header"
                  className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/40 text-xs sm:text-sm"
                >
                  <div>
                    <span className="font-sans text-app-text-muted">
                      <strong className="font-semibold text-app-text">
                        {totalCount || results.length}
                      </strong>{" "}
                      {results.length === 1 ? "resultado para" : "resultados para"}{" "}
                      <span className="text-gold font-medium">“{cleanQueryDisplay}”</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 text-xs text-app-text-muted">
                    <button
                      type="button"
                      onClick={() => {
                        if (isExactQuery) {
                          const unquoted = queryParam.replace(/^"(.*)"$/, "$1");
                          navigate(
                            `/busca?q=${encodeURIComponent(unquoted)}&v=${selectedVersion}&mode=text`
                          );
                        }
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 transition-colors cursor-pointer",
                        !isExactQuery
                          ? "text-app-text font-medium"
                          : "text-app-text-muted hover:text-gold"
                      )}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-gold/80" />
                      <span>Correspondência flexível</span>
                    </button>

                    <span className="text-border/80">|</span>

                    <button
                      type="button"
                      onClick={() => {
                        if (!isExactQuery) {
                          const quoted = `"${queryParam.replace(/"/g, "")}"`;
                          navigate(
                            `/busca?q=${encodeURIComponent(quoted)}&v=${selectedVersion}&mode=text`
                          );
                        }
                      }}
                      className={cn(
                        "inline-flex items-center gap-1 transition-colors cursor-pointer",
                        isExactQuery
                          ? "text-gold font-medium"
                          : "text-app-text-muted hover:text-gold"
                      )}
                    >
                      <span>Frase exata</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* ── LINHAS EDITORIAIS DE RESULTADOS ── */}
                <div className="divide-y-0">
                  {paginatedResults.map((verse) => (
                    <SearchResultCard
                      key={verse.id}
                      route={getResultRoute(verse)}
                      query={queryParam}
                      verse={verse}
                    />
                  ))}
                </div>

                {/* ── PAGINAÇÃO (SE NECESSÁRIA) ── */}
                {results.length > 0 && (
                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/40 pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-app-text-muted">Resultados por página:</span>
                      <select
                        className="bg-[#161412] border border-border text-app-text text-xs rounded-md px-2 py-1 outline-hidden focus:border-gold cursor-pointer"
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentPage((p) => Math.max(1, p - 1));
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        disabled={currentPage === 1}
                        className="border-border/70 hover:border-gold"
                      >
                        Anterior
                      </Button>
                      <span className="text-xs text-app-text-muted">
                        Página {currentPage} de {totalPages || 1}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentPage((p) => Math.min(totalPages, p + 1));
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        disabled={currentPage >= totalPages}
                        className="border-border/70 hover:border-gold"
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── RODAPÉ SAGRADO INSPIRADOR COM SALMO 119:105 ── */}
        <footer
          data-testid="search-sacred-footer"
          className="mt-16 sm:mt-20 border-t border-border/40 pt-8 pb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs text-app-text-muted"
        >
          <div className="flex items-start gap-3 max-w-md">
            <Sparkles className="h-4 w-4 text-gold/80 shrink-0 mt-0.5" />
            <div>
              <p className="font-serif italic text-app-text-muted/90 text-sm leading-relaxed">
                “Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.”
              </p>
              <span className="font-serif text-xs text-app-text-muted/70 block mt-1">
                — Salmo 119:105
              </span>
            </div>
          </div>

          <div className="sm:text-right">
            <p className="font-serif italic text-app-text-muted/80 text-sm">
              A Palavra de Deus sempre nos encontra.
            </p>
          </div>
        </footer>
      </div>
    </Layout>
  );
}