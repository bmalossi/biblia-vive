import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clipboard, Highlighter, PencilLine, Share2, BookOpen } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/i18n";
import HighlightPicker, { HIGHLIGHT_CLASSES } from "@/components/HighlightPicker";
import type { HighlightColor } from "@/lib/notesHighlights";

interface VerseToolbarProps {
  ariaReference: string;
  copyLabel: string;
  isMobile: boolean;
  onCopy: () => void;
  onShare: () => void;
  onStudy: () => void;
  onHighlight: (color: HighlightColor) => void;
  onRemoveHighlight: () => void;
  onNote: () => void;
  position: { left: number; top: number } | null;
  shareLabel: string;
  visible: boolean;
  studyOpen?: boolean;
  activeHighlight?: HighlightColor | null;
  hasNote?: boolean;
}

export default function VerseToolbar({
  visible,
  isMobile,
  position,
  onCopy,
  onShare,
  onStudy,
  onHighlight,
  onRemoveHighlight,
  onNote,
  copyLabel,
  shareLabel,
  ariaReference,
  studyOpen = false,
  activeHighlight = null,
  hasNote = false,
}: VerseToolbarProps) {
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setShowPicker(false);
    }
  }, [visible]);

  if (!visible) return null;

  const floatingStyle = isMobile
    ? undefined
    : {
      left: position?.left ?? 0,
      top: position?.top ?? 0,
    };

  const hlBadge = activeHighlight ? HIGHLIGHT_CLASSES[activeHighlight] : undefined;

  return (
    <div
      aria-label={t("toolbar.ariaToolbar", { ref: ariaReference })}
      aria-orientation="horizontal"
      className={cn(
        "z-40 rounded-[10px] border border-border bg-app-surface p-2 shadow-md transition-all duration-150 ease-out",
        "animate-in fade-in-0 slide-in-from-top-1",
        isMobile ? "fixed inset-x-3 bottom-16" : "absolute",
      )}
      data-verse-toolbar="true"
      role="toolbar"
      style={floatingStyle}
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Study Button */}
        <Button
          aria-label={t("toolbar.ariaStudy", { ref: ariaReference })}
          aria-pressed={studyOpen}
          className={cn(
            "h-9 gap-1.5 font-medium transition-colors",
            studyOpen
              ? "border-gold bg-gold-bg text-gold hover:bg-gold-bg"
              : "border-gold/40 text-gold hover:bg-gold-bg/30",
          )}
          onClick={onStudy}
          ref={firstButtonRef}
          size="sm"
          type="button"
          variant="outline"
        >
          <BookOpen className="h-3.5 w-3.5" />
          {t("toolbar.study")}
        </Button>

        {/* Copy */}
        <Button
          aria-label={t("toolbar.ariaCopy", { ref: ariaReference })}
          className="h-9"
          onClick={onCopy}
          size="sm"
          type="button"
          variant="outline"
        >
          <Clipboard className="h-3.5 w-3.5" />
          {copyLabel}
        </Button>

        {/* Share */}
        <Button
          aria-label={t("toolbar.ariaShare", { ref: ariaReference })}
          className="h-9"
          onClick={onShare}
          size="sm"
          type="button"
          variant="outline"
        >
          <Share2 className="h-3.5 w-3.5" />
          {shareLabel}
        </Button>

        {/* Highlight — toggles colour picker */}
        <div className="relative">
          <Button
            aria-label={t("toolbar.ariaHighlight", { ref: ariaReference })}
            aria-pressed={!!activeHighlight}
            className={cn("h-9 gap-1.5", hlBadge)}
            onClick={() => setShowPicker(p => !p)}
            size="sm"
            type="button"
            variant="outline"
          >
            <Highlighter className="h-3.5 w-3.5" />
            {t("toolbar.highlight")}
          </Button>

          {showPicker && (
            <div className="absolute bottom-full mb-2 left-0 z-50">
              <HighlightPicker
                activeColor={activeHighlight}
                onSelect={(c) => { onHighlight(c); setShowPicker(false); }}
                onRemove={() => { onRemoveHighlight(); setShowPicker(false); }}
              />
            </div>
          )}
        </div>

        {/* Note */}
        <Button
          aria-label={t("toolbar.ariaNote", { ref: ariaReference })}
          aria-pressed={hasNote}
          className={cn("h-9 gap-1.5", hasNote && "border-gold/60 text-gold")}
          onClick={onNote}
          size="sm"
          type="button"
          variant="outline"
        >
          <PencilLine className="h-3.5 w-3.5" />
          {t("toolbar.note")}
        </Button>
      </div>
    </div>
  );
}
