import BookGrid from "@/components/BookGrid";
import HomeQuickActions from "@/components/HomeQuickActions";
import Layout from "@/components/Layout";
import SearchBar from "@/components/SearchBar";
import CapituloDeHojeSection from "@/components/CapituloDeHojeSection";
import ArtigosRecentes from "@/components/ArtigosRecentes";
import { cn } from "@/lib/utils";
import { findBookBySlug, getBooksForLocale } from "@/lib/books";
import { getVersion } from "@/lib/themes";
import { useTranslation } from "@/i18n";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import PwaInstallCard from "@/components/PwaInstallCard";
import QuickVoiceMemorial from "@/components/QuickVoiceMemorial";

interface LastRead {
  capitulo: number;
  livro: string;
  timestamp: number;
  versao: string;
}

const LAST_READ_KEY = "bv_last_read";

export default function HomePage() {
  const { locale, t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const [version, setVersion] = useState(getVersion());
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [activeTestament, setActiveTestament] = useState<"AT" | "NT">("AT");

  const { oldTestament, newTestament } = getBooksForLocale(locale);

  useEffect(() => {
    const refreshVersion = () => setVersion(getVersion());
    window.addEventListener("bv-version-change", refreshVersion);
    return () => window.removeEventListener("bv-version-change", refreshVersion);
  }, []);

  useEffect(() => {
    try {
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
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "@id": `${window.location.origin}#app`,
        name: "Bíblia Vive",
        url: `${window.location.origin}/`,
        description: "Aplicativo web progressivo (PWA) para leitura, estudo e compartilhamento da Bíblia em português e inglês. Inclui planos de leitura, memorial espiritual, caderno de estudos, gravação por voz, comentários e destaques.",
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web, Android, iOS",
        inLanguage: ["pt-BR", "en", "es"],
        featureList: [
          "Leitura da Bíblia em 8 versões (ACF, ARC, NVI, AA, KJA, KJV, BBE, RVR)",
          "Gravação por voz para registrar reflexões, orações e testemunhos no Memorial",
          "Ditado por voz no Caderno de Estudos durante a leitura de capítulos",
          "Memorial espiritual com categorias SOAP, Oração, Testemunho e Propósito",
          "Caderno de estudos bíblicos por capítulo",
          "Planos de leitura (30, 90 e 365 dias)",
          "Versículo do dia",
          "Destaques e anotações nos versículos",
          "Compartilhamento de versículos como imagem",
          "Modo offline (PWA)",
          "Comentários bíblicos",
          "Jornadas contemplativas"
        ],
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "BRL",
          availability: "https://schema.org/InStock"
        },
        publisher: {
          "@id": `${window.location.origin}#organization`
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "O Bíblia Vive tem gravação por voz?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Sim. O Bíblia Vive possui gravação por voz nativa na página inicial (para salvar no Memorial Espiritual) e no Caderno de Estudos de cada capítulo. A transcrição é feita em tempo real pelo navegador (Web Speech API), sem envio de áudio a servidores externos, com suporte ao português do Brasil.",
            },
          },
          {
            "@type": "Question",
            name: "Como gravar reflexões por voz na Bíblia Vive?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Na página inicial do Bíblia Vive, clique em 'Gravar por Voz', escolha a categoria (Reflexão, Oração, Testemunho ou Propósito), fale naturalmente em português e clique em 'Concluir e Guardar'. O texto é transcrito em tempo real e salvo automaticamente no Memorial Espiritual.",
            },
          },
          {
            "@type": "Question",
            name: "Posso ditar anotações enquanto leio a Bíblia?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Sim. No Caderno de Estudos de cada capítulo bíblico, o botão 'Ditar por voz' permite registrar suas anotações sem sair da tela de leitura. O texto ditado é adicionado diretamente ao caderno e salvo automaticamente.",
            },
          },
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

        {/* Atalhos Rápidos Compactos (< 50px) */}
        <HomeQuickActions
          lastRead={lastRead}
          lastReadBookName={lastReadBook?.name}
          version={version}
        />

        {/* Seletor de Testamento e Grade de Livros */}
        <section className="mt-2">
          <div
            role="tablist"
            aria-label="Filtrar por testamento"
            className="mb-4 flex items-center gap-2 border-b border-border pb-3"
          >
            <button
              role="tab"
              aria-selected={activeTestament === "AT"}
              aria-controls="book-grid-panel"
              id="tab-at"
              onClick={() => setActiveTestament("AT")}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                activeTestament === "AT"
                  ? "bg-gold text-primary-foreground font-semibold shadow-sm"
                  : "bg-app-surface text-app-text-muted hover:bg-app-raised hover:text-app-text border border-border"
              )}
            >
              {t("home.oldTestament")} ({oldTestament.length})
            </button>
            <button
              role="tab"
              aria-selected={activeTestament === "NT"}
              aria-controls="book-grid-panel"
              id="tab-nt"
              onClick={() => setActiveTestament("NT")}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                activeTestament === "NT"
                  ? "bg-gold text-primary-foreground font-semibold shadow-sm"
                  : "bg-app-surface text-app-text-muted hover:bg-app-raised hover:text-app-text border border-border"
              )}
            >
              {t("home.newTestament")} ({newTestament.length})
            </button>
          </div>

          <div
            id="book-grid-panel"
            role="tabpanel"
            aria-labelledby={activeTestament === "AT" ? "tab-at" : "tab-nt"}
          >
            <BookGrid
              books={activeTestament === "AT" ? oldTestament : newTestament}
              currentReading={lastRead ? { chapter: lastRead.capitulo, slug: lastRead.livro } : null}
              version={version}
            />
          </div>
        </section>

        {/* Divisor após os livros do Novo Testamento */}
        <div className="my-8 border-t border-border" />

        <CapituloDeHojeSection />



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