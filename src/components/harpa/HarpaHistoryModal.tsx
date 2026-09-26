import React from "react";
import { BookOpen } from "lucide-react";
import HarpaTimeline from "@/components/HarpaTimeline";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface HarpaHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function HarpaHistoryModal({
  open,
  onOpenChange,
}: HarpaHistoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-3xl border-border bg-app-surface text-app-text p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="space-y-2 text-left border-b border-border/60 pb-4 shrink-0">
          <div className="flex items-center gap-2 text-gold">
            <BookOpen className="w-4 h-4" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] font-medium">
              História e Tradição
            </span>
          </div>

          <DialogTitle className="font-serif text-xl sm:text-2xl font-normal text-app-text">
            A História da Harpa Cristã
          </DialogTitle>

          <DialogDescription className="text-xs sm:text-sm text-app-text-muted">
            A trajetória do hinário oficial que embalou e fortaleceu gerações de fé no Brasil.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 overflow-y-auto pr-1 custom-scrollbar flex-1">
          <HarpaTimeline />
        </div>

        <div className="pt-3 border-t border-border/60 flex justify-end shrink-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-5 py-2 rounded-full border border-border text-app-text-muted hover:text-app-text text-xs font-medium transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
