import { useState } from "react";
import { useReadingPlan } from "@/hooks/useReadingPlan";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/i18n";
import { getVersion } from "@/lib/themes";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import AuthModal from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import {
    Flame, Calendar, BookOpen, CheckCircle, ArrowRight,
    Check, ChevronRight, Trophy, SkipForward, ArrowLeft,
} from "lucide-react";

export default function ReadingPlansPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedPlanId = searchParams.get("id");

    const {
        plans,
        progresses,
        activePlan,
        isLoading,
        todayDayIndex,
        todayRefs,
        todayReadRefs,
        isTodayCompleted,
        streak,
        progressPct,
        startPlan,
        abandonPlan,
        markRefRead,
        advanceToNextDay,
    } = useReadingPlan(user?.id ?? null, selectedPlanId);

    const currentVersion = getVersion();
    const [showAuthModal, setShowAuthModal] = useState(false);

    if (isLoading) {
        return (
            <Layout>
                <div className="flex min-h-[50vh] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent"></div>
                </div>
            </Layout>
        );
    }

    // Parse reference like "sl/1" -> { book: "sl", chap: 1 }
    const parseRef = (ref: string) => {
        const [book, chap] = ref.split("/");
        return { book, chap };
    };

    // ─── Plan selection screen ─────────────────────────────────────────────
    if (!activePlan) {
        return (
            <Layout>
                <div className="mx-auto max-w-4xl pt-4">
                    <div className="mb-10 text-center">
                        <h1 className="mb-4 font-serif text-3xl font-bold md:text-4xl text-app-text">
                            Planos de Leitura
                        </h1>
                        <p className="mx-auto max-w-2xl text-app-text-muted">
                            Comece uma jornada de leitura bíblica guiada. Escolha um plano que se adapte ao seu
                            objetivo e acompanhe seu progresso diário.
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {plans.map((plan) => {
                            const prog = progresses[plan.id];
                            const hasStarted = !!prog;
                            const planProgressPct = hasStarted
                                ? Math.round(((prog.completedDays.length ?? 0) / plan.totalDays) * 100)
                                : 0;

                            return (
                                <div
                                    key={plan.id}
                                    className="flex flex-col rounded-2xl border border-border bg-app-surface p-6 shadow-sm transition-all hover:shadow-md hover:border-gold/30"
                                >
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold-bg text-gold">
                                        <BookOpen className="h-6 w-6" />
                                    </div>
                                    <h3 className="mb-2 font-serif text-xl font-bold text-app-text">{plan.name}</h3>
                                    <p className="mb-6 flex-1 text-sm text-app-text-muted">{plan.description}</p>

                                    <div className="mb-6 flex items-center gap-4 text-xs font-medium text-app-text-muted">
                                        <span className="flex items-center gap-1.5 rounded-full bg-app-raised px-3 py-1">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {plan.totalDays} dias
                                        </span>
                                        {hasStarted && (
                                            <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1 font-bold">
                                                {planProgressPct}% lido
                                            </span>
                                        )}
                                    </div>

                                    <Button
                                        onClick={() => {
                                            if (!user) {
                                                setShowAuthModal(true);
                                            } else {
                                                if (!hasStarted) {
                                                    startPlan(plan.id);
                                                }
                                                setSearchParams({ id: plan.id });
                                            }
                                        }}
                                        className={hasStarted
                                            ? "w-full bg-app-raised hover:bg-gold/10 text-gold border border-gold/30 shadow-sm"
                                            : "w-full bg-gold hover:bg-gold-hover text-white shadow-md shadow-gold/20"}
                                    >
                                        {hasStarted ? "Retomar Leitura" : "Iniciar Plano"}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <AuthModal
                    isOpen={showAuthModal}
                    onClose={() => setShowAuthModal(false)}
                    hint="Faça login ou crie uma conta para iniciar seu plano de leitura."
                />
            </Layout>
        );
    }

    // ─── Active plan dashboard ─────────────────────────────────────────────
    const completedCount = todayReadRefs.length;
    const totalCount = todayRefs.length;

    return (
        <Layout>
            <div className="mx-auto max-w-3xl pt-4 pb-12">
                <button
                    onClick={() => setSearchParams({})}
                    className="mb-6 group flex items-center gap-2 text-sm font-medium text-app-text-muted hover:text-gold transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Voltar à lista de planos
                </button>
                {/* Header Dashboard */}
                <div className="mb-8 overflow-hidden rounded-3xl bg-app-surface border border-border shadow-sm">
                    <div className="bg-gradient-to-r from-gold/10 to-transparent px-6 py-8 md:px-10 md:py-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-gold mb-2">Plano Atual</h2>
                                <h1 className="font-serif text-3xl font-bold text-app-text mb-4">{activePlan.name}</h1>

                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-2 rounded-full bg-orange-500/10 px-4 py-1.5 text-orange-600 dark:text-orange-400">
                                        <Flame className="h-4 w-4" />
                                        <span className="font-bold">{streak} {streak === 1 ? 'dia' : 'dias'} de alimento da Palavra</span>
                                    </div>

                                    <div className="text-sm font-medium text-app-text-muted">
                                        Dia {Math.min(todayDayIndex, activePlan.totalDays)} de {activePlan.totalDays}
                                    </div>
                                </div>
                            </div>

                            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-app-raised md:h-32 md:w-32">
                                <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                                    <circle className="text-border" strokeWidth="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                                    <circle
                                        className="text-gold"
                                        strokeWidth="8"
                                        strokeDasharray={251.2}
                                        strokeDashoffset={251.2 - (251.2 * progressPct) / 100}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r="40"
                                        cx="50"
                                        cy="50"
                                        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                                    />
                                </svg>
                                <div className="text-center">
                                    <span className="block text-xl md:text-2xl font-bold text-app-text">{progressPct}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Leitura de Hoje */}
                <h3 className="mb-4 text-xl font-bold text-app-text">Leitura de Hoje</h3>

                {todayDayIndex <= activePlan.totalDays ? (
                    <div className="mb-10 rounded-2xl border border-gold/30 bg-gold-bg/30 p-1">
                        <div className="rounded-xl bg-app-surface p-5 md:p-8">
                            {/* Day header */}
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-app-text">Dia {todayDayIndex}</h4>
                                        <p className="text-sm text-app-text-muted">
                                            {isTodayCompleted
                                                ? "Você já concluiu a leitura de hoje!"
                                                : `${completedCount} de ${totalCount} leitura${totalCount !== 1 ? "s" : ""} concluída${completedCount !== 1 ? "s" : ""}`}
                                        </p>
                                    </div>
                                </div>

                                {isTodayCompleted && (
                                    <div className="flex items-center gap-2 text-gold font-medium">
                                        <CheckCircle className="h-5 w-5" />
                                        <span className="hidden sm:inline">Concluído</span>
                                    </div>
                                )}
                            </div>

                            {/* Per-item reading list */}
                            <div className="space-y-3">
                                {todayRefs.map((ref) => {
                                    const { book, chap } = parseRef(ref);
                                    const isRead = todayReadRefs.includes(ref);
                                    return (
                                        <div
                                            key={ref}
                                            className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${isRead
                                                ? "border-gold/30 bg-gold-bg/10 opacity-70"
                                                : "border-border bg-app-raised hover:border-gold/50 hover:bg-gold-bg/20"
                                                }`}
                                        >
                                            {/* Left: navigate to chapter */}
                                            <Link
                                                to={`/${currentVersion}/${book}/${chap}`}
                                                className="group flex flex-1 items-center gap-3 min-w-0"
                                            >
                                                <div
                                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${isRead
                                                        ? "bg-gold/10 text-gold"
                                                        : "bg-app-surface text-gold/40"
                                                        }`}
                                                >
                                                    {isRead ? (
                                                        <Check className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <ChevronRight className="h-3.5 w-3.5" />
                                                    )}
                                                </div>
                                                <span
                                                    className={`font-medium font-mono tracking-wider text-sm uppercase truncate ${isRead
                                                        ? "text-app-text-muted line-through"
                                                        : "text-app-text"
                                                        }`}
                                                >
                                                    {book} {chap}
                                                </span>
                                                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-app-text-muted transition-transform group-hover:translate-x-1 group-hover:text-gold" />
                                            </Link>

                                            {/* Right: Mark as Read button */}
                                            <button
                                                type="button"
                                                onClick={() => markRefRead(ref)}
                                                disabled={isRead}
                                                aria-label={isRead ? `${book} ${chap} já lido` : `Marcar ${book} ${chap} como lido`}
                                                title={isRead ? "Leitura já marcada" : "Marcar como lido"}
                                                className={`ml-3 flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${isRead
                                                    ? "cursor-default text-green-600 dark:text-green-400 bg-green-500/10"
                                                    : "bg-gold/10 text-gold hover:bg-gold/20 active:scale-95"
                                                    }`}
                                            >
                                                {isRead ? (
                                                    <>
                                                        <Check className="h-3.5 w-3.5" />
                                                        <span className="hidden sm:inline">Lido</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="h-3.5 w-3.5" />
                                                        <span className="hidden sm:inline">Marcar como lido</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Bottom area */}
                            <div className="mt-8 text-center pt-6 border-t border-border space-y-4">
                                {isTodayCompleted ? (
                                    <>
                                        <p className="text-sm text-gold font-medium">
                                            🎉 Excelente! Todas as leituras de hoje foram concluídas.
                                        </p>
                                        {todayDayIndex < activePlan.totalDays && (
                                            <Button
                                                onClick={advanceToNextDay}
                                                variant="outline"
                                                className="gap-2 border-gold/40 text-gold hover:bg-gold/10"
                                            >
                                                <SkipForward className="h-4 w-4" />
                                                Avançar para o próximo dia
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm text-app-text-muted">
                                        Clique no capítulo para ler e depois em{" "}
                                        <strong className="text-app-text">Marcar como lido</strong>{" "}
                                        para registrar sua leitura. O dia será concluído após todas as leituras.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mb-10 rounded-2xl border border-success/30 bg-success-bg p-8 text-center">
                        <Trophy className="mx-auto mb-4 h-12 w-12 text-success" />
                        <h3 className="mb-2 text-2xl font-bold text-success-fg">Parabéns!</h3>
                        <p className="text-success-fg/80">Você concluiu o plano "{activePlan.name}" inteiramente!</p>
                    </div>
                )}

                {/* Danger Zone */}
                <div className="mt-16 flex justify-center">
                    <Button
                        onClick={() => {
                            if (window.confirm("Tem certeza que deseja recomeçar este plano do zero? Todo o seu progresso será perdido.")) {
                                abandonPlan(activePlan.id);
                                setSearchParams({});
                            }
                        }}
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                    >
                        Apagar Meu Progresso
                    </Button>
                </div>
            </div>
        </Layout>
    );
}
