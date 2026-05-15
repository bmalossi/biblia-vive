import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface Article {
    id: string;
    title: string;
    slug: string;
    body: string;
    meta_description: string | null;
    cover_image_url: string | null;
    published_at: string | null;
}

export default function ArtigosRecentes() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function fetchArticles(attempt = 0) {
            try {
                const { data, error } = await supabase
                    .from("articles")
                    .select("id, title, slug, body, meta_description, cover_image_url, published_at")
                    .eq("status", "publicado")
                    .order("published_at", { ascending: false })
                    .limit(3);

                if (!isMounted) return;

                if (error) {
                    if (error.message?.includes("AbortError") && attempt === 0) {
                        setTimeout(() => fetchArticles(1), 600);
                        return;
                    }
                    setArticles([]);
                } else {
                    setArticles(data ?? []);
                }
            } catch (err: unknown) {
                if (!isMounted) return;
                const isAbort =
                    err instanceof Error &&
                    (err.name === "AbortError" || err.message?.includes("AbortError") || err.message?.includes("Lock broken"));
                if (isAbort && attempt === 0) {
                    setTimeout(() => fetchArticles(1), 600);
                    return;
                }
                setArticles([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchArticles();
        return () => { isMounted = false; };
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gold" />
            </div>
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
