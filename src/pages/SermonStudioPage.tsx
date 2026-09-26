import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Flame,
  Sparkles,
  Lock,
  Unlock,
  Target,
  CheckCircle2,
  Save,
  ShieldAlert,
  ScrollText,
} from "lucide-react";
import {
  getSermon,
  saveSermon,
  type Sermon,
  type DesfechoTipo,
} from "@/lib/homileticClient";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DESFECHO_CONFIG: Record<
  DesfechoTipo,
  { label: string; desc: string; icon: string; classes: string }
> = {
  consolacao: {
    label: "Consolação",
    desc: "Bálsamo, cura e paz pela certeza da Graça",
    icon: "🕊️",
    classes: "border-blue-500/40 text-blue-400 bg-blue-500/10",
  },
  confronto: {
    label: "Confronto",
    desc: "Arrependimento, renúncia e santidade de vida",
    icon: "⚡",
    classes: "border-amber-500/40 text-amber-400 bg-amber-500/10",
  },
  conversao: {
    label: "Conversão",
    desc: "Entrega total a Cristo e salvação",
    icon: "✝️",
    classes: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
  },
  oracao: {
    label: "Oração",
    desc: "Clamor, consagração e busca da presença",
    icon: "🙏",
    classes: "border-purple-500/40 text-purple-400 bg-purple-500/10",
  },
};

export default function SermonStudioPage() {
  const { sermonId } = useParams<{ sermonId: string }>();
  const navigate = useNavigate();
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados do Método da Marcha-Ré (Desfecho)
  const [desfechoTipo, setDesfechoTipo] = useState<DesfechoTipo | null>(null);
  const [desfechoTexto, setDesfechoTexto] = useState("");
  const [isSavingDesfecho, setIsSavingDesfecho] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Estados dos blocos homiléticos
  const [bloco1Exegese, setBloco1Exegese] = useState("");
  const [bloco1IntencaoOriginal, setBloco1IntencaoOriginal] = useState("");
  const [isSavingBloco1, setIsSavingBloco1] = useState(false);
  const [bloco3Aplicacao, setBloco3Aplicacao] = useState("");
  const [introducao, setIntroducao] = useState("");

  const isBloco2Unlocked =
    isUnlocked &&
    Boolean(
      sermon?.bloco1IntencaoOriginal &&
        sermon.bloco1IntencaoOriginal.trim().length >= 5
    );

  useEffect(() => {
    if (!sermonId) return;

    let isMounted = true;
    getSermon(sermonId).then((data) => {
      if (isMounted) {
        setSermon(data);
        if (data) {
          setDesfechoTipo(data.desfechoTipo || null);
          setDesfechoTexto(data.desfechoTexto || "");
          setBloco1Exegese(data.bloco1Exegese || "");
          setBloco1IntencaoOriginal(data.bloco1IntencaoOriginal || "");
          setBloco3Aplicacao(data.bloco3Aplicacao || "");
          setIntroducao(data.introducao || "");
          const unlocked = Boolean(data.desfechoTipo && data.desfechoTexto?.trim());
          setIsUnlocked(unlocked);
        }
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [sermonId]);

  const handleSaveDesfecho = async () => {
    if (!sermon || !desfechoTipo || !desfechoTexto.trim()) {
      toast.error("Selecione a categoria de desfecho e digite o ponto de chegada.");
      return;
    }

    setIsSavingDesfecho(true);
    try {
      const updated = await saveSermon({
        id: sermon.id,
        desfechoTipo,
        desfechoTexto: desfechoTexto.trim(),
      });
      setSermon(updated);
      setIsUnlocked(true);
      toast.success("Desfecho fixado com sucesso! Gabinete homilético desbloqueado.");
    } catch (err) {
      console.error("Erro ao salvar desfecho:", err);
      toast.error("Erro ao salvar desfecho.");
    } finally {
      setIsSavingDesfecho(false);
    }
  };

  const handleSaveBloco1 = async () => {
    if (!sermon) return;
    if (!bloco1IntencaoOriginal.trim() || bloco1IntencaoOriginal.trim().length < 5) {
      toast.error(
        "Por favor, responda à pergunta reflexiva obrigatória (mínimo de 1 frase) sobre a intenção do autor sagrado."
      );
      return;
    }

    setIsSavingBloco1(true);
    try {
      const updated = await saveSermon({
        id: sermon.id,
        bloco1Exegese: bloco1Exegese.trim(),
        bloco1IntencaoOriginal: bloco1IntencaoOriginal.trim(),
      });
      setSermon(updated);
      toast.success("Ancoradouro Histórico fixado com sucesso! Bloco 2 desbloqueado.");
    } catch (err) {
      console.error("Erro ao salvar Bloco 1:", err);
      toast.error("Erro ao salvar Bloco 1.");
    } finally {
      setIsSavingBloco1(false);
    }
  };

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
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col pb-24">
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
                {sermon.bookName} {sermon.chapter}
                {sermon.verse ? `:${sermon.verse}` : ""}
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

        {/* Bloco da Marcha-Ré: Definição Obrigatória do Desfecho */}
        <section
          data-testid="desfecho-section"
          className={cn(
            "rounded-2xl border p-5 sm:p-6 space-y-4 transition-all shadow-sm",
            isUnlocked
              ? "border-gold/40 bg-app-surface/90"
              : "border-gold/60 bg-gold/5 ring-1 ring-gold/20"
          )}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gold/10 text-gold">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-serif font-bold text-app-text flex items-center gap-2">
                  Método da Marcha-Ré: Ponto de Chegada
                  {isUnlocked && (
                    <span className="inline-flex items-center gap-1 text-[0.68rem] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Unlock className="w-3 h-3" /> Desbloqueado
                    </span>
                  )}
                </h2>
                <p className="text-[0.75rem] text-app-text-muted">
                  Defina onde o sermão vai terminar antes de escrever os blocos.
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleSaveDesfecho}
              disabled={isSavingDesfecho || !desfechoTipo || !desfechoTexto.trim()}
              className="bg-gold text-primary-foreground hover:bg-gold/90 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              <span>{isSavingDesfecho ? "Salvando..." : "Fixar Desfecho"}</span>
            </Button>
          </div>

          {/* Seletor de Categorias do Desfecho */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {(Object.keys(DESFECHO_CONFIG) as DesfechoTipo[]).map((cat) => {
              const conf = DESFECHO_CONFIG[cat];
              const isSelected = desfechoTipo === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setDesfechoTipo(cat)}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-xl border text-left transition-all relative overflow-hidden",
                    isSelected
                      ? "border-gold bg-gold/10 ring-1 ring-gold shadow-sm"
                      : "border-border/80 bg-app-surface hover:border-border hover:bg-app-raised/50"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-base">{conf.icon}</span>
                    <span className="text-xs font-semibold text-app-text">
                      {conf.label}
                    </span>
                  </div>
                  <span className="text-[0.68rem] text-app-text-muted leading-tight">
                    {conf.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Texto do Desfecho */}
          <div className="space-y-1.5 pt-2">
            <label className="text-[0.75rem] font-sans text-gold font-medium">
              Texto da Conclusão e Apelo Intencional
            </label>
            <textarea
              value={desfechoTexto}
              onChange={(e) => setDesfechoTexto(e.target.value)}
              placeholder="Onde a mensagem vai terminar? Qual é o apelo e impacto espiritual pretendido?"
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-app-surface px-3.5 py-2.5 text-[0.85rem] text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/50"
            />
          </div>
        </section>

        {/* Bloco 1: Explicar o Texto (Exegese & Contexto) */}
        <section
          data-testid="bloco-1-container"
          data-locked={!isUnlocked ? "true" : "false"}
          className={cn(
            "rounded-2xl border p-5 sm:p-6 space-y-4 transition-all relative",
            !isUnlocked
              ? "border-border/60 bg-app-surface/40 opacity-60 pointer-events-none"
              : "border-border/80 bg-app-surface shadow-xs"
          )}
        >
          {!isUnlocked && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-2xl p-4 text-center">
              <Lock className="w-6 h-6 text-gold mb-2" />
              <p className="text-xs font-semibold text-app-text">
                Bloqueado pelo Método da Marcha-Ré
              </p>
              <p className="text-[0.72rem] text-app-text-muted max-w-xs mt-1">
                Defina e fixe o Desfecho da mensagem acima para liberar o Bloco 1 (Explicar o Texto).
              </p>
            </div>
          )}

          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <span className="text-[0.68rem] font-mono text-gold font-semibold uppercase tracking-wider">
                Bloco 1
              </span>
              <h3 className="text-sm sm:text-base font-serif font-bold text-app-text">
                Explicar o Texto (Exegese & Contexto)
              </h3>
            </div>
          </div>

          {/* Ancoradouro Histórico Header se já preenchido */}
          {sermon?.bloco1IntencaoOriginal && (
            <div
              data-testid="ancoradouro-historico-header"
              className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3"
            >
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-500 mt-0.5 shrink-0">
                <ScrollText className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="text-[0.68rem] font-mono uppercase tracking-wider text-amber-500 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ancoradouro Histórico: Intenção Original
                </span>
                <p className="text-xs sm:text-sm font-serif italic text-app-text leading-relaxed">
                  "{sermon.bloco1IntencaoOriginal}"
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[0.75rem] font-sans text-gold font-medium">
              Notas Exegéticas e Contexto Histórico
            </label>
            <textarea
              value={bloco1Exegese}
              onChange={(e) => setBloco1Exegese(e.target.value)}
              placeholder="Pano de fundo histórico, intenção do autor sagrado e significado das palavras no original..."
              rows={4}
              className="w-full resize-none rounded-xl border border-border bg-app-surface px-3.5 py-2.5 text-[0.85rem] text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/50"
            />
          </div>

          {/* Trava Anti-Esegese: Pergunta Reflexiva Obrigatória */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gold flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                Trava Anti-Esegese: Qual era a intenção do autor sagrado para os primeiros ouvintes deste texto?
              </label>
              <span className="text-[0.68rem] font-mono text-app-text-muted">
                Obrigatório (mínimo 1 frase)
              </span>
            </div>
            <p className="text-[0.72rem] text-app-text-muted leading-relaxed">
              Para proteger a fidelidade bíblica e evitar impor nossos pensamentos sobre a Escritura, ancore aqui o propósito original antes de construir os tópicos.
            </p>
            <textarea
              value={bloco1IntencaoOriginal}
              onChange={(e) => setBloco1IntencaoOriginal(e.target.value)}
              placeholder="O que o autor bíblico pretendia comunicar aos seus ouvintes originais? Qual era o problema pastoral ou teológico endereçado?"
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-app-surface px-3.5 py-2.5 text-[0.85rem] text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/50"
            />
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                onClick={handleSaveBloco1}
                disabled={isSavingBloco1 || !bloco1IntencaoOriginal.trim()}
                className="bg-gold text-primary-foreground hover:bg-gold/90 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs"
              >
                <Save className="w-3.5 h-3.5 mr-1" />
                <span>{isSavingBloco1 ? "Salvando..." : "Fixar Ancoradouro"}</span>
              </Button>
            </div>
          </div>
        </section>

        {/* Bloco 2: Pregar a Inspiração (Tópicos em Degraus) */}
        <section
          data-testid="bloco-2-container"
          data-locked={!isBloco2Unlocked ? "true" : "false"}
          className={cn(
            "rounded-2xl border p-5 sm:p-6 space-y-4 transition-all relative",
            !isBloco2Unlocked
              ? "border-border/60 bg-app-surface/40 opacity-60 pointer-events-none"
              : "border-border/80 bg-app-surface shadow-xs"
          )}
        >
          {!isUnlocked ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-2xl p-4 text-center">
              <Lock className="w-6 h-6 text-gold mb-2" />
              <p className="text-xs font-semibold text-app-text">
                Bloqueado pelo Método da Marcha-Ré
              </p>
              <p className="text-[0.72rem] text-app-text-muted max-w-xs mt-1">
                Defina e fixe o Desfecho da mensagem acima para iniciar a preparação.
              </p>
            </div>
          ) : !isBloco2Unlocked ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-2xl p-4 text-center">
              <ShieldAlert className="w-6 h-6 text-amber-500 mb-2" />
              <p className="text-xs font-semibold text-app-text">
                Trava Anti-Esegese Ativa
              </p>
              <p className="text-[0.72rem] text-app-text-muted max-w-xs mt-1">
                Responda à pergunta reflexiva obrigatória no Bloco 1 ("Qual era a intenção do autor sagrado para os primeiros ouvintes deste texto?") para liberar o desenvolvimento dos tópicos no Bloco 2.
              </p>
            </div>
          ) : null}

          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <span className="text-[0.68rem] font-mono text-gold font-semibold uppercase tracking-wider">
                Bloco 2
              </span>
              <h3 className="text-sm sm:text-base font-serif font-bold text-app-text">
                Pregar a Inspiração (Exposição 3x4)
              </h3>
            </div>
          </div>

          <p className="text-xs text-app-text-muted">
            Desenvolvimento dos tópicos homiléticos com os 4 Degraus (A, B, C, D).
          </p>
        </section>

        {/* Bloco 3: Aplicar à Vida Real */}
        <section
          data-testid="bloco-3-container"
          data-locked={!isUnlocked ? "true" : "false"}
          className={cn(
            "rounded-2xl border p-5 sm:p-6 space-y-4 transition-all relative",
            !isUnlocked
              ? "border-border/60 bg-app-surface/40 opacity-60 pointer-events-none"
              : "border-border/80 bg-app-surface shadow-xs"
          )}
        >
          {!isUnlocked && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-2xl p-4 text-center">
              <Lock className="w-6 h-6 text-gold mb-2" />
              <p className="text-xs font-semibold text-app-text">
                Bloqueado pelo Método da Marcha-Ré
              </p>
            </div>
          )}

          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <span className="text-[0.68rem] font-mono text-gold font-semibold uppercase tracking-wider">
                Bloco 3
              </span>
              <h3 className="text-sm sm:text-base font-serif font-bold text-app-text">
                Aplicar à Vida Real (Conexão Prática)
              </h3>
            </div>
          </div>

          <textarea
            value={bloco3Aplicacao}
            onChange={(e) => setBloco3Aplicacao(e.target.value)}
            placeholder="Transposição prática para os desafios da igreja na segunda-feira de manhã..."
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-app-surface px-3.5 py-2.5 text-[0.85rem] text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/50"
          />
        </section>

        {/* Introdução: Gancho de Entrada (Último passo da Marcha-Ré) */}
        <section
          data-testid="introducao-container"
          data-locked={!isUnlocked ? "true" : "false"}
          className={cn(
            "rounded-2xl border p-5 sm:p-6 space-y-4 transition-all relative",
            !isUnlocked
              ? "border-border/60 bg-app-surface/40 opacity-60 pointer-events-none"
              : "border-border/80 bg-app-surface shadow-xs"
          )}
        >
          {!isUnlocked && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-2xl p-4 text-center">
              <Lock className="w-6 h-6 text-gold mb-2" />
              <p className="text-xs font-semibold text-app-text">
                Bloqueado pelo Método da Marcha-Ré
              </p>
            </div>
          )}

          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <span className="text-[0.68rem] font-mono text-gold font-semibold uppercase tracking-wider">
                Passo Final da Marcha-Ré
              </span>
              <h3 className="text-sm sm:text-base font-serif font-bold text-app-text">
                Introdução (Gancho de Entrada)
              </h3>
            </div>
          </div>

          <textarea
            value={introducao}
            onChange={(e) => setIntroducao(e.target.value)}
            placeholder="Gancho inicial para capturar a atenção da igreja sabendo exatamente onde você vai chegar..."
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-app-surface px-3.5 py-2.5 text-[0.85rem] text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/50"
          />
        </section>
      </main>
    </div>
  );
}
