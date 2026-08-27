import React, { useState } from "react";
import { Sparkles, Check, Bookmark } from "lucide-react";

export interface SaveMemorialButtonProps {
  onSave: () => Promise<boolean>;
  onSuccessComplete?: () => void;
  className?: string;
  idleText?: string;
  savingText?: string;
  successText?: string;
  disabled?: boolean;
}

type SaveState = "idle" | "saving" | "success";

export const SaveMemorialButton: React.FC<SaveMemorialButtonProps> = ({
  onSave,
  onSuccessComplete,
  className = "",
  idleText = "Selar no Memorial",
  savingText = "Registrando na Caminhada...",
  successText = "Guardado no Coração",
  disabled = false,
}) => {
  const [state, setState] = useState<SaveState>("idle");

  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(35);
      } catch {
        // Degrada silenciosamente se não for permitido pelo dispositivo
      }
    }
  };

  const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (state !== "idle" || disabled) return;

    setState("saving");

    const start = Date.now();
    let success = false;
    try {
      success = await onSave();
    } catch {
      success = false;
    }

    const elapsed = Date.now() - start;
    // Pequena janela deliberada de 400ms para criar a sensação de selamento
    const remaining = Math.max(400 - elapsed, 0);

    setTimeout(() => {
      if (success) {
        setState("success");
        triggerHaptic();

        if (onSuccessComplete) {
          setTimeout(onSuccessComplete, 450);
        }
      } else {
        setState("idle");
      }
    }, remaining);
  };

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={state !== "idle" || disabled}
      className={`
        relative overflow-hidden w-full py-3 px-5 rounded-xl font-medium
        transition-all duration-300 transform active:scale-[0.98]
        flex items-center justify-center gap-2.5 focus:outline-none select-none
        ${state === "idle" && !disabled
          ? "bg-app-raised hover:bg-app-raised/80 text-app-text border border-gold/30 hover:border-gold/50 shadow-sm"
          : ""
        }
        ${state === "idle" && disabled
          ? "bg-app-raised/40 text-app-text-muted/50 border border-border/40 cursor-not-allowed opacity-50"
          : ""
        }
        ${state === "saving"
          ? "bg-app-raised/50 text-gold/60 border border-gold/20 cursor-not-allowed"
          : ""
        }
        ${state === "success"
          ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          : ""
        }
        ${className}
      `}
    >
      {/* Feixe de Luz Metálica Dourada no Sucesso */}
      {state === "success" && (
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-gold/40 to-transparent skew-x-12 animate-sweep" />
        </div>
      )}

      {/* Estado Idle */}
      {state === "idle" && (
        <>
          <Bookmark className="w-4 h-4 text-gold shrink-0" />
          <span className="tracking-wide font-serif text-[0.92rem] truncate">{idleText}</span>
        </>
      )}

      {/* Estado Salvando */}
      {state === "saving" && (
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin shrink-0" />
          <span className="animate-shimmer-pulse font-serif text-[0.92rem] text-gold/90 truncate">
            {savingText}
          </span>
        </div>
      )}

      {/* Estado Sucesso */}
      {state === "success" && (
        <div className="flex items-center gap-2 animate-scale-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-serif tracking-wide text-[0.92rem] text-app-text truncate">
            {successText}
          </span>
          <Sparkles className="w-3.5 h-3.5 text-gold animate-pulse shrink-0" />
        </div>
      )}
    </button>
  );
};
