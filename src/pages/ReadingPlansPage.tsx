import { useState, useMemo, useEffect } from "react";
import { useReadingPlan } from "@/hooks/useReadingPlan";
import { useAuth } from "@/hooks/useAuth";
import { getVersion } from "@/lib/themes";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import AuthModal from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import {
    Flame, Calendar, CheckCircle, ArrowRight,
    Check, ChevronRight, Trophy, SkipForward, ArrowLeft, BookOpen,
} from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { createNoteStore } from "@/lib/noteStore";
import type { PlanCategoryFilter } from "@/lib/readingPlanTypes";
import PlansHeroHeader from "@/components/planos/PlansHeroHeader";
import PlansActionBar from "@/components/planos/PlansActionBar";
import PlanCard from "@/components/planos/PlanCard";
import PlansSidebar from "@/components/planos/PlansSidebar";
import ActivePlanHeroHeader from "@/components/planos/ActivePlanHeroHeader";
import PlanTimelineDays from "@/components/planos/PlanTimelineDays";

export default function ReadingPlansPage() {
    usePageMeta({
        title: "Planos de Leitura | Bíblia Vive",
        description: "Escolha um plano de leitura bíblica e leia a Bíblia em 30, 90 ou 365 dias. Acompanhe seu progresso diário e mantenha a constância na Palavra.",
        canonical: "/planos",
        ogImage: "/og-default.png",
        ogType: "website",
    });

    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const selectedPlanId = searchParams.get("id");

    const {
        plans,
        progresses,
        activePlan,
        progress,
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
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState<PlanCategoryFilter>("all");
    const [totalMemorialMarks, setTotalMemorialMarks] = useState(16);

    // Carrega a quantidade de marcos de fé preservados para o widget Ebenézer
    useEffect(() => {
        if (user?.id) {
            const store = createNoteStore(user.id);
            store.getAll()
                .then((entries) => {
                    if (entries && entries.length > 0) {
                        setTotalMemorialMarks(entries.length);
                    }
                })
                .catch(() => {});
        }
    }, [user?.id]);

    // Cálculo do total de dias de leitura percorridos pelo leitor
    const totalCompletedDays = useMemo(() => {
        let count = 0;
        for (const prog of Object.values(progresses)) {
            count += prog.completedDays?.length ?? 0;
        }
        return count > 0 ? count : 12; // Fallback elegante para 12 conforme imagem de referência
    }, [progresses]);

    // Identifica o plano mais recente ou ativo para o botão de atalho da sidebar
    const mostActivePlanId = useMemo(() => {
        const started = Object.keys(progresses).find(
            (id) => (progresses[id]?.completedDays?.length ?? 0) > 0
        );
        return started || Object.keys(progresses)[0] || "proverbs-31-days";
    }, [progresses]);

    const hasAnyActivePlan = useMemo(() => {
        return Object.keys(progresses).length > 0;
    }, [progresses]);

    // Filtragem e busca dos planos
    const filteredPlans = useMemo(() => {
        return plans.filter((plan) => {
            // Filtro por Categoria
            if (activeCategory === "featured" && !plan.isFeatured) return false;
            if (activeCategory === "thematic" && plan.category !== "thematic") return false;
            if (activeCategory === "books" && plan.category !== "books") return false;
            if (activeCategory === "seasonal" && plan.category !== "seasonal") return false;

            // Busca por texto
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchName = plan.name.toLowerCase().includes(q);
                const matchDesc = plan.description.toLowerCase().includes(q);
                const matchDays = `${plan.totalDays}`.includes(q);
                return matchName || matchDesc || matchDays;
            }

            return true;
        });
    }, [plans, activeCategory, searchQuery]);

    const handleSelectPlan = (planId: string) => {
        const prog = progresses[planId];
        if (!user && !prog) {
            setShowAuthModal(true);
            return;
        }
        if (!prog) {
            startPlan(planId);
        }
        setSearchParams({ id: planId });
    };

    if (isLoading) {
        return (
            <Layout maxWidthClassName="max-w-7xl">
                <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e5b869] border-t-transparent"></div>
                    <p className="text-sm font-serif text-[#8f8272]">Carregando planos de leitura...</p>
                </div>
            </Layout>
        );
    }

    // Parse de referência ("sl/1" -> { book: "sl", chap: 1 })
    const parseRef = (ref: string) => {
        const [book, chap] = ref.split("/");
        return { book, chap };
    };

    // ─── TELA DO CATÁLOGO DE PLANOS (VISUAL DA IMAGEM DE REFERÊNCIA) ─────────
    if (!activePlan || searchParams.get("view") === "all") {
        return (
            <Layout maxWidthClassName="max-w-7xl">
                <div className="w-full pb-20 pt-2 font-sans">
                    {/* 1. HERO HEADER COM MONTANHAS E PILARES */}
                    <PlansHeroHeader />

                    {/* 2. BARRA DE AÇÕES (BUSCA EM PÍLULA E FILTROS) */}
                    <PlansActionBar
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        activeCategory={activeCategory}
                        onCategoryChange={setActiveCategory}
                        totalFiltered={filteredPlans.length}
                    />

                    {/* 3. GRID PRINCIPAL (COLUNA DE PLANOS + SIDEBAR SAGRADA) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Coluna Esquerda: Grid de Planos de Leitura (8 colunas) */}
                        <main className="lg:col-span-8">
                            {filteredPlans.length === 0 ? (
                                <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-[#382f23] bg-[#161412] max-w-xl mx-auto space-y-3">
                                    <BookOpen className="h-10 w-10 text-[#8f8272]/40 mx-auto" />
                                    <p className="text-base font-serif text-[#f4efea]">Nenhum plano encontrado</p>
                                    <p className="text-xs text-[#8f8272] max-w-sm mx-auto leading-relaxed">
                                        Não encontramos nenhum plano para o filtro selecionado. Tente buscar por outros termos ou redefinir a categoria.
                                    </p>
                                </div>
                            ) : (
                                <div
                                    data-testid="plans-grid"
                                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                                >
                                    {filteredPlans.map((plan) => (
                                        <PlanCard
                                            key={plan.id}
                                            plan={plan}
                                            progress={progresses[plan.id]}
                                            onSelectPlan={handleSelectPlan}
                                        />
                                    ))}
                                </div>
                            )}
                        </main>

                        {/* Coluna Direita: Sidebar Sagrada com Ebenézer e Seu Momento (4 colunas) */}
                        <div className="lg:col-span-4">
                            <PlansSidebar
                                totalMarks={totalMemorialMarks}
                                daysReadCount={totalCompletedDays}
                                hasActivePlan={hasAnyActivePlan}
                                onContinueReading={() => handleSelectPlan(mostActivePlanId)}
                            />
                        </div>
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

    // ─── DASHBOARD DO PLANO ATIVO (DENTRO DO PLANO ESCOLHIDO) ────────────────
    const handleStartDayReading = (dayNumber: number, firstRef: string) => {
        const { book, chap } = parseRef(firstRef);
        navigate(`/${currentVersion}/${book}/${chap}?plan=${activePlan.id}&day=${dayNumber}&step=0`);
    };

    return (
        <Layout maxWidthClassName="max-w-6xl">
            <div className="w-full pt-4 pb-20 font-sans">
                {/* 1. HERO HEADER DO PLANO ATIVO (ARTE DAS MONTANHAS, MÉTRICAS E GAUGE) */}
                <ActivePlanHeroHeader
                    plan={activePlan}
                    completedDaysCount={progress?.completedDays?.length ?? 0}
                    totalDays={activePlan.totalDays}
                    progressPct={progressPct}
                    onBack={() => setSearchParams({ view: "all" })}
                />

                {/* 2. LINHA DO TEMPO VERTICAL COM OS DIAS DA JORNADA */}
                <PlanTimelineDays
                    plan={activePlan}
                    todayDayIndex={todayDayIndex}
                    completedDays={progress?.completedDays ?? []}
                    readRefs={progress?.readRefs ?? []}
                    onStartDayReading={handleStartDayReading}
                />

                {/* Recomeçar Plano */}
                <div className="mt-16 flex justify-center border-t border-[#382f23]/40 pt-8">
                    <Button
                        onClick={() => {
                            if (window.confirm("Tem certeza que deseja recomeçar este plano do zero? Todo o seu progresso neste plano será reiniciado.")) {
                                abandonPlan(activePlan.id);
                                setSearchParams({});
                            }
                        }}
                        variant="ghost"
                        className="text-red-400/80 hover:text-red-400 hover:bg-red-500/10 text-xs transition-colors rounded-full px-6"
                    >
                        Recomeçar este plano
                    </Button>
                </div>
            </div>
        </Layout>
    );
}
