import React, { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import hymnsData from "@/data/harpa-hymns.json";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Search, X, BookOpen, ArrowRight } from "lucide-react";
import HarpaHeroHeader from "@/components/harpa/HarpaHeroHeader";
import HarpaFeaturedCard from "@/components/harpa/HarpaFeaturedCard";
import HarpaHymnCard from "@/components/harpa/HarpaHymnCard";
import HarpaSidebarWidgets from "@/components/harpa/HarpaSidebarWidgets";
import HarpaCollaborationModal from "@/components/harpa/HarpaCollaborationModal";
import HarpaHistoryModal from "@/components/harpa/HarpaHistoryModal";
import { HarpaHymn } from "@/lib/harpaUtils";

export default function HarpaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCollabOpen, setIsCollabOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(30);

  usePageMeta({
    canonical: "/harpa",
    description:
      "Leia, pesquise e ouça os hinos tradicionais da Harpa Cristã. 640 hinos com busca instantânea, linha do tempo histórica e áudio de adoração.",
    ogImage: "/og-default.png",
    title: "Harpa Cristã — Hinos de Adoração e Louvor | Bíblia Vive",
    ogType: "website",
  });

  // Hinos em destaque (os 5 mais amados e cantados, como na referência)
  const featuredHymns = useMemo(() => {
    return (hymnsData as HarpaHymn[]).filter((h) => h.numero >= 1 && h.numero <= 5);
  }, []);

  // Filtro de busca instantânea normalizado
  const filteredHymns = useMemo(() => {
    const normalizedQuery = searchQuery
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (!normalizedQuery) {
      // Quando não há busca, a listagem geral exibe os hinos a partir do 6º
      // (pois os hinos 1 a 5 já estão proeminentes em "Em destaque")
      return (hymnsData as HarpaHymn[]).filter((h) => h.numero >= 6);
    }

    return (hymnsData as HarpaHymn[]).filter((hymn) => {
      const numberStr = String(hymn.numero);
      const titleNorm = hymn.titulo
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      const formattedTitleNorm = hymn.tituloFormatado
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      return (
        numberStr.includes(normalizedQuery) ||
        titleNorm.includes(normalizedQuery) ||
        formattedTitleNorm.includes(normalizedQuery)
      );
    });
  }, [searchQuery]);

  // Hinos a serem exibidos na grade numérica com paginação progressiva
  const displayedGeneralHymns = useMemo(() => {
    if (searchQuery) return filteredHymns;
    return filteredHymns.slice(0, visibleCount);
  }, [filteredHymns, visibleCount, searchQuery]);

  const scrollToHymns = () => {
    const el = document.getElementById("hinos-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Layout maxWidthClassName="max-w-7xl">
      <div className="w-full pb-20 pt-2">
        {/* 1. HERO SUPERIOR COM ARTE SACRA DA CRUZ E ARCOS CELESTIAIS */}
        <HarpaHeroHeader />

        {/* 2. BARRA DE AÇÃO: BUSCA + HISTÓRIA DA HARPA */}
        <section aria-label="Busca de hinos" className="mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            {/* Campo de Pesquisa em Pílula Arredondada */}
            <div className="relative flex-1 w-full max-w-xl">
              <Search className="pointer-events-none absolute left-4 sm:left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8272]" />
              <input
                type="text"
                className="h-11 w-full rounded-full border border-[#382f23]/80 bg-[#161412] pl-11 sm:pl-12 pr-10 text-xs sm:text-sm text-[#f4efea] placeholder:text-[#6e6355] shadow-inner focus:outline-none focus:border-[#e5b869] focus:ring-1 focus:ring-[#e5b869]/30 transition-all"
                placeholder="Buscar hino por número ou título..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Buscar hino por número ou título"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8f8272] hover:text-[#f4efea] transition-colors p-1"
                  aria-label="Limpar busca"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Botão História da Harpa */}
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="inline-flex h-11 w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-full border border-[#c69a50]/40 bg-[#1e1a15]/60 px-5 text-xs font-medium text-[#e5b869] hover:bg-[#262019] hover:border-[#e5b869]/60 transition-all duration-200 shadow-sm cursor-pointer"
            >
              <BookOpen className="h-4 w-4" />
              <span>História da Harpa</span>
            </button>
          </div>
        </section>

        {/* 3. CARD DO HINO EM DESTAQUE ("HINO EM DESTAQUE") */}
        {!searchQuery && (
          <HarpaFeaturedCard hymnNumber={1} title="Chuvas de Graça" />
        )}

        {/* 4. LAYOUT PRINCIPAL EM DUAS COLUNAS */}
        <div id="hinos-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna Esquerda: Listagens de Hinos (~75-80%) */}
          <main className="lg:col-span-9 space-y-10">
            {/* SEÇÃO 1: "Em destaque" (Apenas quando não há busca ativa) */}
            {!searchQuery && (
              <section aria-label="Hinos em destaque">
                <div className="flex items-baseline justify-between gap-4 mb-4">
                  <div>
                    <h2 className="font-serif text-xl sm:text-2xl text-[#f4efea] font-normal">
                      Em destaque
                    </h2>
                    <p className="font-sans text-xs text-[#8f8272] mt-0.5">
                      Hinos mais cantados e amados da Harpa Cristã.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={scrollToHymns}
                    className="text-xs text-[#c69a50] hover:text-[#e5b869] font-medium transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Ver todos os destaques</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Grade de 5 colunas para os hinos em destaque */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-3.5">
                  {featuredHymns.map((hymn) => (
                    <HarpaHymnCard key={hymn.numero} hymn={hymn} />
                  ))}
                </div>
              </section>
            )}

            {/* SEÇÃO 2: "Harpa Cristã" (Ordem numérica completa) */}
            <section aria-label="Todos os hinos da Harpa Cristã">
              <div className="mb-4">
                <h2 className="font-serif text-xl sm:text-2xl text-[#f4efea] font-normal">
                  Harpa Cristã
                </h2>
                <p className="font-sans text-xs text-[#8f8272] mt-0.5">
                  {searchQuery ? (
                    <>
                      Resultados para <span className="text-[#f4efea]">"{searchQuery}"</span> —{" "}
                      {filteredHymns.length} {filteredHymns.length === 1 ? "hino" : "hinos"}
                    </>
                  ) : (
                    "Todos os hinos em ordem numérica."
                  )}
                </p>
              </div>

              {/* Grade de Hinos em 5 Colunas */}
              {displayedGeneralHymns.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-3.5">
                    {displayedGeneralHymns.map((hymn) => (
                      <HarpaHymnCard key={hymn.numero} hymn={hymn} />
                    ))}
                  </div>

                  {/* Botão de Paginação Progressiva (Carregar Mais Hinos) */}
                  {!searchQuery && visibleCount < filteredHymns.length && (
                    <div className="pt-8 text-center">
                      <button
                        type="button"
                        onClick={() => setVisibleCount((prev) => prev + 30)}
                        className="inline-flex items-center justify-center px-6 py-2.5 rounded-full border border-[#382f23] bg-[#161412] hover:bg-[#1f1a16] hover:border-[#e5b869]/50 text-xs font-medium text-[#d5c7b5] hover:text-[#e5b869] transition-all cursor-pointer shadow-md"
                      >
                        Carregar mais hinos ({filteredHymns.length - visibleCount} restantes)
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-[#382f23]/60 bg-[#161412] p-10 text-center">
                  <p className="text-sm text-[#8f8272]">
                    Nenhum hino encontrado para{" "}
                    <span className="text-[#f4efea] font-medium">"{searchQuery}"</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mt-3 text-xs text-[#e5b869] hover:underline cursor-pointer"
                  >
                    Limpar pesquisa
                  </button>
                </div>
              )}
            </section>
          </main>

          {/* Coluna Direita: Widgets Informativos e de Colaboração (~20-25%) */}
          <div className="lg:col-span-3">
            <HarpaSidebarWidgets onCollaborateClick={() => setIsCollabOpen(true)} />
          </div>
        </div>

        {/* 5. MODAL DE COLABORAÇÃO COM A HARPA */}
        <HarpaCollaborationModal open={isCollabOpen} onOpenChange={setIsCollabOpen} />

        {/* 6. MODAL DA HISTÓRIA DA HARPA */}
        <HarpaHistoryModal open={isHistoryOpen} onOpenChange={setIsHistoryOpen} />
      </div>
    </Layout>
  );
}
