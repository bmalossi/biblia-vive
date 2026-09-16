import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BibleVersion, VERSION_CATALOG, VersionInfo } from "@/lib/themes";
import { BookOpen, Check } from "lucide-react";
import { useReadingTheme } from "@/hooks/useReadingTheme";
import { cn } from "@/lib/utils";

export interface VersionPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentVersion: BibleVersion;
  onSelectVersion: (version: BibleVersion) => void;
}

export const VersionPickerModal: React.FC<VersionPickerModalProps> = ({
  open,
  onOpenChange,
  currentVersion,
  onSelectVersion,
}) => {
  const { isDark, isSepia } = useReadingTheme();

  const handleSelect = (v: BibleVersion) => {
    onSelectVersion(v);
    onOpenChange(false);
  };

  const dialogContentClass = isDark
    ? "border-[#382f23]/80 bg-[#161412] text-[#f5f5f0]"
    : isSepia
      ? "border-[#d8c8b0] bg-[#f6f0e4] text-[#2e241d]"
      : "border-neutral-200 bg-white text-neutral-900";

  const selectedItemClass = isDark
    ? "bg-[#e5b869]/15 border-[#e5b869] text-[#e5b869] shadow-xs"
    : isSepia
      ? "bg-[#c4973b]/20 border-[#c4973b] text-[#8a5d12] shadow-xs"
      : "bg-amber-50 border-amber-500 text-amber-900 shadow-xs";

  const unselectedItemClass = isDark
    ? "bg-[#1f1b18]/70 hover:bg-[#28231f] border-[#382f23]/40 text-[#ded9ce] hover:text-white hover:border-[#382f23]"
    : isSepia
      ? "bg-[#ede4d4]/60 hover:bg-[#ede4d4] border-[#d8c8b0] text-[#4a3a2d] hover:text-[#1c140e]"
      : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-800 hover:text-neutral-950";

  const itemTitleClass = isDark
    ? "text-[#f5f5f0]"
    : isSepia
      ? "text-[#2e241d]"
      : "text-neutral-900";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-xl border sm:rounded-2xl p-6 shadow-2xl transition-colors duration-300", dialogContentClass)}>
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-gold" />
            <DialogTitle className="text-xl font-serif">
              Versões da Bíblia
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Escolha a tradução bíblica para leitura e estudo comparativo.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[420px] overflow-y-auto custom-scrollbar pr-1 pt-3 space-y-2">
          {VERSION_CATALOG.map((item: VersionInfo) => {
            const isSelected = item.id === currentVersion;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                  isSelected ? selectedItemClass : unselectedItemClass
                )}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-gold">
                      {item.id.toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground font-sans">
                      &bull; {item.languageLabel}
                    </span>
                    {item.isPro && (
                      <span className="text-[0.62rem] px-1.5 py-0.5 rounded bg-gold/20 text-gold font-semibold">
                        PRO
                      </span>
                    )}
                  </div>
                  <p className={cn("text-sm font-medium", itemTitleClass)}>
                    {item.name}
                  </p>
                </div>
                {isSelected && (
                  <Check className="h-5 w-5 text-gold shrink-0 ml-3" />
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VersionPickerModal;
