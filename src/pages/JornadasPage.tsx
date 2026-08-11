import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useEditorialJornadas } from "@/hooks/useEditorialJornadas";
import {
  EditorialChapter,
  getEditorialChapterLink,
  getEditorialChapterReferenceText,
} from "@/types/editorialChapter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Loader2, Sparkles, X, ArrowRight, BookOpen } from "lucide-react";

export default function JornadasPage() {
  usePageMeta({
    title: "Sua caminhada — Leituras Contemplativas | Bíblia Vive",
    description:
      "Explore a biblioteca de capítulos da sua caminhada de Permanência. Leituras contemplativas organizadas por séries.",
    canonical: "/jornadas",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Sua caminhada — Leituras Contemplativas",
        url: `${window.location.origin}/jornadas`,
        description:
          "Explore a biblioteca de capítulos da sua caminhada de Permanência. Leituras contemplativas organizadas por séries.",
        isPartOf: {
          "@type": "WebSite",
          name: "Bíblia Vive",
          url: window.location.origin,
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: window.location.origin },
          { "@type": "ListItem", position: 2, name: "Sua caminhada", item: `${window.location.origin}/jornadas` },
        ],
      },
    ],
  });

  const { seriesGroups, loading } = useEditorialJornadas();
  const [selectedChapter, setSelectedChapter] = useState<EditorialChapter | null>(
    null
  );
  const [searchParams, setSearchParams] = useSearchParams();

  // Deep link: abre o modal do capítulo automaticamente quando ?capitulo=ID
  // está presente na URL (ex: chegando via notificação push).
  useEffect(() => {
    if (loading) return;
    const capituloId = searchParams.get("capitulo");
    if (!capituloId) return;

    const allChapters = seriesGroups.flatMap((g) => g.chapters);
    const found = allChapters.find((c) => c.id === capituloId);
    if (found) {
      setSelectedChapter(found);
      // Limpa o param da URL sem reload para não re-abrir ao navegar
      setSearchParams({}, { replace: true });
    }
  }, [loading, seriesGroups, searchParams]);

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Cabeçalho da Página */}
        <div className="mb-12 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold mb-2 flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Filosofia da Permanência
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-app-text mb-4">
            Sua caminhada
          </h1>
          <p className="mx-auto max-w-xl text-sm md:text-base text-app-text-muted leading-relaxed">
            Caminhadas contínuas para preparar seu coração e conduzi-lo à leitura das Escrituras.
          </p>
        </div>

        {/* Conteúdo Principal */}
        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : seriesGroups.length === 0 ? (
          <div className="rounded-2xl border border-border bg-app-surface p-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-app-text-muted mb-3 opacity-40" />
            <h2 className="font-serif text-lg text-app-text mb-1">
              Nenhuma Jornada Disponível
            </h2>
            <p className="text-sm text-app-text-muted">
              Novas séries de leitura contemplativa serão disponibilizadas em breve.
            </p>
          </div>
        ) : (
          <div className="space-y-14">
            {seriesGroups.map((group) => (
              <section key={group.seriesName} className="space-y-6">
                <div className="flex items-center gap-3 border-b border-border pb-3">
                  <h2 className="font-serif text-xl font-semibold text-app-text">
                    Série {group.seriesOrder} · {group.seriesName}
                  </h2>
                  <span className="rounded-full bg-gold/10 px-2.5 py-0.5 font-mono text-xs text-gold">
                    {group.chapters.length} {group.chapters.length === 1 ? "capítulo" : "capítulos"}
                  </span>
                </div>

                {/* Grade de Cards de Capítulos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {group.chapters.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => setSelectedChapter(ch)}
                      className="group flex flex-col justify-between rounded-xl border border-border bg-app-surface p-5 text-left transition-all hover:border-gold/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gold/50 active:scale-[0.99]"
                    >
                      <div>
                        <p className="font-mono text-[0.7rem] uppercase tracking-wider text-gold mb-2">
                          Capítulo {ch.chapter_number}
                        </p>
                        <h3 className="font-serif text-base font-medium text-app-text group-hover:text-gold transition-colors line-clamp-2 mb-3">
                          {ch.title}
                        </h3>
                        <p className="text-xs text-app-text-muted line-clamp-3 leading-relaxed mb-4">
                          {ch.intro_text.replace(/\n\n/g, " ")}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-app-text-muted">
                        <span>{getEditorialChapterReferenceText(ch)}</span>
                        <span className="text-gold font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          Ler <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Modal / Dialog de Leitura do Capítulo */}
        {selectedChapter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl rounded-2xl border border-border bg-app-surface p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              {/* Botão Fechar */}
              <button
                onClick={() => setSelectedChapter(null)}
                className="absolute right-4 top-4 rounded-full p-2 text-app-text-muted hover:bg-app-raised hover:text-app-text transition-colors"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Tag da Série & Capítulo */}
              <div className="space-y-1 text-center">
                <p className="font-mono text-xs uppercase tracking-widest text-gold">
                  Capítulo {selectedChapter.chapter_number} · {selectedChapter.series_name}
                </p>
                <h3 className="font-serif text-xl md:text-2xl font-normal text-app-text pt-2 leading-snug">
                  {selectedChapter.title}
                </h3>
              </div>

              {/* Parágrafos de Introdução */}
              <div className="space-y-4 font-sans text-sm md:text-base leading-relaxed text-app-text-muted text-left border-y border-border py-6">
                {selectedChapter.intro_text
                  .split("\n\n")
                  .filter(Boolean)
                  .map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
              </div>

              {/* Botão CTA para Leitura da Bíblia */}
              <div className="text-center pt-2">
                <p className="font-serif text-base italic text-app-text mb-4">
                  Hoje, leia {getEditorialChapterReferenceText(selectedChapter)}.
                </p>
                <Link
                  to={getEditorialChapterLink(selectedChapter)}
                  onClick={() => setSelectedChapter(null)}
                  className="inline-flex items-center justify-center rounded-full bg-gold px-8 py-3 text-sm font-medium text-black transition-all hover:bg-gold/90 hover:shadow-lg active:scale-[0.98]"
                >
                  Ler {getEditorialChapterReferenceText(selectedChapter)} &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
