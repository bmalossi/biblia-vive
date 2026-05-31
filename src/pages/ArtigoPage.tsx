// ─────────────────────────────────────────────────────────────────────────────
// ArtigoPage.tsx — Página pública de Artigo
// Renderiza artigo via react-markdown com Imagem de Capa.
// Acesso público (Visitantes e Leitores).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { Loader2, ArrowLeft, Calendar } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

interface Article {
    id: string;
    title: string;
    slug: string;
    body: string;
    status: "rascunho" | "publicado";
    meta_title: string | null;
    meta_description: string | null;
    cover_image_url: string | null;
    created_at: string;
    published_at: string | null;
    line_height?: string;
    letter_spacing?: string;
}

export default function ArtigoPage() {
    const { slug } = useParams<{ slug: string }>();
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchArticle() {
            if (!slug) {
                setError("Slug não encontrado");
                setLoading(false);
                return;
            }

            const { data, error: fetchError } = await supabase
                .from("articles")
                .select("*")
                .eq("slug", slug)
                .single();

            if (fetchError || !data) {
                setError("Artigo não encontrado");
                setLoading(false);
                return;
            }

            if (data.status !== "publicado") {
                setError("Artigo não encontrado");
                setLoading(false);
                return;
            }

            setArticle(data);
            setLoading(false);
        }

        fetchArticle();
    }, [slug]);

    let title = "Carregando artigo... — Bíblia Vive";
    let description = "Carregando artigo da Bíblia Vive...";
    let robots = "noindex, follow";
    let canonical = undefined;
    let jsonLd = undefined;

    if (error || (!loading && !article)) {
        title = "Artigo não encontrado — Bíblia Vive";
        description = "O artigo solicitado não pôde ser encontrado.";
        robots = "noindex, nofollow";
    } else if (article) {
        title = article.meta_title || `${article.title} — Bíblia Vive`;
        description = article.meta_description || article.body?.substring(0, 160).replace(/[#*_`~\[\]]/g, '') || '';
        robots = "index, follow";
        canonical = `/artigos/${article.slug}`;
        jsonLd = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": article.title,
            "description": description.substring(0, 160),
            "url": `https://www.bibliavive.com.br/artigos/${article.slug}`
        };
    }

    usePageMeta({
        title,
        description,
        robots,
        canonical,
        jsonLd,
        image: article?.cover_image_url || undefined,
        type: "article"
    });

    if (loading) {
        return (
            <Layout>
                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gold" />
                    <p className="text-sm text-app-text-muted">Carregando conteúdo do artigo...</p>
                </div>
            </Layout>
        );
    }

    if (error || !article) {
        return (
            <Layout>
                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                    <div>
                        <h1 className="font-serif text-2xl text-app-text">Artigo não encontrado</h1>
                        <p className="mt-2 text-sm text-app-text-muted">
                            O artigo que você procura não existe ou foi removido.
                        </p>
                    </div>
                    <Link to="/artigos" className="text-sm text-gold hover:underline">
                        Ver todos os artigos
                    </Link>
                </div>
            </Layout>
        );
    }

    const formattedDate = article.published_at
        ? new Date(article.published_at).toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : "";

    return (
        <Layout>
            <article className="mx-auto max-w-3xl px-4 py-12">
                <Link
                    to="/artigos"
                    className="mb-8 inline-flex items-center gap-2 text-sm text-app-text-muted hover:text-gold transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar aos artigos
                </Link>

                {article.cover_image_url && (
                    <img
                        src={article.cover_image_url}
                        alt={article.title}
                        className="mb-8 w-full rounded-2xl object-cover shadow-lg"
                    />
                )}

                {/* Header — same card style as Bible chapter article */}
                <div className="mb-8 rounded-2xl border border-border bg-app-surface px-6 py-6 md:px-8">
                    <h1 className="font-serif text-3xl leading-tight text-app-text md:text-4xl">
                        {article.title}
                    </h1>
                    {formattedDate && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-app-text-muted">
                            <Calendar className="h-4 w-4" />
                            {formattedDate}
                        </div>
                    )}
                </div>

                {/* Body — article-prose overrides Tailwind Typography with design-system vars */}
                <div
                    className="rounded-2xl border border-border bg-app-surface px-6 py-8 md:px-8 prose prose-lg max-w-none article-prose dark:prose-invert prose-headings:font-serif prose-a:text-gold prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-blockquote:border-gold/50 prose-blockquote:text-app-text-muted"
                    style={{
                        letterSpacing: article.letter_spacing || "0em",
                        lineHeight: article.line_height || "1.85",
                        fontFamily: "var(--font-reading)",
                        fontSize: "var(--font-size-reading)",
                    }}
                >
                    <ReactMarkdown remarkPlugins={[remarkBreaks]}>{article.body}</ReactMarkdown>
                </div>
            </article>
        </Layout>
    );
}