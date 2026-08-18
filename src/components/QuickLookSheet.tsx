import React, { useState } from 'react';
import { Quote, BookOpen, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { Commentary } from '@/lib/studyPanel';
import { useTranslation } from '@/i18n';

export interface QuickLookSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullStudy: () => void;
  verseReference: string;
  commentaries: Commentary[] | null;
  isLoading?: boolean;
}

export function QuickLookSheet({
  isOpen,
  onClose,
  onOpenFullStudy,
  verseReference,
  commentaries,
  isLoading = false,
}: QuickLookSheetProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  const validCommentaries = commentaries && commentaries.length > 0 ? commentaries : [];
  const currentCommentary = validCommentaries[currentIndex] ?? null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : validCommentaries.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < validCommentaries.length - 1 ? prev + 1 : 0));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent aria-label={`Comentários de ${verseReference}`} className="max-w-[500px] gap-0 p-0 sm:rounded-2xl overflow-hidden border-border bg-app-surface shadow-2xl">
        {/* Modal Header — Idêntico ao BiblicalCommentary */}
        <div className="bg-gold/5 p-6 pb-4 border-b border-border/50">
          <DialogHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold shrink-0">
                  <Quote className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-serif font-bold text-app-text leading-tight">
                    {currentCommentary ? currentCommentary.author : verseReference}
                  </DialogTitle>
                  <p className="font-mono text-[0.7rem] uppercase tracking-widest text-gold/80">
                    {(currentCommentary as any)?.tradition ?? currentCommentary?.era ?? 'Comentário Teológico'}
                  </p>
                </div>
              </div>
              {verseReference && (
                <span className="font-serif text-xs font-semibold text-gold bg-gold/10 px-2.5 py-1 rounded-full shrink-0">
                  {verseReference}
                </span>
              )}
            </div>

            {currentCommentary && (
              <DialogDescription className="text-sm font-medium flex items-center gap-2 text-app-text-muted italic">
                <BookOpen className="h-3.5 w-3.5" />
                {currentCommentary.work} {currentCommentary.year && `(${currentCommentary.year})`}
                {(currentCommentary as any)?.original_language && (
                  <span className="ml-auto text-[0.65rem] font-mono normal-case not-italic">
                    {(currentCommentary as any).original_language}
                  </span>
                )}
              </DialogDescription>
            )}
          </DialogHeader>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-app-text-muted animate-pulse">
              {t("study.commentaryLoading") ?? "Consultando comentaristas..."}
            </div>
          ) : currentCommentary ? (
            <>
              <p className="font-serif text-[0.95rem] leading-relaxed text-app-text whitespace-pre-wrap">
                {currentCommentary.text}
              </p>

              {currentCommentary.source_url && (
                <a
                  href={currentCommentary.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex items-center gap-1.5 text-xs text-gold hover:underline font-medium"
                >
                  <ExternalLink className="h-3 w-3" />
                  Acessar fonte original
                </a>
              )}
            </>
          ) : (
            <div className="py-6 text-center text-sm text-app-text-muted">
              Nenhum comentário em cache encontrado para este versículo.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-app-bg px-6 py-4 border-t border-border flex items-center justify-between gap-2">
          {validCommentaries.length > 1 ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrev}
                aria-label="Comentário anterior"
                className="h-6 w-6 rounded border border-border flex items-center justify-center text-app-text-muted hover:text-app-text hover:bg-app-raised transition-colors"
                type="button"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-[0.7rem] font-mono text-app-text-muted">
                {currentIndex + 1} de {validCommentaries.length}
              </span>
              <button
                onClick={handleNext}
                aria-label="Próximo comentário"
                className="h-6 w-6 rounded border border-border flex items-center justify-center text-app-text-muted hover:text-app-text hover:bg-app-raised transition-colors"
                type="button"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div />
          )}

          <button
            onClick={() => {
              onClose();
              onOpenFullStudy();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:text-gold/80 transition-colors py-1 px-2 rounded-md hover:bg-gold/10"
            type="button"
          >
            Abrir Estudo Completo
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
