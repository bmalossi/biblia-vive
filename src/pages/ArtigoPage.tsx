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
import { Loader2, ArrowLeft, Calendar } from "lucide-react";

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

            if (data.meta_title) {
                document.title = data.meta_title;
            } else {
                document.title = `${data.title} — Bíblia Vive`;
            }
        }

        fetchArticle();
    }, [slug]);

    if (loading) {
        return (
            <Layout>
                <div className="flex min-h-[60vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gold" />
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
                    className="mb-8 inline-flex items-center gap-2 text-sm text-app-text-muted hover:text-gold"
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

                <header className="mb-8">
                    <h1 className="font-serif text-4xl leading-tight text-app-text">{article.title}</h1>
                    {formattedDate && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-app-text-muted">
                            <Calendar className="h-4 w-4" />
                            {formattedDate}
                        </div>
                    )}
                </header>

                <div className="prose prose-lg max-w-none prose-headings:font-serif prose-a:text-gold prose-img:rounded-xl">
                    <ReactMarkdown>{article.body}</ReactMarkdown>
                </div>
            </article>
        </Layout>
    );
}