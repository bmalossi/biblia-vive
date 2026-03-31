import BookGrid from "@/components/BookGrid";
import Layout from "@/components/Layout";
import SearchBar from "@/components/SearchBar";
import VerseOfDay from "@/components/VerseOfDay";
import { findBookBySlug, getBooksForLocale } from "@/lib/books";
import { getVersion } from "@/lib/themes";
import { useTranslation } from "@/i18n";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Bookmark, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { Sparkles, ArrowRight } from "lucide-react";

interface LastRead {
  capitulo: number;
  livro: string;
  timestamp: number;
  versao: string;
}

const LAST_READ_KEY = "bv_last_read";
const DISMISS_KEY = "bv_last_read_dismissed";

export default function HomePage() {
  const { locale, t } = useTranslation();
  const navigate = useNavigate();
  const { isPro } = useSubscription();
  const [version, setVersion] = useState(getVersion());
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const { oldTestament, newTestament } = getBooksForLocale(locale);

  useEffect(() => {
    const refreshVersion = () => setVersion(getVersion());
    window.addEventListener("bv-version-change", refreshVersion);
    return () => window.removeEventListener("bv-version-change", refreshVersion);
  }, []);

  useEffect(() => {
    try {
      const dismissedInSession = sessionStorage.getItem(DISMISS_KEY) === "true";
      setDismissed(dismissedInSession);

      const raw = localStorage.getItem(LAST_READ_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as LastRead;
      const isFresh = Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000;
      if (isFresh) setLastRead(parsed);
    } catch {
      setLastRead(null);
    }
  }, []);

  const lastReadBook = findBookBySlug(lastRead?.livro, locale);

  usePageMeta({
    canonical: "/",
    description: t("home.description"),
    image: "/og/home.png",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: t("app.name"),
      url: `${window.location.origin}/`,
      description: t("home.description"),
      inLanguage: locale,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${window.location.origin}/busca?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    title: t("home.title"),
    type: "website",
  });

  return (
    <Layout>
      <section className="space-y-10 pb-4">
        <VerseOfDay />

        {!isPro && (
          <div
            onClick={() => navigate('/pro')}
            className="group relative overflow-hidden rounded-2xl border border-gold/30 bg-gold-bg/10 p-5 cursor-pointer hover:bg-gold-bg/20 transition-all"
          >
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold group-hover:scale-110 transition-transform">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-app-text">Conheça o Bíblia Vive PRO</h3>
                  <p className="text-[0.8rem] text-app-text-muted leading-relaxed">
                    Áudios ultra-realistas, Inteligência Artificial ilimitada e exportação de estudos em PDF.
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gold group-hover:translate-x-1 transition-transform" />
            </div>
            {/* Minimalist background accent */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gold/5 blur-2xl" />
          </div>
        )}

        <SearchBar />

        <div className="min-h-[104px]">
          {lastRead && !dismissed && lastReadBook && (
            <div className="animate-in fade-in-0 duration-500 delay-300 rounded-xl border border-gold/40 bg-accent/40 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Bookmark className="mt-0.5 h-4 w-4 text-gold" />
                  <div>
                    <p className="text-sm text-app-text">
                      {t("home.continueReading")}: {lastReadBook.name} · {t("home.chapter")} {lastRead.capitulo}
                    </p>
                    <p className="text-xs text-app-text-muted">({lastRead.versao.toUpperCase()})</p>
                  </div>
                </div>

                <button
                  aria-label={t("home.dismiss")}
                  className="rounded-md p-1 text-app-text-muted hover:bg-app-raised"
                  onClick={() => {
                    sessionStorage.setItem(DISMISS_KEY, "true");
                    setDismissed(true);
                  }}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3">
                <Link
                  className="inline-flex items-center rounded-full border border-gold/50 px-3 py-1.5 text-sm text-gold transition-colors hover:bg-gold-bg"
                  to={`/${lastRead.versao}/${lastRead.livro}/${lastRead.capitulo}`}
                >
                  {t("home.continue")}
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 font-sans text-[0.65rem] uppercase tracking-[0.15em] text-gold">{t("home.oldTestament")}</h2>
        <BookGrid books={oldTestament} currentReading={lastRead ? { chapter: lastRead.capitulo, slug: lastRead.livro } : null} version={version} />

        <div className="my-8 border-t border-border" />

        <h2 className="mb-4 font-sans text-[0.65rem] uppercase tracking-[0.15em] text-gold">{t("home.newTestament")}</h2>
        <BookGrid books={newTestament} currentReading={lastRead ? { chapter: lastRead.capitulo, slug: lastRead.livro } : null} version={version} />
      </section>
    </Layout>
  );
}