import {
  BookOpen, ChevronRight, Copy, Download, Facebook,
  Instagram, MessageCircle, Send, Share2, Shuffle, Twitter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// ─── Mockups ──────────────────────────────────────────────────────────────────

function MockVerseToolbarShare() {
  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-border bg-app-surface p-3 w-full max-w-[280px] mx-auto shadow-md space-y-1.5">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <span className="font-mono text-[0.55rem] uppercase tracking-widest text-gold">Filipenses 4 · ACF</span>
        </div>
        <div className="flex gap-2 px-2 py-1 rounded bg-gold/10 border border-gold/30 text-[0.65rem] text-app-text">
          <span className="shrink-0 font-mono text-[0.5rem] text-gold font-bold">13</span>
          <span>Posso tudo em Cristo que me fortalece.</span>
        </div>
      </div>
      <div className="flex justify-center">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-app-surface px-2 py-1.5 shadow-md">
          <span className="rounded px-1.5 py-0.5 text-[0.55rem] text-app-text-muted border border-border">📖 Estudar</span>
          <span className="rounded px-1.5 py-0.5 text-[0.55rem] text-app-text-muted border border-border">📋 Copiar</span>
          <span className="rounded px-2 py-0.5 text-[0.55rem] text-gold border border-gold/50 bg-gold/10 font-semibold flex items-center gap-0.5">
            <Share2 className="h-2.5 w-2.5" /> Compartilhar
          </span>
          <span className="rounded px-1.5 py-0.5 text-[0.55rem] text-app-text-muted border border-border">🎨</span>
          <span className="rounded px-1.5 py-0.5 text-[0.55rem] text-app-text-muted border border-border">✏️</span>
        </div>
      </div>
    </div>
  );
}

function MockTemplateSelector() {
  const templates = ["Pergaminho", "Minimalista", "Story", "Banner", "Editorial"];
  return (
    <div className="rounded-xl border border-border bg-app-surface w-full max-w-[280px] mx-auto shadow-md overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="font-serif text-[0.78rem] text-app-text">Gerar Card do Versículo</p>
          <p className="font-mono text-[0.5rem] text-app-text-muted uppercase tracking-widest">Fl 4:13 · ACF</p>
        </div>
        <span className="text-app-text-muted/40 text-[0.65rem]">✕</span>
      </div>
      <div className="p-3 space-y-3">
        <p className="font-mono text-[0.5rem] uppercase tracking-widest text-app-text-muted">Escolha o template</p>
        <div className="flex flex-wrap gap-1.5">
          {templates.map((t, i) => (
            <button
              key={t}
              className={`rounded-full border px-2.5 py-1 text-[0.58rem] font-medium transition-all ${
                i === 0 ? "border-gold bg-gold/10 text-gold" : "border-border text-app-text-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockCardPreview() {
  return (
    <div className="rounded-xl border border-border bg-app-surface w-full max-w-[280px] mx-auto shadow-md overflow-hidden">
      <div className="p-3">
        <p className="font-mono text-[0.5rem] uppercase tracking-widest text-app-text-muted mb-2">Pré-visualização</p>
        {/* Simulated card */}
        <div className="rounded-lg overflow-hidden" style={{ background: "linear-gradient(135deg, #2d1f00 0%, #1a1200 100%)" }}>
          <div className="p-4 text-center space-y-2">
            <div className="w-8 h-0.5 bg-gold/50 mx-auto rounded-full" />
            <p className="font-serif text-[0.75rem] italic text-amber-100 leading-relaxed">
              "Posso tudo em Cristo que me fortalece."
            </p>
            <p className="font-mono text-[0.5rem] uppercase tracking-widest text-gold/60">Filipenses 4:13 · ACF</p>
            <div className="w-8 h-0.5 bg-gold/50 mx-auto rounded-full" />
            <p className="text-[0.45rem] text-amber-100/40 tracking-widest">BÍBLIA VIVE</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1 mt-2">
          <Shuffle className="h-2.5 w-2.5 text-app-text-muted" />
          <span className="text-[0.55rem] text-app-text-muted">Trocar template</span>
        </div>
      </div>
    </div>
  );
}

function MockShareOptions() {
  const socials = [
    { icon: <MessageCircle className="h-3 w-3" />, label: "WhatsApp", color: "#25D366" },
    { icon: <Facebook className="h-3 w-3" />, label: "Facebook", color: "#1877F2" },
    { icon: <Twitter className="h-3 w-3" />, label: "Twitter/X", color: "#000000" },
    { icon: <Send className="h-3 w-3" />, label: "Telegram", color: "#26A5E4" },
    { icon: <Instagram className="h-3 w-3" />, label: "Instagram", color: "#ee2a7b" },
  ];
  return (
    <div className="rounded-xl border border-border bg-app-surface w-full max-w-[280px] mx-auto shadow-md overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <p className="font-serif text-[0.78rem] text-app-text">Compartilhar nas Redes?</p>
        <p className="text-[0.6rem] text-app-text-muted mt-0.5">Selecione a rede social abaixo.</p>
      </div>
      <div className="p-3 flex flex-wrap gap-1.5">
        {socials.map((s) => (
          <button
            key={s.label}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.58rem] font-medium border"
            style={{
              backgroundColor: `${s.color}18`,
              borderColor: `${s.color}30`,
              color: s.color === "#000000" ? "var(--app-text)" : s.color,
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MockCopyText() {
  return (
    <div className="rounded-xl border border-border bg-app-surface w-full max-w-[280px] mx-auto shadow-md overflow-hidden p-4 space-y-3">
      <p className="font-mono text-[0.5rem] uppercase tracking-widest text-app-text-muted">Copiar texto do versículo</p>
      <div className="rounded-lg border border-border bg-app-raised/50 px-3 py-2 text-[0.65rem] text-app-text">
        "Posso tudo em Cristo que me fortalece."<br />
        <span className="text-app-text-muted">— Filipenses 4:13 (ACF) | Bíblia Vive</span>
      </div>
      <button className="w-full flex items-center justify-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[0.6rem] font-medium text-app-text hover:bg-app-raised">
        <Copy className="h-3 w-3" /> Copiar Texto
      </button>
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

const steps = [
  {
    number: 1,
    icon: <BookOpen className="h-4 w-4" />,
    title: "Selecione o versículo para compartilhar",
    description: "Toque ou clique no versículo que deseja compartilhar.",
    detail:
      "Qualquer versículo pode ser compartilhado. Versículos curtos e impactantes como Filipenses 4:13, João 3:16 ou Salmos 23:1 funcionam muito bem em cards para redes sociais.",
    visual: <MockVerseToolbarShare />,
  },
  {
    number: 2,
    icon: <Share2 className="h-4 w-4" />,
    title: "Clique em 'Compartilhar'",
    description: "O modal de geração de card abrirá com 5 templates.",
    detail:
      "O gerador de cards abre com uma pré-visualização em tempo real. Você escolhe o template e vê instantaneamente como o versículo ficará antes de baixar ou compartilhar.",
    visual: <MockTemplateSelector />,
  },
  {
    number: 3,
    icon: <Shuffle className="h-4 w-4" />,
    title: "Escolha o template e visualize",
    description: "Navegue pelos 5 estilos disponíveis: Pergaminho, Minimalista, Story, Banner e Editorial.",
    detail:
      "Cada template tem um propósito diferente: Story é otimizado para Instagram Stories (vertical), Banner para posts horizontais, Pergaminho para um visual clássico e solene. Experimente até encontrar o ideal.",
    visual: <MockCardPreview />,
    highlight: true,
  },
  {
    number: 4,
    icon: <Share2 className="h-4 w-4" />,
    title: "Compartilhe nas redes sociais",
    description: "Clique em 'Compartilhar Imagem' e escolha a plataforma.",
    detail:
      "O sistema copia automaticamente a imagem para sua área de transferência e abre a plataforma escolhida. No WhatsApp e Telegram o envio é direto. No Instagram e TikTok, a imagem é baixada para você postar manualmente.",
    visual: <MockShareOptions />,
  },
  {
    number: 5,
    icon: <Copy className="h-4 w-4" />,
    title: "Ou copie apenas o texto",
    description: "Para mensagens e e-mails, use a opção de copiar o texto formatado.",
    detail:
      "O botão 'Copiar Texto' copia o versículo no formato: \"texto\" — Livro Capítulo:Versículo (Versão) | Bíblia Vive. Ideal para WhatsApp, grupos de oração e e-mails sem precisar de imagem.",
    visual: <MockCopyText />,
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HowToShareTab() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Intro */}
      <div className="rounded-2xl border border-border bg-app-surface p-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 border border-gold/30">
            <Share2 className="h-4 w-4 text-gold" />
          </span>
          <h2 className="font-serif text-xl text-app-text">Compartilhando Versículos</h2>
        </div>
        <p className="text-sm text-app-text-muted leading-relaxed">
          O Bíblia Vive gera <strong className="text-app-text">cards visuais profissionais</strong> de qualquer versículo para você compartilhar nas redes sociais, grupos de WhatsApp, Telegram ou e-mail.
          São <strong className="text-app-text">5 templates exclusivos</strong> com formatos otimizados para cada plataforma.
        </p>
        {/* Template badges */}
        <div className="flex flex-wrap gap-2 pt-1">
          {["📜 Pergaminho", "⬜ Minimalista", "📱 Story", "🖼️ Banner", "📰 Editorial"].map((t) => (
            <span key={t} className="rounded-full border border-border bg-app-raised/50 px-3 py-1 text-[0.7rem] text-app-text-muted">
              {t}
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
        <span className="text-xl shrink-0">📱</span>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-app-text">Dica para Instagram e TikTok</p>
          <p className="text-[0.82rem] text-app-text-muted leading-relaxed">
            Para o Instagram Stories, use o template <strong className="text-app-text">Story</strong> — ele já vem no formato vertical (9:16) otimizado. Baixe a imagem, abra o Instagram e adicione como Story ou Reels.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold-bg/30 to-app-surface p-8 text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Share2 className="h-5 w-5 text-gold" />
          <h3 className="font-serif text-xl text-app-text">Compartilhe a Palavra agora</h3>
        </div>
        <p className="text-sm text-app-text-muted max-w-sm mx-auto">
          Abra Filipenses 4:13 e crie seu primeiro card para compartilhar com amigos e família.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            className="bg-gold text-app-bg hover:bg-gold/90 font-bold shadow-lg shadow-gold/20 gap-2"
            onClick={() => navigate("/acf/fp/4#v13")}
          >
            <BookOpen className="h-4 w-4" />
            Abrir Filipenses 4:13
          </Button>
          <Button
            variant="outline"
            className="border-gold/30 text-gold hover:bg-gold/10 gap-2"
            onClick={() => navigate("/compartilhar")}
          >
            <Download className="h-4 w-4" />
            Gerador de Cards
          </Button>
        </div>
      </div>
    </div>
  );
}
