import { useTranslation } from "@/i18n";
import { Link } from "react-router-dom";
import { CheckCircle2, CalendarDays, ArrowRight, BookMarked, Check, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyReadingBadgeProps {
    planName: string;
    todayDayIndex: number;
    isTodayCompleted: boolean;
    isRefCompleted: boolean;
    totalRefs: number;
    completedRefs: number;
    onMarkComplete: () => void;
}

export default function DailyReadingBadge({
    planName,
    todayDayIndex,
    isTodayCompleted,
    isRefCompleted,
    totalRefs,
    completedRefs,
    onMarkComplete,
}: DailyReadingBadgeProps) {
    const { t } = useTranslation();

    // The whole day is completed
    if (isTodayCompleted) {
        return (
            <div className="mx-auto mt-16 mb-12 flex w-full max-w-lg flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Premium Golden Victory Card */}
                <div className="relative w-full overflow-hidden rounded-2xl border border-gold/40 bg-app-surface/60 backdrop-blur-xl p-8 text-center shadow-[0_8px_30px_rgb(192,160,128,0.06)] dark:shadow-[0_8px_30px_rgba(235,200,155,0.03)] transition-all">

                    {/* Golden Glow Backdrop */}
                    <div className="absolute left-1/2 top-0 -z-10 h-[120px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/15 blur-3xl mix-blend-screen"></div>

                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-gold ring-1 ring-gold/20 shadow-inner">
                        <Award className="h-7 w-7" strokeWidth={1.5} />
                    </div>

                    <h4 className="font-serif text-2xl font-medium text-app-text mb-2">
                        Leitura do dia concluída!
                    </h4>

                    <p className="font-sans text-sm text-app-text-muted mb-8 leading-relaxed max-w-[280px] mx-auto">
                        Você completou a porção do dia {todayDayIndex} para o plano <span className="text-gold font-medium">"{planName}"</span>.
                    </p>

                    <Link
                        to={`/planos?id=${encodeURIComponent(planName)}`} // fallback URL, optimally it should be searching by ID, but wait, we only get the string here, so just go back to /planos
                        onClick={(e) => {
                            // Quick patch for URL nav since we don't have the active plan ID here
                            e.currentTarget.href = "/planos";
                        }}
                        className="group inline-flex items-center gap-2 rounded-full border border-gold/50 bg-app-surface px-6 py-2.5 font-sans text-sm font-medium text-gold transition-all hover:border-gold hover:bg-gold-bg shadow-sm"
                    >
                        <span>Ver meu progresso</span>
                        <ArrowRight className="h-4 w-4 text-gold/70 transition-transform group-hover:translate-x-1 group-hover:text-gold" />
                    </Link>
                </div>
            </div>
        );
    }

    // This specific chapter is read, but there are more chapters today
    if (isRefCompleted) {
        return (
            <div className="mx-auto mt-16 mb-12 flex w-full max-w-lg flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Refined "Marked read" state using sleek golden glassmorphism */}
                <div className="group relative overflow-hidden rounded-2xl border border-gold/30 bg-gold-bg/40 backdrop-blur-md px-6 py-6 text-center sm:text-left transition-all hover:border-gold/50 hover:bg-gold-bg/60">
                    <div className="absolute top-0 right-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-gold/5 blur-2xl transition-opacity opacity-0 group-hover:opacity-100 mix-blend-screen"></div>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-app-surface border border-gold/20 text-gold shadow-sm">
                            <Check className="h-6 w-6" strokeWidth={2} />
                        </div>
                        <div className="flex-1 space-y-1">
                            <h4 className="font-serif text-lg font-medium text-app-text">
                                Capítulo lido
                            </h4>
                            <p className="font-sans text-[0.8rem] tracking-wide text-app-text-muted">
                                {completedRefs} de {totalRefs} concluídos hoje no plano "{planName}".
                            </p>
                        </div>
                        <Link
                            to="/planos"
                            className="shrink-0 rounded-full bg-gold px-6 py-2.5 font-sans text-sm font-bold text-white shadow-md shadow-gold/20 hover:bg-gold-hover transition-transform hover:-translate-y-[1px] active:scale-95"
                        >
                            Continuar
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Not read yet
    return (
        <div className="mx-auto mt-16 mb-12 flex w-full max-w-lg flex-col animate-in fade-in duration-700">
            {/* Elegant Call to Action Card */}
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-app-surface p-1 transition-all hover:border-gold/30 hover:shadow-sm">
                <div className="relative flex flex-col sm:flex-row items-center gap-6 rounded-xl bg-app-raised/50 px-6 py-8 sm:p-6 sm:pl-8 text-center sm:text-left transition-colors group-hover:bg-app-raised/80">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold ring-1 ring-gold/20 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]">
                        <BookMarked className="h-5 w-5" strokeWidth={1.5} />
                    </div>

                    <div className="flex-1 space-y-1">
                        <p className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.15em] text-gold/80">
                            Plano • Dia {todayDayIndex} • {completedRefs} de {totalRefs}
                        </p>
                        <h4 className="font-serif text-lg font-medium text-app-text">
                            {planName}
                        </h4>
                        <p className="font-sans text-sm text-app-text-muted max-w-[260px] mx-auto sm:mx-0">
                            Este capítulo faz parte da sua meta diária de leitura.
                        </p>
                    </div>

                    <button
                        onClick={onMarkComplete}
                        className="relative overflow-hidden rounded-full bg-app-text px-6 py-3 font-sans text-sm font-medium text-app-surface transition-transform active:scale-95 sm:px-5 sm:py-2.5 hover:opacity-90 mt-2 sm:mt-0"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            Marcar como lido
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
