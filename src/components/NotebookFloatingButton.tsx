// ─────────────────────────────────────────────────────────────────────────────
// NotebookFloatingButton.tsx — Bíblia Vive
//
// Botão flutuante no canto inferior esquerdo para acessar os cadernos.
// Exibe badge numérico caso existam cadernos no capítulo atual.
// ─────────────────────────────────────────────────────────────────────────────

import { Notebook } from "lucide-react";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";

interface NotebookFloatingButtonProps {
    notebooksCount: number;
    onClick: () => void;
    isOpen: boolean;
}

export default function NotebookFloatingButton({
    notebooksCount,
    onClick,
    isOpen,
}: NotebookFloatingButtonProps) {
    const { t } = useTranslation();

    const accessibleName = notebooksCount > 0
        ? `Abrir caderno do capítulo. ${notebooksCount} ${notebooksCount === 1 ? "caderno salvo" : "cadernos salvos"} neste capítulo.`
        : "Abrir caderno do capítulo";

    return (
        <button
            id="notebook-floating-btn"
            type="button"
            onClick={onClick}
            aria-label={accessibleName}
            title={accessibleName}
            className={cn(
                "fixed left-4 bottom-20 md:left-6 md:bottom-6 z-40",
                "flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-300",
                "border focus:outline-none focus:ring-2 focus:ring-gold/50 hover:scale-105 active:scale-95",
                isOpen
                    ? "bg-gold border-gold text-black hover:bg-gold/90"
                    : "bg-app-surface border-border text-app-text-muted hover:border-gold/40 hover:text-gold hover:shadow-gold/10"
            )}
        >
            <Notebook className="h-5 w-5" />
            {notebooksCount > 0 && (
                <span
                    aria-hidden="true"
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[0.68rem] font-bold text-black border border-app-surface shadow-sm animate-in zoom-in-50"
                >
                    {notebooksCount}
                </span>
            )}
        </button>
    );
}
