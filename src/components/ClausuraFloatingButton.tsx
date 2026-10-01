import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClausuraFloatingButtonProps {
  isActive: boolean;
  onToggle: () => void;
  className?: string;
}

export default function ClausuraFloatingButton({
  isActive,
  onToggle,
  className,
}: ClausuraFloatingButtonProps) {
  const accessibleName = isActive
    ? "Sair do Modo Clausura (Atalho: Esc ou F)"
    : "Ativar Modo Clausura (Leitura sem distrações • Atalho: F)";

  return (
    <button
      id="clausura-floating-btn"
      type="button"
      onClick={onToggle}
      aria-label={accessibleName}
      aria-pressed={isActive}
      title={accessibleName}
      className={cn(
        "fixed z-50 flex items-center justify-center transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50 active:scale-95",
        isActive
          ? "bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:bottom-[5.25rem] right-4 md:right-6 gap-2 rounded-full border border-gold bg-gold px-3.5 sm:px-4 py-2 sm:py-2.5 text-primary-foreground font-semibold shadow-gold-glow hover:bg-gold/90 hover:scale-105"
          : "bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-[5.25rem] right-4 md:right-6 h-11 w-11 md:h-12 md:w-12 rounded-full border border-border bg-app-surface/95 text-app-text-muted backdrop-blur-sm shadow-lg hover:border-gold/50 hover:text-gold hover:scale-105",
        className
      )}
    >
      {isActive ? (
        <>
          <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="font-serif text-xs font-semibold tracking-tight">Sair da Clausura</span>
          <kbd className="hidden sm:inline-block font-mono text-xs font-bold bg-primary-foreground/15 px-1.5 py-0.5 rounded border border-primary-foreground/20 text-primary-foreground">
            Esc
          </kbd>
        </>
      ) : (
        <EyeOff className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}

