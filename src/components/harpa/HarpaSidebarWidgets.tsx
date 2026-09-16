import React from "react";
import { Volume2, Users, ArrowRight } from "lucide-react";

interface HarpaSidebarWidgetsProps {
  onCollaborateClick: () => void;
}

export default function HarpaSidebarWidgets({
  onCollaborateClick,
}: HarpaSidebarWidgetsProps) {
  return (
    <aside
      aria-label="Informações e colaboração da Harpa"
      className="rounded-2xl border border-[#382f23]/80 bg-[#161412] p-5 sm:p-6 space-y-6 shadow-xl sticky top-24"
    >
      {/* Widget 1: Áudio disponível */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#e5b869]/10 border border-[#e5b869]/20 flex items-center justify-center text-[#e5b869] shrink-0">
            <Volume2 className="w-4 h-4" />
          </div>
          <h3 className="font-sans text-xs font-medium text-[#f4efea] leading-snug">
            Áudio disponível em alguns hinos
          </h3>
        </div>

        <p className="font-sans text-[0.72rem] text-[#8f8272] leading-relaxed pl-0 sm:pl-11">
          Ouça os hinos da Harpa Cristã que já possuem gravação de áudio, com vozes que amam e servem a Deus.
        </p>
      </div>

      {/* Linha Divisória */}
      <div className="border-t border-[#382f23]/60" />

      {/* Widget 2: Colabore com a Harpa */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#e5b869]/10 border border-[#e5b869]/20 flex items-center justify-center text-[#e5b869] shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <h3 className="font-sans text-xs font-medium text-[#f4efea] leading-snug">
            Colabore com a Harpa
          </h3>
        </div>

        <p className="font-sans text-[0.72rem] text-[#8f8272] leading-relaxed pl-0 sm:pl-11">
          Ajude a manter e ampliar o acervo de áudio. Sua voz também pode abençoar vidas.
        </p>

        <div className="pl-0 sm:pl-11 pt-1">
          <button
            type="button"
            onClick={onCollaborateClick}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#382f23] text-xs text-[#e5b869] hover:bg-[#e5b869]/10 hover:border-[#e5b869]/50 transition-colors cursor-pointer"
          >
            <span>Saiba mais</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </aside>
  );
}
