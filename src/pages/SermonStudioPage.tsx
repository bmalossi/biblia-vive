import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Flame, Sparkles, CheckCircle2 } from "lucide-react";
import { getSermon, type Sermon } from "@/lib/homileticClient";
import { Button } from "@/components/ui/button";

export default function SermonStudioPage() {
  const { sermonId } = useParams<{ sermonId: string }>();
  const navigate = useNavigate();
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Flame className="w-8 h-8 text-gold animate-pulse" />
          <p className="text-sm font-sans text-app-text-muted">
            Abrindo gabinete de estudos...
          </p>
        </div>
      </div>
    );
  }

  if (!sermon) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4 bg-app-surface p-6 rounded-2xl border border-border">
          <h2 className="text-lg font-serif font-semibold text-app-text">
            Sermão não encontrado
          </h2>
          <p className="text-xs text-app-text-muted">
            O esboço solicitado não existe ou você não possui permissão para acessá-lo.
          </p>
          <Button onClick={() => navigate("/memorial")} variant="outline" className="w-full">
            Voltar ao Memorial
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-app-surface/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/memorial"
              className="p-2 rounded-xl hover:bg-app-raised text-app-text-muted hover:text-app-text transition-colors"
              title="Voltar ao Memorial"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-[0.68rem] font-mono uppercase tracking-wider text-gold font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Estúdio Homilético 3x4
              </span>
              <h1 className="text-sm sm:text-base font-serif font-bold text-app-text truncate max-w-xs sm:max-w-md">
                {sermon.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate(`/pulpito/${sermon.id}`)}
              className="bg-gold text-primary-foreground hover:bg-gold/90 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Pregar Agora</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="max-w-4xl mx-auto w-full px-4 pt-6 space-y-6 flex-1">
        {/* Bloco 0: A Chama Inicial ("Eu e Deus") */}
        <section
          data-testid="eu-e-deus-section"
          className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-500 font-semibold text-xs font-mono uppercase tracking-wide">
              <Flame className="w-4 h-4 fill-amber-500/20" />
              <span>Eu e Deus — A Chama Inicial</span>
            </div>
            {sermon.bookName && (
              <span className="text-[0.72rem] font-mono text-gold bg-app-raised px-2.5 py-0.5 rounded-full border border-gold/30">
                {sermon.bookName} {sermon.chapter}{sermon.verse ? `:${sermon.verse}` : ""}
              </span>
            )}
          </div>

          <div className="bg-app-surface/60 rounded-xl p-3.5 border border-border/60">
            <p className="text-xs sm:text-sm font-sans text-app-text leading-relaxed whitespace-pre-line italic">
              "{sermon.sparkText || "Inspiração espiritual capturada no momento da oração."}"
            </p>
          </div>

          <p className="text-[0.72rem] text-app-text-muted leading-relaxed">
            Esta mensagem nasceu da sua oração e comunhão com Deus. O Estúdio Homilético ajuda você a organizar esta inspiração sem perder o fogo que a gerou.
          </p>
        </section>

        {/* Placeholder da Estrutura Homilética (Ticket 2 em diante) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="text-sm font-serif font-bold text-app-text">
              Estrutura Homilética em Construção
            </h2>
            <span className="text-[0.68rem] font-mono text-app-text-muted bg-app-raised px-2 py-0.5 rounded-md border border-border">
              Método da Marcha-Ré
            </span>
          </div>

          <div className="p-6 rounded-2xl border border-dashed border-border/80 bg-app-surface/40 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-gold/60 mx-auto" />
            <p className="text-xs font-sans text-app-text font-medium">
              Semente homilética ancorada com sucesso no gabinete.
            </p>
            <p className="text-[0.72rem] text-app-text-muted max-w-md mx-auto">
              No próximo passo (Ticket 2), você definirá o Desfecho Homilético para destravar os blocos de Exegese, Tópicos em Degraus e Aplicação Prática.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
