import { Button } from "@/components/ui/button";
import { Pause, Play, Square } from "lucide-react";
import { useTranslation } from "@/i18n";

interface TTSPlayerProps {
  currentLabel?: string;
  isPaused: boolean;
  isPlaying: boolean;
  onPause: () => void;
  onResume: () => void;
  onStart: () => void;
  onStop: () => void;
}

export default function TTSPlayer({
  isPlaying,
  isPaused,
  currentLabel,
  onStart,
  onPause,
  onResume,
  onStop,
}: TTSPlayerProps) {
  const { t } = useTranslation();
  if (!isPlaying && !isPaused) {
    return (
      <Button aria-label={t("tts.listen")} className="gap-2" onClick={onStart} type="button" variant="outline">
        <Play className="h-4 w-4" />
        <span className="hidden sm:inline">{t("tts.listen")}</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-app-surface px-2 py-1">
      {isPaused ? (
        <Button aria-label={t("tts.resumeAria")} className="h-8 gap-1.5" onClick={onResume} size="sm" type="button" variant="ghost">
          <Play className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("tts.resume")}</span>
        </Button>
      ) : (
        <Button aria-label={t("tts.pauseAria")} className="h-8 gap-1.5" onClick={onPause} size="sm" type="button" variant="ghost">
          <Pause className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("tts.pause")}</span>
        </Button>
      )}

      <Button className="h-8 gap-1.5" onClick={onStop} size="sm" type="button" variant="ghost">
        <Square className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t("tts.stop")}</span>
      </Button>

      {currentLabel && (
        <span aria-live="polite" className="hidden text-xs text-app-text-muted sm:inline">
          {currentLabel}
        </span>
      )}
    </div>
  );
}