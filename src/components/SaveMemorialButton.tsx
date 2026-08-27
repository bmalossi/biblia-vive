import React, { useState } from "react";
import { Sparkles, Check, Bookmark } from "lucide-react";

export interface SaveMemorialButtonProps {
  onSave: () => Promise<boolean>;
  onSuccessComplete?: () => void;
  className?: string;
}

type SaveState = "idle" | "saving" | "success";

export const SaveMemorialButton: React.FC<SaveMemorialButtonProps> = ({
  onSave,
  onSuccessComplete,
  className = "",
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

    if (state !== "idle") return;

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
      disabled={state !== "idle"}
      className={`
        relative overflow-hidden w-full py-3 px-5 rounded-xl font-medium
        transition-all duration-300 transform active:scale-[0.98]
        flex items-center justify-center gap-2.5 focus:outline-none select-none
        ${state === "idle"
          ? "bg-app-raised hover:bg-app-raised/80 text-app-text border border-gold/30 hover:border-gold/50 shadow-sm"
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
          <Bookmark className="w-4 h-4 text-gold" />
          <span className="tracking-wide font-serif text-[0.95rem]">Selar no Memorial</span>
        </>
      )}

      {/* Estado Salvando */}
      {state === "saving" && (
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <span className="animate-shimmer-pulse font-serif text-[0.95rem] text-gold/90">
            Registrando na Caminhada...
          </span>
        </div>
      )}

      {/* Estado Sucesso */}
      {state === "success" && (
        <div className="flex items-center gap-2 animate-scale-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="font-serif tracking-wide text-[0.95rem] text-app-text">
            Guardado no Coração
          </span>
          <Sparkles className="w-3.5 h-3.5 text-gold animate-pulse" />
        </div>
      )}
    </button>
  );
};
