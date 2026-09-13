import React from "react";
import { CheckCircle2 } from "lucide-react";

export interface AnswerPrayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  answerText: string;
  onAnswerTextChange: (text: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const AnswerPrayerDialog: React.FC<AnswerPrayerDialogProps> = ({
  isOpen,
  onClose,
  answerText,
  onAnswerTextChange,
  onSubmit,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="modal-answer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md rounded-2xl bg-app-surface border border-border p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3
            id="modal-answer-title"
            className="text-[0.95rem] font-serif font-semibold text-app-text flex items-center gap-2"
          >
            <CheckCircle2 className="h-5 w-5 text-gold" />
            <span>Registrar Oração Respondida</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-app-raised text-app-text-muted hover:text-app-text transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <p className="text-[0.8rem] text-app-text-muted leading-relaxed">
          "A fidelidade do Senhor permanece para sempre." Registre o testemunho de como Deus respondeu a esta oração para erguer seu memorial:
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <textarea
            value={answerText}
            onChange={(e) => onAnswerTextChange(e.target.value)}
            placeholder="Descreva como o Senhor atendeu a sua oração..."
            rows={4}
            autoFocus
            className="w-full resize-none rounded-xl border border-border bg-app-surface p-3 text-[0.85rem] text-app-text placeholder:text-app-text-muted/50 focus:outline-none focus:ring-1 focus:ring-gold/50 shadow-xs"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-[0.78rem] text-app-text-muted hover:text-app-text transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-gold font-sans font-semibold text-[0.8rem] text-black hover:bg-gold/90 disabled:opacity-50 transition-colors shadow-xs cursor-pointer active:scale-95"
            >
              {isSubmitting ? "Salvando..." : "Salvar Testemunho"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnswerPrayerDialog;
