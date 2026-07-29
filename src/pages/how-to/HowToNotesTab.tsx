import { BookOpen, ChevronRight, FileText, FolderOpen, PencilLine, Save, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// ─── Mockups ──────────────────────────────────────────────────────────────────

function MockVerseSelected() {
  return (
    <div className="rounded-xl border border-border bg-app-surface p-3 w-full max-w-[280px] mx-auto shadow-md space-y-2">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <span className="font-mono text-[0.55rem] uppercase tracking-widest text-gold">João 3 · ACF</span>
      </div>
      <div className="flex gap-2 rounded-lg px-2 py-1.5 bg-gold/10 border border-gold/30 text-[0.68rem] text-app-text">
        <span className="shrink-0 font-mono text-[0.55rem] text-gold font-bold pt-0.5">16</span>
        <span>Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito...</span>
      </div>
      <div className="flex gap-1 flex-wrap pt-1">
        <span className="rounded-full border border-gold/40 bg-transparent px-2 py-1 text-[0.58rem] text-gold font-medium">📖 Estudar</span>
        <span className="rounded-full border border-border px-2 py-1 text-[0.58rem] text-app-text-muted">📋 Copiar</span>
        <span className="rounded-full border border-border px-2 py-1 text-[0.58rem] text-app-text-muted">📤 Compartilhar</span>
        <span className="rounded-full border border-border px-2 py-1 text-[0.58rem] text-app-text-muted">🎨 Destaque</span>
        <span className="rounded-full border border-gold/60 bg-gold/5 px-2 py-1 text-[0.58rem] text-gold font-semibold flex items-center gap-0.5">
          <PencilLine className="h-2.5 w-2.5" /> Nota
        </span>
      </div>
    </div>
  );
}

function MockNoteModal({ state }: { state: "empty" | "writing" | "saved" }) {
  return (
    <div className="rounded-xl border border-border bg-app-surface w-full max-w-[280px] mx-auto shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-border">
        <div>
          <p className="font-mono text-[0.55rem] uppercase tracking-widest text-gold">João 3:16</p>
          <p className="text-[0.6rem] text-app-text-muted italic mt-0.5 line-clamp-1">"Porque Deus amou o mundo..."</p>
        </div>
        <span className="text-app-text-muted/40 text-[0.65rem]">✕</span>
      </div>
      {/* Textarea */}
      <div className="px-4 py-3">
        <div className={`w-full rounded-lg border px-3 py-2 text-[0.65rem] min-h-[70px] transition-colors ${
          state === "writing" ? "border-gold/50 text-app-text" : "border-border text-app-text-muted/40"
        }`}>
          {state === "empty" && "Escreva sua reflexão sobre este versículo..."}
          {state === "writing" && "O amor de Deus aqui é incondicional. Ele não amou porque merecemos, mas por graça. A palavra 'mundo' (kosmos) indica universalidade — nenhuma pessoa está fora do alcance desse amor..."}
          {state === "saved" && (
            <span className="text-app-text">O amor de Deus aqui é incondicional. Ele não amou porque merecemos, mas por graça...</span>
          )}
        </div>
      </div>
      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        {state === "saved" ? (
          <button className="flex items-center gap-1 text-[0.6rem] text-red-400">
            <Trash2 className="h-3 w-3" /> Excluir
          </button>
        ) : <span />}
        <div className="flex gap-2">
          <button className="rounded-lg px-2 py-1 text-[0.6rem] text-app-text-muted border border-border">Cancelar</button>
          <button className={`flex items-center gap-1 rounded-lg px-3 py-1 text-[0.6rem] font-medium ${
            state === "empty" ? "bg-gold/40 text-app-bg opacity-50" : "bg-gold text-app-bg"
          }`}>
            <Save className="h-2.5 w-2.5" /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function MockVerseWithNote() {
  return (
    <div className="rounded-xl border border-border bg-app-surface p-3 w-full max-w-[280px] mx-auto shadow-md space-y-2">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <span className="font-mono text-[0.55rem] uppercase tracking-widest text-gold">João 3 · ACF</span>
      </div>
      <div className="flex gap-2 px-2 py-1.5 text-[0.68rem] text-app-text">
        <span className="shrink-0 font-mono text-[0.55rem] text-app-text-muted/50 pt-0.5">15</span>
        <span className="text-app-text-muted/70">Para que todo aquele que nele crê não pereça...</span>
      </div>
      <div className="flex gap-2 px-2 py-1.5 rounded-lg text-[0.68rem] text-app-text relative">
        <span className="shrink-0 font-mono text-[0.55rem] text-gold font-bold pt-0.5">16</span>
        <span>Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito...</span>
        <span className="absolute top-1 right-2 text-gold" title="Nota">
          <PencilLine className="h-3 w-3" />
        </span>
      </div>
      <div className="flex gap-2 px-2 py-1.5 text-[0.68rem] text-app-text">
        <span className="shrink-0 font-mono text-[0.55rem] text-app-text-muted/50 pt-0.5">17</span>
        <span className="text-app-text-muted/70">Porque Deus não enviou o seu Filho ao mundo para que...</span>
      </div>
    </div>
  );
}

function MockMyNotesPage() {
  return (
    <div className="rounded-xl border border-border bg-app-surface w-full max-w-[280px] mx-auto shadow-md overflow-hidden">
      <div className="border-b border-border px-4 py-3 flex items-center gap-2">
        <FolderOpen className="h-4 w-4 text-gold" />
        <span className="font-serif text-[0.8rem] text-app-text">Minhas Notas</span>
      </div>
      <div className="p-3 space-y-2">
        {[
          { ref: "Jo 3:16", preview: "O amor de Deus aqui é incondicional..." },
          { ref: "Sl 23:1", preview: "O Senhor é meu pastor — a palavra hebraica rô'eh..." },
          { ref: "Rm 8:28", preview: "Todas as coisas cooperam — mesmo as difíceis..." },
        ].map((note) => (
          <div key={note.ref} className="rounded-lg border border-border bg-app-raised px-3 py-2 space-y-0.5">
            <p className="font-mono text-[0.55rem] uppercase tracking-widest text-gold">{note.ref}</p>
            <p className="text-[0.6rem] text-app-text-muted line-clamp-1">{note.preview}</p>
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
    title: "Abra um capítulo e selecione um versículo",
    description: "Toque ou clique em qualquer versículo para selecioná-lo.",
    detail:
      "Navegue até qualquer capítulo da Bíblia. Ao clicar em um versículo, ele será destacado e a barra de ações aparecerá. Experimente com João 3:16 para acompanhar este tutorial.",
    visual: <MockVerseSelected />,
  },
  {
    number: 2,
    icon: <PencilLine className="h-4 w-4" />,
    title: "Clique em 'Nota'",
    description: "Na barra de ações, selecione o botão 'Nota'.",
    detail:
      "O botão 'Nota' (com ícone de lápis) abre um modal de edição diretamente na tela. Se o versículo já tiver uma nota, o conteúdo existente será carregado para edição.",
    visual: <MockNoteModal state="empty" />,
  },
  {
    number: 3,
    icon: <FileText className="h-4 w-4" />,
    title: "Escreva sua reflexão",
    description: "Digite livremente — observações, perguntas, insights ou orações.",
    detail:
      "Não existe formato certo ou errado. Anote o que o texto significa para você, conexões com outros versículos, o que o Espírito Santo falou ao seu coração, ou perguntas para pesquisar depois.",
    visual: <MockNoteModal state="writing" />,
    highlight: true,
  },
  {
    number: 4,
    icon: <Save className="h-4 w-4" />,
    title: "Salve a nota",
    description: "Clique em 'Salvar' — a nota é sincronizada com sua conta.",
    detail:
      "As notas são salvas na nuvem (Supabase) e ficam disponíveis em qualquer dispositivo onde você acessar o Bíblia Vive. O versículo passará a exibir um ícone de lápis dourado indicando que há uma nota.",
    visual: <MockVerseWithNote />,
  },
  {
    number: 5,
    icon: <FolderOpen className="h-4 w-4" />,
    title: "Acesse todas as suas notas",
    description: "Visite 'Minhas Notas' para rever e gerenciar tudo.",
    detail:
      "Na página 'Minhas Notas' (acessível pelo menu da conta), todas as suas anotações são exibidas em ordem cronológica. Você pode ler, editar ou excluir qualquer nota a qualquer momento.",
    visual: <MockMyNotesPage />,
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HowToNotesTab() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Intro */}
      <div className="rounded-2xl border border-border bg-app-surface p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 border border-gold/30">
            <PencilLine className="h-4 w-4 text-gold" />
          </span>
          <h2 className="font-serif text-xl text-app-text">A Importância de Anotar Versículos</h2>
        </div>
        <p className="text-sm text-app-text-muted leading-relaxed">
          Anotar é um dos hábitos mais poderosos no estudo bíblico. Quando você escreve, a memória se consolida, as conexões se aprofundam e o Espírito Santo tem mais espaço para falar.
          O Bíblia Vive permite criar <strong className="text-app-text">uma nota pessoal por versículo</strong>, sincronizada em todos os seus dispositivos.
        </p>
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { icon: "💡", label: "Consolida o aprendizado" },
            { icon: "🔗", label: "Conecta passagens" },
            { icon: "☁️", label: "Salva na nuvem" },
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

      {/* Tip box */}
      <div className="rounded-2xl border border-border bg-app-raised/30 p-5 flex gap-3">
        <span className="text-xl shrink-0">💡</span>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-app-text">Dica de estudo</p>
          <p className="text-[0.82rem] text-app-text-muted leading-relaxed">
            Combine notas com Destaques coloridos para criar um sistema visual de estudo. Use uma cor para promessas, outra para mandamentos, outra para profecias — e anote a reflexão de cada versículo marcado.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold-bg/30 to-app-surface p-8 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <PencilLine className="h-5 w-5 text-gold" />
          <h3 className="font-serif text-xl text-app-text">Comece a anotar agora</h3>
        </div>
        <p className="text-sm text-app-text-muted max-w-sm mx-auto">
          Abra Salmos 23 e escreva sua primeira nota — o que esse salmo significa para você hoje?
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
            onClick={() => navigate("/memorial")}
          >
            Acessar Meu Memorial
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
