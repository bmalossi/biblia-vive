// ─────────────────────────────────────────────────────────────────────────────
// WidgetDailyVerse.tsx — Bíblia Viva · Sprint 12
// Minimal, standalone route designed to be embedded in external iframes.
// Shows the curated Daily Verse without navigation or app shell.
// ─────────────────────────────────────────────────────────────────────────────

import { useTranslation } from "@/i18n";
import { useDailyVerse } from "@/hooks/useDailyVerse";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Sparkles, Loader2, Quote } from "lucide-react";

export default function WidgetDailyVerse() {
    const { locale, t } = useTranslation();
    const { verse, loading } = useDailyVerse(
        t("home.verseOfDayText"),
        t("home.verseOfDayRef")
    );

    usePageMeta({
        title: "Versículo do Dia · Bíblia Vive",
        description: "Versículo diário curado para o seu site ou blog.",
    });

    const dateLabel = new Date().toLocaleDateString(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    return (
        <main className="min-h-screen bg-app-bg p-4 flex flex-col items-center justify-center font-sans antialiased">
            <div className="w-full max-w-md rounded-2xl border border-border bg-app-surface shadow-xl overflow-hidden relative">
                {/* Decorative Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold/20 via-gold to-gold/20" />

                <div className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        {verse?.isCurated && <Sparkles className="h-4 w-4 text-gold" />}
                        <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">
                            {t("home.verseOfDay")}
                        </p>
                    </div>

                    <Quote className="h-6 w-6 text-gold/20 mx-auto mb-3" />

                    {loading ? (
                        <div className="space-y-3 py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-gold/50 mx-auto" />
                            <p className="text-sm text-app-text-muted">Carregando...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <blockquote className="font-serif text-[1.2rem] italic leading-relaxed text-app-text">
                                "{verse?.text}"
                            </blockquote>

                            <div className="line-clamp-1 border-t border-border/50 pt-4">
                                <p className="text-sm font-medium text-app-text-muted">
                                    {verse?.reference}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer attribution for external embeds */}
                <div className="bg-app-raised/50 py-2.5 px-4 text-center border-t border-border">
                    <a
                        href={window.location.origin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[0.65rem] uppercase tracking-wider text-app-text-muted hover:text-gold transition-colors"
                    >
                        Provido por Bíblia Vive • {dateLabel}
                    </a>
                </div>
            </div>
        </main>
    );
}
