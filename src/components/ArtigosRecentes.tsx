import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Loader2, RefreshCw } from "lucide-react";

interface Article {
    id: string;
    title: string;
    slug: string;
    body: string;
    meta_description: string | null;
    cover_image_url: string | null;
    published_at: string | null;
}

async function fetchRecentArticles(): Promise<Article[]> {
    const { data, error } = await supabase
        .from("articles")
        .select("id, title, slug, body, meta_description, cover_image_url, published_at")
        .eq("status", "publicado")
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
        queryKey: ["articles-recent"],
        queryFn: fetchRecentArticles,
        staleTime: 5 * 60 * 1000, // 5 min
        refetchOnWindowFocus: true,
        retry: 2,
        retryDelay: (attempt) => Math.min(600 * 2 ** attempt, 5000),
    });

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gold" />
            </div>
        );
    }

    if (isError) {
        return (
            <section className="mt-8">
                <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-app-surface py-8 text-center">
                    <p className="text-sm text-app-text-muted">
                        Não foi possível carregar os artigos recentes.
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-4 py-2 text-sm text-gold transition-colors hover:bg-gold-bg"
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
        <section className="mt-8">
            <div className="grid gap-6 md:grid-cols-3">
                {articles.map((article) => (
                    <Link
                        key={article.id}
                        to={`/artigos/${article.slug}`}
                        className="group flex flex-col overflow-hidden rounded-xl border border-border bg-app-surface transition-colors hover:border-gold/50"
                    >
                        {article.cover_image_url ? (
                            <div className="aspect-[16/10] overflow-hidden">
                                <img
                                    src={article.cover_image_url}
                                    alt={article.title}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            </div>
                        ) : (
                            <div className="aspect-[16/10] bg-app-raised flex items-center justify-center">
                                <span className="font-serif text-app-text-muted text-sm">Sem imagem</span>
                            </div>
                        )}
                        <div className="flex flex-1 flex-col p-4 md:p-5">
                            <h3 className="font-serif text-lg font-medium text-app-text transition-colors group-hover:text-gold line-clamp-2">
                                {article.title}
                            </h3>
                            {article.meta_description && (
                                <p className="mt-2 text-sm text-app-text-muted line-clamp-3">
                                    {article.meta_description}
                                </p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
