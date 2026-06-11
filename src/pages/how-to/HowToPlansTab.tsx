import { ArrowRight, BookMarked, BookOpen, Calendar, Check, CheckCircle, ChevronRight, Flame, SkipForward, Sparkles, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// ─── Mockups ──────────────────────────────────────────────────────────────────

function MockPlanCard() {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-app-surface p-4 shadow-sm w-full max-w-[280px] mx-auto">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold">
        <BookOpen className="h-5 w-5" />
      </div>
      <h3 className="mb-1 font-serif text-sm font-bold text-app-text">Evangelhos em 30 dias</h3>
      <p className="mb-4 flex-1 text-[0.62rem] text-app-text-muted leading-relaxed">
        Leia os quatro evangelhos (Mateus, Marcos, Lucas e João) para conhecer a fundo a vida e ensinamentos de Jesus.
      </p>
      <div className="mb-4 flex items-center gap-3 text-[0.58rem] font-medium text-app-text-muted">
        <span className="flex items-center gap-1 rounded-full bg-app-raised px-2 py-0.5">
          <Calendar className="h-3 w-3" />
          30 dias
        </span>
      </div>
      <button className="w-full rounded-lg bg-gold text-app-bg text-[0.6rem] font-bold py-1.5 text-center shadow">
        Iniciar Plano
      </button>
    </div>
  );
}

function MockPlanDashboard() {
  return (
    <div className="rounded-xl border border-border bg-app-surface w-full max-w-[280px] mx-auto shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-gold/10 to-transparent p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-[0.5rem] font-semibold uppercase tracking-wider text-gold mb-0.5">Plano Atual</h2>
            <h1 className="font-serif text-[0.8rem] font-bold text-app-text truncate mb-1.5">Evangelhos em 30 dias</h1>
            <div className="flex flex-col gap-1">
              <div className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-orange-600 dark:text-orange-400 w-fit">
                <Flame className="h-3 w-3" />
                <span className="text-[0.55rem] font-bold">5 dias seguidos</span>
              </div>
              <span className="text-[0.55rem] text-app-text-muted">Dia 1 de 30</span>
            </div>
          </div>
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-app-raised">
            <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle className="text-border" strokeWidth="10" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
              <circle
                className="text-gold"
                strokeWidth="10"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * 15) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
            </svg>
            <span className="text-[0.65rem] font-bold text-app-text">15%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockReadingList() {
  return (
    <div className="rounded-xl border border-border bg-app-surface p-4 w-full max-w-[280px] mx-auto shadow-md space-y-3">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <Calendar className="h-3.5 w-3.5 text-gold" />
        <div>
          <p className="text-[0.65rem] font-bold text-app-text">Dia 1</p>
          <p className="text-[0.55rem] text-app-text-muted">0 de 2 leituras concluídas</p>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { book: "Mateus", chap: 1, isRead: false },
          { book: "Mateus", chap: 2, isRead: false },
        ].map((item) => (
          <div
            key={item.chap}
            className="flex items-center justify-between rounded-lg border border-border bg-app-raised px-3 py-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-app-surface text-gold/40">
                <ChevronRight className="h-3 w-3" />
              </div>
              <span className="font-mono text-[0.6rem] text-app-text uppercase truncate">
                {item.book} {item.chap}
              </span>
            </div>
            <button className="flex items-center gap-1 rounded bg-gold/15 hover:bg-gold/25 px-2 py-1 text-[0.55rem] text-gold font-medium">
              <Check className="h-2.5 w-2.5" /> Marcar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockMarkedAsRead() {
  return (
    <div className="rounded-xl border border-border bg-app-surface p-4 w-full max-w-[280px] mx-auto shadow-md space-y-3">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <Calendar className="h-3.5 w-3.5 text-gold" />
        <div>
          <p className="text-[0.65rem] font-bold text-app-text">Dia 1</p>
          <p className="text-[0.55rem] text-app-text-muted">1 de 2 leituras concluídas</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-lg border border-gold/30 bg-gold-bg/10 opacity-70 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/15 text-gold">
              <Check className="h-3 w-3" />
            </div>
            <span className="font-mono text-[0.6rem] text-app-text-muted line-through uppercase truncate">
              Mateus 1
            </span>
          </div>
          <span className="text-[0.55rem] text-green-600 dark:text-green-400 font-semibold">Lido</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border bg-app-raised px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-app-surface text-gold/40">
              <ChevronRight className="h-3 w-3" />
            </div>
            <span className="font-mono text-[0.6rem] text-app-text uppercase truncate">
              Mateus 2
            </span>
          </div>
          <button className="flex items-center gap-1 rounded bg-gold/15 px-2 py-1 text-[0.55rem] text-gold font-medium">
            <Check className="h-2.5 w-2.5" /> Marcar
          </button>
        </div>
      </div>
    </div>
  );
}

function MockAdvanceDay() {
  return (
    <div className="rounded-xl border border-border bg-app-surface p-4 w-full max-w-[280px] mx-auto shadow-md text-center space-y-3">
      <div className="flex items-center justify-center gap-1.5 text-gold">
        <CheckCircle className="h-4 w-4" />
        <span className="text-[0.65rem] font-bold">Dia Concluído!</span>
      </div>
      <p className="text-[0.58rem] text-app-text-muted">
        🎉 Excelente! Todas as leituras de hoje foram concluídas.
      </p>
      <button className="flex items-center gap-1 rounded-lg border border-gold/40 hover:bg-gold/10 px-3 py-1.5 text-[0.58rem] text-gold font-bold mx-auto">
        <SkipForward className="h-3 w-3" /> Avançar para o próximo dia
      </button>
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

const steps = [
  {
    number: 1,
    icon: <BookMarked className="h-4 w-4" />,
    title: "Escolha um plano de leitura",
    description: "Navegue até a aba de Planos e selecione o ideal para você.",
    detail:
      "O Bíblia Vive oferece planos como ler os Quatro Evangelhos (30 dias), o Novo Testamento (90 dias) ou a Bíblia inteira (1 ano). Cada plano é projetado para criar consistência na sua jornada diária com as Escrituras.",
    visual: <MockPlanCard />,
  },
  {
    number: 2,
    icon: <Flame className="h-4 w-4" />,
    title: "Acompanhe suas estatísticas de leitura",
    description: "Veja seu progresso geral e sua sequência (streak) no dashboard.",
    detail:
      "Ao iniciar ou retomar um plano, você tem acesso a um painel que mostra o percentual concluído do plano e sua ofensiva de leitura (quantidade de dias seguidos que você marcou capítulos como lido).",
    visual: <MockPlanDashboard />,
  },
  {
    number: 3,
    icon: <BookOpen className="h-4 w-4" />,
    title: "Abra a leitura do dia",
    description: "Clique no nome do capítulo para começar a ler.",
    detail:
      "A seção 'Leitura de Hoje' lista as passagens bíblicas reservadas para o dia atual. Clique em qualquer uma delas para ser levado diretamente à tela de leitura e começar a desfrutar do texto sagrado.",
    visual: <MockReadingList />,
  },
  {
    number: 4,
    icon: <Check className="h-4 w-4" />,
    title: "Marque como lido",
    description: "Depois de terminar a leitura do capítulo, registre-a.",
    detail:
      "Você pode marcar o capítulo diretamente da tela de leitura ou retornar ao painel e clicar em 'Marcar como lido'. O capítulo ficará riscado e o progresso do dia subirá.",
    visual: <MockMarkedAsRead />,
    highlight: true,
  },
  {
    number: 5,
    icon: <SkipForward className="h-4 w-4" />,
    title: "Avance para o próximo dia",
    description: "Finalize todas as tarefas do dia e continue progredindo.",
    detail:
      "Uma vez que todas as leituras programadas do dia estiverem marcadas como concluídas, o sistema habilitará o botão 'Avançar para o próximo dia' para atualizar o calendário oficial do seu plano.",
    visual: <MockAdvanceDay />,
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HowToPlansTab() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Intro */}
      <div className="rounded-2xl border border-border bg-app-surface p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 border border-gold/30">
            <BookMarked className="h-4 w-4 text-gold" />
          </span>
          <h2 className="font-serif text-xl text-app-text">Planos de Leitura Bíblica</h2>
        </div>
        <p className="text-sm text-app-text-muted leading-relaxed">
          Os <strong className="text-app-text">Planos de Leitura</strong> auxiliam você a manter a constância diária de leitura, dividindo as Escrituras em metas realistas e estruturadas.
          Escolha um plano, acompanhe seu progresso, mantenha o hábito com o contador de ofensiva e crie intimidade diária com a Palavra.
        </p>
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { icon: "📅", label: "Metas diárias" },
            { icon: "🔥", label: "Dias de constância" },
            { icon: "📊", label: "Progresso em tempo real" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-app-raised/50 p-3 text-center">
              <div className="text-xl mb-1">{item.icon}</div>
              <p className="text-[0.65rem] text-app-text-muted">{item.label}</p>
            </div>
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
                step.highlight
                  ? "border-gold/40 bg-gold-bg/10 shadow-[0_0_30px_rgba(212,175,55,0.08)]"
                  : "border-border bg-app-surface"
              }`}
            >
              <div className="relative z-10 shrink-0">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold text-sm ${
                  step.highlight
                    ? "border-gold bg-gold text-app-bg shadow-lg shadow-gold/30"
                    : "border-border bg-app-bg text-app-text-muted"
                }`}>
                  {step.number}
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={step.highlight ? "text-gold" : "text-app-text-muted"}>{step.icon}</span>
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
        <span className="text-xl shrink-0">🏆</span>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-app-text">Como manter a consistência?</p>
          <p className="text-[0.82rem] text-app-text-muted leading-relaxed">
            Escolha um horário fixo no seu dia (logo de manhã ou antes de dormir) para realizar a leitura programada. A constância de poucos minutos todos os dias é muito mais transformadora do que ler muitas horas de uma única vez.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold-bg/30 to-app-surface p-8 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <BookMarked className="h-5 w-5 text-gold" />
          <h3 className="font-serif text-xl text-app-text">Inicie sua jornada de leitura</h3>
        </div>
        <p className="text-sm text-app-text-muted max-w-sm mx-auto">
          Escolha um plano de leitura agora e dê o primeiro passo para ler a Bíblia com constância e propósito.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            className="bg-gold text-app-bg hover:bg-gold/90 font-bold shadow-lg shadow-gold/20 gap-2"
            onClick={() => navigate("/planos")}
          >
            <BookMarked className="h-4 w-4" />
            Escolher um Plano
          </Button>
          <Button
            variant="outline"
            className="border-gold/30 text-gold hover:bg-gold/10 gap-2"
            onClick={() => navigate("/")}
          >
            Começar a ler
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
