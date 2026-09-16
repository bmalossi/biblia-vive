import { Link } from "react-router-dom";
import { BookOpen, ChevronRight, Mic, Bell } from "lucide-react";

interface HomeQuickActionsProps {
  lastRead: {
    capitulo: number;
    livro: string;
    versao: string;
  } | null;
  lastReadBookName?: string;
  version: string;
  onStartVoiceRecording?: () => void;
  onOpenNotifications?: () => void;
}

export default function HomeQuickActions({
  lastRead,
  lastReadBookName,
  version,
  onStartVoiceRecording,
  onOpenNotifications,
}: HomeQuickActionsProps) {
  const continueText =
    lastRead && lastReadBookName
      ? `Continuar: ${lastReadBookName} ${lastRead.capitulo}`
      : "Continuar: João 6";

  const continueUrl = lastRead
    ? `/${lastRead.versao}/${lastRead.livro}/${lastRead.capitulo}`
    : `/${version}/joao/6`;

  return (
    <div
      aria-label="Ações rápidas da página inicial"
      className="w-full rounded-xl sm:rounded-2xl border border-border/70 bg-app-surface/50 backdrop-blur-xs px-3.5 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-3 text-app-text transition-all hover:border-border"
    >
      {/* Lado Esquerdo: Continuar Leitura */}
      <Link
        to={continueUrl}
        className="group flex items-center gap-2 text-xs font-medium text-app-text hover:text-gold transition-colors truncate min-w-0"
      >
        <BookOpen className="h-3.5 w-3.5 shrink-0 text-gold/90 transition-transform group-hover:scale-105" />
        <span className="truncate">{continueText}</span>
        <ChevronRight className="h-3 w-3 shrink-0 text-app-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-gold" />
      </Link>

      {/* Lado Direito: Gravar Reflexão + Notificações */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <button
          type="button"
          onClick={onStartVoiceRecording}
          className="group inline-flex items-center gap-1.5 text-xs font-medium text-app-text-muted hover:text-app-text transition-colors"
        >
          <Mic className="h-3.5 w-3.5 text-app-text-muted group-hover:text-gold transition-colors" />
          <span className="hidden sm:inline">Gravar reflexão com voz</span>
          <span className="sm:hidden">Gravar reflexão</span>
        </button>

        <button
          type="button"
          onClick={onOpenNotifications}
          aria-label="Notificações"
          className="relative inline-flex items-center justify-center text-app-text-muted hover:text-gold transition-colors p-1"
        >
          <Bell className="h-3.5 w-3.5" />
          {/* Ponto indicador dourado */}
          <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-gold ring-2 ring-app-surface" />
        </button>
      </div>
    </div>
  );
}


