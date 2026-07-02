// ─────────────────────────────────────────────────────────────────────────────
// ArtigosIndexPage.tsx — Página de listagem de Artigos
// Lista todos os artigos publicados em formato de cards.
// Acessível a Visitantes e Leitores.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { Loader2, FileText } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

interface Author {
    name: string;
    slug: string;
}

interface Article {
    id: string;
    title: string;
    slug: string;
    body: string;
    meta_description: string | null;
    cover_image_url: string | null;
    published_at: string | null;
    author?: Author | null;
}

export default function ArtigosIndexPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    usePageMeta({
        title: "Artigos Bíblicos | Bíblia Vive",
        description: "Explore artigos e conteúdos sobre a Palavra de Deus.",
        canonical: "/artigos",
        ogImage: "/og-default.png",
        ogType: "website",
        jsonLd: {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Artigos Bíblicos | Bíblia Vive",
            "description": "Explore artigos e conteúdos sobre a Palavra de Deus.",
            "url": "https://www.bibliavive.com.br/artigos"
        }
    });

    useEffect(() => {
        async function fetchArticles() {
            const { data } = await supabase
                .from("articles")
                .select("id, title, slug, body, meta_description, cover_image_url, published_at, author:article_authors(name, slug)")
                .eq("status", "publicado")
                .order("published_at", { ascending: false });

            setArticles(data ?? []);
            setLoading(false);
        }

        fetchArticles();
    }, []);

    function getExcerpt(body: string, maxLength = 150): string {
        const plainText = body.replace(/[#*_`~\[\]]/g, "").replace(/\n+/g, " ");
        if (plainText.length <= maxLength) return plainText;
        return plainText.substring(0, maxLength).trim() + "...";
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gold" />
                    <p className="text-sm text-app-text-muted">Carregando artigos...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="mx-auto max-w-5xl px-4 py-12">
                <div className="mb-8">
                    <h1 className="font-serif text-3xl text-app-text">Artigos</h1>
                    <p className="mt-2 text-app-text-muted">Explore nossos artigos e conteúdos</p>
                </div>

                {articles.length === 0 ? (
                    <div className="text-center py-12 text-app-text-muted">
                        <FileText className="mx-auto h-12 w-12 opacity-50" />
                        <p className="mt-4">Nenhum artigo publicado ainda.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {articles.map((article) => (
                            <Link
                                key={article.id}
                                to={`/artigos/${article.slug}`}
                                className="group block overflow-hidden rounded-2xl border border-border bg-app-surface transition-colors hover:border-gold/50"
                            >
                                {article.cover_image_url && (
                                    <div className="aspect-video overflow-hidden">
                                        <img
                                            src={article.cover_image_url}
                                            alt={article.title}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    </div>
                                )}
                                <div className="p-5">
                                    <h2 className="font-serif text-lg text-app-text transition-colors group-hover:text-gold">
                                        {article.title}
                                    </h2>
                                    {article.meta_description && (
                                        <p className="mt-2 text-sm text-app-text-muted line-clamp-2">
                                            {article.meta_description}
                                        </p>
                                    )}
                                    <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-app-text-muted">
                                        <span className="font-medium text-gold/80 truncate max-w-[150px]">
                                            {article.author ? article.author.name : "Bíblia Vive"}
                                        </span>
                                        {article.published_at && (
                                            <span>
                                                {new Date(article.published_at).toLocaleDateString("pt-BR", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}