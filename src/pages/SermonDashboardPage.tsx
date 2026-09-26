import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  BookOpen,
  Plus,
  Search,
  Flame,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Crown,
  History,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { listSermons, saveSermon, type Sermon } from "@/lib/homileticClient";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SermonDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isTemplo, loading: subLoading, checkout } = useSubscription();

  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "completed">("all");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!isTemplo) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    listSermons()
      .then((data) => {
        if (isMounted) {
          setSermons(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar sermões:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isTemplo]);

  const handleCreateNewSermon = async () => {
    setIsCreating(true);
    try {
      const newSermon = await saveSermon({
        id: `sermon_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: "Novo Estudo Homilético",
        status: "draft",
        sparkText: "Inspiração capturada para ministração da Palavra.",
      });
      toast.success("Novo sermão criado no Estúdio!");
      navigate(`/estudio/${newSermon.id}`);
    } catch (err) {
      console.error("Erro ao criar novo sermão:", err);
      toast.error("Não foi possível criar o sermão.");
    } finally {
      setIsCreating(false);
    }
  };

  const filteredSermons = useMemo(() => {
    return sermons.filter((s) => {
      const matchesStatus =
        statusFilter === "all" ? true : s.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesStatus;

      const titleMatch = s.title?.toLowerCase().includes(q);
      const bookMatch = s.bookName?.toLowerCase().includes(q);
      const passageMatch = `${s.bookName || ""} ${s.chapter || ""}:${s.verse || ""}`
        .toLowerCase()
        .includes(q);
      const sparkMatch = s.sparkText?.toLowerCase().includes(q);

      return matchesStatus && (titleMatch || bookMatch || passageMatch || sparkMatch);
    });
  }, [sermons, searchQuery, statusFilter]);

  if (subLoading || (isTemplo && loading)) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 border border-gold/20 shadow-lg">
            <Flame className="w-6 h-6 text-gold animate-pulse" />
          </div>
          <p className="text-sm font-sans text-app-text-muted">
            Abrindo o Estúdio Homilético...
          </p>
        </div>
      </div>
    );
  }

  // ── GATE INSTITUCIONAL TEMPLO (Para usuários sem plano Templo) ────────────────
  if (!isTemplo) {
    return (
      <div
        data-testid="templo-gate-container"
        className="min-h-screen bg-app-bg text-app-text py-8 sm:py-12 px-4 sm:px-6"
      >
        <div className="max-w-5xl mx-auto space-y-10 sm:space-y-12">
          {/* Top Bar de Retorno */}
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-mono text-app-text-muted hover:text-gold transition-colors py-1 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
              <span>Voltar para a Bíblia</span>
            </Link>

            <span className="text-[0.68rem] font-mono uppercase tracking-[0.2em] text-gold font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> MÓDULO EXCLUSIVO
            </span>
          </div>

          {/* Hero Banner Imersivo do Gate com Arte Sacra */}
          <section
            aria-label="Apresentação do Estúdio Homilético"
            className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-border/80 bg-app-surface p-6 sm:p-10 md:p-12 shadow-2xl transition-all duration-300"
          >
            {/* Imagem de Fundo com Máscara e Degradês em Camadas para o Efeito Fumaça Suave */}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-full sm:w-[60%] md:w-[52%] lg:w-[48%] overflow-hidden select-none">
              <img
                src="/images/article-hero-bible.jpg"
                alt="Bíblia sagrada aberta em ambiente de estudo e oração"
                className="h-full w-full object-cover object-center opacity-25 dark:opacity-45"
                style={{
                  maskImage:
                    "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0.2) 78%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0.2) 78%, transparent 100%)",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-app-surface/40 via-40% to-app-surface" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_90%_at_25%_50%,hsl(var(--bg-surface))_15%,hsl(var(--bg-surface)/0.75)_50%,transparent_90%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_65%_45%,rgba(229,184,105,0.12)_0%,rgba(198,154,80,0.03)_50%,transparent_80%)] mix-blend-screen" />
              <div className="absolute inset-0 bg-gradient-to-b from-app-surface/60 via-transparent to-app-surface/80" />
              <div className="absolute inset-0 bg-gradient-to-r from-app-surface/80 via-transparent to-transparent" />
            </div>

            {/* Conteúdo à Esquerda */}
            <div className="relative z-10 max-w-2xl space-y-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.2em] text-gold bg-gold/10 border border-gold/30 px-3.5 py-1 rounded-full font-medium">
                <Sparkles className="w-3.5 h-3.5" /> Módulo Exclusivo — Plano Templo
              </span>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.2rem] font-serif font-normal text-app-text tracking-tight leading-[1.12]">
                Estúdio Homilético 3x4
              </h1>

              <p className="text-sm sm:text-base text-app-text-muted leading-relaxed max-w-xl">
                Do Altar Secreto ao Púlpito: a arquitetura definitiva para pregadores e líderes que levam a sério a fidelidade bíblica e a clareza expositiva.
              </p>
            </div>
          </section>

          {/* Os 3 Pilares do Módulo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group relative overflow-hidden bg-app-surface border border-border/80 hover:border-gold/50 rounded-2xl p-6 sm:p-7 space-y-3.5 shadow-md hover:shadow-xl transition-all duration-300">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-gold border border-gold/20 shadow-xs">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-normal text-lg sm:text-xl text-app-text group-hover:text-gold transition-colors">
                Método 3x4 & Marcha-Ré
              </h3>
              <p className="text-xs sm:text-[0.82rem] text-app-text-muted leading-relaxed">
                Comece pelo ponto de chegada (Consolação, Confronto, Conversão ou Oração) e construa os 4 Degraus com a Trava Anti-Esegese para jamais impor ideias sobre o texto.
              </p>
            </div>

            <div className="group relative overflow-hidden bg-app-surface border border-border/80 hover:border-gold/50 rounded-2xl p-6 sm:p-7 space-y-3.5 shadow-md hover:shadow-xl transition-all duration-300">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-gold border border-gold/20 shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-normal text-lg sm:text-xl text-app-text group-hover:text-gold transition-colors">
                Modo Púlpito Solene
              </h3>
              <p className="text-xs sm:text-[0.82rem] text-app-text-muted leading-relaxed">
                Interface com Screen Wake Lock que nunca apaga a tela, marcadores de dinâmica vocal, cronômetro discreto e versículos interativos em cards flutuantes.
              </p>
            </div>

            <div className="group relative overflow-hidden bg-app-surface border border-border/80 hover:border-gold/50 rounded-2xl p-6 sm:p-7 space-y-3.5 shadow-md hover:shadow-xl transition-all duration-300">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-gold border border-gold/20 shadow-xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-normal text-lg sm:text-xl text-app-text group-hover:text-gold transition-colors">
                Guardião de Gálatas 1:8
              </h3>
              <p className="text-xs sm:text-[0.82rem] text-app-text-muted leading-relaxed">
                Auditoria de ortodoxia com modelo TypeSafe JEV e consulta RAG a clássicos históricos (Barnes, Henry, Gill), resguardando a centralidade da Graça.
              </p>
            </div>
          </div>

          {/* Chamada para Ação */}
          <div className="relative overflow-hidden bg-gradient-to-br from-gold/10 via-app-surface to-gold/5 border border-gold/30 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl">
            <div className="max-w-2xl mx-auto space-y-3">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-normal text-app-text tracking-tight">
                Capacite o seu ministério com ferramentas do altar
              </h2>
              <p className="text-xs sm:text-sm text-app-text-muted leading-relaxed">
                O Plano Templo foi concebido para pastores, pregadores e igrejas que buscam profundidade exegética e excelência na ministração da Palavra.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Button
                onClick={() => checkout("templo")}
                className="w-full sm:w-auto bg-gold text-primary-foreground hover:bg-gold/90 font-semibold px-7 py-3 rounded-full shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Crown className="w-4 h-4" />
                <span>Assinar Plano Templo</span>
              </Button>
              <Button
                onClick={() => navigate("/precos")}
                variant="outline"
                className="w-full sm:w-auto rounded-full border-border/80 hover:border-gold/50 hover:text-gold text-xs sm:text-sm px-6 py-3 cursor-pointer"
              >
                <span>Conhecer todos os planos</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PAINEL DO PREGADOR (Usuários com plano Templo) ────────────────────────────
  const completedCount = sermons.filter((s) => s.status === "completed").length;
  const draftCount = sermons.filter((s) => s.status === "draft").length;

  return (
    <div
      data-testid="templo-dashboard"
      className="min-h-screen bg-app-bg text-app-text pb-24"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-8">
        {/* Top Bar de Retorno e Identidade */}
        <div className="flex items-center justify-between pb-1">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-app-text-muted hover:text-gold transition-colors py-1 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            <span>Voltar para a Bíblia</span>
          </Link>

          <span className="text-[0.68rem] font-mono uppercase tracking-[0.2em] text-gold font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> PLANO TEMPLO
          </span>
        </div>

        {/* Hero Header do Dashboard com Arte Sacra */}
        <section
          aria-label="Apresentação do Estúdio Homilético"
          className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-border/80 bg-app-surface p-6 sm:p-8 md:p-10 shadow-2xl transition-all duration-300"
        >
          {/* Imagem de Fundo com Máscara e Degradês em Camadas para Efeito Fumaça */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-full sm:w-[60%] md:w-[50%] lg:w-[45%] overflow-hidden select-none">
            <img
              src="/images/article-hero-bible.jpg"
              alt="Bíblia sagrada aberta em ambiente de estudo e oração"
              className="h-full w-full object-cover object-center opacity-25 dark:opacity-45"
              style={{
                maskImage:
                  "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0.2) 78%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0.2) 78%, transparent 100%)",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-app-surface/40 via-40% to-app-surface" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_90%_at_25%_50%,hsl(var(--bg-surface))_15%,hsl(var(--bg-surface)/0.75)_50%,transparent_90%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_65%_45%,rgba(229,184,105,0.12)_0%,rgba(198,154,80,0.03)_50%,transparent_80%)] mix-blend-screen" />
            <div className="absolute inset-0 bg-gradient-to-b from-app-surface/60 via-transparent to-app-surface/80" />
            <div className="absolute inset-0 bg-gradient-to-r from-app-surface/80 via-transparent to-transparent" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <p className="font-mono text-[0.68rem] sm:text-xs uppercase tracking-[0.22em] text-gold font-medium">
                OFICINA HOMILÉTICA
              </p>

              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-app-text leading-[1.12]">
                Estúdio Homilético
              </h1>

              <p className="font-sans text-xs sm:text-sm text-app-text-muted leading-relaxed">
                Seus sermões, esboços 3x4 e histórico de ministração
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                onClick={handleCreateNewSermon}
                disabled={isCreating}
                className="w-full sm:w-auto bg-gold text-primary-foreground hover:bg-gold/90 text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-full flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isCreating ? "Criando..." : "Novo Estudo"}</span>
              </Button>
            </div>
          </div>
        </section>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-app-surface border border-border/80 rounded-2xl p-4 sm:p-5 space-y-1 shadow-xs hover:border-border transition-all">
            <span className="text-[0.68rem] font-mono uppercase tracking-wider text-app-text-muted">
              Total de Sermões
            </span>
            <p className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-app-text">
              {sermons.length}
            </p>
          </div>

          <div className="bg-app-surface border border-border/80 rounded-2xl p-4 sm:p-5 space-y-1 shadow-xs hover:border-gold/30 transition-all">
            <span className="text-[0.68rem] font-mono uppercase tracking-wider text-gold">
              Prontos para Pregar
            </span>
            <p className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-gold">
              {completedCount}
            </p>
          </div>

          <div className="bg-app-surface border border-border/80 rounded-2xl p-4 sm:p-5 space-y-1 shadow-xs hover:border-border transition-all">
            <span className="text-[0.68rem] font-mono uppercase tracking-wider text-app-text-muted">
              Rascunhos no Estúdio
            </span>
            <p className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-app-text">
              {draftCount}
            </p>
          </div>

          <div className="bg-app-surface border border-border/80 rounded-2xl p-4 sm:p-5 space-y-1 shadow-xs hover:border-border transition-all">
            <span className="text-[0.68rem] font-mono uppercase tracking-wider text-app-text-muted">
              Banco de Dados
            </span>
            <p className="text-xs sm:text-sm font-mono text-gold/80 pt-1">
              Cloudflare D1 (Edge)
            </p>
          </div>
        </div>

        {/* Barra de Filtro e Busca */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-app-surface p-2 sm:p-2.5 rounded-2xl border border-border/80 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-muted" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título ou passagem bíblica..."
              className="pl-10 h-10 rounded-xl bg-app-bg/80 border-border text-xs sm:text-sm text-app-text placeholder:text-app-text-muted focus:border-gold/60 focus:ring-1 focus:ring-gold/30"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-app-bg/60 p-1 rounded-xl border border-border/60">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer",
                statusFilter === "all"
                  ? "bg-gold text-primary-foreground shadow-xs font-semibold"
                  : "text-app-text-muted hover:text-app-text"
              )}
            >
              Todos ({sermons.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("draft")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer",
                statusFilter === "draft"
                  ? "bg-gold text-primary-foreground shadow-xs font-semibold"
                  : "text-app-text-muted hover:text-app-text"
              )}
            >
              Rascunhos ({draftCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("completed")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer",
                statusFilter === "completed"
                  ? "bg-gold text-primary-foreground shadow-xs font-semibold"
                  : "text-app-text-muted hover:text-app-text"
              )}
            >
              Prontos ({completedCount})
            </button>
          </div>
        </div>

        {/* Lista de Sermões */}
        {filteredSermons.length === 0 ? (
          <div className="bg-app-surface border border-border/80 rounded-2xl p-10 sm:p-12 text-center space-y-4 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 border border-gold/20 text-gold mx-auto shadow-xs">
              <BookOpen className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="font-serif font-normal text-lg sm:text-xl text-app-text">
                Nenhum sermão encontrado
              </h3>
              <p className="text-xs sm:text-sm text-app-text-muted leading-relaxed">
                {searchQuery
                  ? "Nenhum resultado corresponde à sua pesquisa. Tente outro termo."
                  : "Você ainda não preparou nenhum sermão no Estúdio Homilético."}
              </p>
            </div>
            {!searchQuery && (
              <Button
                onClick={handleCreateNewSermon}
                className="bg-gold text-primary-foreground hover:bg-gold/90 text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-full shadow-md cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Criar Primeiro Estudo
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredSermons.map((sermon) => {
              const hasPassage = Boolean(sermon.bookName && sermon.chapter);
              const isReady = sermon.status === "completed";

              return (
                <div
                  key={sermon.id}
                  data-testid={`sermon-card-${sermon.id}`}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-app-surface p-5 sm:p-6 shadow-md hover:border-gold/60 hover:shadow-xl transition-all duration-300 space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {hasPassage ? (
                        <span className="text-[0.72rem] font-mono text-gold bg-gold/10 border border-gold/30 px-3 py-0.5 rounded-full font-semibold">
                          {sermon.bookName} {sermon.chapter}
                          {sermon.verse ? `:${sermon.verse}` : ""}
                        </span>
                      ) : (
                        <span className="text-[0.72rem] font-mono text-app-text-muted bg-app-raised px-3 py-0.5 rounded-full">
                          Sem passagem definida
                        </span>
                      )}

                      <span
                        className={cn(
                          "text-[0.68rem] font-mono px-2.5 py-0.5 rounded-full border font-medium",
                          isReady
                            ? "text-gold bg-gold/10 border-gold/30"
                            : "text-app-text-muted bg-app-raised border-border/80"
                        )}
                      >
                        {isReady ? "Pronto para Pregar" : "Rascunho"}
                      </span>
                    </div>

                    <h2 className="font-serif font-normal text-lg sm:text-xl text-app-text group-hover:text-gold transition-colors line-clamp-1 leading-snug">
                      {sermon.title}
                    </h2>

                    {sermon.sparkText && (
                      <p className="font-serif text-xs sm:text-[0.84rem] text-app-text-muted italic line-clamp-2 leading-relaxed pl-3 border-l-2 border-gold/30">
                        "{sermon.sparkText}"
                      </p>
                    )}
                  </div>

                  <div className="pt-3.5 border-t border-border/50 flex items-center justify-between gap-3">
                    <span className="text-[0.68rem] font-mono text-app-text-muted flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-gold/70" />
                      {new Date(sermon.updatedAt || sermon.createdAt).toLocaleDateString("pt-BR")}
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => navigate(`/estudio/${sermon.id}`)}
                        variant="outline"
                        size="sm"
                        className="text-xs rounded-full border-border/80 hover:border-gold/50 hover:text-gold h-8 px-3.5 font-medium cursor-pointer"
                      >
                        <span>Abrir Estúdio</span>
                      </Button>

                      <Button
                        onClick={() => navigate(`/pulpito/${sermon.id}`)}
                        size="sm"
                        className="bg-gold text-primary-foreground hover:bg-gold/90 text-xs font-semibold rounded-full h-8 px-4 flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Pregar</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
