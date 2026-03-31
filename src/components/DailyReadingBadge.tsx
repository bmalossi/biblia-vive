import { useTranslation } from "@/i18n";
import { Link } from "react-router-dom";
import { CheckCircle2, CalendarDays, ArrowRight, BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyReadingBadgeProps {
    planName: string;
    todayDayIndex: number;
    isTodayCompleted: boolean;
    onMarkComplete: () => void;
}

export default function DailyReadingBadge({
    planName,
    todayDayIndex,
    isTodayCompleted,
    onMarkComplete,
}: DailyReadingBadgeProps) {
    const { t } = useTranslation();

    if (isTodayCompleted) {
        return (
            <div className="mx-auto mt-16 mb-12 flex w-full max-w-lg flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Refined Glassmorphism Success Card */}
                <div className="relative w-full overflow-hidden rounded-2xl border border-success/20 bg-app-surface/60 backdrop-blur-md p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(255,255,255,0.02)] transition-all">

                    {/* Subtle aesthetic glow behind icon */}
                    <div className="absolute left-1/2 top-0 -z-10 h-[100px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-success/10 blur-3xl"></div>

                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success ring-1 ring-success/20">
                        <CheckCircle2 className="h-7 w-7" strokeWidth={1.5} />
                    </div>

                    <h4 className="font-serif text-2xl font-medium text-app-text mb-2">
                        Leitura Concluída
                    </h4>

                    <p className="font-sans text-sm text-app-text-muted mb-8 leading-relaxed max-w-[280px] mx-auto">
                        Você completou a porção do dia {todayDayIndex} para o plano <span className="text-app-text font-medium">"{planName}"</span>.
                    </p>

                    <Link
                        to="/planos"
                        className="group inline-flex items-center gap-2 rounded-full border border-border bg-app-raised px-6 py-2.5 font-sans text-sm font-medium text-app-text transition-all hover:border-success/40 hover:bg-success/5"
                    >
                        <span>Ver meu progresso</span>
                        <ArrowRight className="h-4 w-4 text-app-text-muted transition-transform group-hover:translate-x-1 group-hover:text-success" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto mt-16 mb-12 flex w-full max-w-lg flex-col animate-in fade-in duration-700">
            {/* Elegant Call to Action Card */}
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-app-surface p-1 transition-all hover:border-gold/30 hover:shadow-sm">
                <div className="relative flex flex-col sm:flex-row items-center gap-6 rounded-xl bg-app-raised/50 px-6 py-8 sm:p-6 sm:pl-8 text-center sm:text-left transition-colors group-hover:bg-app-raised/80">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold ring-1 ring-gold/20">
                        <BookMarked className="h-5 w-5" strokeWidth={1.5} />
                    </div>

                    <div className="flex-1 space-y-1">
                        <p className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.15em] text-gold/80">
                            Plano • Dia {todayDayIndex}
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
