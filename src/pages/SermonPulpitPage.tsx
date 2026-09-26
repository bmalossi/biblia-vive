import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Clock,
  BookOpen,
  X,
  Flame,
  Volume2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSermon, savePreachingLog, type Sermon } from "@/lib/homileticClient";
import { fetchChapter, type Chapter } from "@/lib/bibleApi";
import { createNoteStore } from "@/lib/noteStore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Renderizador com realce de marcadores de dinâmica vocal e retórica
function renderWithDynamicMarkers(text: string | undefined): React.ReactNode {
  if (!text) return null;

  // Quebra por marcadores conhecidos
  const parts = text.split(/(\[(?:Ilustração|Pausa Silenciosa|Pausa|Tom de Voz \/ Apelo|Tom\/Apelo)\])/gi);

  return parts.map((part, index) => {
    const lower = part.toLowerCase();
    if (lower === "[ilustração]") {
      return (
        <span
          key={index}
          data-testid="dynamic-chip-ilustracao"
          className="inline-flex items-center gap-1 font-mono text-[0.72rem] bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md mx-1 font-semibold select-none shadow-xs"
        >
          💡 Ilustração
        </span>
      );
    }
    if (lower === "[pausa silenciosa]" || lower === "[pausa]") {
      return (
        <span
          key={index}
          data-testid="dynamic-chip-pausa"
          className="inline-flex items-center gap-1 font-mono text-[0.72rem] bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-md mx-1 font-semibold select-none shadow-xs"
        >
          🤫 Pausa Silenciosa
        </span>
      );
    }
    if (lower === "[tom de voz / apelo]" || lower === "[tom/apelo]") {
      return (
        <span
          key={index}
          data-testid="dynamic-chip-apelo"
          className="inline-flex items-center gap-1 font-mono text-[0.72rem] bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md mx-1 font-semibold select-none shadow-xs"
        >
          ⚡ Tom de Voz / Apelo
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export default function SermonPulpitPage() {
  const { sermonId } = useParams<{ sermonId: string }>();
  const navigate = useNavigate();

  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [loading, setLoading] = useState(true);

  // Tipografia para leitura a 60cm de distância (18px-20px padrão no altar)
  const [fontSizeIndex, setFontSizeIndex] = useState(1); // 0: 18px, 1: 20px (padrão altar), 2: 22px, 3: 24px
  const fontSizes = [
    "text-[18px] leading-[1.8]",
    "text-[20px] leading-[1.85]",
    "text-[22px] leading-[1.9]",
    "text-[24px] leading-[2.0]",
  ];

  // Modo Altar / Pregar Agora (oculta menus e evita toques acidentais no púlpito)
  const [isAltarMode, setIsAltarMode] = useState(false);

  // Trava de Tela (Screen Wake Lock API)
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const wakeLockSentinelRef = useRef<any>(null);

  const requestWakeLock = async () => {
    if ("wakeLock" in navigator && (navigator as any).wakeLock) {
      try {
        const lock = await (navigator as any).wakeLock.request("screen");
        wakeLockSentinelRef.current = lock;
        setIsWakeLockActive(true);
        if (lock && typeof lock.addEventListener === "function") {
          lock.addEventListener("release", () => {
            setIsWakeLockActive(false);
          });
        }
      } catch (err) {
        console.warn("[ModoPulpito] Screen Wake Lock falhou:", err);
        setIsWakeLockActive(false);
      }
    }
  };

  useEffect(() => {
    requestWakeLock();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (wakeLockSentinelRef.current && typeof wakeLockSentinelRef.current.release === "function") {
        try {
          const res = wakeLockSentinelRef.current.release();
          if (res && typeof res.catch === "function") {
            res.catch(() => {});
          }
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleEnterAltarMode = () => {
    setIsAltarMode(true);
    if (typeof document !== "undefined" && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    toast.success("Modo Altar Ativo: Menus ocultos contra toques acidentais.");
  };

  const handleExitAltarMode = () => {
    setIsAltarMode(false);
    if (typeof document !== "undefined" && document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Cronômetro de Púlpito
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Card Flutuante de Texto Bíblico
  const [isScriptureOpen, setIsScriptureOpen] = useState(false);
  const [chapterData, setChapterData] = useState<Chapter | null>(null);
  const [loadingScripture, setLoadingScripture] = useState(false);

  // Registro Pós-Pregação
  const [isPreachingModalOpen, setIsPreachingModalOpen] = useState(false);
  const [churchName, setChurchName] = useState("");
  const [city, setCity] = useState("");
  const [preachedAt, setPreachedAt] = useState(() => new Date().toISOString().split("T")[0]);
  const [preachingNotes, setPreachingNotes] = useState("");
  const [mirrorToMemorial, setMirrorToMemorial] = useState(false);
  const [isSavingLog, setIsSavingLog] = useState(false);

  const handleSavePreaching = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sermon || !churchName.trim() || !city.trim()) return;

    setIsSavingLog(true);
    try {
      await savePreachingLog({
        sermonId: sermon.id,
        churchName: churchName.trim(),
        city: city.trim(),
        preachedAt: preachedAt || new Date().toISOString().split("T")[0],
        notes: preachingNotes.trim() || undefined,
      });

      if (mirrorToMemorial) {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user.id || null;
        const noteStore = createNoteStore(userId);
        await noteStore.save({
          type: "testimony",
          title: `Testemunho de Ministração: ${sermon.title}`,
          content: `${churchName} (${city}) - ${preachingNotes || "Ministração no Modo Púlpito."}`,
          bookId: sermon.bookId || "sl",
          bookName: sermon.bookName || "Salmos",
          chapter: sermon.chapter || 1,
          verse: sermon.verse || null,
          version: sermon.version || "acf",
          metadata: {
            testimony: {
              churchName: churchName.trim(),
              city: city.trim(),
              preachedAt,
              sermonId: sermon.id,
            },
          },
        });
      }

      toast.success("Ministração registrada com sucesso!");
      navigate(`/estudio/${sermon.id}`);
    } catch (err) {
      console.error("[ModoPulpito] Erro ao salvar registro de pregação:", err);
      toast.error("Erro ao registrar ministração.");
    } finally {
      setIsSavingLog(false);
    }
  };

  // Cronômetro contínuo
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formattedTimer = useMemo(() => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;

    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(remMins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, [seconds]);

  // 3. Carregar Sermão
  useEffect(() => {
    if (!sermonId) return;

    let isMounted = true;
    getSermon(sermonId).then((data) => {
      if (isMounted) {
        setSermon(data);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [sermonId]);

  // 4. Carregar Texto Bíblico para o Card Flutuante
  const handleOpenScripture = async () => {
    setIsScriptureOpen(true);
    if (chapterData || !sermon?.bookName || !sermon?.chapter) return;

    setLoadingScripture(true);
    try {
      const data = await fetchChapter(
        sermon.version || "acf",
        sermon.bookId || "rom",
        String(sermon.chapter)
      );
      setChapterData(data);
    } catch (err) {
      console.error("[ModoPulpito] Erro ao buscar passagem bíblica:", err);
    } finally {
      setLoadingScripture(false);
    }
  };

  const scrollToSection = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg text-app-text flex items-center justify-center">
        <Flame className="w-8 h-8 text-gold animate-pulse" />
      </div>
    );
  }

  if (!sermon) {
    return (
      <div className="min-h-screen bg-app-bg text-app-text flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4 bg-app-surface p-6 rounded-2xl border border-border shadow-sm">
          <p className="text-sm text-app-text-muted">Sermão não encontrado.</p>
          <Button onClick={() => navigate("/estudio")} variant="outline" className="border-border">
            Voltar ao Estúdio
          </Button>
        </div>
      </div>
    );
  }

  const hasPassage = Boolean(sermon.bookName && sermon.chapter);

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col font-serif selection:bg-gold/30 selection:text-gold antialiased">
      {/* ── BARRA FIXA SUPERIOR DO ALTAR (Tema + Versículo Flutuante + Cronômetro + Trava de Tela) ── */}
      <header
        data-testid="pulpit-header"
        className="sticky top-0 z-40 bg-app-surface/95 backdrop-blur-md border-b border-border px-4 py-2.5 transition-all shadow-xs"
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Lado Esquerdo: Tema / Título & Versículo Flutuante */}
          <div className="flex items-center gap-2.5 min-w-0">
            <h1
              title={sermon.title}
              className="text-sm sm:text-base font-bold text-app-text truncate max-w-[140px] sm:max-w-xs md:max-w-sm"
            >
              {sermon.title}
            </h1>

            {hasPassage && (
              <button
                type="button"
                data-testid="scripture-pill-main"
                onClick={handleOpenScripture}
                className="inline-flex items-center gap-1.5 text-[0.72rem] font-mono text-gold bg-gold/10 border border-gold/30 hover:bg-gold/20 px-2.5 py-1 rounded-full transition-colors shrink-0 shadow-xs cursor-pointer font-medium"
                title="Abrir versículo bíblico no card flutuante"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>
                  {sermon.bookName} {sermon.chapter}
                  {sermon.verse ? `:${sermon.verse}` : ""}
                </span>
              </button>
            )}
          </div>

          {/* Lado Direito: Cronômetro + Trava de Tela + Botão Pregar Agora / Modo Altar + Controles */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Cronômetro */}
            <div
              data-testid="pulpit-stopwatch"
              className="flex items-center gap-1.5 font-mono text-xs sm:text-sm text-gold bg-app-raised border border-border px-2.5 py-1 rounded-xl shadow-xs"
            >
              <Clock className="w-3.5 h-3.5 text-gold/80" />
              <span>{formattedTimer}</span>
            </div>

            {/* Trava de Tela (Screen Wake Lock) */}
            <button
              type="button"
              data-testid="wake-lock-status-indicator"
              onClick={requestWakeLock}
              title={
                isWakeLockActive
                  ? "Trava de Tela ativa: o display não apagará durante a pregação"
                  : "Clique para ativar a Trava de Tela"
              }
              className={cn(
                "flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-xl border transition-all cursor-pointer select-none shadow-xs",
                isWakeLockActive
                  ? "bg-gold/15 text-gold border-gold/40 font-semibold"
                  : "bg-app-raised text-app-text-muted border-border hover:text-app-text"
              )}
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  isWakeLockActive
                    ? "bg-gold animate-pulse shadow-xs shadow-gold/50"
                    : "bg-app-text-muted/60"
                )}
              />
              <span className="hidden md:inline font-semibold">
                {isWakeLockActive ? "Tela Ativa" : "Travar Tela"}
              </span>
              <span className="md:hidden">🔒</span>
            </button>

            {/* Botão [ 📖 Pregar Agora ] / Sair do Modo Altar */}
            {!isAltarMode ? (
              <Button
                type="button"
                data-testid="enter-altar-mode-btn"
                onClick={handleEnterAltarMode}
                className="bg-gold text-primary-foreground hover:bg-gold/90 text-xs sm:text-sm font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                title="Ocultar menus e evitar toques acidentais no púlpito"
              >
                <span>📖</span>
                <span>Pregar Agora</span>
              </Button>
            ) : (
              <Button
                type="button"
                data-testid="exit-altar-mode-btn"
                onClick={handleExitAltarMode}
                variant="outline"
                size="sm"
                className="text-xs border-border bg-app-raised text-app-text hover:bg-app-surface rounded-xl px-2.5 h-8 flex items-center gap-1.5 cursor-pointer"
                title="Sair do modo foco e reexibir menus"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desbloquear Menus</span>
              </Button>
            )}

            {/* Ajuste de Fonte (Oculto no modo altar para evitar toques acidentais) */}
            {!isAltarMode && (
              <div className="hidden sm:flex items-center bg-app-raised border border-border rounded-xl p-0.5 shadow-xs">
                <button
                  type="button"
                  onClick={() => setFontSizeIndex((prev) => Math.max(0, prev - 1))}
                  disabled={fontSizeIndex === 0}
                  className="px-2 py-0.5 text-xs text-app-text-muted hover:text-app-text disabled:opacity-30 cursor-pointer"
                  title="Diminuir texto"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFontSizeIndex((prev) => Math.min(fontSizes.length - 1, prev + 1))
                  }
                  disabled={fontSizeIndex === fontSizes.length - 1}
                  className="px-2 py-0.5 text-xs text-app-text-muted hover:text-app-text disabled:opacity-30 cursor-pointer"
                  title="Aumentar texto"
                >
                  A+
                </button>
              </div>
            )}

            {/* Botão Encerrar Pregação */}
            <Button
              data-testid="finish-preaching-btn"
              onClick={() => setIsPreachingModalOpen(true)}
              variant="outline"
              size="sm"
              className="text-xs border-amber-500/30 bg-app-raised hover:bg-app-surface text-amber-600 dark:text-amber-400 rounded-xl px-2.5 h-8 flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Encerrar</span>
            </Button>
          </div>
        </div>

        {/* ── MAPA DO SERMÃO (Pílulas de Navegação - Ocultas quando isAltarMode para evitar toques acidentais) ── */}
        {!isAltarMode && (
          <div className="max-w-5xl mx-auto flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 text-[0.68rem] font-mono no-scrollbar">
            <button
              type="button"
              onClick={() => scrollToSection("sec-spark")}
              className="px-2.5 py-1 rounded-lg bg-app-raised hover:bg-app-surface border border-border text-gold whitespace-nowrap transition-colors cursor-pointer font-medium"
            >
              0. Eu e Deus
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("sec-intro")}
              className="px-2.5 py-1 rounded-lg bg-app-raised hover:bg-app-surface border border-border text-gold whitespace-nowrap transition-colors cursor-pointer font-bold"
            >
              Introd.
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("sec-bloco-1")}
              className="px-2.5 py-1 rounded-lg bg-app-raised hover:bg-app-surface border border-border text-app-text-muted hover:text-app-text whitespace-nowrap transition-colors cursor-pointer"
            >
              1. Exegese
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("sec-bloco-2")}
              className="px-2.5 py-1 rounded-lg bg-app-raised hover:bg-app-surface border border-border text-app-text-muted hover:text-app-text whitespace-nowrap transition-colors cursor-pointer"
            >
              2. Tópicos
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("sec-bloco-3")}
              className="px-2.5 py-1 rounded-lg bg-app-raised hover:bg-app-surface border border-border text-app-text-muted hover:text-app-text whitespace-nowrap transition-colors cursor-pointer"
            >
              3. Aplicação
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("sec-desfecho")}
              className="px-2.5 py-1 rounded-lg bg-app-raised hover:bg-app-surface border border-border text-gold whitespace-nowrap transition-colors cursor-pointer font-semibold"
            >
              4. Desfecho
            </button>
          </div>
        )}
      </header>

      {/* ── CORPO DO SERMÃO NO PÚLPITO (Ordem Cronológica da Pregação: Introdução no topo, Desfecho na conclusão) ── */}
      <main
        data-testid="pulpit-main-content"
        className={cn(
          "max-w-3xl mx-auto w-full px-5 sm:px-8 py-8 space-y-12 flex-1 antialiased",
          fontSizes[fontSizeIndex]
        )}
      >
        {/* Banner Indicador do Modo Altar Ativo */}
        {isAltarMode && (
          <div
            data-testid="altar-mode-banner"
            className="flex items-center justify-between bg-zinc-900/90 border border-gold/40 px-4 py-2 rounded-xl text-xs font-mono text-gold select-none animate-in fade-in duration-200"
          >
            <div className="flex items-center gap-2">
              <span className="animate-pulse">🛡️</span>
              <span className="font-semibold">Modo Altar Ativo: Menus ocultos contra toques acidentais</span>
            </div>
            <button
              type="button"
              onClick={handleExitAltarMode}
              className="text-[0.7rem] text-zinc-400 hover:text-white underline cursor-pointer"
            >
              Desbloquear Menus
            </button>
          </div>
        )}

        {/* 0. Eu e Deus — Chama Inicial (Referência Devocional) */}
        {sermon.sparkText && (
          <section
            id="sec-spark"
            className="space-y-2 border-l-2 border-amber-500/50 pl-5 py-2 bg-amber-500/5 rounded-r-xl"
          >
            <span className="text-[0.7rem] font-mono uppercase tracking-widest text-amber-400 font-bold block">
              0. Eu e Deus — Chama Inicial
            </span>
            <p className="italic text-zinc-300 font-serif text-sm sm:text-base leading-relaxed">
              "{sermon.sparkText}"
            </p>
          </section>
        )}

        {/* 1. Introdução (Gancho de Entrada no Topo da Pregação) */}
        <section id="sec-intro" className="space-y-4 border-l-2 border-gold/70 pl-5 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-gold font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> 1. Introdução (Gancho de Entrada)
            </span>
            <span className="text-[0.68rem] font-mono text-zinc-500">Início da Ministração</span>
          </div>
          <div className="text-zinc-100 font-serif whitespace-pre-line leading-relaxed">
            {sermon.introducao ? (
              renderWithDynamicMarkers(sermon.introducao)
            ) : (
              <p className="italic text-zinc-400">Nenhuma introdução redigida ainda.</p>
            )}
          </div>
        </section>

        {/* 2. Explicar o Texto (Exegese & Contexto Histórico) */}
        <section id="sec-bloco-1" className="space-y-5 border-l-2 border-zinc-700 pl-5 py-2">
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold block">
            2. Explicar o Texto (Exegese & Contexto)
          </span>

          {sermon.bloco1IntencaoOriginal && (
            <div className="bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-4 text-[1rem] sm:text-[1.125rem] text-zinc-200 leading-relaxed italic font-serif shadow-xs">
              <span className="font-mono text-xs text-amber-400 font-bold block mb-1 not-italic uppercase tracking-wide">
                ⚓ Ancoradouro Histórico (Intenção Original do Autor):
              </span>
              "{sermon.bloco1IntencaoOriginal}"
            </div>
          )}

          {sermon.bloco1Exegese && (
            <div className="text-zinc-100 font-serif whitespace-pre-line leading-relaxed">
              {renderWithDynamicMarkers(sermon.bloco1Exegese)}
            </div>
          )}
        </section>

        {/* 3. Pregar a Inspiração (Tópicos da Mensagem em Degraus Contínuos) */}
        <section id="sec-bloco-2" className="space-y-8 border-l-2 border-zinc-700 pl-5 py-2">
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold block">
            3. Pregar a Inspiração (Tópicos em Degraus)
          </span>

          {sermon.bloco2Topicos && sermon.bloco2Topicos.length > 0 ? (
            sermon.bloco2Topicos.map((top, idx) => (
              <div
                key={top.id || idx}
                className="space-y-5 pt-3 pb-4 border-b border-zinc-800/80 last:border-b-0"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs uppercase tracking-wider px-2.5 py-0.5 rounded bg-gold/15 text-gold border border-gold/30 shrink-0 font-bold">
                    Tópico {idx + 1}
                  </span>
                  <h2 className="font-serif font-bold text-xl sm:text-2xl text-gold-light leading-snug">
                    {top.title}
                  </h2>
                </div>

                {/* Parágrafos contínuos dos 4 Degraus com badges sutis na margem */}
                <div className="space-y-4 text-zinc-100 font-serif">
                  {top.steps?.stepA_fato && (
                    <div className="flex items-start gap-3">
                      <span
                        data-testid={`badge-degrau-a-${idx}`}
                        className="shrink-0 mt-1 inline-flex items-center text-[0.68rem] font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded select-none shadow-xs"
                      >
                        A · Fato
                      </span>
                      <div className="flex-1 whitespace-pre-line leading-relaxed">
                        {renderWithDynamicMarkers(top.steps.stepA_fato)}
                      </div>
                    </div>
                  )}

                  {top.steps?.stepB_porque && (
                    <div className="flex items-start gap-3">
                      <span
                        data-testid={`badge-degrau-b-${idx}`}
                        className="shrink-0 mt-1 inline-flex items-center text-[0.68rem] font-mono font-bold uppercase tracking-wider text-sky-300 bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded select-none shadow-xs"
                      >
                        B · Porquê
                      </span>
                      <div className="flex-1 whitespace-pre-line leading-relaxed">
                        {renderWithDynamicMarkers(top.steps.stepB_porque)}
                      </div>
                    </div>
                  )}

                  {top.steps?.stepC_contraste && (
                    <div className="flex items-start gap-3">
                      <span
                        data-testid={`badge-degrau-c-${idx}`}
                        className="shrink-0 mt-1 inline-flex items-center text-[0.68rem] font-mono font-bold uppercase tracking-wider text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded select-none shadow-xs"
                      >
                        C · Contraste
                      </span>
                      <div className="flex-1 whitespace-pre-line leading-relaxed">
                        {renderWithDynamicMarkers(top.steps.stepC_contraste)}
                      </div>
                    </div>
                  )}

                  {top.steps?.stepD_tensao && (
                    <div className="flex items-start gap-3">
                      <span
                        data-testid={`badge-degrau-d-${idx}`}
                        className="shrink-0 mt-1 inline-flex items-center text-[0.68rem] font-mono font-bold uppercase tracking-wider text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded select-none shadow-xs"
                      >
                        D · Tensão
                      </span>
                      <div className="flex-1 whitespace-pre-line leading-relaxed">
                        {renderWithDynamicMarkers(top.steps.stepD_tensao)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-400 italic">Sem tópicos definidos no esboço.</p>
          )}
        </section>

        {/* 4. Aplicar à Vida Real (Conexão Prática) */}
        <section id="sec-bloco-3" className="space-y-4 border-l-2 border-zinc-700 pl-5 py-2">
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold block">
            4. Aplicar à Vida Real (Conexão Prática)
          </span>
          <div className="text-zinc-100 font-serif whitespace-pre-line leading-relaxed">
            {sermon.bloco3Aplicacao ? (
              renderWithDynamicMarkers(sermon.bloco3Aplicacao)
            ) : (
              <p className="italic text-zinc-400">Nenhuma aplicação redigida ainda.</p>
            )}
          </div>
        </section>

        {/* 5. Desfecho Homilético & Apelo Final (Conclusão na Ordem Cronológica) */}
        <section
          id="sec-desfecho"
          className="space-y-4 border-l-2 border-gold pl-5 py-4 bg-gold/5 p-5 rounded-2xl border border-gold/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-gold font-bold block">
              5. Desfecho Homilético & Apelo Final ({sermon.desfechoTipo || "Conclusão"})
            </span>
            <span className="text-[0.68rem] font-mono text-gold/80">Conclusão da Mensagem</span>
          </div>
          <p className="text-zinc-100 font-serif font-bold whitespace-pre-line leading-relaxed">
            {renderWithDynamicMarkers(sermon.desfechoTexto || "Conclusão da mensagem.")}
          </p>
        </section>

        {/* Encerramento da Pregação */}
        <div className="pt-8 pb-12 flex justify-center">
          <Button
            type="button"
            onClick={() => setIsPreachingModalOpen(true)}
            className="bg-gold text-primary-foreground hover:bg-gold/90 text-sm font-semibold px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-md active:scale-95 cursor-pointer"
          >
            <span>⏹️</span>
            <span>Encerrar Pregação & Registrar</span>
          </Button>
        </div>
      </main>

      {/* ── CARD FLUTUANTE DE TEXTO BÍBLICO ───────────────────────────────────── */}
      {isScriptureOpen && (
        <div
          data-testid="biblical-text-floating-card"
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[480px] max-h-[70vh] z-50 bg-zinc-900 border border-gold/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header do Card */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/60">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gold" />
              <span className="font-mono text-xs font-bold text-zinc-100">
                {sermon.bookName} {sermon.chapter}
                {sermon.verse ? `:${sermon.verse}` : ""}
              </span>
              <span className="text-[0.65rem] font-mono text-zinc-400 uppercase">
                ({sermon.version || "acf"})
              </span>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsScriptureOpen(false)}
              aria-label="Fechar Passagem"
              className="text-zinc-400 hover:text-white p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Versículos */}
          <div className="p-4 overflow-y-auto space-y-2 text-sm leading-relaxed text-zinc-200 font-serif">
            {loadingScripture ? (
              <div className="py-6 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                <Flame className="w-4 h-4 text-gold animate-spin" />
                <span>Carregando texto sagrado...</span>
              </div>
            ) : chapterData?.verses ? (
              chapterData.verses.map((v) => {
                const isSelectedVerse = sermon.verse && v.number === sermon.verse;
                return (
                  <p
                    key={v.number}
                    className={cn(
                      "py-0.5",
                      isSelectedVerse && "bg-gold/15 text-gold-light rounded px-1 font-semibold"
                    )}
                  >
                    <sup className="text-gold text-[0.68rem] font-mono mr-1.5">{v.number}</sup>
                    {v.text}
                  </p>
                );
              })
            ) : (
              <p className="text-xs text-zinc-400">Passagem bíblica não carregada.</p>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL SOLENE DE REGISTRO PÓS-PREGAÇÃO ──────────────────────────── */}
      {isPreachingModalOpen && (
        <div
          data-testid="preaching-log-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5 text-zinc-100 font-sans">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🏛️</span>
                <div>
                  <h3 className="font-serif font-bold text-base text-zinc-100">
                    Registro Pós-Pregação
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Guarde o testemunho da ministração no Cloudflare D1
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreachingModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 h-auto"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSavePreaching} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                  Nome da Igreja / Comunidade *
                </label>
                <input
                  data-testid="preaching-church-input"
                  type="text"
                  required
                  value={churchName}
                  onChange={(e) => setChurchName(e.target.value)}
                  placeholder="Ex: Igreja Batista Esperança, Comunidade da Graça..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                    Cidade *
                  </label>
                  <input
                    data-testid="preaching-city-input"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Curitiba, PR"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                    Data da Ministração *
                  </label>
                  <input
                    data-testid="preaching-date-input"
                    type="date"
                    required
                    value={preachedAt}
                    onChange={(e) => setPreachedAt(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                  Resumo do Impacto Espiritual & Notas
                </label>
                <textarea
                  data-testid="preaching-notes-input"
                  rows={3}
                  value={preachingNotes}
                  onChange={(e) => setPreachingNotes(e.target.value)}
                  placeholder="Como o Espírito Santo se moveu? Reconciliações, consolações, arrependimento ou impressões marcantes..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-gold resize-none"
                />
              </div>

              <div className="flex items-center gap-2 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
                <input
                  id="mirror-checkbox"
                  data-testid="preaching-mirror-memorial-checkbox"
                  type="checkbox"
                  checked={mirrorToMemorial}
                  onChange={(e) => setMirrorToMemorial(e.target.checked)}
                  className="w-4 h-4 rounded text-gold focus:ring-gold bg-zinc-900 border-zinc-700 cursor-pointer"
                />
                <label htmlFor="mirror-checkbox" className="text-xs text-zinc-300 cursor-pointer select-none">
                  Espelhar resumo no Meu Memorial como Testemunho
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/estudio/${sermon.id}`)}
                  className="text-xs border-zinc-700 text-zinc-400 hover:text-white"
                >
                  Sair sem salvar
                </Button>
                <Button
                  type="submit"
                  data-testid="save-preaching-log-btn"
                  disabled={isSavingLog || !churchName.trim() || !city.trim()}
                  className="bg-gold text-primary-foreground hover:bg-gold/90 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
                >
                  {isSavingLog ? "Salvando..." : "Salvar Registro & Concluir"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
