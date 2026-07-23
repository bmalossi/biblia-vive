import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Loader2, RefreshCw, ArrowRight } from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  meta_description: string | null;
  cover_image_url: string | null;
  published_at: string | null;
}

async function fetchHomeArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("id, title, slug, meta_description, cover_image_url, published_at")
    .eq("status", "publicado")
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(3);

  if (error) throw error;
  return data ?? [];
}

export default function ArtigosRecentes() {
  const {
    data: articles = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["articles-home-grid"],
    queryFn: fetchHomeArticles,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: (attempt) => Math.min(600 * 2 ** attempt, 5000),
  });

  if (isLoading) {
    return (
      <section className="mt-8" aria-label="Artigos em destaque">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sans text-[0.65rem] uppercase tracking-[0.15em] text-gold">
            Artigos
          </h2>
        </div>
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="mt-8" aria-label="Artigos em destaque">
        <h2 className="mb-4 font-sans text-[0.65rem] uppercase tracking-[0.15em] text-gold">
          Artigos
        </h2>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-app-surface py-8 text-center">
          <p className="text-sm text-app-text-muted">
            Não foi possível carregar os artigos.
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-4 py-2 text-sm text-gold transition-colors hover:bg-gold-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="mt-8" aria-label="Artigos em destaque">
      {/* Header with Heading & Link to all articles */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-sans text-[0.65rem] uppercase tracking-[0.15em] text-gold">
          Artigos em Destaque
        </h2>
        <Link
          to="/artigos"
          className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 rounded"
        >
          <span>Ver todos os artigos</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Static Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {articles.map((article, index) => {
          const isFirst = index === 0;
          return (
            <Link
              key={article.id}
              to={`/artigos/${article.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-app-surface transition-all duration-200 hover:border-gold/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg"
            >
              {article.cover_image_url ? (
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-app-raised">
                  <img
                    src={article.cover_image_url}
                    alt={article.title}
                    width={600}
                    height={375}
                    loading={isFirst ? "eager" : "lazy"}
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="aspect-[16/10] w-full bg-app-raised flex items-center justify-center">
                  <span className="font-serif text-xs text-app-text-muted">
                    Bíblia Vive
                  </span>
                </div>
              )}

              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-serif text-base font-semibold text-app-text transition-colors group-hover:text-gold line-clamp-2">
                  {article.title}
                </h3>
                {article.meta_description && (
                  <p className="mt-2 text-xs leading-relaxed text-app-text-muted line-clamp-2">
                    {article.meta_description}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
