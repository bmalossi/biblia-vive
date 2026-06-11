import { lazy, Suspense, useState } from "react";
import { BookMarked, BookOpen, Loader2, Palette, PenLine, Quote, Share2 } from "lucide-react";
import Layout from "@/components/Layout";
import { usePageMeta } from "@/hooks/usePageMeta";

const HowToStudyTab = lazy(() => import("./how-to/HowToStudyTab"));
const HowToNotesTab = lazy(() => import("./how-to/HowToNotesTab"));
const HowToHighlightsTab = lazy(() => import("./how-to/HowToHighlightsTab"));
const HowToShareTab = lazy(() => import("./how-to/HowToShareTab"));
const HowToPlansTab = lazy(() => import("./how-to/HowToPlansTab"));

type TabId = "study" | "notes" | "highlights" | "share" | "plans";

interface TabDef {
  id: TabId;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  badge?: "novo" | "em breve";
}

const tabs: TabDef[] = [
  {
    id: "study",
    icon: <Quote className="h-4 w-4" />,
    label: "Estudar",
    sublabel: "Comentários teológicos",
    badge: "novo",
  },
  {
    id: "notes",
    icon: <PenLine className="h-4 w-4" />,
    label: "Notas",
    sublabel: "Anote versículos",
  },
  {
    id: "highlights",
    icon: <Palette className="h-4 w-4" />,
    label: "Destaques",
    sublabel: "Cores e marcações",
  },
  {
    id: "share",
    icon: <Share2 className="h-4 w-4" />,
    label: "Compartilhar",
    sublabel: "Cards de versículos",
  },
  {
    id: "plans",
    icon: <BookMarked className="h-4 w-4" />,
    label: "Planos",
    sublabel: "Leitura consistente",
  },
];

const TabFallback = () => (
  <div className="flex items-center justify-center py-20 opacity-60">
    <Loader2 className="h-6 w-6 animate-spin text-gold" />
  </div>
);

export default function HowToPage() {
  const [activeTab, setActiveTab] = useState<TabId>("study");

  usePageMeta({
    title: "Como usar o Bíblia Vive — Guia de Estudo e Leitura",
    description:
      "Aprenda a usar as ferramentas do Bíblia Vive: comentários teológicos históricos, notas em versículos, destaques coloridos, compartilhamento e planos de leitura.",
    canonical: "/como-usar",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "Como estudar a Bíblia com comentários teológicos no Bíblia Vive",
        description:
          "Passo a passo para usar o recurso de Comentários Teológicos do Bíblia Vive, acessando análises de Matthew Henry, Albert Barnes e John Gill.",
        step: [
          { "@type": "HowToStep", position: 1, name: "Abra um capítulo da Bíblia" },
          { "@type": "HowToStep", position: 2, name: "Selecione um versículo" },
          { "@type": "HowToStep", position: 3, name: "Clique em Estudar" },
          { "@type": "HowToStep", position: 4, name: "Vá à aba Comentários" },
          { "@type": "HowToStep", position: 5, name: "Clique em Buscar Comentários" },
          { "@type": "HowToStep", position: 6, name: "Leia, reflita e anote" },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: window.location.origin },
          {
            "@type": "ListItem",
            position: 2,
            name: "Como usar",
            item: `${window.location.origin}/como-usar`,
          },
        ],
      },
    ],
  });

  return (
    <Layout>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-border bg-app-bg">
        {/* Background decorative gradient */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-gold/5 blur-3xl" />
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-gold/3 blur-2xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20 text-center">
          {/* Eyebrow */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5">
            <BookOpen className="h-3.5 w-3.5 text-gold" />
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-gold">
              Guia de Uso
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl text-app-text mb-4 leading-tight">
            Como usar o{" "}
            <span className="text-gold">Bíblia Vive</span>
          </h1>

          <p className="text-base sm:text-lg text-app-text-muted max-w-xl mx-auto leading-relaxed mb-8">
            Aprenda a extrair o máximo das ferramentas de estudo e leitura
            bíblica. Siga os tutoriais abaixo e aprofunde seu conhecimento
            das Escrituras.
          </p>

          {/* Quick stats */}
          <div className="inline-flex gap-6 sm:gap-10 rounded-2xl border border-border bg-app-surface/60 backdrop-blur px-6 py-4">
            {[
              { value: "5", label: "Guias" },
              { value: "6", label: "Passos no tutorial" },
              { value: "3+", label: "Teólogos históricos" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-serif text-2xl font-bold text-gold">{stat.value}</p>
                <p className="text-[0.7rem] text-app-text-muted uppercase tracking-wide mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ───────────────────────────────────────────────── */}
      <div className="sticky top-[56px] md:top-[60px] z-30 border-b border-border bg-app-bg/90 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-2 sm:px-4">
          <div
            className="flex overflow-x-auto gap-1 py-2 scrollbar-none"
            role="tablist"
            aria-label="Guias de uso"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-left
                    transition-all duration-200 focus-visible:outline focus-visible:outline-2
                    focus-visible:outline-offset-2 focus-visible:outline-gold
                    ${isActive
                      ? "bg-gold/15 border border-gold/40 text-gold shadow-sm"
                      : "border border-transparent text-app-text-muted hover:bg-app-raised hover:text-app-text"
                    }
                  `}
                >
                  <span className={`transition-colors ${isActive ? "text-gold" : "text-app-text-muted group-hover:text-app-text"}`}>
                    {tab.icon}
                  </span>
                  <div className="hidden sm:block">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold leading-none">{tab.label}</span>
                      {tab.badge === "novo" && (
                        <span className="rounded-full bg-gold text-app-bg text-[0.5rem] font-bold uppercase tracking-widest px-1.5 py-0.5 leading-none">
                          Novo
                        </span>
                      )}
                      {tab.badge === "em breve" && !isActive && (
                        <span className="rounded-full border border-border text-app-text-muted/50 text-[0.5rem] uppercase tracking-widest px-1.5 py-0.5 leading-none">
                          Em breve
                        </span>
                      )}
                    </div>
                    <p className="text-[0.65rem] text-app-text-muted/70 leading-none mt-0.5">{tab.sublabel}</p>
                  </div>
                  {/* Mobile: label only */}
                  <span className="sm:hidden text-xs font-semibold">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <Suspense fallback={<TabFallback />}>
          <div
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
          >
            {activeTab === "study" && <HowToStudyTab />}
            {activeTab === "notes" && <HowToNotesTab />}
            {activeTab === "highlights" && <HowToHighlightsTab />}
            {activeTab === "share" && <HowToShareTab />}
            {activeTab === "plans" && <HowToPlansTab />}
          </div>
        </Suspense>
      </div>
    </Layout>
  );
}
