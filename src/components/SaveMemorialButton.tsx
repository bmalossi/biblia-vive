import React, { useState } from "react";
import { Save, Check } from "lucide-react";

export interface SaveMemorialButtonProps {
  onSave: () => Promise<boolean>;
  onSuccessComplete?: () => void;
  className?: string;
  idleText?: string;
  savingText?: string;
  successText?: string;
  disabled?: boolean;
  variant?: "gold" | "dark";
}

type SaveState = "idle" | "saving" | "success";

export const SaveMemorialButton: React.FC<SaveMemorialButtonProps> = ({
  onSave,
  onSuccessComplete,
  className = "",
  idleText = "Guardar",
  savingText = "Guardando...",
  successText = "Guardado",
  disabled = false,
  variant = "gold",
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

  const isGoldVariant = variant === "gold";

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={state !== "idle" || disabled}
      className={`
        relative overflow-hidden w-full py-2.5 px-4 rounded-xl font-sans font-medium text-xs
        transition-all duration-300 transform active:scale-[0.98]
        flex items-center justify-center gap-2 focus:outline-none select-none shadow-sm
        ${state === "idle" && !disabled
          ? isGoldVariant
            ? "bg-gold text-black hover:bg-gold/90 border border-gold"
            : "bg-app-raised hover:bg-app-raised/80 text-app-text border border-gold/30 hover:border-gold/50"
          : ""
        }
        ${state === "idle" && disabled
          ? "bg-gold/40 text-black/40 border border-gold/20 cursor-not-allowed opacity-50"
          : ""
        }
        ${state === "saving"
          ? isGoldVariant
            ? "bg-gold/70 text-black/70 border border-gold/50 cursor-not-allowed"
            : "bg-app-raised/50 text-gold/60 border border-gold/20 cursor-not-allowed"
          : ""
        }
        ${state === "success"
          ? "bg-emerald-600 text-white border border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          : ""
        }
        ${className}
      `}
    >
      {/* Feixe de Luz Metálica no Sucesso */}
      {state === "success" && (
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 animate-sweep" />
        </div>
      )}

      {/* Estado Idle */}
      {state === "idle" && (
        <>
          <Save className={`w-3.5 h-3.5 shrink-0 ${isGoldVariant ? "text-black" : "text-gold"}`} />
          <span className="font-medium tracking-wide truncate">{idleText}</span>
        </>
      )}

      {/* Estado Salvando */}
      {state === "saving" && (
        <div className="flex items-center gap-2">
          <div className={`w-3.5 h-3.5 border-2 ${isGoldVariant ? "border-black" : "border-gold"} border-t-transparent rounded-full animate-spin shrink-0`} />
          <span className="animate-shimmer-pulse font-medium truncate">
            {savingText}
          </span>
        </div>
      )}

      {/* Estado Sucesso */}
      {state === "success" && (
        <div className="flex items-center gap-1.5 animate-scale-in">
          <Check className="w-4 h-4 text-white shrink-0" />
          <span className="font-semibold tracking-wide truncate">
            {successText}
          </span>
        </div>
      )}
    </button>
  );
};
