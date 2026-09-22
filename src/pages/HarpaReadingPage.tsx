// ─────────────────────────────────────────────────────────────────────────────
// HarpaReadingPage.tsx — Bíblia Vive · Letra dos Hinos da Harpa Cristã
// Redesenhada com Hero Header clássico, layout em colunas para estrofes,
// player lateral de áudio, créditos e citação inspiradora.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import hymnsData from "@/data/harpa-hymns.json";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useHarpaAudio } from "@/hooks/useHarpaAudio";
import { useHarpaPlayer } from "@/contexts/HarpaPlayerContext";
import { useHymnCredits } from "@/hooks/useHymnCredits";
import { useAuth } from "@/hooks/useAuth";
import HymnCreditsModal from "@/components/harpa/HymnCreditsModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Share2,
  MoreHorizontal,
  Music2,
  BookOpen,
  Heart,
  Mic,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Repeat,
  AlertCircle,
  Check,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";


interface Strophe {
  numero: number;
  titulo: string;
  estrofe: number;
  texto: string;
}

const LoadingLines = () => (
  <div className="min-h-[420px] space-y-4 pt-2">
    {[100, 92, 96, 85, 90, 94, 80, 88, 95, 84].map((width, index) => (
      <Skeleton className="h-6 bg-[#2a2219]/60" key={index} style={{ width: `${width}%` }} />
    ))}
  </div>
);

function isChorusLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return trimmed === trimmed.toUpperCase() && !/^\d/.test(trimmed);
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function HarpaReadingPage() {
  const { hymnNumber } = useParams();
  const navigate = useNavigate();
  const [strophes, setStrophes] = useState<Strophe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Controles de leitura e interação
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [isFavorite, setIsFavorite] = useState(false);
  const [copiedFeedback, setCopiedFeedback] = useState<string | null>(null);

  const numero = useMemo(() => parseInt(hymnNumber ?? "", 10), [hymnNumber]);

  const hymnInfo = useMemo(
    () => (isNaN(numero) ? null : hymnsData.find((h) => h.numero === numero) || null),
    [numero]
  );

  // Lista ordenada de hinos para navegação anterior/próximo
  const allNumbers = useMemo(() => hymnsData.map((h) => h.numero), []);
  const currentIndex = useMemo(() => allNumbers.indexOf(numero), [allNumbers, numero]);
  const prevNumber = currentIndex > 0 ? allNumbers[currentIndex - 1] : null;
  const nextNumber = currentIndex < allNumbers.length - 1 ? allNumbers[currentIndex + 1] : null;

  // Integração com Player Global de Áudio
  const { audioUrl, isAvailable } = useHarpaAudio(numero, hymnInfo?.tituloFormatado);
  const {
    state: playerState,
    play,
    pause,
    resume,
    seek,
    toggleMute,
    toggleLoop,
  } = useHarpaPlayer();

  const isCurrentHymn = playerState.hymnNumber === numero;
  const isPlaying = isCurrentHymn && playerState.isPlaying;
  const progress = isCurrentHymn ? playerState.progress : 0;
  const duration = isCurrentHymn && playerState.duration > 0 ? playerState.duration : 192; // 3:12 padrão enquanto não toca
  const currentTime = (progress / 100) * duration;

  // Verificação de admin para exibir controles de edição
  const { user } = useAuth();
  const isAdmin = (user?.app_metadata as Record<string, unknown> | undefined)?.role === "admin";

  // Créditos dinâmicos: Supabase com fallback para JSON estático
  const { credits, hasRealCredits } = useHymnCredits(numero);

  // Estado do modal de edição de créditos (visível só para admin)
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);

  // Carrega estado de favorito
  useEffect(() => {
    try {
      const raw = localStorage.getItem("bv_favorite_hymns");
      if (raw) {
        const list: number[] = JSON.parse(raw);
        setIsFavorite(list.includes(numero));
      }
    } catch {}
  }, [numero]);

  const toggleFavorite = () => {
    try {
      const raw = localStorage.getItem("bv_favorite_hymns");
      let list: number[] = raw ? JSON.parse(raw) : [];
      if (list.includes(numero)) {
        list = list.filter((n) => n !== numero);
        setIsFavorite(false);
      } else {
        list.push(numero);
        setIsFavorite(true);
      }
      localStorage.setItem("bv_favorite_hymns", JSON.stringify(list));
    } catch {}
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Harpa Cristã — Hino ${numero}: ${hymnInfo?.tituloFormatado}`,
          text: `Ouça e acompanhe a letra do Hino ${numero} (${hymnInfo?.tituloFormatado}) da Harpa Cristã no Bíblia Vive.`,
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedFeedback("Link copiado!");
      setTimeout(() => setCopiedFeedback(null), 2500);
    }
  };

  const handleCopyLyrics = () => {
    if (!hymnInfo || strophes.length === 0) return;
    const fullText = strophes
      .map((s) => `[Estrofe ${s.estrofe}]\n${s.texto}`)
      .join("\n\n");
    navigator.clipboard.writeText(
      `Hino ${numero} — ${hymnInfo.tituloFormatado} (Harpa Cristã)\n\n${fullText}\n\n— Bíblia Vive: ${window.location.href}`
    );
    setCopiedFeedback("Letra copiada!");
    setTimeout(() => setCopiedFeedback(null), 2500);
  };

  const handlePlayPause = () => {
    if (!audioUrl) return;
    if (isCurrentHymn) {
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
    } else {
      play({
        hymnNumber: numero,
        title: hymnInfo?.tituloFormatado || `Hino ${numero}`,
        audioUrl,
      });
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCurrentHymn) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(ratio);
  };

  // Carregamento assíncrono das estrofes
  useEffect(() => {
    if (isNaN(numero) || !hymnInfo) {
      setError("Hino não encontrado ou número inválido.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setStrophes([]);

    const fetchHymnData = async () => {
      try {
        const promises = Array.from({ length: hymnInfo.estrofes }, (_, i) => {
          const stropheNum = i + 1;
          return fetch(`/bible/harpa/${numero}/${stropheNum}.json`).then((res) => {
            if (!res.ok) throw new Error(`Falha ao carregar estrofe ${stropheNum}`);
            return res.json() as Promise<Strophe>;
          });
        });

        const results = await Promise.allSettled(promises);
        const loaded: Strophe[] = results
          .filter((r): r is PromiseFulfilledResult<Strophe> => r.status === "fulfilled")
          .map((r) => r.value);

        loaded.sort((a, b) => a.estrofe - b.estrofe);

        if (!cancelled) {
          setStrophes(loaded);
          setLoading(false);
        }
      } catch (err) {
        console.error("[HarpaReadingPage] Error fetching hymn:", err);
        if (!cancelled) {
          setError("Não foi possível carregar as estrofes deste hino.");
          setLoading(false);
        }
      }
    };

    fetchHymnData();
    return () => {
      cancelled = true;
    };
  }, [numero, hymnInfo]);

  usePageMeta({
    canonical: `/harpa/${numero}`,
    description: hymnInfo
      ? `Letra completa do Hino ${hymnInfo.numero} — ${hymnInfo.tituloFormatado} da Harpa Cristã. Louve e adore com a letra e áudio.`
      : "Leia as letras dos hinos da Harpa Cristã.",
    ogImage: "/images/harpa-hero-book.jpg",
    title: hymnInfo
      ? `Harpa Cristã — Hino ${hymnInfo.numero}: ${hymnInfo.tituloFormatado} — Bíblia Vive`
      : "Harpa Cristã — Bíblia Vive",
    ogType: "article",
  });

  // Distribuição equilibrada das estrofes em 2 colunas
  const { leftCol, rightCol } = useMemo(() => {
    if (strophes.length <= 1) return { leftCol: strophes, rightCol: [] };

    const totalLines = strophes.reduce(
      (sum, s) => sum + s.texto.split("\n").filter(Boolean).length,
      0
    );
    const targetHalf = totalLines / 2;

    const left: Strophe[] = [];
    const right: Strophe[] = [];
    let currentLines = 0;

    for (let i = 0; i < strophes.length; i++) {
      const s = strophes[i];
      const lines = s.texto.split("\n").filter(Boolean).length;
      if (i === 0 || currentLines + lines / 2 <= targetHalf) {
        left.push(s);
        currentLines += lines;
      } else {
        right.push(s);
      }
    }

    if (right.length === 0 && left.length > 1) {
      right.push(left.pop()!);
    }

    return { leftCol: left, rightCol: right };
  }, [strophes]);

  // hasRealCredits e credits vêm do hook useHymnCredits (Supabase com fallback JSON)
  // definido acima junto aos demais hooks

  if (isNaN(numero) || !hymnInfo) {
    return (
      <Layout>
        <div className="mx-auto flex min-h-[360px] w-full max-w-[680px] flex-col items-center justify-center px-4 text-center md:px-6">
          <Alert className="w-full border-[#382f23] bg-[#161412] text-[#f4efea]">
            <AlertCircle className="h-4 w-4 text-[#e5b869]" />
            <AlertTitle className="text-[#f4efea]">Hino não encontrado</AlertTitle>
            <AlertDescription className="text-[#a89b8c]">
              O número de hino informado não existe na Harpa Cristã.
            </AlertDescription>
          </Alert>
          <button
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#e5b869]/50 bg-[#241e18] px-5 py-2 font-mono text-xs text-[#e5b869] hover:bg-[#e5b869] hover:text-[#121110] transition-all cursor-pointer"
            onClick={() => navigate("/harpa")}
            type="button"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Voltar para a Harpa</span>
          </button>
        </div>
      </Layout>
    );
  }

  // Renderização individual de cada estrofe e coro
  const renderStropheItem = (strophe: Strophe) => {
    const rawParagraphs = strophe.texto.split(/\n\s*\n/);

    return (
      <div key={strophe.estrofe} className="space-y-4">
        {rawParagraphs.map((para, pIdx) => {
          const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);
          if (lines.length === 0) return null;

          const isChorus = lines.some((l) => isChorusLine(l));

          return (
            <div key={pIdx} className="space-y-1.5">
              {/* Overline do Bloco: ESTROFE X ou CORO */}
              <p className="font-mono text-[0.68rem] font-semibold tracking-[0.18em] uppercase text-[#e5b869]">
                {isChorus ? "CORO" : `ESTROFE ${strophe.estrofe}`}
              </p>

              {/* Linhas da Letra */}
              <div
                className={cn(
                  "font-serif leading-relaxed",
                  fontSize === "sm" && "text-xs sm:text-sm",
                  fontSize === "base" && "text-sm sm:text-base",
                  fontSize === "lg" && "text-base sm:text-lg",
                  isChorus ? "text-[#e5b869] italic font-medium" : "text-[#f4efea]"
                )}
              >
                {lines.map((line, lIdx) => (
                  <p key={lIdx} className="leading-[1.75]">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Layout>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* ─── 1. HERO HEADER COMPACTO COM FOTO DO LIVRO DA HARPA ─── */}
        <section
          aria-label="Apresentação da Harpa Cristã"
          className="relative mb-6 w-full overflow-hidden rounded-2xl border border-[#382f23]/60 bg-[#161412] shadow-xl"
        >
          {/* Arte Fotográfica da Harpa Cristã com Degradê Multicamadas */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            <div
              className="absolute right-0 top-0 bottom-0 w-full md:w-1/2 bg-cover bg-center md:bg-right opacity-35 mix-blend-luminosity"
              style={{
                backgroundImage: "url('/images/harpa-hero-book.jpg')",
                maskImage:
                  "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 25%, rgba(0,0,0,0.9) 70%, rgba(0,0,0,1) 100%)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 25%, rgba(0,0,0,0.9) 70%, rgba(0,0,0,1) 100%)",
              }}
            />

            {/* Glow Dourado Ambiente */}
            <div className="absolute right-1/4 top-1/2 -translate-y-1/2 h-40 w-40 rounded-full bg-[#e5b869]/10 blur-2xl pointer-events-none" />

            {/* Degradês Escuros de Integração */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#161412] via-[#161412]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#161412] via-[#161412]/85 to-transparent" />
          </div>

          {/* Conteúdo do Hero Header Reduzido pela Metade */}
          <div className="relative z-10 px-5 sm:px-7 py-3.5 sm:py-4">
            {/* Topbar: Link de Retorno e Overline */}
            <div className="flex items-center justify-between gap-4 mb-2">
              <Link
                to="/harpa"
                className="group inline-flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-wider text-[#8f8272] transition-colors hover:text-[#e5b869] cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                <span>Voltar à lista da Harpa</span>
              </Link>

              <span className="font-mono text-[0.65rem] sm:text-[0.7rem] uppercase tracking-[0.22em] text-[#e5b869] font-medium">
                HARPA CRISTÃ
              </span>
            </div>

            {/* Linha Principal: Título + 3 Pilares lado a lado */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-6">
              <div>
                <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-normal text-[#f4efea] tracking-tight leading-tight">
                  Hinos que alimentam a alma.
                </h1>
                <p className="mt-0.5 text-xs text-[#a89b8c] font-sans leading-relaxed max-w-xl">
                  Louve a Deus com o coração. A Harpa Cristã é um convite constante à adoração e comunhão com o Senhor.
                </p>
              </div>

              {/* 3 Pilares de Valor Compactos em Linha */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4.5 text-left shrink-0 pt-1 lg:pt-0">
                {/* Pilar 1: 640 hinos */}
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#241e18] border border-[#382f23] text-[#e5b869]">
                    <Music2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-sans text-xs sm:text-sm font-semibold text-[#f4efea] leading-tight">
                      640 hinos
                    </p>
                    <p className="text-[0.65rem] text-[#8f8272] font-mono leading-tight">
                      Harpa Cristã
                    </p>
                  </div>
                </div>

                <div className="hidden sm:block h-6 w-[1px] bg-[#382f23]" />

                {/* Pilar 2: Organizada por temas */}
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#241e18] border border-[#382f23] text-[#e5b869]">
                    <BookOpen className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-sans text-xs sm:text-sm font-semibold text-[#f4efea] leading-tight">
                      Organizada por temas
                    </p>
                    <p className="text-[0.65rem] text-[#8f8272] font-mono leading-tight">
                      e índices
                    </p>
                  </div>
                </div>

                <div className="hidden sm:block h-6 w-[1px] bg-[#382f23]" />

                {/* Pilar 3: Adoração e culto */}
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#241e18] border border-[#382f23] text-[#e5b869]">
                    <Heart className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-sans text-xs sm:text-sm font-semibold text-[#f4efea] leading-tight">
                      Ideal para momentos
                    </p>
                    <p className="text-[0.65rem] text-[#8f8272] font-mono leading-tight">
                      de adoração e culto
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 2. GRID PRINCIPAL: LETRA DO HINO (ESQUERDA) + SIDEBAR (DIREITA) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* COLUNA ESQUERDA: CARD PRINCIPAL DA LETRA DO HINO */}
          <article
            aria-busy={loading}
            aria-live="polite"
            className="lg:col-span-8 rounded-2xl border border-[#382f23]/80 bg-[#161412] p-6 sm:p-8 md:p-10 shadow-xl relative"
          >
            {/* Cabeçalho do Card */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#382f23]/60">
              <div className="space-y-1">
                <Link
                  to="/harpa"
                  className="group inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[#8f8272] hover:text-[#e5b869] transition-colors mb-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                  <span>Hino {numero}</span>
                </Link>

                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal text-[#f4efea] tracking-tight">
                  {hymnInfo.tituloFormatado}
                </h2>

                <p className="text-xs text-[#8f8272] font-mono">
                  Harpa Cristã · Hino {numero}
                </p>
              </div>

              {/* Ações: Favoritar, Compartilhar, Copiar Letra e Ajuste de Tipografia */}
              <div className="flex items-center gap-1.5 sm:self-center">
                {/* Feedback de Cópia */}
                {copiedFeedback && (
                  <span className="inline-flex items-center gap-1 text-[0.72rem] font-mono text-[#e5b869] bg-[#241e18] border border-[#e5b869]/40 px-2.5 py-1 rounded-full animate-in fade-in">
                    <Check className="h-3 w-3" />
                    {copiedFeedback}
                  </span>
                )}

                {/* Favoritar */}
                <button
                  type="button"
                  onClick={toggleFavorite}
                  title={isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
                  aria-label={isFavorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
                  className="p-2 rounded-lg text-[#8f8272] hover:text-[#e5b869] hover:bg-[#241e18] border border-transparent hover:border-[#382f23] transition-colors cursor-pointer"
                >
                  <Bookmark
                    className={cn("h-4 w-4", isFavorite && "fill-[#e5b869] text-[#e5b869]")}
                  />
                </button>

                {/* Compartilhar */}
                <button
                  type="button"
                  onClick={handleShare}
                  title="Compartilhar hino"
                  aria-label="Compartilhar hino"
                  className="p-2 rounded-lg text-[#8f8272] hover:text-[#e5b869] hover:bg-[#241e18] border border-transparent hover:border-[#382f23] transition-colors cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                </button>

                {/* Mais Opções / Copiar Letra */}
                <button
                  type="button"
                  onClick={handleCopyLyrics}
                  title="Copiar letra completa"
                  aria-label="Copiar letra completa"
                  className="p-2 rounded-lg text-[#8f8272] hover:text-[#e5b869] hover:bg-[#241e18] border border-transparent hover:border-[#382f23] transition-colors cursor-pointer"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>

                {/* Seletor de Tamanho de Fonte A A A */}
                <div className="flex items-center border border-[#382f23] rounded-lg bg-[#221c17] p-0.5 ml-1">
                  <button
                    type="button"
                    onClick={() => setFontSize("sm")}
                    className={cn(
                      "px-2 py-0.5 text-xs font-serif rounded transition-colors cursor-pointer",
                      fontSize === "sm"
                        ? "bg-[#2a2219] text-[#e5b869] font-bold"
                        : "text-[#8f8272] hover:text-[#f4efea]"
                    )}
                    title="Fonte menor"
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSize("base")}
                    className={cn(
                      "px-2 py-0.5 text-sm font-serif rounded transition-colors cursor-pointer",
                      fontSize === "base"
                        ? "bg-[#2a2219] text-[#e5b869] font-bold"
                        : "text-[#8f8272] hover:text-[#f4efea]"
                    )}
                    title="Fonte padrão"
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSize("lg")}
                    className={cn(
                      "px-2 py-0.5 text-base font-serif rounded transition-colors cursor-pointer",
                      fontSize === "lg"
                        ? "bg-[#2a2219] text-[#e5b869] font-bold"
                        : "text-[#8f8272] hover:text-[#f4efea]"
                    )}
                    title="Fonte maior"
                  >
                    A
                  </button>
                </div>
              </div>
            </div>

            {/* Conteúdo das Estrofes */}
            <div className="pt-8">
              {loading ? (
                <div aria-label="Carregando estrofes...">
                  <LoadingLines />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <Alert className="w-full border-[#382f23] bg-[#241e18] text-[#f4efea]">
                    <AlertCircle className="h-4 w-4 text-[#e5b869]" />
                    <AlertTitle>Não foi possível carregar este hino.</AlertTitle>
                    <AlertDescription className="text-[#a89b8c]">{error}</AlertDescription>
                  </Alert>
                  <button
                    className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#e5b869]/50 bg-[#241e18] px-4 py-1.5 text-xs font-mono text-[#e5b869] hover:bg-[#e5b869] hover:text-[#121110] transition-all cursor-pointer"
                    onClick={() => window.location.reload()}
                    type="button"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : (
                /* Grade de Estrofes em 2 Colunas */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
                  <div className="space-y-8">
                    {leftCol.map((strophe) => renderStropheItem(strophe))}
                  </div>
                  <div className="space-y-8">
                    {rightCol.map((strophe) => renderStropheItem(strophe))}
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé do Card com Navegação Anterior / Próximo */}
            <div className="mt-12 pt-6 border-t border-[#382f23]/60 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                disabled={prevNumber === null}
                onClick={() => prevNumber !== null && navigate(`/harpa/${prevNumber}`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#382f23] bg-[#221c17] text-xs font-mono text-[#a89b8c] hover:border-[#e5b869]/50 hover:text-[#e5b869] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Hino anterior</span>
              </button>

              <span className="font-mono text-xs text-[#8f8272]">
                Hino {numero} de {hymnsData.length}
              </span>

              <button
                type="button"
                disabled={nextNumber === null}
                onClick={() => nextNumber !== null && navigate(`/harpa/${nextNumber}`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#382f23] bg-[#221c17] text-xs font-mono text-[#a89b8c] hover:border-[#e5b869]/50 hover:text-[#e5b869] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              >
                <span>Próximo hino</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </article>

          {/* COLUNA DIREITA: SIDEBAR COM OUVIR HINO, CRÉDITOS E CITAÇÃO */}
          <aside className="lg:col-span-4 space-y-6">
            {/* 1. CARD OUVIR HINO */}
            <div className="rounded-2xl border border-[#382f23]/80 bg-[#161412] p-5 sm:p-6 shadow-xl space-y-4">
              {/* Header do Player */}
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2a2219] border border-[#382f23] text-[#e5b869]">
                  <Music2 className="h-3.5 w-3.5" />
                </span>
                <h3 className="font-mono text-[0.68rem] tracking-[0.18em] uppercase text-[#e5b869] font-medium">
                  OUVIR HINO
                </h3>
              </div>

              {/* Controles de Reprodução e Barra de Progresso */}
              <div className="pt-1 space-y-3">
                <div className="flex items-center gap-4">
                  {/* Botão Play/Pause Principal Circular */}
                  <button
                    type="button"
                    disabled={!isAvailable}
                    onClick={handlePlayPause}
                    aria-label={isPlaying ? "Pausar hino" : "Ouvir hino"}
                    className={cn(
                      "h-12 w-12 shrink-0 rounded-full border border-[#e5b869] bg-[#241e18] text-[#e5b869] flex items-center justify-center hover:bg-[#e5b869] hover:text-[#121110] transition-all shadow-md active:scale-95",
                      !isAvailable ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                    )}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 ml-0.5" />
                    )}
                  </button>

                  {/* Barra de Progresso e Marcadores de Tempo */}
                  <div className="flex-1 space-y-1.5">
                    <div
                      className={cn(
                        "h-1.5 w-full bg-[#2a2219] rounded-full overflow-hidden relative",
                        isAvailable && isCurrentHymn ? "cursor-pointer" : "cursor-default"
                      )}
                      onClick={handleSeek}
                      role="progressbar"
                      aria-valuenow={Math.round(progress)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full bg-[#e5b869] rounded-full transition-all duration-100"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[0.68rem] font-mono text-[#8f8272]">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                </div>

                {/* Informações da Faixa e Ações Secundárias */}
                <div className="flex items-center justify-between pt-2 border-t border-[#382f23]/40">
                  <div className="min-w-0 pr-2">
                    <p className="font-serif text-sm font-medium text-[#f4efea] truncate">
                      {hymnInfo.tituloFormatado}
                    </p>
                    <p className="text-[0.7rem] font-mono text-[#8f8272]">
                      Harpa Cristã · Hino {numero}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={toggleMute}
                      title="Mutar/Desmutar"
                      className="text-[#8f8272] hover:text-[#e5b869] transition-colors p-1"
                    >
                      {playerState.isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={toggleLoop}
                      title={playerState.loopMode ? "Desativar repetição" : "Repetir hino"}
                      className={cn(
                        "transition-colors p-1",
                        playerState.loopMode ? "text-[#e5b869]" : "text-[#8f8272] hover:text-[#e5b869]"
                      )}
                    >
                      <Repeat className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {!isAvailable && (
                  <p className="text-[0.68rem] font-mono text-[#8f8272] pt-1">
                    Áudio ainda não disponível para este hino.
                  </p>
                )}
              </div>
            </div>

            {/* 2. CARD CRÉDITOS DA GRAVAÇÃO — Dinâmico via Supabase (fallback JSON) */}
            {(hasRealCredits || isAdmin) && (
              <div className="rounded-2xl border border-[#382f23]/80 bg-[#161412] p-5 sm:p-6 shadow-xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2a2219] border border-[#382f23] text-[#e5b869]">
                      <Mic className="h-3.5 w-3.5" />
                    </span>
                    <h3 className="font-mono text-[0.68rem] tracking-[0.18em] uppercase text-[#e5b869] font-medium">
                      CRÉDITOS DA GRAVAÇÃO
                    </h3>
                  </div>

                  {/* Botão de edição — visível somente para admin */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setCreditsModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#382f23] bg-[#1e1a15] px-2.5 py-1 text-[0.65rem] font-mono text-[#8f8272] hover:border-[#e5b869]/50 hover:text-[#e5b869] transition-all"
                      title="Editar créditos desta gravação"
                    >
                      <Pencil className="h-3 w-3" />
                      Editar
                    </button>
                  )}
                </div>

                {hasRealCredits && credits ? (
                  <>
                    <p className="text-xs text-[#a89b8c] leading-relaxed">
                      Uma poderosa mensagem sonora da Harpa Cristã, interpretada com excelência para
                      edificar o seu coração.
                    </p>

                    <div className="pt-2 space-y-1.5 text-xs text-[#8f8272] font-sans border-t border-[#382f23]/40">
                      {credits.voice && (
                        <p>
                          <span className="text-[#a89b8c] font-medium">Intérprete:</span>{" "}
                          {credits.voice}
                        </p>
                      )}
                      {credits.guitar && (
                        <p>
                          <span className="text-[#a89b8c] font-medium">Violão:</span>{" "}
                          {credits.guitar}
                        </p>
                      )}
                      {credits.source && (
                        <p>
                          <span className="text-[#a89b8c] font-medium">Fonte:</span>{" "}
                          {credits.source}
                        </p>
                      )}
                      {credits.notes && (
                        <p className="pt-1 text-[#7a6e63] italic leading-relaxed">
                          {credits.notes}
                        </p>
                      )}
                      {credits.sourceUrl && (
                        <p className="pt-1">
                          <a
                            href={credits.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[0.72rem] text-[#e5b869] hover:underline transition-colors"
                          >
                            <span>Ouvir gravação original</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </p>
                      )}
                    </div>
                  </>
                ) : isAdmin ? (
                  // Placeholder para admin quando não há créditos
                  <p className="text-[0.72rem] font-mono text-[#6e6355] italic">
                    Nenhum crédito registrado. Clique em "Editar" para adicionar.
                  </p>
                ) : null}
              </div>
            )}

            {/* 3. CARD CITAÇÃO INSPIRADORA */}
            <div className="rounded-2xl border border-[#382f23]/80 bg-[#161412] p-6 shadow-xl relative overflow-hidden flex items-start gap-4">
              <span className="text-3xl font-serif text-[#e5b869] leading-none select-none opacity-80">
                "
              </span>
              <div className="space-y-2">
                <blockquote className="font-serif italic text-sm text-[#e8dfd5] leading-relaxed">
                  "A Palavra de Deus não é apenas para ser lida, mas para ser vivida."
                </blockquote>
                <p className="text-[0.72rem] font-mono text-[#8f8272]">
                  — Harpa Cristã
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Modal de edição de créditos — montado fora do layout para evitar clipping */}
      {isAdmin && hymnInfo && (
        <HymnCreditsModal
          hymnNumber={numero}
          hymnTitle={hymnInfo.tituloFormatado}
          open={creditsModalOpen}
          onClose={() => setCreditsModalOpen(false)}
        />
      )}
    </Layout>
  );
}

