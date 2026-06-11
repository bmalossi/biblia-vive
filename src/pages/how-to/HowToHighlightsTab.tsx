import { BookOpen, ChevronRight, Highlighter, Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// ─── Color data (matches HighlightPicker.tsx exactly) ────────────────────────

const COLORS = [
  { id: "yellow", hex: "#FACC15", label: "Amarelo", use: "Promessas de Deus" },
  { id: "blue",   hex: "#60A5FA", label: "Azul",    use: "Versículos de paz e conforto" },
  { id: "green",  hex: "#4ADE80", label: "Verde",   use: "Mandamentos e instruções" },
  { id: "pink",   hex: "#F472B6", label: "Rosa",    use: "Amor e graça" },
  { id: "purple", hex: "#A78BFA", label: "Roxo",    use: "Profecias e mistérios" },
];

// ─── Mockups ──────────────────────────────────────────────────────────────────

function MockVerseWithToolbar() {
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-border bg-app-surface p-3 w-full max-w-[280px] mx-auto shadow-md space-y-1.5">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <span className="font-mono text-[0.55rem] uppercase tracking-widest text-gold">Salmos 23 · ACF</span>
        </div>
        <div className="flex gap-2 px-2 py-1 text-[0.65rem] text-app-text-muted/70">
          <span className="shrink-0 font-mono text-[0.5rem]">1</span>
          <span>O Senhor é o meu pastor; nada me faltará.</span>
        </div>
        <div className="flex gap-2 px-2 py-1 rounded bg-gold/10 border border-gold/30 text-[0.65rem] text-app-text">
          <span className="shrink-0 font-mono text-[0.5rem] text-gold font-bold">2</span>
          <span>Deitar-me faz em verdes pastos; guia-me mansamente a águas tranquilas.</span>
        </div>
        <div className="flex gap-2 px-2 py-1 text-[0.65rem] text-app-text-muted/70">
          <span className="shrink-0 font-mono text-[0.5rem]">3</span>
          <span>Refrigera a minha alma; guia-me pelas veredas da justiça...</span>
        </div>
      </div>
      {/* Toolbar */}
      <div className="flex justify-center">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-app-surface px-2 py-1.5 shadow-md">
          <span className="rounded px-1.5 py-0.5 text-[0.55rem] text-app-text-muted border border-border">📖 Estudar</span>
          <span className="rounded px-1.5 py-0.5 text-[0.55rem] text-app-text-muted border border-border">📋 Copiar</span>
          <span className="rounded px-1.5 py-0.5 text-[0.55rem] text-app-text-muted border border-border">📤</span>
          <span className="rounded px-2 py-0.5 text-[0.55rem] text-gold border border-gold/50 bg-gold/10 font-semibold flex items-center gap-0.5">
            <Highlighter className="h-2.5 w-2.5" /> Destaque
          </span>
          <span className="rounded px-1.5 py-0.5 text-[0.55rem] text-app-text-muted border border-border">✏️</span>
        </div>
      </div>
    </div>
  );
}

function MockColorPicker({ selectedColor }: { selectedColor?: string }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-app-surface p-3 w-full max-w-[280px] mx-auto shadow-md">
        <div className="flex gap-2 px-2 py-1 rounded bg-gold/10 border border-gold/30 text-[0.65rem] text-app-text mb-3">
          <span className="shrink-0 font-mono text-[0.5rem] text-gold font-bold">2</span>
          <span>Deitar-me faz em verdes pastos; guia-me mansamente a águas tranquilas.</span>
        </div>
        {/* Color picker */}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-app-surface p-2 w-fit mx-auto">
          {COLORS.map((c) => (
            <button
              key={c.id}
              className={`w-5 h-5 rounded-full border-2 transition-all ${
                selectedColor === c.id ? "border-app-text scale-110 shadow" : "border-transparent"
              }`}
              style={{ backgroundColor: c.hex }}
              title={c.label}
            />
          ))}
        </div>
      </div>
      {selectedColor && (
        <p className="text-center text-[0.65rem] text-gold animate-pulse">← Escolha a cor e clique</p>
      )}
    </div>
  );
}

function MockHighlightedVerses() {
  const highlightedVerses = [
    { num: 1, text: "O Senhor é o meu pastor; nada me faltará.", color: "#FACC15" },
    { num: 2, text: "Deitar-me faz em verdes pastos; guia-me a águas tranquilas.", color: "#60A5FA" },
    { num: 4, text: "...pois tu és comigo; o teu cajado me consola.", color: "#F472B6" },
    { num: 6, text: "Bondade e misericórdia me seguirão todos os dias da minha vida.", color: "#4ADE80" },
  ];
  return (
    <div className="rounded-xl border border-border bg-app-surface p-3 w-full max-w-[280px] mx-auto shadow-md space-y-1.5">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <span className="font-mono text-[0.55rem] uppercase tracking-widest text-gold">Salmos 23 · ACF</span>
      </div>
      {highlightedVerses.map((v) => (
        <div
          key={v.num}
          className="flex gap-2 px-2 py-1 rounded text-[0.65rem] text-app-text"
          style={{ backgroundColor: `${v.color}30` }}
        >
          <span className="shrink-0 font-mono text-[0.5rem] text-app-text-muted/50 pt-0.5">{v.num}</span>
          <span>{v.text}</span>
        </div>
      ))}
    </div>
  );
}

function MockColorLegend() {
  return (
    <div className="rounded-xl border border-border bg-app-surface p-4 w-full max-w-[280px] mx-auto shadow-md space-y-3">
      <p className="font-mono text-[0.55rem] uppercase tracking-widest text-app-text-muted">Meu sistema de cores</p>
      <div className="space-y-2">
        {COLORS.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: c.hex }} />
            <div>
              <span className="text-[0.6rem] font-medium text-app-text">{c.label}</span>
              <span className="text-[0.58rem] text-app-text-muted ml-1.5">— {c.use}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

const steps = [
  {
    number: 1,
    icon: <BookOpen className="h-4 w-4" />,
    title: "Selecione o versículo que deseja destacar",
    description: "Toque ou clique no versículo para ativá-lo.",
    detail:
      "Qualquer versículo pode receber um Destaque de cor. Você pode combinar Destaque e Nota no mesmo versículo — são recursos independentes. Experimente com Salmos 23:2 para este tutorial.",
    visual: <MockVerseWithToolbar />,
  },
  {
    number: 2,
    icon: <Highlighter className="h-4 w-4" />,
    title: "Clique em 'Destaque' na barra de ações",
    description: "O seletor de cores aparecerá sobre o versículo.",
    detail:
      "O botão 'Destaque' abre um picker com 5 cores disponíveis: Amarelo, Azul, Verde, Rosa e Roxo. Cada cor pode ter um significado diferente no seu sistema de estudo pessoal.",
    visual: <MockColorPicker selectedColor="blue" />,
    highlight: true,
  },
  {
    number: 3,
    icon: <Palette className="h-4 w-4" />,
    title: "Escolha uma cor e aplique",
    description: "Clique na cor desejada — o versículo é destacado instantaneamente.",
    detail:
      "A cor é aplicada com um fundo translúcido que funciona tanto no modo claro quanto escuro. Para remover um destaque, clique novamente no botão 'Destaque' e selecione a mesma cor ativa.",
    visual: <MockHighlightedVerses />,
  },
  {
    number: 4,
    icon: <Palette className="h-4 w-4" />,
    title: "Crie seu sistema de cores pessoal",
    description: "Cada cor pode representar uma categoria de estudo.",
    detail:
      "Sugerimos um sistema de 5 categorias, mas você cria o seu. O importante é ser consistente para que, ao revisitar um capítulo, as cores já contem a história do seu estudo anterior.",
    visual: <MockColorLegend />,
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HowToHighlightsTab() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Intro */}
      <div className="rounded-2xl border border-border bg-app-surface p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 border border-gold/30">
            <Palette className="h-4 w-4 text-gold" />
          </span>
          <h2 className="font-serif text-xl text-app-text">Destaques e Cores</h2>
        </div>
        <p className="text-sm text-app-text-muted leading-relaxed">
          Os <strong className="text-app-text">Destaques</strong> transformam sua Bíblia em um mapa visual do estudo. Ao colorir versículos, você cria camadas de significado que facilitam a revisão e o aprendizado.
          São <strong className="text-app-text">5 cores disponíveis</strong>, cada uma podendo representar uma categoria na sua metodologia pessoal.
        </p>
        {/* Color preview pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {COLORS.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.7rem] font-medium text-app-text border border-border/50"
              style={{ backgroundColor: `${c.hex}25` }}
            >
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: c.hex }} />
              {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="relative">
        <div className="absolute left-5 top-6 bottom-6 w-px bg-gradient-to-b from-gold/40 via-border to-border hidden sm:block" />
        <div className="space-y-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`relative flex gap-4 sm:gap-6 rounded-2xl border p-5 transition-all ${
                (step as any).highlight
                  ? "border-gold/40 bg-gold-bg/10 shadow-[0_0_30px_rgba(212,175,55,0.08)]"
                  : "border-border bg-app-surface"
              }`}
            >
              <div className="relative z-10 shrink-0">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold text-sm ${
                  (step as any).highlight
                    ? "border-gold bg-gold text-app-bg shadow-lg shadow-gold/30"
                    : "border-border bg-app-bg text-app-text-muted"
                }`}>
                  {step.number}
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={(step as any).highlight ? "text-gold" : "text-app-text-muted"}>{step.icon}</span>
                    <h3 className="font-semibold text-app-text text-base">{step.title}</h3>
                  </div>
                  <p className="text-sm font-medium text-app-text-muted">{step.description}</p>
                </div>
                <div className="rounded-xl bg-app-bg border border-border/60 p-4">
                  {step.visual}
                </div>
                <p className="text-[0.82rem] text-app-text-muted leading-relaxed border-l-2 border-gold/30 pl-3">
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tip */}
      <div className="rounded-2xl border border-border bg-app-raised/30 p-5 flex gap-3">
        <span className="text-xl shrink-0">🎨</span>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-app-text">Sistema sugerido de cores</p>
          <div className="space-y-1 pt-1">
            {COLORS.map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-[0.78rem] text-app-text-muted">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.hex }} />
                <strong className="text-app-text">{c.label}:</strong> {c.use}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold-bg/30 to-app-surface p-8 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Palette className="h-5 w-5 text-gold" />
          <h3 className="font-serif text-xl text-app-text">Pinte sua Bíblia de significado</h3>
        </div>
        <p className="text-sm text-app-text-muted max-w-sm mx-auto">
          Abra Salmos 23 e experimente destacar cada versículo com uma cor diferente conforme sua categoria.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            className="bg-gold text-app-bg hover:bg-gold/90 font-bold shadow-lg shadow-gold/20 gap-2"
            onClick={() => navigate("/acf/sl/23")}
          >
            <BookOpen className="h-4 w-4" />
            Abrir Salmos 23
          </Button>
          <Button
            variant="outline"
            className="border-gold/30 text-gold hover:bg-gold/10 gap-2"
            onClick={() => navigate("/")}
          >
            Explorar a Bíblia
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
