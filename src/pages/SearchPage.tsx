import Layout from "@/components/Layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchResultCard from "@/components/SearchResultCard";
import { checkVerseExists, getFriendlyApiError, searchVerses, type Verse } from "@/lib/bibleApi";
import { BOOK_ALIASES, normalizeBookAlias } from "@/lib/bookAliases";
import { ALL_BOOKS, findBookById, findBookBySlug, type Book } from "@/lib/books";
import { formatParsedReferenceLabel, parseReference } from "@/lib/referenceParser";
import { getVersion, isBibleVersion } from "@/lib/themes";
import { useTranslation } from "@/i18n";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ArrowRight, BookOpen, Loader2, Search, SearchX, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
        matrix[row - 1][column - 1] + cost,
      );
    }
  }

  return matrix[source.length][target.length];
};

const getClosestBook = (term: string) => {
  const normalizedTerm = normalizeCompact(term);
  if (!normalizedTerm) return null;

  const ranked = ALL_BOOKS.map((book) => {
    const candidates = [book.name, book.abbrev, book.slug, book.id].map((item) => normalizeCompact(String(item)));
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
  const selectedVersion = isBibleVersion(versionParam) ? versionParam : getVersion();
  const modeParam = params.get("mode") === "reference" ? "reference" : "text";

  const [query, setQuery] = useState(queryParam);
  const [mode, setMode] = useState<SearchMode>(modeParam);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Verse[]>([]);
  const [reloadToken, setReloadToken] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { t } = useTranslation();

  const parsedReference = useMemo(() => parseReference(query), [query]);
  const referenceLabel = useMemo(() => (parsedReference ? formatParsedReferenceLabel(parsedReference) : ""), [parsedReference]);
  const queryBookMatch = useMemo(() => {
    if (!queryParam.trim() || !onlyBookText(queryParam)) return undefined;
    return getBookFromText(queryParam);
  }, [queryParam]);

  const instantBookSuggestions = useMemo(() => {
    const normalized = normalizeCompact(query);
    if (!normalized || normalized.length < 2) return [];

    return ALL_BOOKS.filter((book) => {
      const haystack = [book.name, book.abbrev, book.slug, book.id].map((value) => normalizeCompact(String(value)));
      return haystack.some((value) => value.includes(normalized));
    }).slice(0, 4);
  }, [query]);

  const similarReference = useMemo<SuggestedReference | null>(() => {
    if (!query.trim() || parsedReference) return null;

    const normalized = normalizeText(query);
    const scopeMatch = normalized.match(/^(.+?)\s+(?:em|in|en)\s+([a-z0-9]+(?:\s+[a-z0-9]+)?)$/);
    let searchTerm = normalized;
    let scopeBookSlug: string | undefined;

    if (scopeMatch) {
      const potentialTerm = scopeMatch[1].trim();
      const rawScope = scopeMatch[2].trim().replace(/\s+/g, "");

      const normalizedScope = normalizeText(rawScope);
      const bookId = BOOK_ALIASES[normalizedScope];

      if (bookId) {
        searchTerm = potentialTerm;
        scopeBookSlug = bookId.toLowerCase();
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
      checkVerseExists(selectedVersion, parsedReference.slug, parsedReference.chapter, parsedReference.verse)
        .then(setReferenceExists);
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
    return `/${selectedVersion}/${book.slug}/${safeChapter}${hash}`;
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
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);

      searchVerses(selectedVersion, queryParam, 1000, controller.signal)
        .then((data) => {
          setResults(data);
        })
        .catch((apiError) => {
          if ((apiError as DOMException)?.name === "AbortError") return;
          setError(getFriendlyApiError(apiError));
        })
        .finally(() => {
          setLoading(false);
        });
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [mode, queryBookMatch, queryParam, reloadToken, selectedVersion]);

  const goToReference = () => {
    if (!parsedReference) return;
    const hash = parsedReference.verse ? `#v${parsedReference.verse}` : "";
    navigate(`/${selectedVersion}/${parsedReference.slug}/${parsedReference.chapter}${hash}`);
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
    const [bookId, chapterId] = (verse.chapterId || "").split(".");
    const matchedBook = findBookBySlug(bookId) || findBookById(bookId);
    const chapter = chapterId || "1";
    const verseNumber = verse.reference.match(/:(\d+)/)?.[1] ?? "1";
    return `/${selectedVersion}/${matchedBook?.slug ?? "gn"}/${chapter}#v${verseNumber}`;
  };

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
    title: hasQuery ? `Resultados para '${queryParam}' — ${t("app.name")}` : `${t("nav.search")} | ${t("app.name")}`,
    ogType: "website",
  });

  return (
    <Layout>
      <h1 className="text-3xl text-app-text">{t("search.title")}</h1>
      <p className="mt-2 font-sans text-sm text-app-text-muted">{t("search.subtitle")}</p>

      <form className="relative mt-6 max-w-[640px]" onSubmit={handleSubmit}>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-muted" />
        <Input
          aria-autocomplete="list"
          aria-controls="search-page-suggestions"
          aria-describedby="search-page-help"
          aria-expanded={instantBookSuggestions.length > 0}
          aria-label={t("nav.search")}
          className="h-11 rounded-full border-border bg-app-raised pl-11 pr-5 text-app-text placeholder:text-app-text-muted"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search.placeholder")}
          role="combobox"
          value={query}
        />
        <span className="sr-only" id="search-page-help">
          {t("search.helpText")}
        </span>
      </form>

      <Tabs className="mt-4" onValueChange={(value) => setMode(value as SearchMode)} value={mode}>
        <TabsList className="rounded-full bg-app-raised">
          <TabsTrigger className="rounded-full" value="text">
            {t("search.textTab")}
          </TabsTrigger>
          <TabsTrigger className="rounded-full" value="reference">
            {t("search.referenceTab")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {!!query.trim() && (
        <div className="mt-4 space-y-3">
          {similarReference && !parsedReference && (
            <button
              className="flex w-full items-center justify-between rounded-xl border border-border bg-app-surface px-4 py-3 text-left text-sm text-app-text transition-colors hover:border-gold"
              onClick={() => goToBookChapter(similarReference.book, similarReference.chapter ?? 1, similarReference.verse)}
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
            <div className="rounded-xl border border-border bg-app-surface p-3">
              <p className="font-sans text-xs uppercase tracking-[0.08em] text-app-text-muted">{t("search.instantSuggestions")}</p>
              {instantBookSuggestions.map((book, index) => (
                <div className="mt-3 rounded-lg border border-border bg-app-raised p-3" key={book.id}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-2 font-serif text-base text-app-text">
                      <BookOpen className="h-4 w-4 text-gold" />
                      {book.name}
                    </p>
                    <Button
                      onClick={() => navigate(`/busca?q=${encodeURIComponent(book.name)}&v=${selectedVersion}&mode=text`)}
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

      {parsedReference && (
        <button
          className={`mt-4 flex w-full items-center justify-between rounded-xl border border-border bg-app-surface px-4 py-3 text-left text-sm text-app-text transition-colors hover:border-gold ${referenceExists === false ? "opacity-90" : ""
            }`}
          onClick={() => {
            if (referenceExists === false) {
              navigate(`/${selectedVersion}/${parsedReference.slug}/${parsedReference.chapter}`);
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
                    chapterRef: `${findBookById(parsedReference.bookId)?.name || parsedReference.bookId} ${parsedReference.chapter}`
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

      {error && (
        <Alert className="mt-6 border-border bg-app-surface" variant="destructive">
          <AlertTitle>{t("search.errorTitle")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button className="mt-3" onClick={() => setReloadToken((value) => value + 1)} size="sm" type="button" variant="outline">
            {t("reading.retry")}
          </Button>
        </Alert>
      )}

      {!queryParam && !loading && !error && (
        <div className="mt-8 rounded-xl border border-border bg-app-surface p-4">
          <p className="font-sans text-sm text-app-text">{t("search.popularToday")}</p>
          <div className="mt-3 flex flex-wrap gap-2" id="search-page-suggestions" role="listbox">
            {["João 3:16", "Salmos 23:1", "Filipenses 4:13", "Romanos 8:28", "Jeremias 29:11"].map((suggestion) => (
              <Button
                key={suggestion}
                onClick={() => {
                  setQuery(suggestion);
                  navigate(`/busca?q=${encodeURIComponent(suggestion)}&v=${selectedVersion}&mode=text`);
                }}
                role="option"
                size="sm"
                type="button"
                variant="outline"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {loading && mode === "text" && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-2 px-1 text-sm text-app-text-muted">
            <Loader2 className="h-4 w-4 animate-spin text-gold" />
            <span>{t("search.searching")}</span>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton className="h-20 w-full bg-app-surface" key={index} />
            ))}
          </div>
        </div>
      )}

      {!loading && !!queryParam && !error && mode === "text" && (
        <div className="mt-8 space-y-3">
          {queryBookMatch ? (
            <div className="rounded-xl border border-border bg-app-surface p-4">
              <p className="font-serif text-lg text-app-text">{queryBookMatch.name}</p>
              <p className="mt-1 font-sans text-xs text-app-text-muted">{t("search.chooseChapter")}</p>
              <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                {Array.from({ length: queryBookMatch.chapters }, (_, index) => index + 1).map((chapter) => (
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
                ))}
              </div>
            </div>
          ) : memoizedResults.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-border bg-app-surface px-4 text-center">
              <SearchX className="h-8 w-8 text-app-text-muted" />
              <p className="mt-3 font-sans text-sm text-app-text-muted">{t("search.noResults", { query: queryParam })}</p>
              <p className="mt-1 font-sans text-xs text-app-text-muted">
                {t("search.noResultsHint")}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-2 px-1">
                <p className="font-sans text-[0.65rem] uppercase tracking-[0.1em] text-app-text-muted">
                  {results.length === 1 ? t("search.resultCount") : t("search.resultsCount", { count: results.length })}
                </p>
              </div>
              {paginatedResults.map((verse) => (
                <SearchResultCard key={verse.id} route={getResultRoute(verse)} query={queryParam} verse={verse} />
              ))}

              {results.length > 0 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-app-text-muted">Resultados por página:</span>
                    <select
                      className="bg-app-raised border border-border text-app-text text-sm rounded-md px-2 py-1 outline-none focus:border-gold"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
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
                        setCurrentPage(p => Math.max(1, p - 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === 1}
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
                        setCurrentPage(p => Math.min(totalPages, p + 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage >= totalPages}
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

      <footer className="mt-10 border-t border-border pt-4">
        <p className="font-sans text-xs uppercase tracking-[0.08em] text-app-text-muted">{t("search.selectedVersion")}: {selectedVersion.toUpperCase()}</p>
      </footer>
    </Layout>
  );
}