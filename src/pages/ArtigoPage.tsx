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
import { Loader2, ArrowLeft, Calendar, Check, User, Building2, MapPin } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

interface Author {
    id: string;
    name: string;
    slug: string;
    avatar_url: string | null;
    bio: string;
    church: string | null;
    city: string | null;
    role: string | null;
}

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
    author_id?: string | null;
    reviewed_by?: string | null;
    author?: Author | null;
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
                .select("*, author:article_authors(*)")
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

    let title = "Carregando artigo... | Bíblia Vive";
    let description = "Carregando artigo da Bíblia Vive...";
    let robots = "noindex, follow";
    let canonical = undefined;
    let jsonLd = undefined;

    if (error || (!loading && !article)) {
        title = "Artigo não encontrado | Bíblia Vive";
        description = "O artigo solicitado não pôde ser encontrado.";
        robots = "noindex, nofollow";
    } else if (article) {
        title = article.meta_title || `${article.title} | Bíblia Vive`;
        description = article.meta_description || article.body?.substring(0, 160).replace(/[#*_`~\[\]]/g, '') || '';
        robots = "index, follow";
        description = description.substring(0, 160);
        canonical = `/artigos/${article.slug}`;
        jsonLd = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": article.title,
            "description": description,
            "url": `https://www.bibliavive.com.br/artigos/${article.slug}`,
            "image": article.cover_image_url || "https://www.bibliavive.com.br/og-default.png",
            "datePublished": article.published_at || article.created_at || undefined,
            "dateModified": article.published_at || article.created_at || undefined,
            "author": {
                "@type": "Person",
                "name": article.author ? article.author.name : "Bíblia Vive",
                "jobTitle": article.author ? (article.author.role || undefined) : undefined,
                "worksFor": article.author && article.author.church ? {
                    "@type": "Organization",
                    "name": article.author.church
                } : undefined
            },
            "publisher": {
                "@type": "Organization",
                "name": "Bíblia Vive",
                "url": "https://www.bibliavive.com.br",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.bibliavive.com.br/og/home.png"
                },
                "sameAs": [
                    "https://www.instagram.com/biblia.vive/",
                    "https://www.facebook.com/bibliavive/"
                ],
            },
            "inLanguage": "pt-BR",
        };
    }

    usePageMeta({
        title,
        description,
        robots,
        canonical,
        jsonLd,
        ogImage: article?.cover_image_url || "/og-default.png",
        ogType: "article",
        articlePublishedTime: article?.published_at || article?.created_at || undefined,
        articleModifiedTime: article?.published_at || article?.created_at || undefined,
        articleAuthor: article?.author ? article.author.name : "Bíblia Vive"
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
                    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-app-text-muted">
                        {formattedDate && (
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gold/80" />
                                {formattedDate}
                            </div>
                        )}
                        {article.reviewed_by && (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 border border-gold/25 px-3 py-0.5 text-xs text-gold font-medium">
                                <Check className="h-3.5 w-3.5" />
                                <span>Revisado por: {article.reviewed_by}</span>
                            </div>
                        )}
                    </div>
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

                {/* Author Box */}
                {article.author && (
                    <div className="mt-12 rounded-2xl border border-border bg-app-surface p-6 md:p-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start shadow-md relative overflow-hidden">
                        {/* Soft visual glowing element */}
                        <div className="absolute -left-6 -top-6 h-20 w-20 rounded-full bg-gold/5 blur-xl" />

                        {article.author.avatar_url ? (
                            <img
                                src={article.author.avatar_url}
                                alt={article.author.name}
                                className="relative z-10 h-20 w-20 rounded-full object-cover border border-gold/30 flex-shrink-0 shadow-sm"
                            />
                        ) : (
                            <div className="relative z-10 h-20 w-20 rounded-full bg-app-raised flex items-center justify-center border border-border flex-shrink-0 shadow-sm">
                                <User className="h-10 w-10 text-app-text-muted" />
                            </div>
                        )}

                        <div className="relative z-10 space-y-2.5 text-center sm:text-left flex-1 min-w-0">
                            <div>
                                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-gold/80 block">
                                    Sobre o autor
                                </span>
                                <Link
                                    to={`/autor/${article.author.slug}`}
                                    className="font-serif text-xl font-bold text-app-text hover:text-gold transition-colors mt-0.5 inline-block"
                                >
                                    {article.author.name}
                                </Link>
                                {article.author.role && (
                                    <p className="text-xs text-gold font-medium mt-0.5">
                                        {article.author.role}
                                    </p>
                                )}
                            </div>

                            <p className="text-sm text-app-text-muted leading-relaxed">
                                {article.author.bio}
                            </p>

                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-app-text-muted pt-1 border-t border-border/40">
                                {article.author.church && (
                                    <span className="flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5 text-gold/60" />
                                        {article.author.church}
                                    </span>
                                )}
                                {article.author.city && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-gold/60" />
                                        {article.author.city}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </article>
        </Layout>
    );
}