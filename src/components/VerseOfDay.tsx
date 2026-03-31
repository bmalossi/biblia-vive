import { useTranslation } from "@/i18n";
import { useDailyVerse } from "@/hooks/useDailyVerse";
import { Sparkles } from "lucide-react";

export default function VerseOfDay() {
  const { locale, t } = useTranslation();
  const { verse, loading } = useDailyVerse(
    t("home.verseOfDayText"),
    t("home.verseOfDayRef")
  );

  const dateLabel = new Date().toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <section className="rounded-2xl border border-border bg-app-surface px-6 py-10 text-center">
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-gold flex items-center justify-center gap-2">
        {verse?.isCurated && <Sparkles className="h-3 w-3" />}
        {t("home.verseOfDay")} · {dateLabel}
      </p>

      {loading ? (
        <div className="mx-auto mt-6 h-12 max-w-[620px] animate-pulse rounded-lg bg-app-raised" />
      ) : (
        <>
          <blockquote className="mx-auto mt-6 max-w-[620px] font-serif text-[1.3rem] italic leading-relaxed text-app-text">
            {verse?.text}
          </blockquote>
          <p className="mt-4 font-sans text-[0.8rem] text-app-text-muted">
            {verse?.reference}
          </p>
          {verse?.reflection && (
            <p className="mx-auto mt-4 max-w-[500px] font-sans text-[0.85rem] leading-relaxed text-app-text-muted border-t border-border pt-4">
              {verse.reflection}
            </p>
          )}
        </>
      )}
    </section>
  );
}