import { BookOpen, Footprints, Notebook, Scroll, Sprout } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// ─── Mockups (Prints de Demonstração) ─────────────────────────────────────────

function MockFloatingButtonRead() {
  return (
    <div className="relative rounded-xl border border-border bg-app-surface w-full max-w-[320px] mx-auto shadow-md overflow-hidden p-3.5 space-y-2">
      <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
        <span className="font-mono text-[0.55rem] uppercase tracking-widest text-gold">João 3 · ACF</span>
      </div>
      <div className="space-y-1.5 text-[0.68rem] text-app-text font-serif leading-relaxed">
        <p className="text-app-text-muted/70">
          <span className="font-mono text-[0.5rem] mr-1 text-gold font-bold">1</span>
          E havia entre os fariseus um homem, chamado Nicodemos...
        </p>
        <p>
          <span className="font-mono text-[0.5rem] mr-1 text-gold font-bold">3</span>
          Jesus respondeu: Na verdade, te digo que aquele que não nascer de novo, não pode ver o reino de Deus.
        </p>
      </div>

      {/* Botão Flutuante do Caderno no canto inferior esquerdo */}
      <div className="pt-2 flex items-center justify-between border-t border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-black font-bold shadow-lg border border-gold animate-bounce">
            <Notebook className="h-4 w-4" />
          </div>
          <span className="text-[0.62rem] font-medium text-gold font-sans">← Clique no botão do Caderno</span>
        </div>
      </div>
    </div>
  );
}

function MockCadernoDrawer() {
  return (
    <div className="rounded-xl border border-border bg-[#141414] w-full max-w-[320px] mx-auto shadow-2xl overflow-hidden text-app-text font-sans">
      {/* Header do Drawer */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/60 bg-[#181818]">
        <div className="flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-wider text-app-text font-mono">
          <Notebook className="h-3.5 w-3.5 text-gold" />
          <span>MEU CADERNO</span>
        </div>
        <span className="text-[0.65rem] text-app-text-muted">✕</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/60 text-[0.62rem] font-medium">
        <div className="flex-1 py-2 text-center text-gold border-b-2 border-gold font-semibold">Neste Capítulo</div>
        <div className="flex-1 py-2 text-center text-app-text-muted">Todos os Cadernos</div>
      </div>

      {/* Corpo do Caderno */}
      <div className="p-3.5 space-y-4">
        {/* Seção Registrar Memória da Caminhada */}
        <div className="space-y-2">
          <p className="text-[0.55rem] font-mono tracking-wider uppercase text-app-text-muted font-semibold">
            REGISTRAR MEMÓRIA DA CAMINHADA:
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button className="py-2 px-2 rounded-lg border border-gold/50 bg-gold/10 text-gold text-[0.65rem] font-medium text-center shadow-sm">
              Reflexão
            </button>
            <button className="py-2 px-2 rounded-lg border border-border bg-app-surface text-app-text-muted text-[0.65rem] font-medium text-center hover:border-gold/30">
              Oração
            </button>
            <button className="py-2 px-2 rounded-lg border border-border bg-app-surface text-app-text-muted text-[0.65rem] font-medium text-center hover:border-gold/30">
              Testemunho
            </button>
            <button className="py-2 px-2 rounded-lg border border-border bg-app-surface text-app-text-muted text-[0.65rem] font-medium text-center hover:border-gold/30">
              Jejum / Propósito
            </button>
          </div>

          <div className="pt-1">
            <button className="w-full py-2 rounded-lg bg-gold text-black font-semibold text-[0.68rem] text-center shadow">
              + Novo caderno livre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockTimeline() {
  const entries = [
    { type: "Reflexão", ref: "João 15:4", date: "Hoje", text: '"Permanecer é uma decisão diária..."' },
    { type: "Oração", ref: "Salmos 23:1", date: "Ontem", text: '"Senhor, ensina-me a confiar..."' },
    { type: "Testemunho", ref: "Filipenses 4:7", date: "Esta semana", text: '"Deus respondeu aquela oração..."' },
  ];

  return (
    <div className="w-full max-w-[280px] mx-auto space-y-2">
      {entries.map((item, i) => (
        <div key={i} className="rounded-xl border border-border bg-app-surface p-3 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-[0.6rem]">
            <span className="px-2 py-0.5 rounded-full border border-gold/30 bg-gold/10 text-gold font-medium">
              {item.type}
            </span>
            <span className="text-app-text-muted/60">{item.date}</span>
          </div>
          <p className="text-[0.6rem] font-mono text-gold/80">{item.ref}</p>
          <p className="text-[0.62rem] text-app-text-muted italic truncate">{item.text}</p>
        </div>
      ))}
    </div>
  );
}

function MockAnsweredPrayer() {
  return (
    <div className="rounded-xl border border-border bg-app-surface w-full max-w-[280px] mx-auto p-3 space-y-2 shadow-md">
      <div className="flex items-center justify-between text-[0.6rem] border-b border-border/60 pb-1.5">
        <span className="px-2 py-0.5 rounded-full border border-border text-app-text-muted">Oração</span>
        <span className="text-app-text-muted/60">João 15:4</span>
      </div>
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 space-y-1">
        <div className="flex items-center gap-1 text-[0.6rem] font-semibold text-emerald-400">
          <span>✓</span>
          <span>Oração Respondida</span>
        </div>
        <p className="text-[0.62rem] text-app-text italic">
          "Hoje Deus respondeu aquela oração e confirmou o caminho."
        </p>
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function HowToMemorialTab() {
  const navigate = useNavigate();

  const sections = [
    {
      icon: <BookOpen className="h-5 w-5 text-gold" />,
      title: "Ler",
      lines: [
        "Abra a Bíblia e leia normalmente.",
        "Quando algo tocar seu coração, clique no botão do Caderno no canto inferior esquerdo da tela.",
      ],
      visual: <MockFloatingButtonRead />,
    },
    {
      icon: <Sprout className="h-5 w-5 text-gold" />,
      title: "Preservar",
      lines: [
        "Escolha o tipo de registro que deseja guardar.",
        "Tudo ficará ligado ao capítulo onde aquele momento aconteceu.",
      ],
      visual: <MockCadernoDrawer />,
    },
    {
      icon: <Scroll className="h-5 w-5 text-gold" />,
      title: "Relembrar",
      lines: [
        "Sempre que desejar, volte ao Memorial.",
        "Lá você reencontra sua caminhada organizada em uma linha do tempo simples.",
      ],
      visual: <MockTimeline />,
    },
    {
      icon: <Footprints className="h-5 w-5 text-gold" />,
      title: "Continuar caminhando",
      lines: [
        "Cada novo capítulo pode se tornar uma nova lembrança.",
        "A Palavra permanece. O Memorial ajuda você a preservá-la.",
      ],
      visual: <MockAnsweredPrayer />,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-10 font-sans">
      {/* 4 Movimentos */}
      <div className="space-y-8">
        {sections.map((sec, idx) => (
          <div key={idx} className="rounded-2xl border border-border bg-app-surface p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/10 border border-gold/30">
                {sec.icon}
              </span>
              <h2 className="font-serif text-xl font-semibold text-app-text tracking-tight">
                {sec.emoji} {sec.title}
              </h2>
            </div>

            <div className="space-y-1 text-sm text-app-text-muted font-serif leading-relaxed">
              {sec.lines.map((line, lIdx) => (
                <p key={lIdx}>{line}</p>
              ))}
            </div>

            {/* Print / Mockup */}
            <div className="rounded-xl bg-app-bg border border-border/60 p-4">
              {sec.visual}
            </div>
          </div>
        ))}
      </div>

      {/* Apenas 2 Botões no Final */}
      <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          className="bg-gold text-app-bg hover:bg-gold/90 font-bold shadow-lg shadow-gold/20 gap-2 py-6 text-sm"
          onClick={() => navigate("/acf/jo/15")}
        >
          <BookOpen className="h-4 w-4" />
          Abrir a Bíblia
        </Button>
        <Button
          variant="outline"
          className="border-gold/30 text-gold hover:bg-gold/10 gap-2 py-6 text-sm"
          onClick={() => navigate("/memorial")}
        >
          <Scroll className="h-4 w-4" />
          Abrir Memorial
        </Button>
      </div>
    </div>
  );
}
