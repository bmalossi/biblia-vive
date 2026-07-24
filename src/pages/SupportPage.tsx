import Layout from "@/components/Layout";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useTranslation } from "@/i18n";
import { BookOpen, Heart, Layers, HelpCircle, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function SupportPage() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const PIX_KEY = "suporte@bibliavive.com.br";

  usePageMeta({
    title: "Apoie a Missão — Bíblia Vive",
    description:
      "A Bíblia Vive existe para cultivar a permanência das pessoas na Palavra de Deus. Se este projeto já fez parte da sua caminhada, você pode ajudar para que ele continue servindo.",
    canonical: "/apoiar",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Apoie a Missão — Bíblia Vive",
        url: `${window.location.origin}/apoiar`,
      },
    ],
  });

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    try {
      toast.success("Chave PIX copiada!");
    } catch (e) {}
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">

        {/* ── Hero ── */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gold mb-3">
            Bíblia Vive
          </h2>
          <h1 className="font-serif text-4xl sm:text-5xl text-app-text mb-6 leading-snug">
            Ajude a preservar{" "}
            <br className="hidden sm:block" />
            <span className="italic text-gold">esta missão</span>
          </h1>
          <p className="text-lg text-app-text-muted leading-relaxed mb-4">
            A Bíblia Vive existe para proteger um dos encontros mais importantes do dia:
            o encontro silencioso entre uma pessoa e a Palavra de Deus.
          </p>
          <p className="text-lg text-app-text-muted leading-relaxed">
            Se este projeto já fez parte da sua caminhada, você pode ajudar para que
            ele continue servindo milhares de outros leitores.
          </p>
          <div className="mt-8">
            <a
              href="#contribuicao"
              className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-app-background hover:bg-gold/90 transition-all shadow-lg hover:shadow-gold/20"
            >
              <Heart className="h-4 w-4" />
              Contribuir via PIX
            </a>
          </div>
        </div>

        {/* ── Nossa Convicção ── */}
        <div className="mb-20 bg-app-surface border border-border rounded-3xl p-8 lg:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-gold/10 rounded-full blur-[100px] pointer-events-none -mr-36 -mt-36" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gold mb-3">
            Nossa convicção
          </h2>
          <h3 className="font-serif text-3xl text-app-text mb-6">
            A Palavra sempre será maior que a plataforma
          </h3>
          <div className="space-y-4 text-app-text-muted leading-relaxed max-w-2xl">
            <p>A Bíblia Vive não existe para que as pessoas dependam dela.</p>
            <p>Ela existe para conduzir cada leitor às Escrituras.</p>
            <p>
              Se um dia a plataforma desaparecer, nossa maior alegria será saber que
              milhares de pessoas permaneceram na Palavra.
            </p>
          </div>
        </div>

        {/* ── Como sua contribuição ajuda ── */}
        <div className="mb-20 border-t border-border/50 pt-16">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl text-app-text">Como sua contribuição ajuda</h2>
            <p className="text-app-text-muted mt-2">
              Cada recurso nasce para facilitar a permanência na leitura
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">

            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1 h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center border border-gold/20">
                <BookOpen className="h-5 w-5 text-gold" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-app-text mb-2">
                  Manter a Palavra acessível
                </h3>
                <p className="text-app-text-muted text-sm leading-relaxed">
                  Sua contribuição ajuda a manter a plataforma disponível todos os dias,
                  para que qualquer pessoa possa abrir as Escrituras quando precisar.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1 h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                <Layers className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-app-text mb-2">
                  Continuar desenvolvendo recursos
                </h3>
                <p className="text-app-text-muted text-sm leading-relaxed">
                  Cada nova ferramenta nasce para facilitar a permanência na leitura,
                  nunca para substituir a própria Bíblia.
                </p>
              </div>
            </div>

            <div className="flex gap-4 md:col-span-2 md:max-w-lg md:mx-auto">
              <div className="flex-shrink-0 mt-1 h-10 w-10 rounded-full bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                <Heart className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-app-text mb-2">
                  Dedicar tempo à missão
                </h3>
                <p className="text-app-text-muted text-sm leading-relaxed">
                  Por trás da plataforma existe trabalho diário de estudo, desenvolvimento,
                  revisão e cuidado. Sua contribuição permite que esse trabalho continue
                  acontecendo.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ── PIX + Contribuição voluntária ── */}
        <div id="contribuicao" className="scroll-mt-24 mb-20">
          <div className="grid md:grid-cols-2 gap-6 items-stretch">

            {/* Lado esquerdo — texto */}
            <div className="bg-app-surface border border-border rounded-3xl p-8 lg:p-10 shadow-2xl relative overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 w-64 h-64 bg-gold/5 rounded-full blur-[100px] pointer-events-none -ml-32 -mt-32" />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-gold mb-3">
                Contribuição
              </h2>
              <h3 className="font-serif text-2xl text-app-text mb-5">
                Contribua apenas se isso fizer sentido para você
              </h3>
              <div className="space-y-3 text-app-text-muted text-sm leading-relaxed flex-1">
                <p>Nenhuma pessoa deve sentir obrigação de contribuir.</p>
                <p>Se Deus colocar esse desejo em seu coração, receba nossa gratidão.</p>
                <p>
                  Se hoje não for possível, continue utilizando a Bíblia Vive da mesma
                  forma.
                </p>
              </div>
              <div className="mt-6 p-4 bg-app-raised border border-border/60 rounded-xl text-xs text-app-text-muted italic leading-relaxed">
                "Cada um dê conforme determinou em seu coração, não com pesar ou por
                obrigação, pois Deus ama quem dá com alegria." — 2 Coríntios 9:7
              </div>
            </div>

            {/* Lado direito — PIX */}
            <div className="bg-app-surface border border-gold/20 rounded-3xl p-8 lg:p-10 shadow-2xl relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-[100px] pointer-events-none -mr-32 -mt-32" />
              <div className="relative flex items-center gap-2 px-3 pt-1.5 pb-1 bg-gradient-to-r from-[#443818] to-[#2c240f] border border-[#685623] rounded-md shadow-md self-start mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-[#e5c158] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#fbf0cd]">
                  PIX
                </span>
              </div>
              <h3 className="font-serif text-2xl text-app-text mb-5">
                Apoie esta missão
              </h3>
              <p className="text-sm text-app-text-muted leading-relaxed mb-6 flex-1">
                Contribua com o valor que fizer sentido para você. Qualquer valor é
                recebido com gratidão.
              </p>
              <div>
                <div className="text-xs text-app-text-muted mb-2 font-mono break-all bg-app-background p-3 rounded-xl border border-border">
                  {PIX_KEY}
                </div>
                <Button
                  onClick={handleCopyPix}
                  className="w-full h-12 flex items-center justify-center gap-2 bg-gold hover:bg-gold/90 text-app-background font-bold transition-all shadow-lg hover:shadow-gold/20 rounded-xl text-sm mt-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Chave copiada!" : "Copiar chave PIX"}
                </Button>
              </div>
            </div>

          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="mb-16 border-t border-border/50 pt-16">
          <div className="flex items-center justify-center gap-2 mb-10">
            <HelpCircle className="h-5 w-5 text-gold" />
            <h2 className="font-serif text-3xl text-app-text">Perguntas frequentes</h2>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="bg-app-surface border border-border rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-[60px] pointer-events-none" />
              <h4 className="font-medium text-app-text mb-2">
                A Bíblia Vive continuará gratuita?
              </h4>
              <p className="text-sm text-app-text-muted leading-relaxed">
                Esse é o nosso alvo. Hoje alguns recursos possuem custos técnicos
                inevitáveis, especialmente aqueles que dependem de serviços externos.
                Nosso desejo é reduzir essas limitações ao máximo e tornar cada vez mais
                conteúdo acessível gratuitamente.
              </p>
            </div>

            <div className="bg-app-surface border border-border rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-[60px] pointer-events-none" />
              <h4 className="font-medium text-app-text mb-2">
                É seguro contribuir pela chave PIX?
              </h4>
              <p className="text-sm text-app-text-muted leading-relaxed">
                Sim. A chave PIX informada é vinculada diretamente à conta responsável
                pelo projeto.
              </p>
            </div>

            <div className="bg-app-surface border border-border rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-[60px] pointer-events-none" />
              <h4 className="font-medium text-app-text mb-2">
                Posso ajudar de outra forma?
              </h4>
              <p className="text-sm text-app-text-muted leading-relaxed">
                Sim. Compartilhe a Bíblia Vive com outras pessoas. Convide alguém para
                ler as Escrituras. E, principalmente, ore para que este projeto
                permaneça fiel à Palavra de Deus.
              </p>
            </div>
          </div>
        </div>

        {/* ── Encerramento ── */}
        <div className="bg-app-surface border border-border rounded-3xl p-8 lg:p-10 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 w-full h-full bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
          <p className="text-app-text-muted leading-relaxed mb-2 relative">
            Obrigado por caminhar conosco.
          </p>
          <p className="text-app-text-muted leading-relaxed mb-3 relative">
            Que a Palavra de Deus continue encontrando espaço no seu dia.
          </p>
          <p className="font-serif text-xl text-gold italic relative">
            E que ela permaneça viva em seu coração.
          </p>
        </div>

      </div>
    </Layout>
  );
}
