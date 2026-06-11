import { BookOpen, ChevronRight, MessageSquare, MousePointer2, Quote, Search, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// ─── Mockup components — imitate the app UI visually ─────────────────────────

function MockVerseRow({ active = false }: { active?: boolean }) {
  return (
    <div
      className={`flex gap-2 rounded-lg px-3 py-2 text-[0.72rem] leading-relaxed transition-colors ${
        active
          ? "bg-gold/15 border border-gold/40 text-app-text"
          : "text-app-text-muted"
      }`}
    >
      <span className={`shrink-0 font-mono text-[0.6rem] pt-0.5 ${active ? "text-gold font-bold" : "text-app-text-muted/50"}`}>16</span>
      <span>
        Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.
      </span>
    </div>
  );
}

function MockToolbar() {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-gold/50 bg-app-surface shadow-lg px-3 py-1.5 w-fit mx-auto">
      <button className="flex items-center gap-1 rounded-full bg-gold px-3 py-1 text-[0.65rem] font-bold text-app-bg">
        <BookOpen className="h-3 w-3" /> Estudar
      </button>
      <button className="flex items-center gap-1 rounded-full px-2 py-1 text-[0.65rem] text-app-text-muted hover:bg-app-raised">
        🖊️ Nota
      </button>
      <button className="flex items-center gap-1 rounded-full px-2 py-1 text-[0.65rem] text-app-text-muted hover:bg-app-raised">
        🎨 Cor
      </button>
      <button className="flex items-center gap-1 rounded-full px-2 py-1 text-[0.65rem] text-app-text-muted hover:bg-app-raised">
        📤 Compartilhar
      </button>
    </div>
  );
}

function MockStudyPanelCommentaryTab({ state }: { state: "empty" | "loading" | "result" }) {
  return (
    <div className="rounded-xl border border-border bg-app-surface overflow-hidden w-full max-w-[260px] mx-auto shadow-xl">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="font-mono text-[0.55rem] uppercase tracking-widest text-app-text-muted">Painel de Estudo</span>
        <span className="text-[0.55rem] text-app-text-muted/40">✕</span>
      </div>
      {/* Verse preview */}
      <div className="border-b border-border bg-gold-bg/20 px-3 py-2">
        <p className="font-mono text-[0.5rem] uppercase tracking-widest text-gold mb-0.5">Jo 3:16 · ACF</p>
        <p className="font-serif text-[0.65rem] italic text-app-text line-clamp-2">"Porque Deus amou o mundo..."</p>
      </div>
      {/* Tabs */}
      <div className="grid grid-cols-4 border-b border-border">
        {["Ctx", "Refs", "Lang", "Coment."].map((tab, i) => (
          <button
            key={tab}
            className={`py-1.5 text-[0.5rem] font-medium border-b-2 transition-colors ${
              i === 3 ? "border-gold text-gold" : "border-transparent text-app-text-muted"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* Commentary content */}
      <div className="p-3 min-h-[80px] flex flex-col items-center justify-center">
        {state === "empty" && (
          <div className="text-center space-y-2">
            <div className="w-8 h-8 bg-gold/10 rounded-full flex items-center justify-center mx-auto">
              <MessageSquare className="h-4 w-4 text-gold" />
            </div>
            <p className="text-[0.6rem] text-app-text font-semibold">Comentários Teológicos</p>
            <p className="text-[0.55rem] text-app-text-muted">Acesse perspectivas de teólogos históricos.</p>
            <div className="w-full rounded-lg bg-gold text-app-bg text-[0.6rem] font-bold py-1.5 text-center mt-2">
              Buscar Comentários
            </div>
          </div>
        )}
        {state === "loading" && (
          <div className="text-center space-y-1.5">
            <div className="w-5 h-5 rounded-full border-2 border-gold border-t-transparent animate-spin mx-auto" />
            <p className="text-[0.55rem] text-app-text-muted">Analisando teologia...</p>
            <p className="text-[0.5rem] text-app-text-muted/60">Pode levar 60–90 segundos</p>
          </div>
        )}
        {state === "result" && (
          <div className="w-full space-y-2">
            <div className="rounded-lg border border-border bg-app-raised p-2 space-y-1">
              <p className="font-mono text-[0.5rem] uppercase tracking-widest text-gold">Matthew Henry</p>
              <p className="text-[0.58rem] text-app-text leading-relaxed line-clamp-3">
                "O amor de Deus pelo mundo é o fundamento de toda redenção. Não um amor sentimental, mas um amor de propósito e ação..."
              </p>
            </div>
            <div className="rounded-lg border border-border bg-app-raised p-2 space-y-1">
              <p className="font-mono text-[0.5rem] uppercase tracking-widest text-gold">Albert Barnes</p>
              <p className="text-[0.58rem] text-app-text leading-relaxed line-clamp-2">
                "A palavra 'mundo' aqui é abrangente — inclui todos os povos e nações..."
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step definition ──────────────────────────────────────────────────────────

interface Step {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  detail: string;
  visual: React.ReactNode;
  highlight?: boolean;
}

const steps: Step[] = [
  {
    number: 1,
    icon: <BookOpen className="h-4 w-4" />,
    title: "Abra um capítulo da Bíblia",
    description: "Navegue até qualquer livro e capítulo.",
    detail:
      "Na página inicial, use a busca ou navegue pelo índice de livros. Para acompanhar este tutorial, abra João capítulo 3.",
    visual: (
      <div className="rounded-xl border border-border bg-app-surface p-3 w-full max-w-[280px] mx-auto shadow-md">
        <div className="flex items-center gap-2 border-b border-border pb-2 mb-2">
          <span className="font-mono text-[0.55rem] uppercase tracking-widest text-gold">João 3 · ACF</span>
        </div>
        <div className="space-y-1">
          {[15, 16, 17].map((n) => (
            <div key={n} className={`flex gap-2 rounded px-2 py-1 text-[0.65rem] ${n === 16 ? "text-app-text" : "text-app-text-muted/70"}`}>
              <span className="shrink-0 font-mono text-[0.55rem] text-app-text-muted/50 pt-0.5">{n}</span>
              <span className="line-clamp-1">{n === 16 ? "Porque Deus amou o mundo de tal maneira..." : n === 15 ? "Para que todo aquele que nele crê não pereça..." : "Porque Deus não enviou o seu Filho..."}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    number: 2,
    icon: <MousePointer2 className="h-4 w-4" />,
    title: "Selecione um versículo",
    description: "Toque ou clique no versículo que deseja estudar.",
    detail:
      "Ao clicar, o versículo é destacado e um menu de ações aparece. Tente clicar em João 3:16 — um dos versículos mais comentados de toda a Bíblia.",
    visual: (
      <div className="rounded-xl border border-border bg-app-surface p-3 w-full max-w-[280px] mx-auto shadow-md space-y-1.5">
        <div className="flex items-center gap-2 border-b border-border pb-2 mb-2">
          <span className="font-mono text-[0.55rem] uppercase tracking-widest text-gold">João 3 · ACF</span>
        </div>
        <MockVerseRow />
        <MockVerseRow active />
        <MockVerseRow />
      </div>
    ),
  },
  {
    number: 3,
    icon: <Sparkles className="h-4 w-4" />,
    title: "Clique em 'Estudar'",
    description: "No menu de ações, escolha a opção Estudar.",
    detail:
      "Uma barra de ações surge abaixo do versículo selecionado. O botão 'Estudar' (em dourado) abre o Painel de Estudo — a central de análise teológica do versículo.",
    visual: (
      <div className="space-y-2">
        <div className="rounded-xl border border-border bg-app-surface p-3 w-full max-w-[280px] mx-auto shadow-md">
          <MockVerseRow active />
        </div>
        <MockToolbar />
        <p className="text-center text-[0.6rem] text-gold animate-pulse">← Clique aqui</p>
      </div>
    ),
  },
  {
    number: 4,
    icon: <Quote className="h-4 w-4" />,
    title: "Vá à aba 'Comentários'",
    description: "No painel lateral, selecione a aba Comentários.",
    detail:
      "O Painel de Estudo abre com 4 abas: Contexto, Referências, Idioma Original e Comentários. Clique na última aba para acessar o acervo teológico histórico.",
    visual: (
      <div className="flex justify-center">
        <MockStudyPanelCommentaryTab state="empty" />
      </div>
    ),
  },
  {
    number: 5,
    icon: <Search className="h-4 w-4" />,
    title: "Clique em 'Buscar Comentários'",
    description: "Acione a busca nos comentários históricos.",
    detail:
      "Nossa IA utiliza RAG (Recuperação Aumentada por Geração) para localizar os trechos mais relevantes de teólogos como Matthew Henry, Albert Barnes e John Gill. O processo leva entre 60 e 90 segundos.",
    visual: (
      <div className="flex justify-center">
        <MockStudyPanelCommentaryTab state="loading" />
      </div>
    ),
    highlight: true,
  },
  {
    number: 6,
    icon: <MessageSquare className="h-4 w-4" />,
    title: "Leia, reflita e anote",
    description: "Os comentários históricos são exibidos por teólogo.",
    detail:
      "Cada comentário mostra a fonte e o trecho original traduzido. Aproveite para criar uma Nota no versículo com seus insights — ela ficará salva na sua conta.",
    visual: (
      <div className="flex justify-center">
        <MockStudyPanelCommentaryTab state="result" />
      </div>
    ),
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function HowToStudyTab() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Intro */}
      <div className="rounded-2xl border border-border bg-app-surface p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 border border-gold/30">
            <Quote className="h-4 w-4 text-gold" />
          </span>
          <h2 className="font-serif text-xl text-app-text">Estudar com Comentários Teológicos</h2>
        </div>
        <p className="text-sm text-app-text-muted leading-relaxed">
          O recurso de Comentários do Bíblia Vive conecta você ao pensamento de teólogos históricos como
          <strong className="text-app-text"> Matthew Henry</strong>, <strong className="text-app-text">Albert Barnes</strong> e{" "}
          <strong className="text-app-text">John Gill</strong> sobre qualquer versículo da Bíblia.
          Siga o passo a passo abaixo usando <strong className="text-gold">João 3:16</strong> como exemplo.
        </p>
      </div>

      {/* Steps */}
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-5 top-6 bottom-6 w-px bg-gradient-to-b from-gold/40 via-border to-border hidden sm:block" />

        <div className="space-y-6">
          {steps.map((step, idx) => (
            <div
              key={step.number}
              className={`relative flex gap-4 sm:gap-6 rounded-2xl border p-5 transition-all ${
                step.highlight
                  ? "border-gold/40 bg-gold-bg/10 shadow-[0_0_30px_rgba(212,175,55,0.08)]"
                  : "border-border bg-app-surface"
              }`}
            >
              {/* Step number circle */}
              <div className="relative z-10 shrink-0">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold text-sm transition-all ${
                    step.highlight
                      ? "border-gold bg-gold text-app-bg shadow-lg shadow-gold/30"
                      : "border-border bg-app-bg text-app-text-muted"
                  }`}
                >
                  {step.number}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={step.highlight ? "text-gold" : "text-app-text-muted"}>
                      {step.icon}
                    </span>
                    <h3 className="font-semibold text-app-text text-base">{step.title}</h3>
                    {step.highlight && (
                      <span className="ml-auto rounded-full bg-gold/20 border border-gold/30 px-2 py-0.5 text-[0.6rem] font-bold text-gold tracking-widest">
                        PRO
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-app-text-muted">{step.description}</p>
                </div>

                {/* Visual mockup */}
                <div className="rounded-xl bg-app-bg border border-border/60 p-4">
                  {step.visual}
                </div>

                {/* Detail text */}
                <p className="text-[0.82rem] text-app-text-muted leading-relaxed border-l-2 border-gold/30 pl-3">
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold-bg/30 to-app-surface p-8 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 text-gold" />
          <h3 className="font-serif text-xl text-app-text">Pronto para começar?</h3>
        </div>
        <p className="text-sm text-app-text-muted max-w-sm mx-auto">
          Abra João 3:16 agora e faça seu primeiro comentário teológico — você tem{" "}
          <strong className="text-gold">1 análise gratuita</strong> disponível.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            className="bg-gold text-app-bg hover:bg-gold/90 font-bold shadow-lg shadow-gold/20 gap-2"
            onClick={() => navigate("/acf/jo/3#v16")}
          >
            <BookOpen className="h-4 w-4" />
            Abrir João 3:16
          </Button>
          <Button
            variant="outline"
            className="border-gold/30 text-gold hover:bg-gold/10 gap-2"
            onClick={() => navigate("/pro")}
          >
            Conhecer o Plano PRO
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
