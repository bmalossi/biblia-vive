// ─────────────────────────────────────────────────────────────────────────────
// NotebookFloatingButton.tsx — Bíblia Vive
//
// Botão flutuante no canto inferior esquerdo para acessar os cadernos.
// Exibe badge numérico caso existam cadernos no capítulo atual.
// Pisca suavemente de tempos em tempos quando fechado para lembrar o usuário de escrever.
// ─────────────────────────────────────────────────────────────────────────────

import { Notebook } from "lucide-react";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface NotebookFloatingButtonProps {
    notebooksCount: number;
    onClick: () => void;
    isOpen: boolean;
    isFocusMode?: boolean;
}

export default function NotebookFloatingButton({
    notebooksCount,
    onClick,
    isOpen,
    isFocusMode = false,
}: NotebookFloatingButtonProps) {
    const { t } = useTranslation();
    const [shouldBlink, setShouldBlink] = useState(false);

    // Efeito para piscar periodicamente quando o caderno está fechado
    useEffect(() => {
        if (isOpen) {
            setShouldBlink(false);
            return;
        }

        let blinkTimeoutId: NodeJS.Timeout;
        let intervalId: NodeJS.Timeout;

        const triggerBlink = () => {
            setShouldBlink(true);
            // Remove a classe de animação após 1.5s (duração definida no CSS)
            blinkTimeoutId = setTimeout(() => {
                setShouldBlink(false);
            }, 1500);
        };

        // Delay inicial de 4 segundos antes de piscar pela primeira vez
        const initialDelayId = setTimeout(() => {
            triggerBlink();
            // Dispara um piscar novamente a cada 12 segundos
            intervalId = setInterval(triggerBlink, 12000);
        }, 4000);

        return () => {
            clearTimeout(initialDelayId);
            clearTimeout(blinkTimeoutId);
            clearInterval(intervalId);
        };
    }, [isOpen]);

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
                "fixed left-4 z-40",
                isFocusMode ? "bottom-6" : "bottom-20 md:bottom-6",
                "md:left-6 md:bottom-6",
                "flex h-12 w-12 items-center justify-center rounded-full shadow-lg",
                // Desativa transições durante o blink para que os keyframes não conflitem com transition-all
                shouldBlink ? "" : "transition-all duration-300",
                "border focus:outline-none focus:ring-2 focus:ring-gold/50 hover:scale-105 active:scale-95",
                isOpen
                    ? "bg-gold border-gold text-black hover:bg-gold/90"
                    // Adiciona a classe de piscar ativamente
                    : cn(
                        "bg-app-surface border-border text-app-text-muted hover:border-gold/40 hover:text-gold",
                        shouldBlink && "animate-notebook-remind"
                      )
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
