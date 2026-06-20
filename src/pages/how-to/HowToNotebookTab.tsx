import { BookOpen, ChevronRight, FileText, Download, Notebook, Plus, Search, ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// ─── Mockups ──────────────────────────────────────────────────────────────────

function MockFloatingButton() {
  return (
    <div className="flex items-center justify-center p-6 bg-app-raised rounded-xl border border-border/40 w-full max-w-[280px] mx-auto shadow-sm">
      <button
        type="button"
        className="flex h-12 w-12 items-center justify-center rounded-full shadow-lg bg-gold text-black border border-gold hover:scale-105 transition-all relative"
      >
        <Notebook className="h-5 w-5" />
        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[0.68rem] font-bold text-black border border-app-surface shadow-sm">
          3
        </span>
      </button>
      <span className="ml-4 text-xs font-semibold text-app-text">Botão Flutuante (Canto Inferior Esquerdo)</span>
    </div>
  );
}

function MockNotebookEditor() {
  return (
    <div className="rounded-xl border border-border bg-app-surface w-full max-w-[280px] mx-auto shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
        <span className="text-[0.65rem] text-app-text-muted underline">← Voltar</span>
        <div className="flex items-center gap-1.5">
          <button className="p-1 rounded bg-gold/10 text-gold text-xs flex items-center gap-0.5">
            <Download className="h-3 w-3" />
          </button>
          <button className="p-1 rounded text-app-text-muted text-xs">🗑️</button>
        </div>
      </div>
      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <p className="font-mono text-[0.55rem] uppercase tracking-widest text-gold">Gênesis 1 — ARC</p>
        <input
          type="text"
          readOnly
          value="Reflexões sobre a Criação"
          className="w-full bg-transparent text-app-text text-[0.8rem] font-semibold border-0 outline-none"
        />
        <div className="h-px bg-border/40" />
        <p className="text-[0.7rem] text-app-text-muted leading-relaxed">
          No princípio criou Deus os céus e a terra. Que texto profundo! Isso estabelece a soberania de Deus antes de toda a existência temporal...
        </p>
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border/40 bg-app-surface/20">
        <span className="text-[0.6rem] text-green-500 font-semibold">Salvo automaticamente</span>
        <button className="bg-gold text-black rounded px-3 py-1 text-[0.6rem] font-semibold">Salvar</button>
      </div>
    </div>
  );
}

function MockListAndSearch() {
  return (
    <div className="rounded-xl border border-border bg-app-surface w-full max-w-[280px] mx-auto shadow-md overflow-hidden">
      {/* Tabs */}
      <div className="grid grid-cols-2 border-b border-border">
        <button className="py-2 text-[0.65rem] text-app-text-muted text-center">Neste Capítulo</button>
        <button className="py-2 text-[0.65rem] text-gold border-b-2 border-gold font-semibold text-center">Todos os Cadernos</button>
      </div>
      {/* Search & Sort */}
      <div className="p-3 space-y-2 border-b border-border/40">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-app-text-muted" />
          <input
            type="text"
            readOnly
            value="criacao"
            className="w-full h-7 pl-7 pr-2 rounded bg-app-surface border border-border text-[0.68rem] text-app-text outline-none"
          />
        </div>
        <div className="flex items-center justify-between text-[0.6rem]">
          <span className="text-app-text-muted">Ordenar:</span>
          <div className="flex gap-2">
            <span className="text-app-text-muted">Recentes</span>
            <span className="text-gold font-semibold">Livro ↑</span>
            <span className="text-app-text-muted">Livro ↓</span>
          </div>
        </div>
      </div>
      {/* Notebook Cards */}
      <div className="p-3 space-y-2">
        <div className="rounded-lg border border-gold/30 bg-gold/5 p-2.5 space-y-1 text-left">
          <p className="text-[0.7rem] font-medium text-app-text">Reflexões sobre a Criação</p>
          <p className="text-[0.55rem] text-gold font-mono uppercase tracking-wide">Gênesis 1 — ARC</p>
          <p className="text-[0.62rem] text-app-text-muted line-clamp-1">No princípio criou Deus os céus...</p>
        </div>
      </div>
    </div>
  );
}

function MockExportMenu() {
  return (
    <div className="rounded-xl border border-border bg-app-surface p-4 w-full max-w-[280px] mx-auto shadow-md space-y-3">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <span className="text-xs font-semibold text-app-text flex items-center gap-1">
          <Download className="h-3.5 w-3.5 text-gold" /> Opções de Exportação
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="rounded border border-border px-3 py-1.5 text-[0.68rem] hover:bg-gold/10 cursor-pointer transition-colors text-app-text-muted flex justify-between">
          <span>📄 Exportar Filtro Atual (PDF)</span>
          <span className="text-gold font-semibold">&gt;</span>
        </div>
        <div className="rounded border border-border px-3 py-1.5 text-[0.68rem] hover:bg-gold/10 cursor-pointer transition-colors text-app-text-muted flex justify-between">
          <span>📝 Exportar Filtro Atual (Word)</span>
          <span className="text-gold font-semibold">&gt;</span>
        </div>
        <div className="h-px bg-border/40 my-1" />
        <div className="rounded border border-border px-3 py-1.5 text-[0.68rem] hover:bg-gold/10 cursor-pointer transition-colors text-app-text flex justify-between font-medium">
          <span>📄 Exportar Tudo (PDF)</span>
          <span className="text-gold">&gt;</span>
        </div>
      </div>
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

const steps = [
  {
    number: 1,
    icon: <Notebook className="h-4 w-4" />,
    title: "Abra o painel do caderno",
    description: "Clique no botão flutuante no canto inferior esquerdo da página de leitura.",
    detail:
      "Em qualquer página de leitura da Bíblia, você verá um botão flutuante com o ícone de um caderno. O número dourado indica quantos estudos você já salvou no capítulo atual. Toque ou clique nele para abrir o painel lateral (no computador) ou gaveta (no celular).",
    visual: <MockFloatingButton />,
  },
  {
    number: 2,
    icon: <Plus className="h-4 w-4" />,
    title: "Escreva e salve seus estudos",
    description: "Crie um novo caderno e escreva suas reflexões.",
    detail:
      "Clique em '+ Novo caderno' para abrir o editor. Opcionalmente digite um título e escreva suas reflexões teológicas sobre o capítulo atual. O editor conta com salvamento automático para evitar perdas, mas você pode clicar em 'Salvar' para concluir imediatamente e voltar à lista de cadernos.",
    visual: <MockNotebookEditor />,
  },
  {
    number: 3,
    icon: <Search className="h-4 w-4" />,
    title: "Busque e organize seus estudos",
    description: "Acesse a aba 'Todos os Cadernos' para localizar todas as reflexões.",
    detail:
      "Use a caixa de busca em tempo real para filtrar cadernos instantaneamente pelo título, conteúdo ou nome do livro. Ordene a lista como preferir utilizando os botões 'Recentes', 'Livro ↑' (ordem da Bíblia) ou 'Livro ↓'.",
    visual: <MockListAndSearch />,
    highlight: true,
  },
  {
    number: 4,
    icon: <Download className="h-4 w-4" />,
    title: "Exporte para PDF ou Word",
    description: "Gere documentos elegantes com folha de rosto estilizada.",
    detail:
      "Exporte um único caderno clicando no ícone de Download no topo do editor. Para exportar em lote, clique no ícone de Download no cabeçalho da listagem principal: você pode exportar a lista filtrada atual (aplicando sua busca) ou todo o seu acervo pessoal de cadernos de uma única vez nos formatos PDF ou Word (.doc).",
    visual: <MockExportMenu />,
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HowToNotebookTab() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Intro */}
      <div className="rounded-2xl border border-border bg-app-surface p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 border border-gold/30">
            <Notebook className="h-4 w-4 text-gold" />
          </span>
          <h2 className="font-serif text-xl text-app-text">Caderno de Estudos da Bíblia</h2>
        </div>
        <p className="text-sm text-app-text-muted leading-relaxed">
          O *Caderno de Estudos* é um diário espiritual completo integrado à sua leitura. Diferente das Notas (que ficam restritas a um único versículo), o Caderno permite escrever estudos abrangentes sobre capítulos inteiros, formular reflexões teológicas globais, buscar textos e exportar seus estudos prontos em PDF ou Word para sua comodidade.
        </p>
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { icon: "📝", label: "Estudos de Capítulos" },
            { icon: "🔍", label: "Busca sem Acentuação" },
            { icon: "📄", label: "Exportação PDF & Word" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-app-raised/50 p-3 text-center">
              <div className="text-xl mb-1">{item.icon}</div>
              <p className="text-[0.65rem] text-app-text-muted font-medium">{item.label}</p>
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
          <p className="text-sm font-semibold text-app-text">Organização Espiritual</p>
          <p className="text-[0.82rem] text-app-text-muted leading-relaxed">
            Ordene seus cadernos com *Livro ↑* ao final de um mês ou ano de estudos para ler seu diário espiritual do início ao fim em ordem bíblica cronológica. Isso ajuda a perceber seu progresso e memorizar a sequência das Escrituras.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold-bg/30 to-app-surface p-8 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Notebook className="h-5 w-5 text-gold" />
          <h3 className="font-serif text-xl text-app-text">Comece seu diário espiritual</h3>
        </div>
        <p className="text-sm text-app-text-muted max-w-sm mx-auto">
          Abra Gênesis 1 agora, clique no botão do caderno e faça as suas primeiras anotações sobre o início da criação!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            className="bg-gold text-app-bg hover:bg-gold/90 font-bold shadow-lg shadow-gold/20 gap-2"
            onClick={() => navigate("/acf/gn/1")}
          >
            <BookOpen className="h-4 w-4" />
            Abrir Gênesis 1
          </Button>
        </div>
      </div>
    </div>
  );
}
