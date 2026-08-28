import BookGrid from "@/components/BookGrid";
import Layout from "@/components/Layout";
import SearchBar from "@/components/SearchBar";
import CapituloDeHojeSection from "@/components/CapituloDeHojeSection";
import ArtigosRecentes from "@/components/ArtigosRecentes";
import { findBookBySlug, getBooksForLocale } from "@/lib/books";
import { getVersion } from "@/lib/themes";
import { useTranslation } from "@/i18n";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Bookmark, X, BookOpen, Calendar } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useReadingPlan } from "@/hooks/useReadingPlan";
import { Sparkles, ArrowRight } from "lucide-react";
import PwaInstallCard from "@/components/PwaInstallCard";
import QuickVoiceMemorial from "@/components/QuickVoiceMemorial";

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
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const [version, setVersion] = useState(getVersion());
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const { oldTestament, newTestament } = getBooksForLocale(locale);

  const { progresses, plans } = useReadingPlan(user?.id ?? null);
  const firstProgress = useMemo(() => {
    const activeProgresses = Object.values(progresses).filter(prog => {
      const planInfo = plans.find(p => p.id === prog.planId);
      if (!planInfo) return false;
      return prog.completedDays.length < planInfo.totalDays;
    });
    // Sort by startDate descending (most recently started active plan)
    activeProgresses.sort((a, b) => b.startDate - a.startDate);
    return activeProgresses[0] ?? null;
  }, [progresses, plans]);
  const activePlanInfo = useMemo(() => firstProgress ? plans.find(p => p.id === firstProgress.planId) : null, [firstProgress, plans]);

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
    ogImage: "/og-default.png",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${window.location.origin}#website`,
        name: t("app.name"),
        url: `${window.location.origin}/`,
        description: t("home.description"),
        inLanguage: locale,
        potentialAction: {
          "@type": "SearchAction",
          target: `${window.location.origin}/busca?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${window.location.origin}#organization`,
        name: t("app.name"),
        url: window.location.origin,
        logo: `${window.location.origin}/og/home.png`,
        sameAs: [
          "https://www.instagram.com/biblia.vive/",
          "https://www.facebook.com/bibliavive/"
        ],
      },
    ],
    title: "Bíblia Vive — Leia, Estude e Compartilhe a Bíblia",
    ogType: "website",
  });

  return (
    <Layout>
      <div className="flex flex-col">
        <h1 className="sr-only">Bíblia Vive — Leia e Estude a Bíblia Online</h1>

        {/* Gravação Rápida por Voz para o Memorial */}
        <QuickVoiceMemorial />

        {/* Livros em destaque no topo */}
        <section className="mt-2">
          <h2 className="mb-4 font-sans text-[0.65rem] uppercase tracking-[0.15em] text-gold">{t("home.oldTestament")}</h2>
          <BookGrid books={oldTestament} currentReading={lastRead ? { chapter: lastRead.capitulo, slug: lastRead.livro } : null} version={version} />

          <div className="my-8 border-t border-border" />

          <h2 className="mb-4 font-sans text-[0.65rem] uppercase tracking-[0.15em] text-gold">{t("home.newTestament")}</h2>
          <BookGrid books={newTestament} currentReading={lastRead ? { chapter: lastRead.capitulo, slug: lastRead.livro } : null} version={version} />
        </section>

        {/* Divisor após os livros do Novo Testamento */}
        <div className="my-8 border-t border-border" />

        <CapituloDeHojeSection />

        {/* Renderiza a seção de "Continuar Leitura" e "Plano" apenas se eles existirem. A mt-6 os empurra um pouco do versículo. */}
        {((lastRead && !dismissed && lastReadBook) || (firstProgress && activePlanInfo)) && (
          <div className="mt-6 min-h-[104px] flex flex-col md:flex-row gap-4">
            {lastRead && !dismissed && lastReadBook && (
              <div className="flex-1 animate-in fade-in-0 duration-500 delay-300 rounded-xl border border-gold/40 bg-accent/40 px-4 py-3">
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
                    className="inline-flex items-center rounded-full border border-gold/50 px-3 py-1.5 text-sm text-gold transition-colors hover:bg-gold hover:text-primary-foreground hover:border-gold"
                    to={`/${lastRead.versao}/${lastRead.livro}/${lastRead.capitulo}`}
                  >
                    {t("home.continue")}
                  </Link>
                </div>
              </div>
            )}

            {firstProgress && activePlanInfo && (
              <div className="flex-1 animate-in fade-in-0 duration-500 delay-400 rounded-xl border border-gold/40 bg-accent/40 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <BookOpen className="mt-0.5 h-4 w-4 text-gold" />
                    <div>
                      <p className="text-sm font-medium text-app-text">
                        Plano: {activePlanInfo.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Calendar className="h-3 w-3 text-app-text-muted" />
                        <p className="text-xs text-app-text-muted">
                          Dia {Math.floor((Date.now() - firstProgress.startDate) / (1000 * 60 * 60 * 24)) + 1} de {activePlanInfo.totalDays}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <Link
                    className="inline-flex items-center rounded-full border border-gold/50 px-3 py-1.5 text-sm font-extralight text-white transition-colors hover:bg-gold/90 hover:text-white bg-gold"
                    to={`/planos?id=${activePlanInfo.id}`}
                  >
                    Retomar Leitura
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Artigos em destaque */}
        <ArtigosRecentes />

        {/* Card PWA no final da página */}
        <section className="mt-12 overflow-hidden md:hidden">
          <PwaInstallCard variant="home" />
        </section>
      </div>
    </Layout>
  );
}