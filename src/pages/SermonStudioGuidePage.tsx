import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Flame,
  CheckCircle2,
  Copy,
  Check,
  Pause,
  Zap,
  GraduationCap,
  Eye,
  Brain,
  Link2,
  Volume2,
  Layers,
  ArrowRight,
  Sun,
  Moon,
  Coffee,
  ScrollText,
  Clock,
  ExternalLink,
  ChevronRight,
  Lightbulb,
  ShieldAlert,
  Compass,
  FileText,
} from "lucide-react";
import { getTheme, setTheme as setGlobalTheme, type Theme } from "@/lib/themes";
import { usePageMeta } from "@/hooks/usePageMeta";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Exemplo completo para cópia rápida
const FULL_PULPIT_TEXT = `====================================================================
📖 LUCAS 24:13-35  |  ⏱️ 00:00  |  💡 TELA ATIVA  |  [ 🏛️ VER PARÂMETROS ]
====================================================================

TEMA: Quando a Frustração Cega os Olhos, mas a Palavra Aquece
DESFECHO: Dobrar joelhos -> Oração de renúncia de expectativas.

--------------------------------------------------------------------
🔥 INTRODUÇÃO (GANCHO DE ENTRADA)
"Você já esteve em um lugar onde fez tudo certo, mas deu errado?..."
--------------------------------------------------------------------

🏛️ BLOCO 1: EXEGESE & CONTEXTO HISTÓRICO
• Ancoradouro: Mostrar a Teófilo e crentes que Cristo é o cumprimento profético.
• Contexto: Emaús (11 km) = Fuga e desistência. Olhos impedidos pela dor.

--------------------------------------------------------------------
📖 BLOCO 2: PREGAR A INSPIRAÇÃO

TÓPICO 1: A FRUSTRAÇÃO CEGA A VISÃO DO SAGRADO
• [A: Fato] Caminhavam com Cristo sem O reconhecer (v.15-16).
• [B: Porquê] Presos à expectativa de um Messias político (v.21).
• [C: Contraste] [ 🤫 PAUSA 3S ] A dor não afasta Deus, afasta sua visão.
• [D: Tensão] -> O que Jesus faz quando nos vê cegos?

TÓPICO 2: A PALAVRA EXPOSTA É O REMÉDIO QUE QUEIMA
• [A: Fato] Jesus abre as Escrituras de Moisés aos Profetas (v.27).
• [B: Porquê] Fé madura não vem de show, vem da Palavra explicada.
• [C: Contraste] [ 💡 ILUSTRAÇÃO: Fogo de palha x Fogo do fogão a lenha ].
• [D: Tensão] -> Qual o resultado da Palavra no partir do pão?

TÓPICO 3: A REVELAÇÃO TRANSFORMA A FUGA EM MISSÃO
• [A: Fato] Olhos se abrem no partir do pão e voltam a Jerusalém (v.31-33).
• [B: Porquê] Encontro com Cristo elimina a passividade.
• [C: Contraste] [ ⚡ ELEVAR TOM ] Correram 11km de noite cheios de força!
• [D: Tensão] -> Vai continuar fugindo para Emaús ou volta para Jerusalém?

--------------------------------------------------------------------
🎯 BLOCO 3: APLICAÇÃO PRÁTICA
• Segunda-feira, 7h da manhã: Antes das redes sociais, abra a Bíblia na mesa.

--------------------------------------------------------------------
🏁 DESFECHO & APELO FINAL
• Chamada à oração de joelhos: "Abre os meus olhos e queima o coração!"
====================================================================`;

export default function SermonStudioGuidePage() {
  const navigate = useNavigate();
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => getTheme());
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [pulpitViewMode, setPulpitViewMode] = useState<"formatted" | "raw">("formatted");
  const [activeSection, setActiveSection] = useState<"estudio" | "pulpito" | "memorizacao">("estudio");

  usePageMeta({
    title: "Aprenda a Usar o Estúdio Homilético — Guia Prático Passo a Passo | Bíblia Vive",
    description:
      "Guia completo de homilética no Bíblia Vive: construa sermões com o Método da Marcha-Ré, os 4 Degraus, exegese anti-esegese e pregue com liberdade usando o Modo Púlpito.",
    canonical: "/estudio/aprenda-a-usar",
  });

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<Theme>;
      setCurrentTheme(customEvent.detail || getTheme());
    };
    window.addEventListener("bv-theme-change", handleThemeChange);
    return () => window.removeEventListener("bv-theme-change", handleThemeChange);
  }, []);

  const handleSelectTheme = (theme: Theme) => {
    sessionStorage.setItem("sermon_studio_theme_explicit", "true");
    setGlobalTheme(theme);
    setCurrentTheme(theme);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    toast.success("Copiado para a área de transferência!");
    setTimeout(() => {
      setCopiedSnippet(null);
    }, 2500);
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text font-sans antialiased selection:bg-gold/20 selection:text-gold transition-colors duration-200">
      {/* ── BARRA SUPERIOR ELEGANTE / HEADER ── */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 dark:border-[#221c15] bg-app-bg/95 dark:bg-[#0d0b09]/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate("/estudio");
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/80 dark:border-[#2a2219] hover:border-gold/40 text-xs text-app-text-muted hover:text-gold transition-all cursor-pointer bg-app-surface dark:bg-[#14100c] shadow-xs"
              title="Voltar"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Voltar ao Estúdio</span>
            </button>

            <div className="h-4 w-[1px] bg-border/60 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
                <GraduationCap className="w-3.5 h-3.5 text-gold" />
              </div>
              <span className="font-mono text-[0.68rem] uppercase tracking-wider text-gold font-bold">
                Manual Homilético
              </span>
            </div>
          </div>

          {/* Ações à Direita: Tema e Botão para Estúdio */}
          <div className="flex items-center gap-3">
            {/* Seletor White / Sépia / Dark */}
            <div
              data-testid="theme-selector-group"
              className="hidden sm:flex items-center bg-app-surface dark:bg-[#120f0c] p-1 rounded-xl border border-border/80 dark:border-[#221c15] shadow-xs"
            >
              <button
                type="button"
                onClick={() => handleSelectTheme("light")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                  currentTheme === "light"
                    ? "bg-amber-100 text-amber-950 shadow-xs border border-amber-300 font-semibold"
                    : "text-app-text-muted hover:text-app-text"
                )}
                title="Modo White"
              >
                <Sun className="w-3 h-3 text-amber-600" />
                <span className="text-[0.68rem]">White</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTheme("sepia")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                  currentTheme === "sepia"
                    ? "bg-[#d8c39e] text-[#2c1d11] shadow-xs border border-[#b89f70] font-semibold"
                    : "text-app-text-muted hover:text-app-text"
                )}
                title="Modo Sépia"
              >
                <Coffee className="w-3 h-3 text-[#8c6b38]" />
                <span className="text-[0.68rem]">Sépia</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTheme("dark")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                  currentTheme === "dark"
                    ? "bg-[#251e17] text-gold shadow-xs border border-gold/40 font-semibold"
                    : "text-app-text-muted hover:text-app-text"
                )}
                title="Modo Dark"
              >
                <Moon className="w-3 h-3 text-gold" />
                <span className="text-[0.68rem]">Dark</span>
              </button>
            </div>

            <Link
              to="/estudio"
              className="bg-gold text-primary-foreground hover:bg-gold/90 text-xs font-semibold px-4 py-1.5 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <span>Abrir Estúdio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── CONTEÚDO PRINCIPAL ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        {/* ── HERO BANNER ── */}
        <section className="relative overflow-hidden rounded-3xl border border-border/80 dark:border-[#2a2219] bg-gradient-to-br from-app-surface via-app-surface/90 to-gold/5 p-6 sm:p-10 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-mono text-[0.68rem] tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 font-semibold">
              <Sparkles className="w-3 h-3" /> Arquitetura Homilética Bíblia Vive
            </span>
            <span className="font-mono text-[0.68rem] text-app-text-muted">
              Método 3x4 • Marcha-Ré • Modo Púlpito
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-app-text leading-tight">
              Guia Prático de Construção: <br className="hidden sm:inline" />
              <span className="text-gold italic font-serif">Passo a Passo no Estúdio</span>
            </h1>
            <p className="text-sm sm:text-base text-app-text-muted leading-relaxed max-w-3xl">
              Um modelo de excelência para pastores e expositores da Palavra. Aprenda como preencher cada campo
              no estúdio, desdobrar os 4 Degraus Homiléticos, converter o esboço em pergaminho de púlpito de alta
              escaneabilidade e pregar com autoridade e fluidez sem nunca &ldquo;dar branco&rdquo;.
            </p>
          </div>

          {/* Destaque do Estudo de Caso (Lucas 24) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/60 dark:border-[#261f17]">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-app-bg/60 dark:bg-[#0f0c09]/60 border border-border/60 dark:border-[#221c15]">
              <div className="w-8 h-8 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0 border border-gold/20">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[0.68rem] font-mono uppercase tracking-wider text-app-text-muted font-bold">
                  Texto Bíblico Base
                </span>
                <p className="text-sm font-semibold text-app-text font-serif">
                  Lucas 24:13-35
                </p>
                <p className="text-xs text-app-text-muted">
                  Os Discípulos no Caminho de Emaús
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-app-bg/60 dark:bg-[#0f0c09]/60 border border-border/60 dark:border-[#221c15]">
              <div className="w-8 h-8 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0 border border-gold/20">
                <Flame className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[0.68rem] font-mono uppercase tracking-wider text-gold font-bold">
                  Tema da Mensagem
                </span>
                <p className="text-sm font-serif italic text-app-text font-medium">
                  &ldquo;Quando a Frustração Cega os Olhos, mas a Palavra Aquece o Coração&rdquo;
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── NAVEGAÇÃO RÁPIDA EM ABAS / SUMÁRIO ── */}
        <nav
          aria-label="Sumário do Guia"
          className="sticky top-[61px] z-30 flex items-center gap-2 p-1.5 rounded-2xl bg-app-surface/90 dark:bg-[#130f0c]/90 border border-border/80 dark:border-[#261e16] backdrop-blur-md shadow-md overflow-x-auto"
        >
          <button
            type="button"
            onClick={() => {
              setActiveSection("estudio");
              scrollTo("secao-estudio");
            }}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
              activeSection === "estudio"
                ? "bg-gold text-primary-foreground font-semibold shadow-xs"
                : "text-app-text-muted hover:text-app-text hover:bg-app-raised/50"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Passo a Passo no Estúdio</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection("pulpito");
              scrollTo("secao-pulpito");
            }}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
              activeSection === "pulpito"
                ? "bg-gold text-primary-foreground font-semibold shadow-xs"
                : "text-app-text-muted hover:text-app-text hover:bg-app-raised/50"
            )}
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>2. Como Pôr em Prática no Púlpito</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSection("memorizacao");
              scrollTo("secao-memorizacao");
            }}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
              activeSection === "memorizacao"
                ? "bg-gold text-primary-foreground font-semibold shadow-xs"
                : "text-app-text-muted hover:text-app-text hover:bg-app-raised/50"
            )}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>3. Dicas de Ouro (Sem Dar Branco)</span>
          </button>
        </nav>

        {/* ════════════════════════════════════════════════════════════════════
            PARTE 1: PASSO A PASSO NO ESTÚDIO
           ════════════════════════════════════════════════════════════════════ */}
        <section id="secao-estudio" className="space-y-8 scroll-mt-32">
          <div className="space-y-1 border-b border-border/80 dark:border-[#241c14] pb-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-gold font-bold">
              <span>Seção 01</span>
              <span>•</span>
              <span>Construção no Gabinete</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-app-text">
              Guia Prático de Construção: Passo a Passo no Estúdio
            </h2>
            <p className="text-xs sm:text-sm text-app-text-muted">
              Siga os 6 campos no estúdio exatamente na ordem de reflexão pastoral e homilética.
            </p>
          </div>

          {/* ── CARD 1: CHAMA INICIAL ── */}
          <div className="rounded-2xl border border-border/80 dark:border-[#282015] bg-app-surface dark:bg-[#14110d] p-6 sm:p-7 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 dark:border-[#221b14] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center font-mono font-bold text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-app-text flex items-center gap-2">
                    Campo: Chama Inicial (&ldquo;Eu e Deus&rdquo;)
                  </h3>
                  <p className="text-xs text-app-text-muted italic">
                    Onde o pregador captura a semente no Memorial em 3 a 5 linhas do seu fluxo espiritual no cotidiano.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    "Estava orando sobre o desânimo de alguns irmãos da igreja que se sentem frustrados porque Deus não agiu da forma que esperavam nesta semana. Lendo Lucas 24, percebi que os dois discípulos de Emaús conversavam tristes justamente porque esperavam um libertador político imediato. Jesus estava ao lado deles caminhando, mas a expectativa errada cego-os para a presença de Cristo.",
                    "chama"
                  )
                }
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 dark:border-[#2c2217] bg-app-raised/60 hover:border-gold/40 text-xs text-app-text-muted hover:text-gold transition-all cursor-pointer font-sans"
              >
                {copiedSnippet === "chama" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Exemplo</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[0.68rem] font-mono uppercase tracking-wider text-gold font-bold">
                Preenchimento no Estúdio:
              </span>
              <blockquote className="rounded-xl border border-border/70 dark:border-[#281f15] bg-app-raised/40 dark:bg-[#1a1510] p-4 text-xs sm:text-sm text-app-text leading-relaxed font-sans italic border-l-4 border-l-gold">
                &ldquo;Estava orando sobre o desânimo de alguns irmãos da igreja que se sentem frustrados porque Deus não agiu da forma que esperavam nesta semana. Lendo Lucas 24, percebi que os dois discípulos de Emaús conversavam tristes justamente porque esperavam um libertador político imediato. Jesus estava ao lado deles caminhando, mas a expectativa errada cego-os para a presença de Cristo.&rdquo;
              </blockquote>
            </div>
          </div>

          {/* ── CARD 2: MÉTODO DA MARCHA-RÉ ── */}
          <div className="rounded-2xl border border-border/80 dark:border-[#282015] bg-app-surface dark:bg-[#14110d] p-6 sm:p-7 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 dark:border-[#221b14] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center font-mono font-bold text-sm">
                  2
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-app-text flex items-center gap-2">
                    Campo: Método da Marcha-Ré (Desfecho / Conclusão Pretendida)
                  </h3>
                  <p className="text-xs text-app-text-muted italic">
                    Preenchido ANTES de escrever o corpo da mensagem, definindo o destino final.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    "Levar a igreja a renunciar às suas próprias expectativas humanas na oração final, dobrando os joelhos e fazendo esta oração sincera: 'Senhor, perdoa a minha cegueira espiritual. Abre os meus olhos para Te ver na minha rotina e queima o meu coração com a Tua Palavra!'.",
                    "desfecho"
                  )
                }
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 dark:border-[#2c2217] bg-app-raised/60 hover:border-gold/40 text-xs text-app-text-muted hover:text-gold transition-all cursor-pointer font-sans"
              >
                {copiedSnippet === "desfecho" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Exemplo</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-app-text">Intenção Selecionada:</span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[0.72rem] bg-gold/15 text-gold border border-gold/30 px-3 py-1 rounded-lg font-semibold">
                  <Zap className="w-3 h-3 text-gold" />
                  Confronto & Consolação
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[0.68rem] font-mono uppercase tracking-wider text-gold font-bold">
                  Desfecho Definido:
                </span>
                <blockquote className="rounded-xl border border-border/70 dark:border-[#281f15] bg-app-raised/40 dark:bg-[#1a1510] p-4 text-xs sm:text-sm text-app-text leading-relaxed font-sans border-l-4 border-l-gold">
                  &ldquo;Levar a igreja a renunciar às suas próprias expectativas humanas na oração final, dobrando os joelhos e fazendo esta oração sincera: &lsquo;Senhor, perdoa a minha cegueira espiritual. Abre os meus olhos para Te ver na minha rotina e queima o meu coração com a Tua Palavra!&rsquo;.&rdquo;
                </blockquote>
              </div>
            </div>
          </div>

          {/* ── CARD 3: BLOCO 1 EXPLICAR O TEXTO ── */}
          <div className="rounded-2xl border border-border/80 dark:border-[#282015] bg-app-surface dark:bg-[#14110d] p-6 sm:p-7 space-y-5 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 dark:border-[#221b14] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center font-mono font-bold text-sm">
                  3
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-app-text flex items-center gap-2">
                    Campo: Bloco 1 — Explicar o Texto (Exegese & Ancoradouro Histórico)
                  </h3>
                  <p className="text-xs text-app-text-muted italic">
                    Garante fidelidade bíblica inegociável através da Trava Anti-Esegese.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    "Mostrar aos cristãos perseguidos do primeiro século que a ressurreição de Cristo não era uma lenda, mas o cumprimento exato de todas as profecias do Antigo Testamento que eles precisavam aprender a enxergar pelas Escrituras.\n\nEmaús ficava a cerca de 11 km de Jerusalém. Caminhar de volta para Emaús significava desistir da missão e fugir do centro da dor. Os discípulos estavam 'com os olhos impedidos de o reconhecer' (v.16) não por milagre punitivo, mas porque estavam tomados pela narrativa da derrota. Jesus entra na caminhada como um desconhecido e, em vez de fazer um show de milagres, decide expor as Escrituras desde Moisés e todos os Profetas.",
                    "bloco1"
                  )
                }
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 dark:border-[#2c2217] bg-app-raised/60 hover:border-gold/40 text-xs text-app-text-muted hover:text-gold transition-all cursor-pointer font-sans"
              >
                {copiedSnippet === "bloco1" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Exemplo</span>
                  </>
                )}
              </button>
            </div>

            {/* Trava Anti-Esegese */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-gold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-gold" />
                <span>Trava Anti-Esegese (Pergunta Reflexiva Obrigatória)</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-app-text">
                &ldquo;Qual era a intenção do autor sagrado para os primeiros ouvintes deste texto?&rdquo;
              </p>
              <div className="text-xs sm:text-sm text-app-text leading-relaxed bg-app-surface/90 dark:bg-[#13100c] p-3 rounded-lg border border-border/80 dark:border-[#261e16] font-sans">
                <strong className="text-gold font-mono uppercase text-[0.68rem] block mb-1">
                  Resposta do Pregador (Ancoradouro Histórico):
                </strong>
                &ldquo;Mostrar aos cristãos perseguidos do primeiro século que a ressurreição de Cristo não era uma lenda, mas o cumprimento exato de todas as profecias do Antigo Testamento que eles precisavam aprender a enxergar pelas Escrituras.&rdquo;
              </div>
            </div>

            {/* Exegese & Contexto Histórico */}
            <div className="space-y-1.5">
              <span className="text-[0.68rem] font-mono uppercase tracking-wider text-gold font-bold">
                Exegese & Contexto Histórico:
              </span>
              <div className="rounded-xl border border-border/70 dark:border-[#281f15] bg-app-raised/40 dark:bg-[#1a1510] p-4 text-xs sm:text-sm text-app-text leading-relaxed font-sans">
                &ldquo;Emaús ficava a cerca de 11 km de Jerusalém. Caminhar de volta para Emaús significava desistir da missão e fugir do centro da dor. Os discípulos estavam &lsquo;com os olhos impedidos de o reconhecer&rsquo; (v.16) não por milagre punitivo, mas porque estavam tomados pela narrativa da derrota. Jesus entra na caminhada como um desconhecido e, em vez de fazer um show de milagres, decide expor as Escrituras desde Moisés e todos os Profetas.&rdquo;
              </div>
            </div>
          </div>

          {/* ── CARD 4: BLOCO 2 PREGAR A INSPIRAÇÃO (OS 4 DEGRAUS) ── */}
          <div className="rounded-2xl border border-border/80 dark:border-[#282015] bg-app-surface dark:bg-[#14110d] p-6 sm:p-7 space-y-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 dark:border-[#221b14] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center font-mono font-bold text-sm">
                  4
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-app-text flex items-center gap-2">
                    Campo: Bloco 2 — Pregar a Inspiração (Tópicos com os 4 Degraus)
                  </h3>
                  <p className="text-xs text-app-text-muted italic">
                    A estrutura de 4 degraus homiléticos (A, B, C, D) para cada tópico da mensagem.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    "TÓPICO 1: A Frustração Humana Cega a Visão do Sagrado\n• Degrau A (Fato): Os discípulos caminhavam ao lado do próprio Cristo ressurreto, mas conversavam tristes sem saber quem Ele era (v. 15-16).\n• Degrau B (Porquê): Eles estavam presos à narrativa da frustração porque esperavam um Messias terreno que destruísse Roma (v. 21).\n• Degrau C (Contraste): [ 🤫 Pausa de 3 segundos ] A dor não afasta Deus de você; a dor apenas afasta a sua capacidade de enxergá-Lo agindo no ordinário da vida.\n• Degrau D (Tensão): Mas o que Jesus faz quando nos encontra presos nesse estado de cegueira?\n\nTÓPICO 2: A Palavra Exposta é o Remédio que Queima por Dentro\n• Degrau A (Fato): Jesus não faz um milagre pirotecnico para provar quem era; Ele abre as Escrituras voltando aos textos de Moisés e dos Profetas (v. 27).\n• Degrau B (Porquê): A fé madura não se sustenta no impacto visual passageiro, mas na convicção da Palavra explicada e compreendida.\n• Degrau C (Contraste): [ 💡 Ilustração: A diferença entre o fogo de palha (que brilha rápido e apaga) e o fogo do fogão a lenha (que queima lento e aquece a casa inteira) ]. Muitos buscam arrepios na igreja, mas o que sustenta a alma na terça-feira é o coração queimando pela Escritura!\n• Degrau D (Tensão): E qual é o resultado inevitável quando a Palavra encontra um coração aberto no partir do pão?\n\nTÓPICO 3: A Revelação de Cristo Transforma a Fuga em Missão\n• Degrau A (Fato): Ao partir o pão, os olhos deles se abriram e eles levantaram na mesma hora para voltar a Jerusalém (v. 31-33).\n• Degrau B (Porquê): Quem verdadeiramente tem um encontro com o Cristo vivo não consegue permanecer fugindo nem passivo diante da vida.\n• Degrau C (Contraste): [ ⚡ Elevar o Tom de Voz ] Eles tinham caminhado 11 km cansados, escuro e tristes para Emaús, mas voltaram correndo os mesmos 11 km de noite, cheios de força e alegria!\n• Degrau D (Tensão): E você? Vai continuar caminhando rumo à fuga de Emaús ou vai voltar para Jerusalém hoje?",
                    "bloco2"
                  )
                }
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 dark:border-[#2c2217] bg-app-raised/60 hover:border-gold/40 text-xs text-app-text-muted hover:text-gold transition-all cursor-pointer font-sans"
              >
                {copiedSnippet === "bloco2" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Todos os Tópicos</span>
                  </>
                )}
              </button>
            </div>

            {/* Resumo visual dos 4 Degraus */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-3 rounded-xl bg-app-raised/50 dark:bg-[#18130f] border border-border/60 text-xs">
              <div className="space-y-0.5">
                <span className="font-mono font-bold text-gold">Degrau A:</span>
                <p className="text-app-text-muted text-[0.72rem]">Fato / Afirmação Bíblica</p>
              </div>
              <div className="space-y-0.5">
                <span className="font-mono font-bold text-gold">Degrau B:</span>
                <p className="text-app-text-muted text-[0.72rem]">Porquê / Fundamentação</p>
              </div>
              <div className="space-y-0.5">
                <span className="font-mono font-bold text-gold">Degrau C:</span>
                <p className="text-app-text-muted text-[0.72rem]">Contraste + Marcadores</p>
              </div>
              <div className="space-y-0.5">
                <span className="font-mono font-bold text-gold">Degrau D:</span>
                <p className="text-app-text-muted text-[0.72rem]">Tensão / Pergunta Gancho</p>
              </div>
            </div>

            {/* TÓPICO 1 */}
            <div className="rounded-xl border border-border/80 dark:border-[#251e16] bg-app-bg/50 dark:bg-[#100d0a] p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-gold/15 text-gold font-mono text-xs font-bold">
                  TÓPICO 1
                </span>
                <h4 className="font-serif text-base sm:text-lg font-semibold text-app-text">
                  A Frustração Humana Cega a Visão do Sagrado
                </h4>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm pl-2 border-l-2 border-gold/40">
                <div className="space-y-0.5">
                  <span className="font-mono text-[0.72rem] text-gold font-bold">Degrau A (Fato / Afirmação):</span>
                  <p className="text-app-text">
                    Os discípulos caminhavam ao lado do próprio Cristo ressurreto, mas conversavam tristes sem saber quem Ele era (v. 15-16).
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="font-mono text-[0.72rem] text-gold font-bold">Degrau B (Porquê / Fundamentação):</span>
                  <p className="text-app-text">
                    Eles estavam presos à narrativa da frustração porque esperavam um Messias terreno que destruísse Roma (v. 21).
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[0.72rem] text-gold font-bold">Degrau C (Contraste / Objeção):</span>
                  <p className="text-app-text flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 font-mono text-[0.7rem] bg-gold/10 text-gold border border-gold/30 px-2 py-0.5 rounded font-semibold">
                      <Pause className="w-3 h-3 text-gold/80" />
                      [ 🤫 Pausa de 3 segundos ]
                    </span>
                    <span>A dor não afasta Deus de você; a dor apenas afasta a sua capacidade de enxergá-Lo agindo no ordinário da vida.</span>
                  </p>
                </div>

                <div className="space-y-0.5 bg-gold/5 p-2.5 rounded-lg border border-gold/20">
                  <span className="font-mono text-[0.72rem] text-gold font-bold">Degrau D (Tensão / Gancho):</span>
                  <p className="text-app-text italic font-serif">
                    &ldquo;Mas o que Jesus faz quando nos encontra presos nesse estado de cegueira?&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* TÓPICO 2 */}
            <div className="rounded-xl border border-border/80 dark:border-[#251e16] bg-app-bg/50 dark:bg-[#100d0a] p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-gold/15 text-gold font-mono text-xs font-bold">
                  TÓPICO 2
                </span>
                <h4 className="font-serif text-base sm:text-lg font-semibold text-app-text">
                  A Palavra Exposta é o Remédio que Queima por Dentro
                </h4>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm pl-2 border-l-2 border-gold/40">
                <div className="space-y-0.5">
                  <span className="font-mono text-[0.72rem] text-gold font-bold">Degrau A (Fato / Afirmação):</span>
                  <p className="text-app-text">
                    Jesus não faz um milagre pirotecnico para provar quem era; Ele abre as Escrituras voltando aos textos de Moisés e dos Profetas (v. 27).
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="font-mono text-[0.72rem] text-gold font-bold">Degrau B (Porquê / Fundamentação):</span>
                  <p className="text-app-text">
                    A fé madura não se sustenta no impacto visual passageiro, mas na convicção da Palavra explicada e compreendida.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[0.72rem] text-gold font-bold">Degrau C (Contraste / Objeção):</span>
                  <div className="space-y-1 text-app-text">
                    <span className="inline-flex items-center gap-1 font-mono text-[0.7rem] bg-gold/10 text-gold border border-gold/30 px-2 py-0.5 rounded font-semibold">
                      <Sparkles className="w-3 h-3 text-gold/80" />
                      [ 💡 Ilustração: A diferença entre o fogo de palha (que brilha rápido e apaga) e o fogo do fogão a lenha (que queima lento e aquece a casa inteira) ]
                    </span>
                    <p className="pt-0.5">
                      Muitos buscam arrepios na igreja, mas o que sustenta a alma na terça-feira é o coração queimando pela Escritura!
                    </p>
                  </div>
                </div>

                <div className="space-y-0.5 bg-gold/5 p-2.5 rounded-lg border border-gold/20">
                  <span className="font-mono text-[0.72rem] text-gold font-bold">Degrau D (Tensão / Gancho):</span>
                  <p className="text-app-text italic font-serif">
                    &ldquo;E qual é o resultado inevitável quando a Palavra encontra um coração aberto no partir do pão?&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* TÓPICO 3 */}
            <div className="rounded-xl border border-border/80 dark:border-[#251e16] bg-app-bg/50 dark:bg-[#100d0a] p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-gold/15 text-gold font-mono text-xs font-bold">
                  TÓPICO 3
                </span>
                <h4 className="font-serif text-base sm:text-lg font-semibold text-app-text">
                  A Revelação de Cristo Transforma a Fuga em Missão
                </h4>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm pl-2 border-l-2 border-gold/40">
                <div className="space-y-0.5">
                  <span className="font-mono text-[0.72rem] text-gold font-bold">Degrau A (Fato / Afirmação):</span>
                  <p className="text-app-text">
                    Ao partir o pão, os olhos deles se abriram e eles levantaram na mesma hora para voltar a Jerusalém (v. 31-33).
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="font-mono text-[0.72rem] text-gold font-bold">Degrau B (Porquê / Fundamentação):</span>
                  <p className="text-app-text">
                    Quem verdadeiramente tem um encontro com o Cristo vivo não consegue permanecer fugindo nem passivo diante da vida.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-[0.72rem] text-gold font-bold">Degrau C (Contraste / Objeção):</span>
                  <div className="space-y-1 text-app-text">
                    <span className="inline-flex items-center gap-1 font-mono text-[0.7rem] bg-gold/10 text-gold border border-gold/30 px-2 py-0.5 rounded font-semibold">
                      <Zap className="w-3 h-3 text-gold/80" />
                      [ ⚡ Elevar o Tom de Voz ]
                    </span>
                    <p className="pt-0.5">
                      Eles tinham caminhado 11 km cansados, escuro e tristes para Emaús, mas voltaram correndo os mesmos 11 km de noite, cheios de força e alegria!
                    </p>
                  </div>
                </div>

                <div className="space-y-0.5 bg-gold/5 p-2.5 rounded-lg border border-gold/20">
                  <span className="font-mono text-[0.72rem] text-gold font-bold">Degrau D (Tensão / Gancho):</span>
                  <p className="text-app-text italic font-serif">
                    &ldquo;E você? Vai continuar caminhando rumo à fuga de Emaús ou vai voltar para Jerusalém hoje?&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── CARD 5: BLOCO 3 APLICAR À VIDA REAL ── */}
          <div className="rounded-2xl border border-border/80 dark:border-[#282015] bg-app-surface dark:bg-[#14110d] p-6 sm:p-7 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 dark:border-[#221b14] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center font-mono font-bold text-sm">
                  5
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-app-text flex items-center gap-2">
                    Campo: Bloco 3 — Aplicar à Vida Real (Conexão Prática)
                  </h3>
                  <p className="text-xs text-app-text-muted italic">
                    Traz a verdade das Escrituras para a rotina diária dos ouvintes.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    "Amanhã, segunda-feira às 7h da manhã, quando a ansiedade do seu trabalho, da sua conta bancária ou da sua família tentar te convencer de que Deus te abandonou na cruz, não fuja para Emaús. Antes de abrir as redes sociais, abra a Bíblia na sua mesa, leia um capítulo com calma e peça: 'Senhor, queima o meu coração com a Tua Palavra hoje'!",
                    "bloco3"
                  )
                }
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 dark:border-[#2c2217] bg-app-raised/60 hover:border-gold/40 text-xs text-app-text-muted hover:text-gold transition-all cursor-pointer font-sans"
              >
                {copiedSnippet === "bloco3" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Exemplo</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[0.68rem] font-mono uppercase tracking-wider text-gold font-bold">
                Preenchimento no Estúdio:
              </span>
              <blockquote className="rounded-xl border border-border/70 dark:border-[#281f15] bg-app-raised/40 dark:bg-[#1a1510] p-4 text-xs sm:text-sm text-app-text leading-relaxed font-sans border-l-4 border-l-gold">
                &ldquo;Amanhã, segunda-feira às 7h da manhã, quando a ansiedade do seu trabalho, da sua conta bancária ou da sua família tentar te convencer de que Deus te abandonou na cruz, não fuja para Emaús. Antes de abrir as redes sociais, abra a Bíblia na sua mesa, leia um capítulo com calma e peça: &lsquo;Senhor, queima o meu coração com a Tua Palavra hoje&rsquo;!&rdquo;
              </blockquote>
            </div>
          </div>

          {/* ── CARD 6: PASSO FINAL DA MARCHA-RÉ (INTRODUÇÃO) ── */}
          <div className="rounded-2xl border border-border/80 dark:border-[#282015] bg-app-surface dark:bg-[#14110d] p-6 sm:p-7 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 dark:border-[#221b14] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center font-mono font-bold text-sm">
                  6
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-app-text flex items-center gap-2">
                    Campo: Passo Final da Marcha-Ré — Introdução (Gancho de Entrada)
                  </h3>
                  <p className="text-xs text-app-text-muted italic">
                    Escrita por último no gabinete para capturar a atenção nos primeiros 30 segundos.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    "Você já esteve em um lugar onde fez tudo certo, mas no final tudo pareceu dar errado? Você já sentiu a sensação amarga de ver um projeto ou um sonho morrer e se perguntar em silêncio: 'Deus, onde o Senhor estava quando isso aconteceu?'. Hoje nós vamos caminhar 11 quilômetros com dois homens que sentiam exatamente isso...",
                    "intro"
                  )
                }
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 dark:border-[#2c2217] bg-app-raised/60 hover:border-gold/40 text-xs text-app-text-muted hover:text-gold transition-all cursor-pointer font-sans"
              >
                {copiedSnippet === "intro" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Exemplo</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[0.68rem] font-mono uppercase tracking-wider text-gold font-bold">
                Preenchimento no Estúdio:
              </span>
              <blockquote className="rounded-xl border border-border/70 dark:border-[#281f15] bg-app-raised/40 dark:bg-[#1a1510] p-4 text-xs sm:text-sm text-app-text leading-relaxed font-sans italic border-l-4 border-l-gold">
                &ldquo;Você já esteve em um lugar onde fez tudo certo, mas no final tudo pareceu dar errado? Você já sentiu a sensação amarga de ver um projeto ou um sonho morrer e se perguntar em silêncio: &lsquo;Deus, onde o Senhor estava quando isso aconteceu?&rsquo;. Hoje nós vamos caminhar 11 quilômetros com dois homens que sentiam exatamente isso...&rdquo;
              </blockquote>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            PARTE 2: COMO PÔR EM PRÁTICA NO PÚLPITO (MODO PÚLPITO)
           ════════════════════════════════════════════════════════════════════ */}
        <section id="secao-pulpito" className="space-y-6 scroll-mt-32">
          <div className="space-y-1 border-b border-border/80 dark:border-[#241c14] pb-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-gold font-bold">
              <span>Seção 02</span>
              <span>•</span>
              <span>Execução no Altar</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-app-text">
              Parte 2: Como Pôr em Prática no Púlpito (Modo Púlpito)
            </h2>
            <p className="text-xs sm:text-sm text-app-text-muted">
              Quando você toca no botão <strong className="text-gold font-mono font-semibold">[ 📖 Pregar Agora ]</strong>, a interface transforma esse formulário em um <span className="text-app-text font-medium">Pergaminho de Púlpito de Alta Escaneabilidade Visual</span>.
            </p>
          </div>

          {/* Toggle entre Visualização Formatada e Formato Raw ASCII */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-app-surface dark:bg-[#120f0c] p-1 rounded-xl border border-border/80 dark:border-[#221c15]">
              <button
                type="button"
                onClick={() => setPulpitViewMode("formatted")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                  pulpitViewMode === "formatted"
                    ? "bg-gold text-primary-foreground font-semibold shadow-xs"
                    : "text-app-text-muted hover:text-app-text"
                )}
              >
                <ScrollText className="w-3.5 h-3.5" />
                <span>Simulação do Pergaminho</span>
              </button>

              <button
                type="button"
                onClick={() => setPulpitViewMode("raw")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                  pulpitViewMode === "raw"
                    ? "bg-gold text-primary-foreground font-semibold shadow-xs"
                    : "text-app-text-muted hover:text-app-text"
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Visão em Texto (ASCII)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(FULL_PULPIT_TEXT, "pulpit_full")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gold/40 bg-gold/10 hover:bg-gold/20 text-xs text-gold transition-all cursor-pointer font-medium"
            >
              {copiedSnippet === "pulpit_full" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span>Pergaminho Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Pergaminho Completo</span>
                </>
              )}
            </button>
          </div>

          {/* SIMULAÇÃO FORMATADA DO PERGAMINHO */}
          {pulpitViewMode === "formatted" ? (
            <div className="rounded-3xl border-2 border-gold/40 dark:border-[#382b1d] bg-app-surface dark:bg-[#0e0c09] shadow-2xl overflow-hidden">
              {/* Header do Púlpito */}
              <div className="bg-app-raised/90 dark:bg-[#18130e] border-b border-gold/30 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gold flex items-center gap-1.5 text-sm">
                    <BookOpen className="w-4 h-4 text-gold" />
                    LUCAS 24:13-35
                  </span>
                  <span className="text-app-text-muted">|</span>
                  <span className="flex items-center gap-1 text-app-text-muted font-medium">
                    <Clock className="w-3.5 h-3.5 text-gold" />
                    00:00
                  </span>
                  <span className="text-app-text-muted">|</span>
                  <span className="flex items-center gap-1 text-emerald-500 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    TELA ATIVA
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg border border-gold/30 bg-gold/10 text-gold font-medium text-[0.72rem]">
                    🏛️ VER PARÂMETROS
                  </span>
                </div>
              </div>

              {/* Corpo do Pergaminho */}
              <div className="p-6 sm:p-8 space-y-8 font-sans">
                {/* Metadados: Tema & Desfecho */}
                <div className="p-4 rounded-2xl bg-gold/5 border border-gold/25 space-y-2">
                  <p className="text-sm font-semibold text-app-text">
                    <span className="font-mono text-gold uppercase text-xs tracking-wider mr-2 font-bold">TEMA:</span>
                    Quando a Frustração Cega os Olhos, mas a Palavra Aquece o Coração
                  </p>
                  <p className="text-xs text-app-text-muted">
                    <span className="font-mono text-gold uppercase text-[0.68rem] tracking-wider mr-2 font-bold">DESFECHO:</span>
                    Dobrar joelhos &rarr; Oração de renúncia de expectativas humanas.
                  </p>
                </div>

                {/* 1. INTRODUÇÃO */}
                <div className="space-y-2 border-t border-border/80 dark:border-[#221c16] pt-5">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-gold uppercase tracking-wider">
                    <Flame className="w-3.5 h-3.5" />
                    <span>🔥 INTRODUÇÃO (GANCHO DE ENTRADA)</span>
                  </div>
                  <p className="text-base sm:text-lg font-serif italic text-app-text leading-relaxed pl-3 border-l-2 border-gold/40">
                    &ldquo;Você já esteve em um lugar onde fez tudo certo, mas deu errado? Você já sentiu a sensação amarga de ver um projeto morrer e perguntar: &lsquo;Deus, onde o Senhor estava?&rsquo;...&rdquo;
                  </p>
                </div>

                {/* 2. BLOCO 1: EXEGESE */}
                <div className="space-y-3 border-t border-border/80 dark:border-[#221c16] pt-5">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-gold uppercase tracking-wider">
                    <Compass className="w-3.5 h-3.5" />
                    <span>🏛️ BLOCO 1: EXEGESE & CONTEXTO HISTÓRICO</span>
                  </div>
                  <ul className="space-y-2 text-sm text-app-text pl-3">
                    <li className="flex items-start gap-2">
                      <span className="text-gold font-mono">•</span>
                      <span><strong>Ancoradouro:</strong> Mostrar a Teófilo e crentes que Cristo é o cumprimento profético.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gold font-mono">•</span>
                      <span><strong>Contexto:</strong> Emaús (11 km) = Fuga e desistência. Olhos impedidos pela dor.</span>
                    </li>
                  </ul>
                </div>

                {/* 3. BLOCO 2: PREGAR A INSPIRAÇÃO */}
                <div className="space-y-6 border-t border-border/80 dark:border-[#221c16] pt-5">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-gold uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>📖 BLOCO 2: PREGAR A INSPIRAÇÃO</span>
                  </div>

                  {/* Tópico 1 */}
                  <div className="space-y-2.5 p-4 rounded-2xl bg-app-raised/40 dark:bg-[#15110d] border border-border/60">
                    <h4 className="font-serif text-base font-bold text-app-text">
                      TÓPICO 1: A FRUSTRAÇÃO CEGA A VISÃO DO SAGRADO
                    </h4>
                    <div className="space-y-2 text-sm pl-2">
                      <p><span className="font-mono text-xs font-bold text-gold">[A: Fato]</span> Caminhavam com Cristo sem O reconhecer (v.15-16).</p>
                      <p><span className="font-mono text-xs font-bold text-gold">[B: Porquê]</span> Presos à expectativa de um Messias político (v.21).</p>
                      <p className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-gold">[C: Contraste]</span>
                        <span className="inline-flex items-center gap-1 font-mono text-[0.7rem] bg-gold/10 text-gold border border-gold/30 px-2 py-0.5 rounded font-semibold">
                          <Pause className="w-3 h-3 text-gold/80" />
                          [ 🤫 PAUSA 3S ]
                        </span>
                        <span>A dor não afasta Deus, afasta sua visão.</span>
                      </p>
                      <p className="text-gold italic font-serif"><span className="font-mono text-xs font-bold text-gold font-sans not-italic">[D: Tensão]</span> &rarr; O que Jesus faz quando nos vê cegos?</p>
                    </div>
                  </div>

                  {/* Tópico 2 */}
                  <div className="space-y-2.5 p-4 rounded-2xl bg-app-raised/40 dark:bg-[#15110d] border border-border/60">
                    <h4 className="font-serif text-base font-bold text-app-text">
                      TÓPICO 2: A PALAVRA EXPOSTA É O REMÉDIO QUE QUEIMA
                    </h4>
                    <div className="space-y-2 text-sm pl-2">
                      <p><span className="font-mono text-xs font-bold text-gold">[A: Fato]</span> Jesus abre as Escrituras de Moisés aos Profetas (v.27).</p>
                      <p><span className="font-mono text-xs font-bold text-gold">[B: Porquê]</span> Fé madura não vem de show, vem da Palavra explicada.</p>
                      <div className="space-y-1">
                        <span className="font-mono text-xs font-bold text-gold">[C: Contraste]</span>
                        <span className="inline-flex items-center gap-1 font-mono text-[0.7rem] bg-gold/10 text-gold border border-gold/30 px-2 py-0.5 rounded font-semibold ml-1.5">
                          <Sparkles className="w-3 h-3 text-gold/80" />
                          [ 💡 ILUSTRAÇÃO: Fogo de palha x Fogo do fogão a lenha ]
                        </span>
                      </div>
                      <p className="text-gold italic font-serif"><span className="font-mono text-xs font-bold text-gold font-sans not-italic">[D: Tensão]</span> &rarr; Qual o resultado da Palavra no partir do pão?</p>
                    </div>
                  </div>

                  {/* Tópico 3 */}
                  <div className="space-y-2.5 p-4 rounded-2xl bg-app-raised/40 dark:bg-[#15110d] border border-border/60">
                    <h4 className="font-serif text-base font-bold text-app-text">
                      TÓPICO 3: A REVELAÇÃO TRANSFORMA A FUGA EM MISSÃO
                    </h4>
                    <div className="space-y-2 text-sm pl-2">
                      <p><span className="font-mono text-xs font-bold text-gold">[A: Fato]</span> Olhos se abrem no partir do pão e voltam a Jerusalém (v.31-33).</p>
                      <p><span className="font-mono text-xs font-bold text-gold">[B: Porquê]</span> Encontro com Cristo elimina a passividade.</p>
                      <p className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-gold">[C: Contraste]</span>
                        <span className="inline-flex items-center gap-1 font-mono text-[0.7rem] bg-gold/10 text-gold border border-gold/30 px-2 py-0.5 rounded font-semibold">
                          <Zap className="w-3 h-3 text-gold/80" />
                          [ ⚡ ELEVAR TOM ]
                        </span>
                        <span>Correram 11km de noite cheios de força!</span>
                      </p>
                      <p className="text-gold italic font-serif"><span className="font-mono text-xs font-bold text-gold font-sans not-italic">[D: Tensão]</span> &rarr; Vai continuar fugindo para Emaús ou volta para Jerusalém?</p>
                    </div>
                  </div>
                </div>

                {/* 4. BLOCO 3: APLICAÇÃO */}
                <div className="space-y-2 border-t border-border/80 dark:border-[#221c16] pt-5">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-gold uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>🎯 BLOCO 3: APLICAÇÃO PRÁTICA</span>
                  </div>
                  <p className="text-sm sm:text-base text-app-text pl-3">
                    • <strong>Segunda-feira, 7h da manhã:</strong> Antes das redes sociais, abra a Bíblia na mesa.
                  </p>
                </div>

                {/* 5. DESFECHO & APELO */}
                <div className="space-y-2 border-t border-border/80 dark:border-[#221c16] pt-5">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-gold uppercase tracking-wider">
                    <Flame className="w-3.5 h-3.5" />
                    <span>🏁 DESFECHO & APELO FINAL</span>
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-app-text pl-3">
                    • Chamada à oração de joelhos: <em>&ldquo;Abre os meus olhos e queima o coração!&rdquo;</em>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* VISÃO EM TEXTO MONOSPACE / ASCII */
            <div className="rounded-2xl border border-border/80 dark:border-[#251e16] bg-[#0c0a08] p-5 sm:p-6 overflow-x-auto shadow-2xl">
              <pre className="font-mono text-xs sm:text-[0.82rem] text-gold/90 leading-relaxed whitespace-pre select-all">
                {FULL_PULPIT_TEXT}
              </pre>
            </div>
          )}
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            PARTE 3: DICAS DE OURO PARA MEMORIZAÇÃO E FLUIDEZ
           ════════════════════════════════════════════════════════════════════ */}
        <section id="secao-memorizacao" className="space-y-6 scroll-mt-32">
          <div className="space-y-1 border-b border-border/80 dark:border-[#241c14] pb-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-gold font-bold">
              <span>Seção 03</span>
              <span>•</span>
              <span>Homilética Sem Bloqueios</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-app-text">
              Dicas de Ouro para Memorização e Fluidez (Para Não &ldquo;Dar Branco&rdquo;)
            </h2>
            <p className="text-xs sm:text-sm text-app-text-muted">
              Para pregar com liberdade, autoridade e sem ficar com a cabeça enterrada no celular, aplique estas 4 técnicas de memorização tática:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TÉCNICA 1 */}
            <div className="rounded-2xl border border-border/80 dark:border-[#282015] bg-app-surface dark:bg-[#14110d] p-6 space-y-4 shadow-md flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center shrink-0">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[0.68rem] font-mono uppercase tracking-wider text-gold font-bold">
                      Técnica 1
                    </span>
                    <h3 className="font-serif text-lg font-semibold text-app-text">
                      A Regra do &ldquo;Tríptico de Palavras-Âncoras&rdquo;
                    </h3>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-app-text-muted leading-relaxed">
                  Não tente memorizar frases completas de cada tópico. Guarde apenas <strong className="text-app-text">UMA PALAVRA-CHAVE</strong> para cada Tópico do Bloco 2:
                </p>

                <div className="space-y-2 p-3.5 rounded-xl bg-app-raised/50 dark:bg-[#18130f] border border-border/60 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gold font-bold">Tópico 1 ➔</span>
                    <strong className="text-gold tracking-wide">CEGUEIRA</strong>
                    <span className="text-app-text-muted text-xs">(A frustração cega)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gold font-bold">Tópico 2 ➔</span>
                    <strong className="text-gold tracking-wide">ESCRITURA</strong>
                    <span className="text-app-text-muted text-xs">(A Palavra queima)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gold font-bold">Tópico 3 ➔</span>
                    <strong className="text-gold tracking-wide">RETORNO</strong>
                    <span className="text-app-text-muted text-xs">(A missão faz voltar)</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 dark:border-[#221c15] text-xs font-serif italic text-gold">
                &ldquo;Se você lembrar das palavras CEGUEIRA ➔ ESCRITURA ➔ RETORNO, você tem o sermão inteiro na cabeça!&rdquo;
              </div>
            </div>

            {/* TÉCNICA 2 */}
            <div className="rounded-2xl border border-border/80 dark:border-[#282015] bg-app-surface dark:bg-[#14110d] p-6 space-y-4 shadow-md flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center shrink-0">
                    <Link2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[0.68rem] font-mono uppercase tracking-wider text-gold font-bold">
                      Técnica 2
                    </span>
                    <h3 className="font-serif text-lg font-semibold text-app-text">
                      O &ldquo;Efeito Dominó&rdquo; do Degrau D
                    </h3>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-app-text-muted leading-relaxed">
                  O Degrau D de cada tópico foi desenhado exatamente para evitar que você trave! Como o Degrau D é uma <strong className="text-app-text">pergunta de tensão</strong>, ao falar a pergunta em voz alta para a igreja, a resposta é automaticamente o <strong className="text-app-text">título do próximo tópico</strong>!
                </p>

                <div className="space-y-2 p-3.5 rounded-xl bg-app-raised/50 dark:bg-[#18130f] border border-border/60 text-xs sm:text-sm">
                  <p className="text-app-text">
                    <span className="font-mono text-gold text-xs font-bold">• Você pergunta:</span> &ldquo;O que Jesus faz quando nos encontra cegos?&rdquo; <span className="text-app-text-muted text-xs">(Degrau D do Ponto 1)</span>
                  </p>
                  <p className="text-gold font-semibold">
                    <span className="font-mono text-gold text-xs font-bold">• Sua mente lembra na hora:</span> &ldquo;Ele abre a ESCRITURA!&rdquo; <span className="text-app-text-muted text-xs">(Ponto 2)</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 dark:border-[#221c15] text-xs font-serif italic text-app-text-muted">
                Cada degrau D é uma rampa de transição invisível para o seu próximo ponto.
              </div>
            </div>

            {/* TÉCNICA 3 */}
            <div className="rounded-2xl border border-border/80 dark:border-[#282015] bg-app-surface dark:bg-[#14110d] p-6 space-y-4 shadow-md flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center shrink-0">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[0.68rem] font-mono uppercase tracking-wider text-gold font-bold">
                      Técnica 3
                    </span>
                    <h3 className="font-serif text-lg font-semibold text-app-text">
                      A Técnica da &ldquo;Âncora Ocular&rdquo;
                    </h3>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-app-text-muted leading-relaxed">
                  Olho na tela, voz na igreja. O segredo da oratória livre sem virar refém das anotações:
                </p>

                <ul className="space-y-2.5 text-xs sm:text-sm text-app-text pl-1">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 shrink-0" />
                    <span><strong className="text-gold">0,5 Segundo no Celular:</strong> Passe o olho no cartão do Degrau (ex: <code className="font-mono text-xs bg-gold/10 px-1.5 py-0.5 rounded text-gold">[C: Contraste] [ 💡 Ilustração ]</code>).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 shrink-0" />
                    <span><strong className="text-gold">Levante a Cabeça:</strong> Olhe nos olhos dos membros da igreja e fale a frase ou conte a ilustração.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    <span className="text-red-400 dark:text-red-300 font-medium"><strong>Nunca leia o texto enquanto fala!</strong> Olhe primeiro para absorver a ideia, levante o rosto e pregue!</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-border/60 dark:border-[#221c15] text-xs font-serif italic text-gold">
                A congregação conecta-se com os seus olhos, não com o topo da sua cabeça.
              </div>
            </div>

            {/* TÉCNICA 4 */}
            <div className="rounded-2xl border border-border/80 dark:border-[#282015] bg-app-surface dark:bg-[#14110d] p-6 space-y-4 shadow-md flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center shrink-0">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[0.68rem] font-mono uppercase tracking-wider text-gold font-bold">
                      Técnica 4
                    </span>
                    <h3 className="font-serif text-lg font-semibold text-app-text">
                      Respeite os Marcadores de Dinâmica
                    </h3>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-app-text-muted leading-relaxed">
                  Quando o seu olho bater no marcador <code className="font-mono text-xs bg-gold/10 px-2 py-0.5 rounded text-gold font-semibold">[ 🤫 Pausa de 3s ]</code>, <strong className="text-app-text">pare de falar fisicamente e conte 1... 2... 3... na mente</strong>.
                </p>

                <div className="p-4 rounded-xl bg-gold/10 border border-gold/30 space-y-2">
                  <p className="text-xs sm:text-sm text-app-text font-serif italic">
                    &ldquo;O silêncio no púlpito gera um impacto emocional e espiritual 10 vezes maior do que gritar sem parar!&rdquo;
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 font-mono text-[0.68rem]">
                    <span className="bg-app-bg px-2 py-0.5 rounded border border-border/80">🤫 Silêncio dramático</span>
                    <span className="bg-app-bg px-2 py-0.5 rounded border border-border/80">⚡ Variação vocal</span>
                    <span className="bg-app-bg px-2 py-0.5 rounded border border-border/80">💡 Metáfora viva</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 dark:border-[#221c15] text-xs font-serif italic text-app-text-muted">
                A modulação vocal é a moldura que destaca o quadro da Palavra.
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="rounded-3xl border border-gold/40 bg-gradient-to-br from-gold/10 via-app-surface to-gold/5 p-8 sm:p-12 text-center space-y-6 shadow-xl">
          <div className="max-w-xl mx-auto space-y-3">
            <h3 className="font-serif text-2xl sm:text-3xl font-normal text-app-text">
              Pronto para construir o seu sermão no Estúdio?
            </h3>
            <p className="text-xs sm:text-sm text-app-text-muted leading-relaxed">
              Aplique agora o Método da Marcha-Ré e os 4 Degraus no seu próximo texto bíblico.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/estudio"
              className="w-full sm:w-auto bg-gold text-primary-foreground hover:bg-gold/90 font-semibold px-8 py-3 rounded-full shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <span>Ir para o Estúdio de Sermões</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
