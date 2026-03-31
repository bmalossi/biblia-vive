import { useReadingPlan } from "@/hooks/useReadingPlan";
import { useTranslation } from "@/i18n";
import { getVersion } from "@/lib/themes";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Flame, Calendar, BookOpen, CheckCircle, ArrowRight, Play, Trophy } from "lucide-react";

export default function ReadingPlansPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const {
        plans,
        activePlan,
        isLoading,
        todayDayIndex,
        todayRefs,
        isTodayCompleted,
        streak,
        progressPct,
        startPlan,
        abandonPlan
    } = useReadingPlan();

    const currentVersion = getVersion();

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
                        {plans.map((plan) => (
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
                                </div>

                                <Button
                                    onClick={() => startPlan(plan.id)}
                                    className="w-full bg-gold hover:bg-gold-hover text-white shadow-md shadow-gold/20"
                                >
                                    Iniciar Plano
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </Layout>
        );
    }

    // Dashboard for Active Plan
    return (
        <Layout>
            <div className="mx-auto max-w-3xl pt-4 pb-12">
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
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-app-text">Dia {todayDayIndex}</h4>
                                        <p className="text-sm text-app-text-muted">
                                            {isTodayCompleted ? "Você já concluiu a leitura de hoje!" : "Capítulos programados para hoje:"}
                                        </p>
                                    </div>
                                </div>

                                {isTodayCompleted && (
                                    <div className="flex items-center gap-2 text-green-600 dark:text-green-500 font-medium">
                                        <CheckCircle className="h-5 w-5" />
                                        <span className="hidden sm:inline">Concluído</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                {todayRefs.map((ref) => {
                                    const { book, chap } = parseRef(ref);
                                    return (
                                        <Link
                                            key={ref}
                                            to={`/${currentVersion}/${book}/${chap}`}
                                            className="group flex items-center justify-between rounded-xl border border-border bg-app-raised px-5 py-4 transition-colors hover:border-gold/50 hover:bg-gold-bg/20"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-app-surface shadow-sm text-gold">
                                                    <Play className="h-3.5 w-3.5 ml-0.5" />
                                                </div>
                                                <span className="font-medium text-app-text uppercase font-mono tracking-wider text-sm">
                                                    {book} {chap}
                                                </span>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-app-text-muted transition-transform group-hover:translate-x-1 group-hover:text-gold" />
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="mt-8 text-center pt-6 border-t border-border">
                                {isTodayCompleted ? (
                                    <p className="text-sm text-app-text-muted font-medium">
                                        Excelente trabalho! Volte amanhã para continuar sua jornada.
                                    </p>
                                ) : (
                                    <p className="text-sm text-app-text-muted">
                                        Comece a leitura por qualquer um dos capítulos acima. Quando você chegar ao final da página, poderá marcar a leitura de hoje como concluída.
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
                        variant="ghost"
                        onClick={() => {
                            if (window.confirm("Tem certeza que deseja abandonar este plano? Todo o seu progresso será perdido.")) {
                                abandonPlan();
                            }
                        }}
                        className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
                    >
                        Abandonar Plano
                    </Button>
                </div>
            </div>
        </Layout>
    );
}
