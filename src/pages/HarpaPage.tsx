import Layout from "@/components/Layout";
import hymnsData from "@/data/harpa-hymns.json";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, X, Volume2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

export default function HarpaPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHymns = useMemo(() => {
    const normalizedQuery = searchQuery
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (!normalizedQuery) return hymnsData;

    return hymnsData.filter((hymn) => {
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

  usePageMeta({
    canonical: "/harpa",
    description:
      "Leia, pesquise e ouça os hinos tradicionais da Harpa Cristã. Mais de 640 hinos com busca instantânea e áudio de adoração.",
    ogImage: "/og-default.png",
    title: "Harpa Cristã — Hinos de Adoração e Louvor | Bíblia Vive",
    ogType: "website",
  });

  return (
    <Layout>
      <div className="flex flex-col">
        {/* Search Bar */}
        <section className="mt-8 text-center">
          <div className="mx-auto flex w-full max-w-[480px] items-center gap-2 relative">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-muted" />
            <input
              type="text"
              className="h-11 w-full rounded-full border border-border bg-app-raised pl-12 pr-10 text-sm text-app-text focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 placeholder:text-app-text-muted"
              placeholder="Buscar hino por número ou título..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar hino"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-app-text-muted hover:text-app-text transition-colors"
                aria-label="Limpar busca"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </section>

        {/* Info Banner */}
        <section className="mt-6 mx-auto w-full max-w-[680px]">
          <div className="rounded-xl border border-border bg-app-surface p-4 text-sm text-app-text-muted flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold ring-1 ring-gold/20">
              <Volume2 className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="font-sans font-medium text-app-text">Hinos com Áudio e Colaboração</p>
              <p className="text-xs leading-relaxed">
                Os hinos que possuem gravação de áudio estão sinalizados com o ícone de alto-falante (<Volume2 className="inline-block h-3.5 w-3.5 mx-0.5 text-gold/80" />) no topo do card, facilitando a identificação.
              </p>
              <p className="text-xs leading-relaxed mt-1.5">
                Caso você possua as canções de hinos que ainda não estão disponíveis no site e deseja colaborar, entre em contato enviando os arquivos ou links para o e-mail{" "}
                <a href="mailto:suporte@bibliavive.com.br" className="text-gold hover:underline font-medium">
                  suporte@bibliavive.com.br
                </a>.
              </p>
            </div>
          </div>
        </section>

        <div className="my-8 border-t border-border" />

        {/* Hymns Grid */}
        <section className="mt-2">
          <h2 className="mb-4 font-sans text-[0.65rem] uppercase tracking-[0.15em] text-gold">
            Harpa Cristã
            {searchQuery && filteredHymns.length > 0 && (
              <span className="ml-2 normal-case text-app-text-muted">
                — {filteredHymns.length} {filteredHymns.length === 1 ? "hino encontrado" : "hinos encontrados"}
              </span>
            )}
          </h2>

          {filteredHymns.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(100px,1fr))]">
              {filteredHymns.map((hymn) => (
                <Tooltip key={hymn.numero}>
                  <TooltipTrigger asChild>
                    <Link
                      className="relative rounded-lg border border-border bg-app-raised px-2 py-2 transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-gold hover:bg-gold-bg hover:shadow-sm"
                      to={`/harpa/${hymn.numero}`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="font-mono text-[0.6rem] text-gold opacity-70">
                          {String(hymn.numero).padStart(3, "0")}
                        </p>
                        {hymn.hasAudio && (
                          <Volume2 className="h-3.5 w-3.5 text-gold/80" />
                        )}
                      </div>
                      <p className="truncate font-sans text-[0.72rem] font-medium text-app-text">
                        {hymn.tituloFormatado}
                      </p>
                      <p className="mt-1 font-sans text-[0.6rem] text-app-text-muted">
                        {hymn.estrofes} {hymn.estrofes === 1 ? "estrofe" : "estrofes"}
                      </p>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    Hino {hymn.numero} — {hymn.tituloFormatado} {hymn.hasAudio && "🔊 (Áudio disponível)"}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-app-surface/30 text-center">
              <p className="text-sm text-app-text-muted">
                Nenhum hino encontrado para{" "}
                <span className="font-medium text-app-text">"{searchQuery}"</span>
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-3 text-xs text-gold hover:underline"
                type="button"
              >
                Limpar busca
              </button>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
