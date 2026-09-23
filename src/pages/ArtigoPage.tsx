// ─────────────────────────────────────────────────────────────────────────────
// ArtigoPage.tsx — Página pública de Artigo (Bíblia Vive)
// Redesenhada com Hero Banner imersivo, faixa de metadados, leitura editorial
// com capitular (drop cap), citações bíblicas e sidebar em 3 cards sagrados.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import {
  Loader2,
  Calendar,
  Clock,
  BookOpen,
  Share2,
  ArrowLeft,
  ArrowRight,
  User,
  Building2,
  MapPin,
  Sparkles,
  Music2,
  ChevronRight,
  Check,
} from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

interface Author {
  id?: string;
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
  youtube_id?: string | null;
  youtubeId?: string | null;
  video_url?: string | null;
  video_title?: string | null;
  video_description?: string | null;
}

interface AdjacentArticle {
  title: string;
  slug: string;
}

interface RelatedArticleItem {
  id: string;
  title: string;
  slug: string;
  body?: string;
  meta_description?: string | null;
}

function extractFeaturedQuote(body?: string) {
  if (!body) {
    return {
      text: "“O Senhor é a minha força e o meu escudo; nele o meu coração confia, e dele recebo ajuda.”",
      reference: "Salmo 28:7",
    };
  }

  // Procura por citação no markdown (> Citação)
  const match = body.match(/>\s*["“]?([^"\n\r]+)["”]?\s*(?:\r?\n>\s*([^\n\r]+))?/);
  if (match && match[1] && match[1].trim().length > 10) {
    const quoteText = match[1].trim();
    const quoteRef = match[2]?.trim() || "Salmo 28:7";
    return {
      text: quoteText.startsWith("“") ? quoteText : `“${quoteText}”`,
      reference: quoteRef.replace(/^[-—]\s*/, ""),
    };
  }

  return {
    text: "“O Senhor é a minha força e o meu escudo; nele o meu coração confia, e dele recebo ajuda.”",
    reference: "Salmo 28:7",
  };
}

export default function ArtigoPage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Navegação entre artigos e leituras relacionadas
  const [prevArticle, setPrevArticle] = useState<AdjacentArticle | null>(null);
  const [nextArticle, setNextArticle] = useState<AdjacentArticle | null>(null);
  const [relatedArticle, setRelatedArticle] = useState<RelatedArticleItem | null>(null);

  useEffect(() => {
    async function fetchArticleAndContext() {
      if (!slug) {
        setError("Slug não encontrado");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("articles")
          .select("*, author:article_authors(*)")
          .eq("slug", slug)
          .single();

        if (fetchError || !data || data.status !== "publicado") {
          setError("Artigo não encontrado");
          setLoading(false);
          return;
        }

        setArticle(data);

        const pubDate = data.published_at || data.created_at;
        if (pubDate) {
          const [prevRes, nextRes, relatedRes] = await Promise.all([
            supabase
              .from("articles")
              .select("title, slug")
              .eq("status", "publicado")
              .lt("published_at", pubDate)
              .order("published_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from("articles")
              .select("title, slug")
              .eq("status", "publicado")
              .gt("published_at", pubDate)
              .order("published_at", { ascending: true })
              .limit(1)
              .maybeSingle(),
            supabase
              .from("articles")
              .select("id, title, slug, body, meta_description")
              .eq("status", "publicado")
              .neq("id", data.id)
              .order("published_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

          if (prevRes?.data) setPrevArticle(prevRes.data);
          if (nextRes?.data) setNextArticle(nextRes.data);
          if (relatedRes?.data) setRelatedArticle(relatedRes.data);
        }
      } catch (err) {
        console.error("[ArtigoPage] Erro ao carregar artigo:", err);
        setError("Erro ao carregar o artigo");
      } finally {
        setLoading(false);
      }
    }

    fetchArticleAndContext();
  }, [slug]);

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: article.meta_description || article.title,
          url: window.location.href,
        });
        return;
      } catch {
        // Ignora cancelamento do usuário
      }
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {
      // Ignora falha de clipboard
    }
  };

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
    description =
      article.meta_description ||
      article.body?.substring(0, 160).replace(/[#*_`~\[\]]/g, "") ||
      "";
    robots = "index, follow";
    description = description.substring(0, 160);
    canonical = `/artigos/${article.slug}`;

    const ytId =
      article.youtube_id ||
      article.youtubeId ||
      article.video_url?.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
      )?.[1];

    jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: description,
      url: `https://www.bibliavive.com.br/artigos/${article.slug}`,
      image: article.cover_image_url || "https://www.bibliavive.com.br/og-default.png",
      datePublished: article.published_at || article.created_at || undefined,
      dateModified: article.published_at || article.created_at || undefined,
      author: {
        "@type": "Person",
        name: article.author ? article.author.name : "Bruno Malossi",
        jobTitle: article.author?.role || "Servo de Deus",
        worksFor: article.author?.church
          ? {
              "@type": "Organization",
              name: article.author.church,
            }
          : undefined,
      },
      publisher: {
        "@type": "Organization",
        name: "Bíblia Vive",
        url: "https://www.bibliavive.com.br",
        logo: {
          "@type": "ImageObject",
          url: "https://www.bibliavive.com.br/og/home.png",
        },
        sameAs: [
          "https://www.instagram.com/biblia.vive/",
          "https://www.facebook.com/bibliavive/",
        ],
      },
      inLanguage: "pt-BR",
      ...(ytId
        ? {
            video: {
              "@type": "VideoObject",
              name: article.video_title || article.title,
              description: article.video_description || description,
              thumbnailUrl:
                article.cover_image_url ||
                `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
              contentUrl: `https://www.youtube.com/watch?v=${ytId}`,
              embedUrl: `https://www.youtube.com/embed/${ytId}`,
              uploadDate: article.published_at || article.created_at,
            },
          }
        : {}),
    };
  }

  usePageMeta({
    title,
    description,
    robots,
    canonical,
    jsonLd,
    ogImage: article?.cover_image_url || "/images/article-hero-bible.jpg",
    ogType: "article",
    articlePublishedTime: article?.published_at || article?.created_at || undefined,
    articleModifiedTime: article?.published_at || article?.created_at || undefined,
    articleAuthor: article?.author ? article.author.name : "Bruno Malossi",
  });

  if (loading) {
    return (
      <Layout maxWidthClassName="max-w-7xl">
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <p className="text-sm text-app-text-muted">Carregando conteúdo do artigo...</p>
        </div>
      </Layout>
    );
  }

  if (error || !article) {
    return (
      <Layout maxWidthClassName="max-w-7xl">
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

  // Metadados calculados
  const formattedDate =
    article.published_at || article.created_at
      ? new Date(article.published_at || article.created_at).toLocaleDateString("pt-BR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "10 de setembro de 2026";

  const wordCount = (article.body || "").trim().split(/\s+/).filter(Boolean).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const leadSubtitle =
    article.meta_description ||
    "A Bíblia nos ensina a discernir entre a verdadeira voz de Deus e as vozes enganosas que se levantam no meio de nós.";

  // Dados do Autor com fallback estruturado
  const author: Author = {
    name: article.author?.name || "Bruno Malossi",
    slug: article.author?.slug || "bruno-malossi",
    avatar_url: article.author?.avatar_url || null,
    role: article.author?.role || "Servo de Deus",
    bio:
      article.author?.bio ||
      "Recebeu de Deus um computador, capacidade intelectual e vontade para entregar o que escrevo às pessoas. Estou entregando aquilo que Ele permitiu, para honra e glória dEle!",
    church: article.author?.church || "Comunidade Apostólica Livre - CAL",
    city: article.author?.city || "Praia Grande - SP",
  };

  const featuredQuote = extractFeaturedQuote(article.body);

  return (
    <Layout maxWidthClassName="max-w-7xl">
      <div className="w-full pb-20 pt-2 font-sans">
        {/* ── 1. HERO BANNER IMERSIVO COM FOTOGRAFIA & GRADIENTE ── */}
        <section
          data-testid="article-hero-banner"
          className="relative overflow-hidden rounded-3xl border border-[#382f23]/60 bg-[#161412] min-h-[380px] sm:min-h-[420px] md:min-h-[460px] flex items-center shadow-2xl"
        >
          {/* Imagem de Fundo Fotográfica */}
          <img
            src={article.cover_image_url || "/images/article-hero-bible.jpg"}
            alt={article.title}
            className="absolute inset-0 w-full h-full object-cover object-center lg:object-right select-none opacity-50 sm:opacity-60 md:opacity-70 transition-opacity duration-300"
          />

          {/* Gradientes Suaves Escuros para Máximo Contraste Editorial */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#121110] via-[#121110]/95 to-[#121110]/40 sm:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121110] via-transparent to-transparent opacity-90" />

          {/* Conteúdo Textual do Hero */}
          <div className="relative z-10 max-w-2xl px-6 py-10 sm:px-10 sm:py-14 md:py-16 space-y-4">
            {/* Overline com Linha Dourada Horizontal */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs sm:text-[0.82rem] font-semibold uppercase tracking-widest text-gold">
                DEVOCIONAL
              </span>
              <span className="h-px w-14 sm:w-20 bg-gold/50" />
            </div>

            {/* Título Principal em Serif Nobre */}
            <h1 className="font-serif text-2xl sm:text-4xl md:text-[2.65rem] lg:text-[2.85rem] font-normal leading-[1.15] text-[#F7F4EE] tracking-tight">
              {article.title}
            </h1>

            {/* Subtítulo / Lead em Itálico */}
            {leadSubtitle && (
              <p className="font-serif italic text-sm sm:text-base md:text-lg text-app-text-muted/95 leading-relaxed pt-1">
                {leadSubtitle}
              </p>
            )}
          </div>
        </section>

        {/* ── 2. FAIXA DE METADADOS ── */}
        <section
          data-testid="article-meta-bar"
          className="mt-4 sm:mt-5 border-y border-border/70 bg-[#161412]/60 py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl flex flex-wrap items-center justify-between gap-y-3 text-xs sm:text-sm text-app-text-muted"
        >
          {/* Lado Esquerdo: Data, Categoria e Tempo de Leitura */}
          <div className="flex flex-wrap items-center gap-x-5 sm:gap-x-7 gap-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gold/80" />
              <span>{formattedDate}</span>
            </div>

            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gold/80" />
              <span>Devocional</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gold/80" />
              <span>{readingTimeMinutes} min de leitura</span>
            </div>
          </div>

          {/* Lado Direito: Ação de Compartilhar */}
          <button
            onClick={handleShare}
            aria-label="Compartilhar este artigo"
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-app-text-muted hover:text-gold transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-gold/10"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-gold" />
                <span className="text-gold font-medium">Link copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 text-gold/80" />
                <span>Compartilhar</span>
              </>
            )}
          </button>
        </section>

        {/* ── 3. GRID PRINCIPAL (LEITURA + SIDEBAR SAGRADA) ── */}
        <div className="mt-8 sm:mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* ── COLUNA ESQUERDA: CORPO DO ARTIGO (8 COLUNAS) ── */}
          <article className="lg:col-span-8 space-y-8">
            <div className="rounded-2xl border border-border/80 bg-[#161412]/50 p-6 sm:p-8 md:p-10 shadow-xs">
              {/* Conteúdo Markdown com Capitular na Primeira Letra */}
              <div
                data-testid="article-markdown-body"
                className="article-content font-serif text-[#D6D2CA] text-base sm:text-lg leading-[1.85] space-y-6 [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:text-5xl sm:[&>p:first-of-type]:first-letter:text-6xl [&>p:first-of-type]:first-letter:font-serif [&>p:first-of-type]:first-letter:font-normal [&>p:first-of-type]:first-letter:text-gold [&>p:first-of-type]:first-letter:mr-3.5 [&>p:first-of-type]:first-letter:leading-none [&>p:first-of-type]:first-letter:pt-1"
                style={{
                  letterSpacing: article.letter_spacing || "0em",
                  lineHeight: article.line_height || "1.85",
                }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkBreaks]}
                  components={{
                    h2: ({ children }) => (
                      <h2 className="font-serif text-2xl sm:text-[1.75rem] font-normal text-[#F4EFEA] mt-10 mb-4 pt-2 tracking-tight">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#F4EFEA] mt-8 mb-3 pt-1 tracking-tight">
                        {children}
                      </h3>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="my-6 border-l-2 border-gold pl-5 sm:pl-6 py-1 italic font-serif text-lg sm:text-xl text-[#EDE8DF] space-y-1 bg-transparent">
                        {children}
                      </blockquote>
                    ),
                    p: ({ children }) => (
                      <p className="mb-5 leading-[1.85] text-[#D6D2CA]">{children}</p>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        className="text-gold underline underline-offset-4 hover:text-gold-light transition-colors"
                        target={href?.startsWith("http") ? "_blank" : undefined}
                        rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {article.body}
                </ReactMarkdown>
              </div>

              {/* ── ASSINATURA EDITORIAL BÍBLIA VIVE ── */}
              <div
                data-testid="article-editorial-signature"
                className="pt-8 mt-10 border-t border-border/40 flex items-center gap-3.5"
              >
                <div className="h-10 w-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="font-serif font-medium text-base text-[#F4EFEA]">Bíblia Vive</p>
                  <p className="font-serif italic text-xs text-app-text-muted">
                    Mais que uma leitura, um encontro com Deus.
                  </p>
                </div>
              </div>

              {/* ── NAVEGAÇÃO ENTRE ARTIGOS ── */}
              <div
                data-testid="article-navigation-footer"
                className="pt-8 mt-6 border-t border-border/40 flex items-center justify-between gap-4"
              >
                {prevArticle ? (
                  <Link
                    to={`/artigos/${prevArticle.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border/80 px-4 py-2 text-xs sm:text-sm text-app-text-muted hover:border-gold hover:text-gold transition-all"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Artigo anterior</span>
                    <span className="sm:hidden">Anterior</span>
                  </Link>
                ) : (
                  <div className="invisible" />
                )}

                <Link
                  to="/artigos"
                  className="text-xs sm:text-sm text-app-text-muted hover:text-gold transition-colors font-medium text-center"
                >
                  Voltar para a lista
                </Link>

                {nextArticle ? (
                  <Link
                    to={`/artigos/${nextArticle.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border/80 px-4 py-2 text-xs sm:text-sm text-app-text-muted hover:border-gold hover:text-gold transition-all"
                  >
                    <span className="hidden sm:inline">Próximo artigo</span>
                    <span className="sm:hidden">Próximo</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <div className="invisible" />
                )}
              </div>
            </div>
          </article>

          {/* ── COLUNA DIREITA: SIDEBAR COM 3 CARDS SAGRADOS (4 COLUNAS) ── */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* ── CARD 1: SOBRE O AUTOR ── */}
            <div
              data-testid="sidebar-card-author"
              className="rounded-2xl border border-border/80 bg-[#161412]/80 p-5 sm:p-6 backdrop-blur-xs shadow-xs space-y-4"
            >
              <div className="flex items-center gap-3.5">
                {author.avatar_url ? (
                  <img
                    src={author.avatar_url}
                    alt={author.name}
                    className="h-13 w-13 rounded-full object-cover border border-gold/30 shrink-0"
                  />
                ) : (
                  <div className="h-13 w-13 rounded-full bg-app-raised border border-border/80 flex items-center justify-center shrink-0">
                    <User className="h-6 w-6 text-app-text-muted" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-[10px] tracking-wider text-gold/90 uppercase font-semibold block">
                    SOBRE O AUTOR
                  </span>
                  <Link
                    to={`/autor/${author.slug}`}
                    className="font-serif text-lg font-bold text-app-text hover:text-gold transition-colors block truncate"
                  >
                    {author.name}
                  </Link>
                  {author.role && (
                    <p className="text-xs text-app-text-muted truncate">{author.role}</p>
                  )}
                </div>
              </div>

              <p className="text-xs sm:text-[0.82rem] text-app-text-muted leading-relaxed">
                {author.bio}
              </p>

              {(author.church || author.city) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 border-t border-border/40 text-[11px] text-app-text-muted">
                  {author.church && (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 text-gold/70 shrink-0" />
                      <span className="truncate">{author.church}</span>
                    </span>
                  )}
                  {author.city && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-gold/70 shrink-0" />
                      <span className="truncate">{author.city}</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* ── CARD 2: LEITURAS RELACIONADAS ── */}
            <div
              data-testid="sidebar-card-related"
              className="rounded-2xl border border-border/80 bg-[#161412]/80 p-5 sm:p-6 backdrop-blur-xs shadow-xs space-y-4"
            >
              <div className="flex items-center gap-2 pb-1 border-b border-border/40">
                <BookOpen className="h-4 w-4 text-gold" />
                <h3 className="font-mono text-[11px] tracking-wider text-gold uppercase font-semibold">
                  LEITURAS RELACIONADAS
                </h3>
              </div>

              <div className="space-y-3">
                {/* 1. Devocional / Artigo Relacionado */}
                <Link
                  to={relatedArticle ? `/artigos/${relatedArticle.slug}` : "/artigos"}
                  className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-gold/5 border border-transparent hover:border-gold/20 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="h-9 w-9 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 group-hover:border-gold/50 transition-colors">
                      <Sparkles className="h-4 w-4 text-gold" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-gold/80 block">
                        DEVOCIONAL
                      </span>
                      <p className="font-serif text-xs sm:text-[0.84rem] text-app-text font-medium group-hover:text-gold transition-colors truncate">
                        {relatedArticle?.title || "A importância de discernir os tempos"}
                      </p>
                      <span className="text-[10px] text-app-text-muted block">
                        5 min de leitura
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-app-text-muted/60 group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>

                {/* 2. Harpa Cristã */}
                <Link
                  to="/harpa/322"
                  className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-gold/5 border border-transparent hover:border-gold/20 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="h-9 w-9 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 group-hover:border-gold/50 transition-colors">
                      <Music2 className="h-4 w-4 text-gold" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-gold/80 block">
                        HARPA CRISTÃ
                      </span>
                      <p className="font-serif text-xs sm:text-[0.84rem] text-app-text font-medium group-hover:text-gold transition-colors truncate">
                        Confiar em Deus
                      </p>
                      <span className="text-[10px] text-app-text-muted block">
                        Hino 322
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-app-text-muted/60 group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>

                {/* 3. Plano de Leitura */}
                <Link
                  to="/planos"
                  className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-gold/5 border border-transparent hover:border-gold/20 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="h-9 w-9 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 group-hover:border-gold/50 transition-colors">
                      <Calendar className="h-4 w-4 text-gold" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-gold/80 block">
                        PLANO DE LEITURA
                      </span>
                      <p className="font-serif text-xs sm:text-[0.84rem] text-app-text font-medium group-hover:text-gold transition-colors truncate">
                        Os Evangelhos em 30 dias
                      </p>
                      <span className="text-[10px] text-app-text-muted block">
                        Dia 12 · Mateus 6
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-app-text-muted/60 group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              </div>
            </div>

            {/* ── CARD 3: CITAÇÃO EM DESTAQUE ── */}
            <div
              data-testid="sidebar-card-quote"
              className="rounded-2xl border border-border/80 bg-[#161412]/80 p-5 sm:p-6 backdrop-blur-xs shadow-xs space-y-3"
            >
              <span className="font-serif text-3xl sm:text-4xl text-gold/90 leading-none block select-none">
                “
              </span>
              <blockquote className="font-serif italic text-xs sm:text-sm text-[#E2DDD5] leading-relaxed">
                {featuredQuote.text}
              </blockquote>
              <p className="font-serif text-xs text-app-text-muted/80 text-right pt-1">
                — {featuredQuote.reference}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}