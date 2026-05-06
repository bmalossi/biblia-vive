// ─────────────────────────────────────────────────────────────────────────────
// CarrosselArtigos.tsx — Carrossel de artigos na HomePage
// Exibe artigos em destaque ou recentes.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

interface Article {
    id: string;
    title: string;
    slug: string;
    cover_image_url: string | null;
    published_at: string | null;
}

export default function CarrosselArtigos() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        async function fetchArticles() {
            const { data } = await supabase
                .from("articles")
                .select("id, title, slug, cover_image_url, published_at")
                .eq("status", "publicado")
                .order("featured", { ascending: false })
                .order("published_at", { ascending: false })
                .limit(6);

            setArticles(data ?? []);
            setLoading(false);
        }

        fetchArticles();
    }, []);

    useEffect(() => {
        if (articles.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % articles.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [articles.length]);

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
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
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
                                className={`h-2 rounded-full transition-all ${idx === currentIndex ? "w-6 bg-gold" : "w-2 bg-white/50"}`}
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