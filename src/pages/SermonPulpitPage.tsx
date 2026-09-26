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
          className="inline-flex items-center gap-1 font-mono text-[0.72rem] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md mx-1 font-semibold select-none shadow-xs"
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
          className="inline-flex items-center gap-1 font-mono text-[0.72rem] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-md mx-1 font-semibold select-none shadow-xs"
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
          className="inline-flex items-center gap-1 font-mono text-[0.72rem] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-md mx-1 font-semibold select-none shadow-xs"
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

  // Tamanho de Fonte para leitura a um braço de distância
  const [fontSizeIndex, setFontSizeIndex] = useState(1); // 0: normal, 1: grande, 2: extragrande
  const fontSizes = ["text-base sm:text-lg", "text-lg sm:text-xl", "text-xl sm:text-2xl"];

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

  // 1. Screen Wake Lock API
  useEffect(() => {
    let sentinel: any = null;

    if ("wakeLock" in navigator && (navigator as any).wakeLock) {
      (navigator as any).wakeLock
        .request("screen")
        .then((lock: any) => {
          sentinel = lock;
        })
        .catch((err: any) => {
          console.warn("[ModoPulpito] Screen Wake Lock falhou ou não permitido:", err);
        });
    }

    return () => {
      if (sentinel && typeof sentinel.release === "function") {
        try {
          const res = sentinel.release();
          if (res && typeof res.catch === "function") {
            res.catch(() => {});
          }
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // 2. Cronômetro contínuo
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
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <Flame className="w-8 h-8 text-gold animate-pulse" />
      </div>
    );
  }

  if (!sermon) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <p className="text-sm text-zinc-400">Sermão não encontrado.</p>
          <Button onClick={() => navigate("/memorial")} variant="outline">
            Voltar ao Memorial
          </Button>
        </div>
      </div>
    );
  }

  const hasPassage = Boolean(sermon.bookName && sermon.chapter);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-serif selection:bg-gold/30 selection:text-gold-light antialiased">
      {/* ── HEADER DO PÚLPITO (Zero distrações de site) ────────────────────────── */}
      <header
        data-testid="pulpit-header"
        className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 px-4 py-2.5 transition-all shadow-md"
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Lado Esquerdo: Título & Pílula da Escritura */}
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-zinc-100 truncate max-w-[160px] sm:max-w-xs md:max-w-sm">
              {sermon.title}
            </h1>

            {hasPassage && (
              <button
                type="button"
                data-testid="scripture-pill-main"
                onClick={handleOpenScripture}
                className="inline-flex items-center gap-1 text-[0.72rem] font-mono text-gold bg-gold/15 border border-gold/30 hover:bg-gold/25 px-2.5 py-0.5 rounded-full transition-colors shrink-0 shadow-xs"
                title="Abrir passagem bíblica no card flutuante"
              >
                <BookOpen className="w-3 h-3" />
                <span>
                  {sermon.bookName} {sermon.chapter}
                  {sermon.verse ? `:${sermon.verse}` : ""}
                </span>
              </button>
            )}
          </div>

          {/* Lado Direito: Cronômetro, Controles de Leitura e Encerramento */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Cronômetro */}
            <div
              data-testid="pulpit-stopwatch"
              className="flex items-center gap-1.5 font-mono text-xs sm:text-sm text-gold bg-zinc-800/80 border border-zinc-700/60 px-2.5 py-1 rounded-lg"
            >
              <Clock className="w-3.5 h-3.5 text-gold/80" />
              <span>{formattedTimer}</span>
            </div>

            {/* Ajuste de Fonte */}
            <div className="flex items-center bg-zinc-800/80 border border-zinc-700/60 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setFontSizeIndex((prev) => Math.max(0, prev - 1))}
                disabled={fontSizeIndex === 0}
                className="px-2 py-0.5 text-xs text-zinc-300 hover:text-white disabled:opacity-30"
                title="Diminuir texto"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSizeIndex((prev) => Math.min(fontSizes.length - 1, prev + 1))}
                disabled={fontSizeIndex === fontSizes.length - 1}
                className="px-2 py-0.5 text-xs text-zinc-300 hover:text-white disabled:opacity-30"
                title="Aumentar texto"
              >
                A+
              </button>
            </div>

            {/* Botão Sair / Encerrar Pregação */}
            <Button
              data-testid="finish-preaching-btn"
              onClick={() => setIsPreachingModalOpen(true)}
              variant="outline"
              size="sm"
              className="text-xs border-amber-500/40 bg-zinc-800/80 hover:bg-zinc-700 text-amber-300 rounded-lg px-2.5 h-8 flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Encerrar Pregação</span>
            </Button>
          </div>
        </div>

        {/* ── MAPA DO SERMÃO (Pílulas de Smooth Scroll) ─────────────────────────── */}
        <div className="max-w-5xl mx-auto flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 text-[0.68rem] font-mono no-scrollbar">
          <button
            type="button"
            onClick={() => scrollToSection("sec-spark")}
            className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-amber-400 whitespace-nowrap transition-colors"
          >
            0. Eu e Deus
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("sec-intro")}
            className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 whitespace-nowrap transition-colors"
          >
            Introd.
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("sec-bloco-1")}
            className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 whitespace-nowrap transition-colors"
          >
            1. Exegese
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("sec-bloco-2")}
            className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 whitespace-nowrap transition-colors"
          >
            2. Tópicos
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("sec-bloco-3")}
            className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 whitespace-nowrap transition-colors"
          >
            3. Aplicação
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("sec-desfecho")}
            className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-gold whitespace-nowrap transition-colors"
          >
            4. Desfecho
          </button>
        </div>
      </header>

      {/* ── CORPO DO SERMÃO NO PÚLPITO ────────────────────────────────────────── */}
      <main
        className={cn(
          "max-w-3xl mx-auto w-full px-5 sm:px-8 py-8 space-y-12 flex-1 leading-relaxed",
          fontSizes[fontSizeIndex]
        )}
      >
        {/* Seção 0: Eu e Deus */}
        <section id="sec-spark" className="space-y-3 border-l-2 border-amber-500/50 pl-4 py-1">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold block">
            0. Eu e Deus — Chama Inicial
          </span>
          <p className="italic text-zinc-300 leading-relaxed">
            "{sermon.sparkText || "Inspiração capturada em oração."}"
          </p>
        </section>

        {/* Seção: Introdução */}
        {sermon.introducao && (
          <section id="sec-intro" className="space-y-3 border-l-2 border-zinc-700 pl-4 py-1">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-semibold block">
              Introdução (Gancho de Entrada)
            </span>
            <div className="text-zinc-200 leading-relaxed whitespace-pre-line">
              {renderWithDynamicMarkers(sermon.introducao)}
            </div>
          </section>
        )}

        {/* Seção 1: Explicar o Texto */}
        <section id="sec-bloco-1" className="space-y-4 border-l-2 border-zinc-700 pl-4 py-1">
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-semibold block">
            1. Explicar o Texto (Exegese & Contexto)
          </span>

          {sermon.bloco1IntencaoOriginal && (
            <div className="bg-zinc-900 border border-amber-500/30 rounded-xl p-3.5 text-sm sm:text-base text-zinc-300 leading-relaxed italic">
              <span className="font-mono text-xs text-amber-400 font-bold block mb-1 not-italic">
                📜 Intenção Original do Autor:
              </span>
              "{sermon.bloco1IntencaoOriginal}"
            </div>
          )}

          {sermon.bloco1Exegese && (
            <div className="text-zinc-200 leading-relaxed whitespace-pre-line">
              {renderWithDynamicMarkers(sermon.bloco1Exegese)}
            </div>
          )}
        </section>

        {/* Seção 2: Tópicos e Degraus */}
        <section id="sec-bloco-2" className="space-y-8 border-l-2 border-zinc-700 pl-4 py-1">
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-semibold block">
            2. Pregar a Inspiração (Tópicos em Degraus)
          </span>

          {sermon.bloco2Topicos && sermon.bloco2Topicos.length > 0 ? (
            sermon.bloco2Topicos.map((top, idx) => (
              <div key={top.id || idx} className="space-y-3 bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
                <h2 className="font-bold text-lg sm:text-xl text-gold">
                  {idx + 1}. {top.title}
                </h2>

                <div className="space-y-3 pt-2 text-zinc-200">
                  {top.steps?.stepA_fato && (
                    <div>
                      <span className="text-xs font-mono text-zinc-400 block">A. O Fato:</span>
                      <p className="leading-relaxed">{renderWithDynamicMarkers(top.steps.stepA_fato)}</p>
                    </div>
                  )}

                  {top.steps?.stepB_porque && (
                    <div>
                      <span className="text-xs font-mono text-zinc-400 block">B. O Porquê:</span>
                      <p className="leading-relaxed">{renderWithDynamicMarkers(top.steps.stepB_porque)}</p>
                    </div>
                  )}

                  {top.steps?.stepC_contraste && (
                    <div>
                      <span className="text-xs font-mono text-zinc-400 block">C. O Contraste:</span>
                      <p className="leading-relaxed">{renderWithDynamicMarkers(top.steps.stepC_contraste)}</p>
                    </div>
                  )}

                  {top.steps?.stepD_tensao && (
                    <div>
                      <span className="text-xs font-mono text-zinc-400 block">D. Tensão / Gancho:</span>
                      <p className="leading-relaxed">{renderWithDynamicMarkers(top.steps.stepD_tensao)}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-400 italic">Sem tópicos definidos no esboço.</p>
          )}
        </section>

        {/* Seção 3: Aplicar à Vida Real */}
        {sermon.bloco3Aplicacao && (
          <section id="sec-bloco-3" className="space-y-3 border-l-2 border-zinc-700 pl-4 py-1">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-semibold block">
              3. Aplicar à Vida Real (Conexão Prática)
            </span>
            <div className="text-zinc-200 leading-relaxed whitespace-pre-line">
              {renderWithDynamicMarkers(sermon.bloco3Aplicacao)}
            </div>
          </section>
        )}

        {/* Seção 4: Desfecho Homilético */}
        <section id="sec-desfecho" className="space-y-3 border-l-2 border-gold pl-4 py-1 bg-gold/5 p-4 rounded-xl border">
          <span className="text-xs font-mono uppercase tracking-widest text-gold font-semibold block">
            4. Desfecho Homilético & Apelo Final ({sermon.desfechoTipo || "Conclusão"})
          </span>
          <p className="text-zinc-100 font-bold leading-relaxed whitespace-pre-line">
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
