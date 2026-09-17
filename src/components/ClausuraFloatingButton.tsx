import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClausuraFloatingButtonProps {
  isActive: boolean;
  onToggle: () => void;
  isFocusMode?: boolean;
}

export default function ClausuraFloatingButton({
  isActive,
  onToggle,
  isFocusMode = false,
}: ClausuraFloatingButtonProps) {
  const accessibleName = isActive ? "Desativar Modo Clausura" : "Ativar Modo Clausura (Leitura sem distrações)";

  return (
    <button
      id="clausura-floating-btn"
      type="button"
      onClick={onToggle}
      aria-label={accessibleName}
      aria-pressed={isActive}
      title={accessibleName}
      className={cn(
        "fixed z-50 hidden md:flex",
        isFocusMode ? "right-6 bottom-[5.25rem]" : "right-6 bottom-[5.25rem]",
        "h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-300",
        "border focus:outline-none focus:ring-2 focus:ring-gold/50 hover:scale-105 active:scale-95",
        isActive
          ? "bg-gold border-gold text-black shadow-gold/30 hover:bg-gold/90"
          : "bg-app-surface border-border text-app-text-muted hover:border-gold/40 hover:text-gold"
      )}
    >
      {isActive ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
    </button>
  );
}
