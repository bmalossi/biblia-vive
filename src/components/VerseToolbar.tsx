import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Clipboard, Highlighter, PencilLine, Share2, BookOpen, X } from "lucide-react";
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
  onClose: () => void;
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
  onClose,
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
    ? {
      top: position?.top ?? 0,
    }
    : {
      left: position?.left ?? 0,
      top: position?.top ?? 0,
    };

  const hlBadge = activeHighlight ? HIGHLIGHT_CLASSES[activeHighlight] : undefined;

  const buttonClassName = cn(
    "font-medium transition-colors hover:bg-gold hover:text-primary-foreground hover:border-gold shrink-0",
    isMobile
      ? "h-7 text-[0.7rem] px-2.5 gap-1 [&_svg]:size-3"
      : "h-8 text-xs px-3.5 gap-1.5 [&_svg]:size-3.5",
  );

  return (
    <div
      aria-label={t("toolbar.ariaToolbar", { ref: ariaReference })}
      aria-orientation="horizontal"
      className={cn(
        "z-40 rounded-[10px] border border-border bg-app-surface shadow-md transition-all duration-150 ease-out",
        "animate-in fade-in-0 slide-in-from-top-1",
        isMobile ? "absolute inset-x-3 p-1.5" : "absolute p-2",
      )}
      data-verse-toolbar="true"
      role="toolbar"
      style={floatingStyle}
    >
      {/* Close Button - positioned offboard at the top right */}
      <button
        aria-label={t("settings.close")}
        className="absolute z-50 h-5 w-5 rounded-full bg-app-surface border border-border text-app-text-muted hover:text-app-text hover:bg-app-raised flex items-center justify-center shadow-md transition-colors shrink-0"
        onClick={onClose}
        style={{ top: "-6px", right: "-6px" }}
        type="button"
      >
        <X className="h-3 w-3" />
      </button>

      <div className={cn("flex items-center flex-wrap", isMobile ? "gap-1" : "gap-1.5")}>
        {/* Study Button */}
        <Button
          aria-label={t("toolbar.ariaStudy", { ref: ariaReference })}
          aria-pressed={studyOpen}
          className={cn(
            buttonClassName,
            studyOpen
              ? "border-gold bg-gold-bg text-gold"
              : "border-gold/40 text-gold",
          )}
          onClick={onStudy}
          ref={firstButtonRef}
          size="sm"
          type="button"
          variant="outline"
        >
          <BookOpen className={isMobile ? "h-3 w-3" : "h-3.5 w-3.5"} />
          {t("toolbar.study")}
        </Button>

        {/* Copy */}
        <Button
          aria-label={t("toolbar.ariaCopy", { ref: ariaReference })}
          className={buttonClassName}
          onClick={onCopy}
          size="sm"
          type="button"
          variant="outline"
        >
          <Clipboard className={isMobile ? "h-3 w-3" : "h-3.5 w-3.5"} />
          {copyLabel}
        </Button>

        {/* Share */}
        <Button
          aria-label={t("toolbar.ariaShare", { ref: ariaReference })}
          className={buttonClassName}
          onClick={onShare}
          size="sm"
          type="button"
          variant="outline"
        >
          <Share2 className={isMobile ? "h-3 w-3" : "h-3.5 w-3.5"} />
          {shareLabel}
        </Button>

        {/* Highlight — toggles colour picker */}
        <div className="relative">
          <Button
            aria-label={t("toolbar.ariaHighlight", { ref: ariaReference })}
            aria-pressed={!!activeHighlight}
            className={cn(buttonClassName, hlBadge)}
            onClick={() => setShowPicker(p => !p)}
            size="sm"
            type="button"
            variant="outline"
          >
            <Highlighter className={isMobile ? "h-3 w-3" : "h-3.5 w-3.5"} />
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
          className={cn(
            buttonClassName,
            hasNote && "border-gold/60 text-gold"
          )}
          onClick={onNote}
          size="sm"
          type="button"
          variant="outline"
        >
          <PencilLine className={isMobile ? "h-3 w-3" : "h-3.5 w-3.5"} />
          {t("toolbar.note")}
        </Button>
      </div>
    </div>
  );
}
