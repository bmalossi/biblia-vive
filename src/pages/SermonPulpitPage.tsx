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
  Layers,
  Compass,
  Target,
  ScrollText,
  Zap,
  Shield,
  Square,
  Lock,
  Landmark,
  Anchor,
  Sun,
  Moon,
  Coffee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSermon, savePreachingLog, type Sermon } from "@/lib/homileticClient";
import { fetchChapter, type Chapter } from "@/lib/bibleApi";
import { createNoteStore } from "@/lib/noteStore";
import { supabase } from "@/lib/supabase";
import { getTheme, setTheme as setGlobalTheme, type Theme } from "@/lib/themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Parser para intervalo de versículos
function parseVerseRange(
  verseStr: string | number | null | undefined
): { start: number; end: number } | null {
  if (verseStr === null || verseStr === undefined || verseStr === "") return null;
  const str = String(verseStr).trim();
  const matchRange = str.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
  if (matchRange) {
    const start = parseInt(matchRange[1], 10);
    const end = parseInt(matchRange[2], 10);
    return { start: Math.min(start, end), end: Math.max(start, end) };
  }
  const matchSingle = str.match(/^(\d+)/);
  if (matchSingle) {
    const v = parseInt(matchSingle[1], 10);
    return { start: v, end: v };
  }
  return null;
}

// Renderizador com realce de marcadores de dinâmica vocal e retórica de alto impacto visual no altar
export function renderWithDynamicMarkers(text: string | undefined): React.ReactNode {
  if (!text) return null;

  // Quebra por marcadores conhecidos com suporte a variações de emoji, caixa e espaços
  const parts = text.split(
    /(\[\s*(?:💡\s*)?(?:Ilustração|ILUSTRAÇÃO)(?:[^\]]*)\]|\[\s*(?:🤫\s*)?(?:Pausa|PAUSA|Pausa Silenciosa|PAUSA SILENCIOSA)(?:[^\]]*)\]|\[\s*(?:⚡\s*)?(?:Tom de Voz \/ Apelo|Tom\/Apelo|Tom de Voz|TOM DE VOZ|Elevar o Tom|ELEVAR O TOM|Elevar o Tom de Voz|ELEVAR O TOM DE VOZ|Apelo|APELO)(?:[^\]]*)\])/gi
  );

  return parts.map((part, index) => {
    const lower = part.toLowerCase();

    // 💡 Ilustração (Tom Amarelo / Âmbar chamativo)
    if (lower.includes("ilustra")) {
      const label = part.replace(/[\[\]]/g, "").trim();
      return (
        <span
          key={index}
          data-testid="dynamic-chip-ilustracao"
          className="inline-flex items-center gap-1.5 font-mono text-[0.72rem] bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-lg mx-1 font-bold select-none shadow-xs align-baseline break-words [overflow-wrap:anywhere]"
        >
          <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400 shrink-0" />
          <span>{label}</span>
        </span>
      );
    }

    // 🤫 Pausa Silenciosa (Tom Azul / Suave calmante)
    if (lower.includes("pausa")) {
      const label = part.replace(/[\[\]]/g, "").trim();
      return (
        <span
          key={index}
          data-testid="dynamic-chip-pausa"
          className="inline-flex items-center gap-1.5 font-mono text-[0.72rem] bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/40 px-2.5 py-0.5 rounded-lg mx-1 font-bold select-none shadow-xs align-baseline break-words [overflow-wrap:anywhere]"
        >
          <Pause className="w-3 h-3 text-sky-500 dark:text-sky-400 shrink-0" />
          <span>{label}</span>
        </span>
      );
    }

    // ⚡ Elevar o Tom / Apelo (Tom Dourado Vibrante)
    if (lower.includes("tom") || lower.includes("apelo")) {
      const label = part.replace(/[\[\]]/g, "").trim();
      return (
        <span
          key={index}
          data-testid="dynamic-chip-apelo"
          className="inline-flex items-center gap-1.5 font-mono text-[0.72rem] bg-gold/20 text-gold border border-gold/50 px-2.5 py-0.5 rounded-lg mx-1 font-bold select-none shadow-xs align-baseline break-words [overflow-wrap:anywhere]"
        >
          <Zap className="w-3 h-3 text-gold shrink-0" />
          <span>{label}</span>
        </span>
      );
    }

    return <span key={index} className="break-words [overflow-wrap:anywhere]">{part}</span>;
  });
}

// Formatador de blocos para eliminar texto monolítico, evitar overflow e garantir escaneabilidade a 60cm
export function renderPreachingContent(text: string | undefined): React.ReactNode {
  if (!text) return null;
  const rawLines = text.split("\n").filter((l) => l.trim().length > 0);

  // Se for apenas uma linha contínua muito longa, quebra por frases para não virar bloco monolítico
  if (rawLines.length === 1 && rawLines[0].length > 180) {
    const sentences = rawLines[0].split(/(?<=[.!?])\s+/);
    if (sentences.length > 1) {
      return (
        <div className="space-y-3.5 min-w-0 w-full">
          {sentences.map((sentence, idx) => (
            <div key={idx} className="flex items-start gap-3 leading-[1.85] min-w-0 w-full">
              <span className="w-2 h-2 rounded-full bg-gold shrink-0 mt-3 select-none" />
              <div className="flex-1 min-w-0 break-words [overflow-wrap:anywhere] text-app-text">
                {renderWithDynamicMarkers(sentence)}
              </div>
            </div>
          ))}
        </div>
      );
    }
  }

  return (
    <div className="space-y-3.5 min-w-0 w-full">
      {rawLines.map((line, idx) => {
        const trimmed = line.trim();
        const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*");
        const cleanText = isBullet ? trimmed.replace(/^[\s•\-*]+/, "") : trimmed;
        return (
          <div key={idx} className="flex items-start gap-3 leading-[1.85] min-w-0 w-full">
            <span className="w-2 h-2 rounded-full bg-gold shrink-0 mt-3 select-none" />
            <div className="flex-1 min-w-0 break-words [overflow-wrap:anywhere] text-app-text">
              {renderWithDynamicMarkers(cleanText)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SermonPulpitPage() {
  const { sermonId } = useParams<{ sermonId: string }>();
  const navigate = useNavigate();

  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [loading, setLoading] = useState(true);

  // Modo de Cor da Página (White / Sépia / Dark)
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => getTheme());

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<Theme>;
      setCurrentTheme(customEvent.detail || getTheme());
    };
    window.addEventListener("bv-theme-change", handleThemeChange);
    return () => window.removeEventListener("bv-theme-change", handleThemeChange);
  }, []);

  const handleSelectTheme = (theme: Theme) => {
    setGlobalTheme(theme);
    setCurrentTheme(theme);
  };

  // Tipografia para leitura a 60cm de distância (18px-20px padrão no altar)
  const [fontSizeIndex, setFontSizeIndex] = useState(1); // 0: 18px, 1: 20px (padrão altar), 2: 22px, 3: 24px
  const fontSizes = [
    "text-[18px] leading-[1.8]",
    "text-[20px] leading-[1.85]",
    "text-[22px] leading-[1.9]",
    "text-[24px] leading-[2.0]",
  ];

  // Modo Altar (oculta menus secundários e evita toques acidentais no púlpito)
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

  // Versículos da Passagem Bíblica Base no Corpo do Pergaminho
  const [passageVerses, setPassageVerses] = useState<Array<{ number: number; text: string }>>([]);
  const [isScriptureExpanded, setIsScriptureExpanded] = useState(true);
  const [isLoadingPassage, setIsLoadingPassage] = useState(false);

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

  // Carregar Sermão
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

  // Carregar Texto Bíblico Base para o Card do Topo do Pergaminho
  useEffect(() => {
    const book = sermon?.bookName || sermon?.bookId;
    const chapter = sermon?.chapter;
    if (!book || !chapter) {
      setPassageVerses([]);
      return;
    }

    let isMounted = true;
    setIsLoadingPassage(true);

    Promise.resolve(fetchChapter?.(sermon.version || "acf", book, String(chapter)))
      .then((data) => {
        if (!isMounted || !data) return;
        if (data?.verses && Array.isArray(data.verses)) {
          const range = parseVerseRange(sermon.verse);
          if (range) {
            const filtered = data.verses.filter(
              (v) => v.number >= range.start && v.number <= range.end
            );
            setPassageVerses(filtered.length > 0 ? filtered : data.verses);
          } else {
            setPassageVerses(data.verses);
          }
        }
      })
      .catch((err) => {
        console.warn("[ModoPulpito] Erro ao buscar texto bíblico base:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingPassage(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sermon?.bookName, sermon?.bookId, sermon?.chapter, sermon?.verse, sermon?.version]);

  // Carregar Texto Bíblico para o Card Flutuante Secundário
  const handleOpenScripture = async () => {
    setIsScriptureOpen(true);
    if (chapterData || !sermon?.bookName || !sermon?.chapter) return;

    setLoadingScripture(true);
    try {
      const data = await fetchChapter(
        sermon.version || "acf",
        sermon.bookId || sermon.bookName || "rom",
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
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col font-serif selection:bg-gold/30 selection:text-gold antialiased relative transition-colors duration-200">
      {/* Luz ambiente sagrada e sutil ao fundo */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden select-none z-0">
        <div className="absolute -top-32 -right-32 w-[620px] h-[620px] bg-[radial-gradient(circle,rgba(229,184,105,0.06)_0%,transparent_70%)] blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -left-32 w-[520px] h-[520px] bg-[radial-gradient(circle,rgba(229,184,105,0.03)_0%,transparent_70%)] blur-3xl pointer-events-none" />
      </div>

      {/* ── BARRA FIXA SUPERIOR DO ALTAR (Clean, Despoluída, Padrão Altar) ── */}
      <header
        data-testid="pulpit-header"
        className="sticky top-0 z-40 bg-app-surface/95 dark:bg-[#120f0c]/95 backdrop-blur-md border-b border-border/80 dark:border-gold/30 px-3 sm:px-6 py-2.5 transition-all shadow-md select-none"
      >
        <div className="max-w-5xl 2xl:max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          {/* Lado Esquerdo: 📖 LUCAS 10:15 | 04:59 | 💡 TELA ATIVA */}
          <div className="flex items-center gap-2 sm:gap-3.5 flex-wrap text-xs sm:text-sm font-mono">
            {hasPassage ? (
              <button
                type="button"
                data-testid="scripture-pill-main"
                onClick={handleOpenScripture}
                className="flex items-center gap-1.5 font-bold text-gold hover:text-gold/80 transition-colors cursor-pointer"
                title="Abrir versículo bíblico no card flutuante"
              >
                <BookOpen className="w-4 h-4 text-gold shrink-0" />
                <span className="uppercase tracking-wide">
                  {sermon.bookName} {sermon.chapter}
                  {sermon.verse ? `:${sermon.verse}` : ""}
                </span>
              </button>
            ) : (
              <span className="flex items-center gap-1.5 font-bold text-gold">
                <BookOpen className="w-4 h-4 text-gold shrink-0" />
                <span>PÚLPITO</span>
              </span>
            )}

            <span className="text-gold/30 font-light select-none">|</span>

            {/* Cronômetro */}
            <div
              data-testid="pulpit-stopwatch"
              className="flex items-center gap-1.5 text-app-text font-bold"
            >
              <Clock className="w-3.5 h-3.5 text-gold shrink-0" />
              <span>{formattedTimer}</span>
            </div>

            <span className="text-gold/30 font-light select-none">|</span>

            {/* Trava de Tela (Screen Wake Lock) */}
            <button
              type="button"
              data-testid="wake-lock-status-indicator"
              onClick={requestWakeLock}
              title={
                isWakeLockActive
                  ? "Trava de Tela ativa: o display não apagará durante a pregação"
                  : "Toque para ativar Trava de Tela"
              }
              className="flex items-center gap-1.5 text-xs transition-colors cursor-pointer select-none"
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  isWakeLockActive
                    ? "bg-emerald-500 animate-pulse shadow-xs shadow-emerald-500/50"
                    : "bg-app-text-muted/50"
                )}
              />
              <span className={cn("font-semibold", isWakeLockActive ? "text-emerald-600 dark:text-emerald-400" : "text-app-text-muted")}>
                {isWakeLockActive ? "TELA ATIVA" : "TRAVAR TELA"}
              </span>
            </button>
          </div>

          {/* Lado Direito: Seletor de Tema + Modo Altar + Ajuste Fonte + [ ✕ SAIR ] */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Seletor de Modo: White / Sépia / Dark */}
            <div
              data-testid="theme-selector-group"
              className="flex items-center bg-app-raised/80 dark:bg-black/40 border border-border/80 dark:border-gold/25 rounded-xl p-0.5 shadow-xs"
            >
              <button
                type="button"
                onClick={() => handleSelectTheme("light")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1 cursor-pointer",
                  currentTheme === "light"
                    ? "bg-white text-stone-900 shadow-xs border border-stone-300 font-bold"
                    : "text-app-text-muted hover:text-app-text"
                )}
                title="Modo White (Fundo Claro)"
              >
                <Sun className="w-3 h-3 text-amber-500" />
                <span className="hidden sm:inline text-[0.68rem]">White</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTheme("sepia")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1 cursor-pointer",
                  currentTheme === "sepia"
                    ? "bg-[#d8c39e] text-[#2c1d11] shadow-xs border border-[#b89f70] font-bold"
                    : "text-app-text-muted hover:text-app-text"
                )}
                title="Modo Sépia (Pergaminho Suave)"
              >
                <Coffee className="w-3 h-3 text-[#8c6b38]" />
                <span className="hidden sm:inline text-[0.68rem]">Sépia</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTheme("dark")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1 cursor-pointer",
                  currentTheme === "dark"
                    ? "bg-[#251e17] text-gold shadow-xs border border-gold/40 font-bold"
                    : "text-app-text-muted hover:text-app-text"
                )}
                title="Modo Dark (Altar Noturno)"
              >
                <Moon className="w-3 h-3 text-gold" />
                <span className="hidden sm:inline text-[0.68rem]">Dark</span>
              </button>
            </div>

            {/* Modo Altar */}
            {!isAltarMode ? (
              <Button
                type="button"
                data-testid="enter-altar-mode-btn"
                onClick={handleEnterAltarMode}
                className="bg-gold text-[#1a1208] hover:bg-gold/90 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                title="Ativar Modo Altar contra toques acidentais"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Modo Altar</span>
              </Button>
            ) : (
              <Button
                type="button"
                data-testid="exit-altar-mode-btn"
                onClick={handleExitAltarMode}
                variant="outline"
                size="sm"
                className="text-xs border-gold/40 bg-gold/10 text-gold hover:bg-gold/20 rounded-xl px-2.5 h-8 flex items-center gap-1.5 cursor-pointer"
                title="Desbloquear menus"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desbloquear</span>
              </Button>
            )}

            {/* Ajuste de Fonte (A- / A+) */}
            {!isAltarMode && (
              <div className="hidden lg:flex items-center bg-app-raised/80 dark:bg-black/40 border border-border/80 dark:border-gold/20 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setFontSizeIndex((prev) => Math.max(0, prev - 1))}
                  disabled={fontSizeIndex === 0}
                  className="px-2 py-0.5 text-xs text-app-text-muted hover:text-gold disabled:opacity-30 cursor-pointer font-mono font-bold"
                  title="Diminuir texto"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setFontSizeIndex((prev) => Math.min(fontSizes.length - 1, prev + 1))}
                  disabled={fontSizeIndex === fontSizes.length - 1}
                  className="px-2 py-0.5 text-xs text-app-text-muted hover:text-gold disabled:opacity-30 cursor-pointer font-mono font-bold"
                  title="Aumentar texto"
                >
                  A+
                </button>
              </div>
            )}

            {/* Botão [ ✕ SAIR ] */}
            <Button
              data-testid="finish-preaching-btn"
              onClick={() => setIsPreachingModalOpen(true)}
              variant="outline"
              size="sm"
              className="text-xs border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-300 hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-200 rounded-xl px-3 h-8 flex items-center gap-1.5 cursor-pointer shadow-xs font-mono font-bold"
              title="Encerrar ministração"
            >
              <X className="w-3.5 h-3.5" />
              <span>SAIR</span>
            </Button>
          </div>
        </div>

        {/* Pílulas de Navegação (ocultas quando em Modo Altar) */}
        {!isAltarMode && (
          <div className="max-w-5xl 2xl:max-w-6xl mx-auto flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 text-[0.68rem] font-mono no-scrollbar px-2">
            <button
              type="button"
              onClick={() => scrollToSection("sec-spark")}
              className="px-2.5 py-0.5 rounded-lg bg-app-surface dark:bg-black/40 hover:border-gold/40 border border-border/80 dark:border-gold/20 text-gold/90 hover:text-gold whitespace-nowrap transition-colors cursor-pointer"
            >
              0. Eu e Deus
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("sec-intro")}
              className="px-2.5 py-0.5 rounded-lg bg-app-surface dark:bg-black/40 hover:border-gold/40 border border-border/80 dark:border-gold/20 text-gold whitespace-nowrap transition-colors cursor-pointer font-bold"
            >
              Introd.
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("sec-bloco-1")}
              className="px-2.5 py-0.5 rounded-lg bg-app-surface dark:bg-black/40 hover:border-gold/40 border border-border/80 dark:border-gold/20 text-app-text-muted hover:text-app-text whitespace-nowrap transition-colors cursor-pointer"
            >
              1. Exegese
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("sec-bloco-2")}
              className="px-2.5 py-0.5 rounded-lg bg-app-surface dark:bg-black/40 hover:border-gold/40 border border-border/80 dark:border-gold/20 text-app-text-muted hover:text-app-text whitespace-nowrap transition-colors cursor-pointer"
            >
              2. Tópicos
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("sec-bloco-3")}
              className="px-2.5 py-0.5 rounded-lg bg-app-surface dark:bg-black/40 hover:border-gold/40 border border-border/80 dark:border-gold/20 text-app-text-muted hover:text-app-text whitespace-nowrap transition-colors cursor-pointer"
            >
              3. Aplicação
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("sec-desfecho")}
              className="px-2.5 py-0.5 rounded-lg bg-app-surface dark:bg-black/40 hover:border-gold/40 border border-border/80 dark:border-gold/20 text-gold whitespace-nowrap transition-colors cursor-pointer font-semibold"
            >
              4. Desfecho
            </button>
          </div>
        )}
      </header>

      {/* ── CORPO DO PERGAMINHO CONTÍNUO COM CARDS DE ALTO CONTRASTE ── */}
      <main
        data-testid="pulpit-main-content"
        className={cn(
          "max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1 antialiased relative z-10 min-w-0 overflow-x-hidden",
          fontSizes[fontSizeIndex]
        )}
      >
        {/* Banner do Modo Altar Ativo (se ativado) */}
        {isAltarMode && (
          <div
            data-testid="altar-mode-banner"
            className="flex items-center justify-between bg-gold/15 border border-gold/40 px-5 py-3 rounded-2xl text-xs font-mono text-gold select-none shadow-md animate-in fade-in duration-200"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-gold shrink-0 animate-pulse" />
              <span className="font-semibold text-xs sm:text-sm">Modo Altar Ativo: Menus ocultos contra toques acidentais</span>
            </div>
            <button
              type="button"
              onClick={handleExitAltarMode}
              className="text-xs text-gold underline hover:text-gold/80 cursor-pointer font-bold"
            >
              Desbloquear Menus
            </button>
          </div>
        )}

        {/* ── TOPO DO PERGAMINHO: TÍTULO & TEMA CENTRALIZADOS ── */}
        <div id="sec-spark" className="text-center space-y-3 pt-2 pb-2 min-w-0">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-app-text tracking-tight uppercase min-w-0 break-words [overflow-wrap:anywhere]">
            {sermon.title}
          </h1>
          {sermon.sparkText && (
            <div className="max-w-2xl mx-auto bg-app-surface/60 dark:bg-black/20 border border-gold/20 rounded-2xl p-3.5 shadow-xs">
              <p className="font-serif italic text-gold text-lg sm:text-xl md:text-2xl leading-relaxed min-w-0 break-words [overflow-wrap:anywhere]">
                &ldquo;{sermon.sparkText}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* ── CARD DE LEITURA BÍBLICA BASE (EXPANSÍVEL / VISÍVEL) ── */}
        {hasPassage && (
          <section
            data-testid="pulpit-base-scripture-section"
            className="bg-app-surface/90 border border-gold/30 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4 overflow-hidden min-w-0"
          >
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-border/60 dark:border-gold/20">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-gold">
                <BookOpen className="w-4 h-4 text-gold shrink-0" />
                <span>
                  TEXTO BÍBLICO BASE: {sermon.bookName} {sermon.chapter}
                  {sermon.verse ? `:${sermon.verse}` : ""}
                  <span className="text-app-text-muted font-normal text-xs ml-1.5 uppercase">
                    ({sermon.version || "acf"})
                  </span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsScriptureExpanded((prev) => !prev)}
                className="text-[0.75rem] font-mono text-gold hover:text-gold/80 transition-colors flex items-center gap-1 cursor-pointer select-none font-semibold px-2.5 py-1 rounded-xl bg-gold/10 hover:bg-gold/15 border border-gold/30"
              >
                <span>{isScriptureExpanded ? "[ Ocultar Texto ]" : "[ Toque p/ expandir ]"}</span>
                {isScriptureExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {isScriptureExpanded && (
              <div className="bg-app-raised/40 dark:bg-black/25 rounded-2xl p-4 sm:p-6 border border-border/50 dark:border-gold/15 text-app-text font-serif italic text-lg sm:text-xl leading-[1.85] space-y-3 min-w-0 break-words [overflow-wrap:anywhere] transition-all">
                {isLoadingPassage ? (
                  <p className="text-xs font-mono text-app-text-muted animate-pulse">Carregando versículos sagrados...</p>
                ) : passageVerses.length > 0 ? (
                  passageVerses.map((v) => (
                    <p key={v.number} className="text-app-text min-w-0 break-words [overflow-wrap:anywhere]">
                      <sup className="text-gold font-mono font-bold mr-2 not-italic text-sm">{v.number}</sup>
                      {v.text}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-app-text-muted not-italic">
                    {sermon.bookName} {sermon.chapter}{sermon.verse ? `:${sermon.verse}` : ""}.
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* ── 1. INTRODUÇÃO (GANCHO DE ENTRADA) ── */}
        <section
          id="sec-intro"
          className="bg-app-surface/90 border border-border/80 dark:border-gold/25 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 overflow-hidden min-w-0"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border/60 dark:border-gold/20">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-mono text-xs uppercase font-bold tracking-wider">
              <Flame className="w-3.5 h-3.5" />
              <span>🔥 INTRODUÇÃO</span>
            </span>
            <span className="text-[0.68rem] font-mono text-app-text-muted font-medium">Início da Ministração</span>
          </div>
          <div className="bg-app-raised/40 dark:bg-black/25 rounded-2xl p-4 sm:p-6 border border-border/50 dark:border-gold/15 text-app-text font-serif leading-[1.85] min-w-0 break-words [overflow-wrap:anywhere]">
            {renderPreachingContent(sermon.introducao || "Nenhuma introdução redigida ainda.")}
          </div>
        </section>

        {/* ── 2. EXEGESE & CONTEXTO HISTÓRICO ── */}
        <section
          id="sec-bloco-1"
          className="bg-app-surface/90 border border-border/80 dark:border-gold/25 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 overflow-hidden min-w-0"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border/60 dark:border-gold/20">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-gold/10 text-gold border border-gold/30 font-mono text-xs uppercase font-bold tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>🏛️ EXEGESE & CONTEXTO HISTÓRICO</span>
            </span>
            <span className="text-[0.68rem] font-mono text-app-text-muted font-medium">Fundamento Bíblico</span>
          </div>

          {sermon.bloco1IntencaoOriginal && (
            <div className="bg-gold/10 dark:bg-gold/10 border-l-4 border-l-gold border border-gold/30 p-4 sm:p-5 rounded-2xl text-lg sm:text-xl text-app-text font-serif italic leading-[1.85] min-w-0 break-words [overflow-wrap:anywhere]">
              <span className="font-mono text-xs text-gold font-bold uppercase tracking-wider block not-italic mb-1">
                • Intenção do Autor / Ideia Central:
              </span>
              &ldquo;{sermon.bloco1IntencaoOriginal}&rdquo;
            </div>
          )}

          {sermon.bloco1Exegese && (
            <div className="bg-app-raised/40 dark:bg-black/25 rounded-2xl p-4 sm:p-6 border border-border/50 dark:border-gold/15 text-app-text font-serif leading-[1.85] min-w-0 break-words [overflow-wrap:anywhere]">
              {renderPreachingContent(sermon.bloco1Exegese)}
            </div>
          )}
        </section>

        {/* ── 3. TÓPICOS PRINCIPAIS (COM OS 4 DEGRAUS) ── */}
        <section
          id="sec-bloco-2"
          className="bg-app-surface/90 border border-border/80 dark:border-gold/25 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 overflow-hidden min-w-0"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border/60 dark:border-gold/20">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-gold/15 text-gold border border-gold/30 font-mono text-xs uppercase font-bold tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ TÓPICOS PRINCIPAIS (COM OS 4 DEGRAUS)</span>
            </span>
            <span className="text-[0.68rem] font-mono text-app-text-muted font-medium">Corpo do Sermão</span>
          </div>

          {sermon.bloco2Topicos && sermon.bloco2Topicos.length > 0 ? (
            sermon.bloco2Topicos.map((top, idx) => (
              <div
                key={top.id || idx}
                className="bg-app-raised/50 dark:bg-black/30 border border-border/60 dark:border-gold/20 rounded-2xl p-5 sm:p-6 space-y-4 overflow-hidden min-w-0"
              >
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-app-text uppercase tracking-wide min-w-0 break-words [overflow-wrap:anywhere]">
                  <span className="text-gold font-mono mr-2">{idx + 1}.</span>
                  {top.title}
                </h3>

                <div className="space-y-3.5 text-app-text font-serif leading-[1.85] min-w-0">
                  {top.steps?.stepA_fato && (
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        data-testid={`badge-degrau-a-${idx}`}
                        className="shrink-0 mt-1 inline-flex items-center text-[0.72rem] font-mono font-bold uppercase tracking-wider text-gold bg-gold/15 border border-gold/30 px-2.5 py-0.5 rounded-lg select-none shadow-xs"
                      >
                        [A · Fato]
                      </span>
                      <div className="flex-1 min-w-0 break-words [overflow-wrap:anywhere]">
                        {renderWithDynamicMarkers(top.steps.stepA_fato)}
                      </div>
                    </div>
                  )}

                  {top.steps?.stepB_porque && (
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        data-testid={`badge-degrau-b-${idx}`}
                        className="shrink-0 mt-1 inline-flex items-center text-[0.72rem] font-mono font-bold uppercase tracking-wider text-gold bg-gold/15 border border-gold/30 px-2.5 py-0.5 rounded-lg select-none shadow-xs"
                      >
                        [B · Porquê]
                      </span>
                      <div className="flex-1 min-w-0 break-words [overflow-wrap:anywhere]">
                        {renderWithDynamicMarkers(top.steps.stepB_porque)}
                      </div>
                    </div>
                  )}

                  {top.steps?.stepC_contraste && (
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        data-testid={`badge-degrau-c-${idx}`}
                        className="shrink-0 mt-1 inline-flex items-center text-[0.72rem] font-mono font-bold uppercase tracking-wider text-gold bg-gold/15 border border-gold/30 px-2.5 py-0.5 rounded-lg select-none shadow-xs"
                      >
                        [C · Contraste]
                      </span>
                      <div className="flex-1 min-w-0 break-words [overflow-wrap:anywhere]">
                        {renderWithDynamicMarkers(top.steps.stepC_contraste)}
                      </div>
                    </div>
                  )}

                  {top.steps?.stepD_tensao && (
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        data-testid={`badge-degrau-d-${idx}`}
                        className="shrink-0 mt-1 inline-flex items-center text-[0.72rem] font-mono font-bold uppercase tracking-wider text-gold bg-gold/15 border border-gold/30 px-2.5 py-0.5 rounded-lg select-none shadow-xs"
                      >
                        [D · Tensão]
                      </span>
                      <div className="flex-1 min-w-0 break-words [overflow-wrap:anywhere] text-gold italic">
                        {renderWithDynamicMarkers(top.steps.stepD_tensao)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-app-text-muted italic">Sem tópicos definidos no esboço.</p>
          )}
        </section>

        {/* ── 4. APLICAÇÃO PRÁTICA ── */}
        <section
          id="sec-bloco-3"
          className="bg-app-surface/90 border border-border/80 dark:border-gold/25 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 overflow-hidden min-w-0"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border/60 dark:border-gold/20">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-mono text-xs uppercase font-bold tracking-wider">
              <Target className="w-3.5 h-3.5" />
              <span>🎯 APLICAÇÃO PRÁTICA (CONEXÃO COM A VIDA)</span>
            </span>
            <span className="text-[0.68rem] font-mono text-app-text-muted font-medium">Segunda-feira</span>
          </div>
          <div className="bg-app-raised/40 dark:bg-black/25 rounded-2xl p-4 sm:p-6 border border-border/50 dark:border-gold/15 text-app-text font-serif leading-[1.85] min-w-0 break-words [overflow-wrap:anywhere]">
            {renderPreachingContent(sermon.bloco3Aplicacao || "Nenhuma aplicação redigida ainda.")}
          </div>
        </section>

        {/* ── 5. DESFECHO & APELO FINAL (SEM TEXTO MONOLÍTICO E COM QUEBRA DE LINHA) ── */}
        <section
          id="sec-desfecho"
          className="bg-gold/10 dark:bg-gold/[0.08] border-2 border-gold/50 rounded-3xl p-6 sm:p-8 shadow-md space-y-4 overflow-hidden min-w-0"
        >
          <div className="flex items-center justify-between pb-3 border-b border-gold/30">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-xl bg-gold/20 text-gold border border-gold/50 font-mono text-xs uppercase font-bold tracking-wider shadow-xs">
              <Flame className="w-3.5 h-3.5" />
              <span>🏁 DESFECHO & APELO ({sermon.desfechoTipo || "Conclusão"})</span>
            </span>
            <span className="text-[0.68rem] font-mono text-gold font-bold uppercase tracking-wider">
              MOMENTO FINAL
            </span>
          </div>
          <div className="bg-app-surface dark:bg-black/35 rounded-2xl p-5 sm:p-7 border border-gold/40 text-app-text font-serif font-semibold text-xl sm:text-2xl leading-[1.85] min-w-0 break-words [overflow-wrap:anywhere]">
            {renderPreachingContent(sermon.desfechoTexto || "Conclusão da mensagem.")}
          </div>
        </section>

        {/* ── ENCERRAMENTO DA PREGAÇÃO ── */}
        <div className="pt-6 pb-16 flex justify-center">
          <Button
            type="button"
            onClick={() => setIsPreachingModalOpen(true)}
            className="bg-gold text-[#1a1208] hover:bg-gold/90 text-sm font-bold px-8 py-3.5 rounded-2xl flex items-center gap-2.5 shadow-xl active:scale-95 cursor-pointer font-sans"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Encerrar Pregação & Registrar</span>
          </Button>
        </div>
      </main>

      {/* ── CARD FLUTUANTE DE TEXTO BÍBLICO (Acionado pelo Header se necessário) ── */}
      {isScriptureOpen && (
        <div
          data-testid="biblical-text-floating-card"
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[480px] max-h-[70vh] z-50 bg-app-surface/95 dark:bg-[#14100c]/95 backdrop-blur-md border border-gold/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header do Card */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/80 dark:border-gold/30 bg-app-raised/80 dark:bg-black/40">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gold" />
              <span className="font-mono text-xs font-bold text-app-text">
                {sermon.bookName} {sermon.chapter}
                {sermon.verse ? `:${sermon.verse}` : ""}
              </span>
              <span className="text-[0.65rem] font-mono text-app-text-muted uppercase">
                ({sermon.version || "acf"})
              </span>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsScriptureOpen(false)}
              aria-label="Fechar Passagem"
              className="text-app-text-muted hover:text-app-text p-1 h-auto cursor-pointer"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Versículos */}
          <div className="p-4 overflow-y-auto space-y-2 text-sm leading-relaxed text-app-text font-serif">
            {loadingScripture ? (
              <div className="py-6 text-center text-xs text-app-text-muted flex items-center justify-center gap-2">
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
                      "py-1 px-2 rounded-lg transition-colors",
                      isSelectedVerse && "bg-gold/15 text-gold font-semibold border border-gold/30"
                    )}
                  >
                    <sup className="text-gold text-[0.68rem] font-mono mr-1.5 font-bold">{v.number}</sup>
                    {v.text}
                  </p>
                );
              })
            ) : (
              <p className="text-xs text-app-text-muted">Passagem bíblica não carregada.</p>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL SOLENE DE REGISTRO PÓS-PREGAÇÃO ── */}
      {isPreachingModalOpen && (
        <div
          data-testid="preaching-log-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-app-surface dark:bg-[#16120d] border border-gold/40 w-full max-w-lg rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5 text-app-text font-sans">
            <div className="flex items-center justify-between border-b border-border/80 dark:border-gold/30 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
                  <Landmark className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-app-text">
                    Registro Pós-Pregação
                  </h3>
                  <p className="text-xs text-app-text-muted">
                    Guarde o testemunho da ministração no Cloudflare D1
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreachingModalOpen(false)}
                className="text-app-text-muted hover:text-app-text p-1 h-auto cursor-pointer"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSavePreaching} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-app-text-muted mb-1 font-semibold">
                  Nome da Igreja / Comunidade *
                </label>
                <input
                  data-testid="preaching-church-input"
                  type="text"
                  required
                  value={churchName}
                  onChange={(e) => setChurchName(e.target.value)}
                  placeholder="Ex: Igreja Batista Esperança, Comunidade da Graça..."
                  className="w-full bg-app-raised/60 dark:bg-black/40 border border-border/80 dark:border-gold/25 rounded-xl px-3.5 py-2.5 text-sm text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/60 focus:border-gold transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-app-text-muted mb-1 font-semibold">
                    Cidade *
                  </label>
                  <input
                    data-testid="preaching-city-input"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Curitiba, PR"
                    className="w-full bg-app-raised/60 dark:bg-black/40 border border-border/80 dark:border-gold/25 rounded-xl px-3.5 py-2.5 text-sm text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/60 focus:border-gold transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-app-text-muted mb-1 font-semibold">
                    Data da Ministração *
                  </label>
                  <input
                    data-testid="preaching-date-input"
                    type="date"
                    required
                    value={preachedAt}
                    onChange={(e) => setPreachedAt(e.target.value)}
                    className="w-full bg-app-raised/60 dark:bg-black/40 border border-border/80 dark:border-gold/25 rounded-xl px-3.5 py-2.5 text-sm text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/60 focus:border-gold transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-app-text-muted mb-1 font-semibold">
                  Resumo do Impacto Espiritual & Notas
                </label>
                <textarea
                  data-testid="preaching-notes-input"
                  rows={3}
                  value={preachingNotes}
                  onChange={(e) => setPreachingNotes(e.target.value)}
                  placeholder="Como o Espírito Santo se moveu? Reconciliações, consolações, arrependimento ou impressões marcantes..."
                  className="w-full bg-app-raised/60 dark:bg-black/40 border border-border/80 dark:border-gold/25 rounded-xl px-3.5 py-2.5 text-sm text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/60 focus:border-gold resize-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 bg-app-raised/40 dark:bg-black/40 p-3.5 rounded-xl border border-border/80 dark:border-gold/25">
                <input
                  id="mirror-checkbox"
                  data-testid="preaching-mirror-memorial-checkbox"
                  type="checkbox"
                  checked={mirrorToMemorial}
                  onChange={(e) => setMirrorToMemorial(e.target.checked)}
                  className="w-4 h-4 rounded text-gold focus:ring-gold bg-app-surface border-border cursor-pointer accent-gold"
                />
                <label htmlFor="mirror-checkbox" className="text-xs text-app-text cursor-pointer select-none">
                  Espelhar resumo no Meu Memorial como Testemunho
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/estudio/${sermon.id}`)}
                  className="text-xs border-border/80 dark:border-gold/30 bg-app-surface dark:bg-black/40 text-app-text-muted hover:text-app-text rounded-xl px-4 py-2 cursor-pointer"
                >
                  Sair sem salvar
                </Button>
                <Button
                  type="submit"
                  data-testid="save-preaching-log-btn"
                  disabled={isSavingLog || !churchName.trim() || !city.trim()}
                  className="bg-gold text-primary-foreground hover:bg-gold/90 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer shadow-md"
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
