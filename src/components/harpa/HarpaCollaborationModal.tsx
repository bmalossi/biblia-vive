import React from "react";
import { Users, Mail, CheckCircle2, Mic } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface HarpaCollaborationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function HarpaCollaborationModal({
  open,
  onOpenChange,
}: HarpaCollaborationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg border-border bg-app-surface text-app-text p-6 sm:p-7 rounded-2xl sm:rounded-3xl shadow-2xl">
        <DialogHeader className="space-y-2 text-left border-b border-border/60 pb-4">
          <div className="flex items-center gap-2 text-gold">
            <Users className="w-4 h-4" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] font-medium">
              Comunidade Bíblia Vive
            </span>
          </div>

          <DialogTitle className="font-serif text-xl sm:text-2xl font-normal text-app-text">
            Colabore com a Harpa Cristã
          </DialogTitle>

          <DialogDescription className="text-xs sm:text-sm text-app-text-muted">
            Ajude a enriquecer o acervo de louvores compartilhando suas gravações de voz ou violão.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-3.5 text-xs sm:text-sm text-app-text leading-relaxed">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
            <span>Gravações com voz suave, violão acústico ou instrumentos tradicionais.</span>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
            <span>Áudios em alta fidelidade e sem ruídos para proporcionar momentos contemplativos.</span>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
            <span>Créditos e referências musicais atribuídos diretamente no leitor do hino.</span>
          </div>

          <div className="mt-4 p-3.5 rounded-xl border border-border bg-app-raised/70 flex items-center gap-3">
            <Mail className="w-5 h-5 text-gold shrink-0" />
            <div className="min-w-0">
              <p className="text-[0.68rem] text-app-text-muted uppercase font-mono">Envio de gravações</p>
              <a
                href="mailto:suporte@bibliavive.com.br?subject=Colaboração%20com%20a%20Harpa%20Cristã"
                className="text-xs text-gold hover:underline font-medium break-all"
              >
                suporte@bibliavive.com.br
              </a>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-border/60 flex justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-5 py-2 rounded-full border border-border text-app-text-muted hover:text-app-text text-xs font-medium transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
