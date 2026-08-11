// ─────────────────────────────────────────────────────────────────────────────
// AuthorPage.tsx — Página pública de perfil do Autor
// Exibe dados do autor e artigos escritos por ele.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { Loader2, ArrowLeft, User, Building2, MapPin, FileText, Calendar } from "lucide-react";
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
    meta_description: string | null;
    cover_image_url: string | null;
    published_at: string | null;
    body: string;
}

export default function AuthorPage() {
    const { slug } = useParams<{ slug: string }>();
    const [author, setAuthor] = useState<Author | null>(null);
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAuthorAndArticles() {
            if (!slug) {
                setError("Slug não informado");
                setLoading(false);
                return;
            }
            try {
                // 1. Fetch Author
                const { data: authorData, error: authorError } = await supabase
                    .from("article_authors")
                    .select("*")
                    .eq("slug", slug)
                    .single();

                if (authorError || !authorData) {
                    setError("Autor não encontrado");
                    setLoading(false);
                    return;
                }

                setAuthor(authorData);

                // 2. Fetch Author's Articles
                const { data: articlesData, error: articlesError } = await supabase
                    .from("articles")
                    .select("id, title, slug, meta_description, cover_image_url, published_at, body")
                    .eq("author_id", authorData.id)
                    .eq("status", "publicado")
                    .order("published_at", { ascending: false });

                if (!articlesError) {
                    setArticles(articlesData ?? []);
                }
            } catch (err: any) {
                console.error("fetchAuthorAndArticles failed:", err);
                setError("Erro de conexão");
            } finally {
                setLoading(false);
            }
        }

        fetchAuthorAndArticles();
    }, [slug]);

    let title = "Autor | Bíblia Vive";
    let description = "Perfil de autor e artigos na Bíblia Vive.";
    let robots = "noindex, follow";
    let canonical = undefined;
    let jsonLd = undefined;

    if (error || (!loading && !author)) {
        title = "Autor não encontrado | Bíblia Vive";
        description = "O autor solicitado não pôde ser encontrado.";
        robots = "noindex, nofollow";
    } else if (author) {
        title = `${author.name} — Colunista Bíblia Vive`;
        description = author.bio || `Explore artigos e reflexões escritos por ${author.name} na Bíblia Vive.`;
        robots = "index, follow";
        canonical = `/autor/${author.slug}`;
        jsonLd = {
            "@context": "https://schema.org",
            "@type": "Person",
            "@id": `${window.location.origin}/autor/${author.slug}#person`,
            "name": author.name,
            "url": `${window.location.origin}/autor/${author.slug}`,
            "description": author.bio,
            "image": author.avatar_url || `${window.location.origin}/og/home.png`,
            "jobTitle": author.role || undefined,
            "worksFor": author.church ? {
                "@type": "Organization",
                "@id": `${window.location.origin}#organization`,
                "name": author.church,
                "sameAs": [
                    "https://www.instagram.com/biblia.vive/",
                    "https://www.facebook.com/bibliavive/",
                ],
            } : undefined,
            "sameAs": [
                `${window.location.origin}/autor/${author.slug}`,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...((author as any).linkedin_url  ? [(author as any).linkedin_url]  : []),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...((author as any).orcid_url     ? [(author as any).orcid_url]     : []),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...((author as any).wikidata_url  ? [(author as any).wikidata_url]  : []),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...((author as any).twitter_url   ? [(author as any).twitter_url]   : []),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...((author as any).instagram_url ? [(author as any).instagram_url] : []),
            ].filter(Boolean),
        };
    }

    usePageMeta({
        title,
        description,
        robots,
        canonical,
        jsonLd,
    });

    if (loading) {
        return (
            <Layout>
                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gold" />
                    <p className="text-sm text-app-text-muted">Carregando perfil...</p>
                </div>
            </Layout>
        );
    }

    if (error || !author) {
        return (
            <Layout>
                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                    <div>
                        <h1 className="font-serif text-2xl text-app-text">Autor não encontrado</h1>
                        <p className="mt-2 text-sm text-app-text-muted">
                            O autor que você procura não está cadastrado ou foi removido.
                        </p>
                    </div>
                    <Link to="/artigos" className="text-sm text-gold hover:underline">
                        Ver todos os artigos
                    </Link>
                </div>
            </Layout>
        );
    }

    function getExcerpt(body: string, maxLength = 130): string {
        const plainText = body.replace(/[#*_`~\[\]]/g, "").replace(/\n+/g, " ");
        if (plainText.length <= maxLength) return plainText;
        return plainText.substring(0, maxLength).trim() + "...";
    }

    return (
        <Layout>
            <div className="mx-auto max-w-4xl px-4 py-12 space-y-12">
                <Link
                    to="/artigos"
                    className="inline-flex items-center gap-2 text-sm text-app-text-muted hover:text-gold transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Ver todos os artigos
                </Link>

                {/* Author Premium Hero Header Card */}
                <div className="relative overflow-hidden rounded-3xl border border-border bg-app-surface/60 backdrop-blur-md p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center shadow-xl">
                    {/* Visual glowing aura behind avatar */}
                    <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-gold/10 blur-3xl" />
                    
                    {author.avatar_url ? (
                        <img
                            src={author.avatar_url}
                            alt={author.name}
                            className="relative z-10 h-28 w-28 md:h-32 md:w-32 rounded-full object-cover border-2 border-gold/40 shadow-md"
                        />
                    ) : (
                        <div className="relative z-10 h-28 w-28 md:h-32 md:w-32 rounded-full bg-app-raised flex items-center justify-center border-2 border-border">
                            <User className="h-14 w-14 text-app-text-muted" />
                        </div>
                    )}

                    <div className="relative z-10 text-center md:text-left flex-1 space-y-3">
                        <div>
                            <h1 className="font-serif text-3xl text-app-text">{author.name}</h1>
                            {author.role && (
                                <p className="text-sm font-medium text-gold mt-1">
                                    {author.role}
                                </p>
                            )}
                        </div>

                        {/* Metadata grid */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-app-text-muted">
                            {author.church && (
                                <div className="flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 text-gold/65" />
                                    <span>{author.church}</span>
                                </div>
                            )}
                            {author.city && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-gold/65" />
                                    <span>{author.city}</span>
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-app-text-muted leading-relaxed max-w-2xl border-t border-border/40 pt-3">
                            {author.bio || "Este autor contribui com artigos edificantes para a edificação da igreja."}
                        </p>
                    </div>
                </div>

                {/* Author's Articles list */}
                <div className="space-y-6">
                    <h2 className="font-serif text-2xl text-app-text flex items-center gap-2 border-b border-border/50 pb-3">
                        <FileText className="h-5 w-5 text-gold" />
                        Artigos de {author.name.split(" ").slice(0, 2).join(" ")} ({articles.length})
                    </h2>

                    {articles.length === 0 ? (
                        <div className="text-center py-12 text-app-text-muted border border-dashed border-border rounded-2xl">
                            <p>Nenhum artigo publicado por este autor ainda.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2">
                            {articles.map((article) => {
                                const formattedDate = article.published_at
                                    ? new Date(article.published_at).toLocaleDateString("pt-BR", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })
                                    : "";

                                return (
                                    <Link
                                        key={article.id}
                                        to={`/artigos/${article.slug}`}
                                        className="group block overflow-hidden rounded-2xl border border-border bg-app-surface transition-colors hover:border-gold/50 flex flex-col justify-between h-full"
                                    >
                                        <div>
                                            {article.cover_image_url && (
                                                <div className="aspect-video overflow-hidden">
                                                    <img
                                                        src={article.cover_image_url}
                                                        alt={article.title}
                                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            )}
                                            <div className="p-5 space-y-2">
                                                <h3 className="font-serif text-lg leading-snug text-app-text group-hover:text-gold transition-colors line-clamp-2">
                                                    {article.title}
                                                </h3>
                                                <p className="text-xs text-app-text-muted line-clamp-3">
                                                    {article.meta_description || getExcerpt(article.body)}
                                                </p>
                                            </div>
                                        </div>
                                        {formattedDate && (
                                            <div className="px-5 pb-5 pt-2 flex items-center gap-2 text-[10px] text-app-text-muted font-mono uppercase tracking-wider">
                                                <Calendar className="h-3.5 w-3.5 text-gold/75" />
                                                <span>{formattedDate}</span>
                                            </div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
