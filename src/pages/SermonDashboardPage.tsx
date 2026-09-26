import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  BookOpen,
  Plus,
  Search,
  Flame,
  ArrowRight,
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
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Flame className="w-8 h-8 text-gold animate-pulse" />
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
        className="min-h-screen bg-app-bg text-app-text py-12 px-4 sm:px-6"
      >
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header do Gate */}
          <div className="text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-gold bg-gold/10 border border-gold/30 px-3.5 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" /> Módulo Exclusivo — Plano Templo
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-app-text">
              Estúdio Homilético 3x4
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-app-text-muted leading-relaxed">
              Do Altar Secreto ao Púlpito: a arquitetura definitiva para pregadores e líderes que levam a sério a fidelidade bíblica e a clareza expositiva.
            </p>
          </div>

          {/* Os 3 Pilares do Módulo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-app-surface border border-border/80 rounded-2xl p-6 space-y-3 shadow-xs">
              <div className="p-3 w-fit rounded-xl bg-gold/10 text-gold border border-gold/20">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-app-text">
                Método 3x4 & Marcha-Ré
              </h3>
              <p className="text-xs text-app-text-muted leading-relaxed">
                Comece pelo ponto de chegada (Consolação, Confronto, Conversão ou Oração) e construa os 4 Degraus com a Trava Anti-Esegese para jamais impor ideias sobre o texto.
              </p>
            </div>

            <div className="bg-app-surface border border-border/80 rounded-2xl p-6 space-y-3 shadow-xs">
              <div className="p-3 w-fit rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-app-text">
                Modo Púlpito Solene
              </h3>
              <p className="text-xs text-app-text-muted leading-relaxed">
                Interface com Screen Wake Lock que nunca apaga a tela, marcadores de dinâmica vocal, cronômetro discreto e versículos interativos em cards flutuantes.
              </p>
            </div>

            <div className="bg-app-surface border border-border/80 rounded-2xl p-6 space-y-3 shadow-xs">
              <div className="p-3 w-fit rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-app-text">
                Guardião de Gálatas 1:8
              </h3>
              <p className="text-xs text-app-text-muted leading-relaxed">
                Auditoria de ortodoxia com modelo TypeSafe JEV e consulta RAG a clássicos históricos (Barnes, Henry, Gill), resguardando a centralidade da Graça.
              </p>
            </div>
          </div>

          {/* Chamada para Ação */}
          <div className="bg-gradient-to-br from-gold/15 via-app-surface to-purple-950/20 border border-gold/40 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-app-text">
              Capacite o seu ministério com ferramentas do altar
            </h2>
            <p className="max-w-xl mx-auto text-xs sm:text-sm text-app-text-muted leading-relaxed">
              O Plano Templo foi concebido para pastores, pregadores e igrejas que buscam profundidade exegética e excelência na ministração da Palavra.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                onClick={() => checkout("templo")}
                className="w-full sm:w-auto bg-gold text-primary-foreground hover:bg-gold/90 font-semibold px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2"
              >
                <Crown className="w-4 h-4" />
                <span>Assinar Plano Templo</span>
              </Button>
              <Button
                onClick={() => navigate("/precos")}
                variant="outline"
                className="w-full sm:w-auto rounded-xl"
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[0.68rem] font-mono uppercase tracking-wider text-gold font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Plano Templo
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-app-text">
              Estúdio Homilético
            </h1>
            <p className="text-xs sm:text-sm text-app-text-muted">
              Seus sermões, esboços 3x4 e histórico de ministração
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={handleCreateNewSermon}
              disabled={isCreating}
              className="w-full sm:w-auto bg-gold text-primary-foreground hover:bg-gold/90 text-xs font-semibold px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isCreating ? "Criando..." : "Novo Estudo"}</span>
            </Button>
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-app-surface border border-border rounded-xl p-4 space-y-1">
            <span className="text-[0.68rem] font-mono uppercase text-app-text-muted">
              Total de Sermões
            </span>
            <p className="text-xl sm:text-2xl font-serif font-bold text-app-text">
              {sermons.length}
            </p>
          </div>

          <div className="bg-app-surface border border-border rounded-xl p-4 space-y-1">
            <span className="text-[0.68rem] font-mono uppercase text-emerald-400">
              Prontos para Pregar
            </span>
            <p className="text-xl sm:text-2xl font-serif font-bold text-emerald-400">
              {completedCount}
            </p>
          </div>

          <div className="bg-app-surface border border-border rounded-xl p-4 space-y-1">
            <span className="text-[0.68rem] font-mono uppercase text-amber-400">
              Rascunhos no Estúdio
            </span>
            <p className="text-xl sm:text-2xl font-serif font-bold text-amber-400">
              {draftCount}
            </p>
          </div>

          <div className="bg-app-surface border border-border rounded-xl p-4 space-y-1">
            <span className="text-[0.68rem] font-mono uppercase text-purple-400">
              Banco de Dados
            </span>
            <p className="text-xs sm:text-sm font-mono text-purple-400 pt-1">
              Cloudflare D1 (Edge)
            </p>
          </div>
        </div>

        {/* Barra de Filtro e Busca */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-muted" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título ou passagem bíblica..."
              className="pl-9 h-10 rounded-xl bg-app-surface border-border text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-app-surface p-1 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
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
                "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
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
                "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
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
          <div className="bg-app-surface border border-border rounded-2xl p-10 text-center space-y-4">
            <BookOpen className="w-10 h-10 text-app-text-muted mx-auto opacity-50" />
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-base text-app-text">
                Nenhum sermão encontrado
              </h3>
              <p className="text-xs text-app-text-muted max-w-sm mx-auto">
                {searchQuery
                  ? "Nenhum resultado corresponde à sua pesquisa. Tente outro termo."
                  : "Você ainda não preparou nenhum sermão no Estúdio Homilético."}
              </p>
            </div>
            {!searchQuery && (
              <Button
                onClick={handleCreateNewSermon}
                className="bg-gold text-primary-foreground hover:bg-gold/90 text-xs font-semibold px-4 py-2 rounded-xl"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Criar Primeiro Estudo
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSermons.map((sermon) => {
              const hasPassage = Boolean(sermon.bookName && sermon.chapter);
              const isReady = sermon.status === "completed";

              return (
                <div
                  key={sermon.id}
                  data-testid={`sermon-card-${sermon.id}`}
                  className="bg-app-surface border border-border/80 hover:border-gold/50 rounded-2xl p-5 space-y-4 transition-all shadow-xs flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {hasPassage ? (
                        <span className="text-[0.72rem] font-mono text-gold bg-gold/10 border border-gold/20 px-2.5 py-0.5 rounded-full font-semibold">
                          {sermon.bookName} {sermon.chapter}
                          {sermon.verse ? `:${sermon.verse}` : ""}
                        </span>
                      ) : (
                        <span className="text-[0.72rem] font-mono text-app-text-muted bg-app-raised px-2.5 py-0.5 rounded-full">
                          Sem passagem definida
                        </span>
                      )}

                      <span
                        className={cn(
                          "text-[0.68rem] font-mono px-2 py-0.5 rounded-full border",
                          isReady
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        )}
                      >
                        {isReady ? "Pronto para Pregar" : "Rascunho"}
                      </span>
                    </div>

                    <h2 className="font-serif font-bold text-base sm:text-lg text-app-text group-hover:text-gold transition-colors line-clamp-1">
                      {sermon.title}
                    </h2>

                    {sermon.sparkText && (
                      <p className="text-xs text-app-text-muted italic line-clamp-2 leading-relaxed">
                        "{sermon.sparkText}"
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    <span className="text-[0.68rem] font-mono text-app-text-muted flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(sermon.updatedAt || sermon.createdAt).toLocaleDateString("pt-BR")}
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => navigate(`/estudio/${sermon.id}`)}
                        variant="outline"
                        size="sm"
                        className="text-xs rounded-xl h-8 px-2.5"
                      >
                        <span>Abrir Estúdio</span>
                      </Button>

                      <Button
                        onClick={() => navigate(`/pulpito/${sermon.id}`)}
                        size="sm"
                        className="bg-gold text-primary-foreground hover:bg-gold/90 text-xs font-semibold rounded-xl h-8 px-2.5 flex items-center gap-1"
                      >
                        <BookOpen className="w-3 h-3" />
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
