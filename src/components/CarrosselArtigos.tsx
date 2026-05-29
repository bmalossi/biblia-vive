// ─────────────────────────────────────────────────────────────────────────────
// CarrosselArtigos.tsx — Carrossel de artigos na HomePage
// Exibe artigos em destaque ou recentes.
// Usa React Query para buscar artigos, garantindo refetch ao retornar à aba e
// retry automático em falhas de rede/auth.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Loader2, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

interface Article {
    id: string;
    title: string;
    slug: string;
    cover_image_url: string | null;
    published_at: string | null;
}

async function fetchCarouselArticles(): Promise<Article[]> {
    const { data, error } = await supabase
        .from("articles")
        .select("id, title, slug, cover_image_url, published_at")
        .eq("status", "publicado")
        .order("featured", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(6);

    if (error) throw error;
    return data ?? [];
}

export default function CarrosselArtigos() {
    const {
        data: articles = [],
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["articles-carousel"],
        queryFn: fetchCarouselArticles,
        staleTime: 5 * 60 * 1000, // 5 min
        refetchOnWindowFocus: true,
        retry: 2,
        retryDelay: (attempt) => Math.min(600 * 2 ** attempt, 5000),
    });

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (articles.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % articles.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [articles.length]);

    // Reset index when articles change (e.g. after refetch)
    useEffect(() => {
        setCurrentIndex(0);
    }, [articles]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gold" />
            </div>
        );
    }

    if (isError) {
        return (
            <section>
                <h2 className="mt-8 mb-4 font-sans text-[0.65rem] uppercase tracking-[0.15em] text-gold">Artigos</h2>
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-app-surface py-8 text-center">
                    <p className="text-sm text-app-text-muted">
                        Não foi possível carregar os artigos.
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

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length);
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % articles.length);
    };

    return (
        <section>
            <h2 className="mt-8 mb-4 font-sans text-[0.65rem] uppercase tracking-[0.15em] text-gold">Artigos</h2>
            <div className="relative overflow-hidden rounded-2xl border border-border bg-app-surface">
                <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                    {articles.map((article) => (
                        <div key={article.id} className="min-w-full">
                            <Link to={`/artigos/${article.slug}`} className="block">
                                {article.cover_image_url ? (
                                    <div className="relative aspect-[2/1] md:aspect-[3/1]">
                                        <img
                                            src={article.cover_image_url}
                                            alt={article.title}
                                            className="h-full w-full object-cover"
                                        />
                                        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/80 to-transparent" />
                                        <div className="absolute top-0 left-0 right-0 p-4 md:p-6 z-10">
                                            <h3 className="font-serif text-xl md:text-2xl text-white line-clamp-2">{article.title}</h3>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 md:p-6">
                                        <h3 className="font-serif text-xl md:text-2xl text-app-text line-clamp-2">{article.title}</h3>
                                    </div>
                                )}
                            </Link>
                        </div>
                    ))}
                </div>

                {articles.length > 1 && (
                    <>
                        <button
                            onClick={goToPrevious}
                            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                            aria-label="Artigo anterior"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
                            aria-label="Próximo artigo"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {articles.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`h-2 w-2 rounded-full transition-all ${idx === currentIndex ? "bg-gold scale-125 ring-2 ring-gold/20" : "bg-white/50 hover:bg-white/70"}`}
                                    aria-label={`Ir para artigo ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}