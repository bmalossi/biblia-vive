import { X, CheckCircle2, Info, AlertCircle } from "lucide-react";
import { dismissToast, useToast } from "@/hooks/useToast";

const typeConfig = {
  success: {
    icon: <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />,
    className: "border-green-500/20 bg-green-500/5 dark:bg-green-500/10 text-green-700 dark:text-green-400 backdrop-blur-xl shadow-[0_8px_32px_rgba(34,197,94,0.12)]",
  },
  info: {
    icon: <Info className="h-5 w-5 shrink-0 text-gold" />,
    className: "border-gold/20 bg-gold-bg/30 dark:bg-gold-bg/10 text-gold-foreground backdrop-blur-xl shadow-[0_8px_32px_rgba(212,175,55,0.12)]",
  },
  error: {
    icon: <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />,
    className: "border-red-500/20 bg-red-500/5 dark:bg-red-500/10 text-red-700 dark:text-red-400 backdrop-blur-xl shadow-[0_8px_32px_rgba(239,68,68,0.12)]",
  },
};

export function ToastViewport() {
  const { toasts } = useToast();

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-8 z-[1100] flex flex-col items-center gap-3 px-4" role="status">
      {toasts.map((item) => {
        const config = typeConfig[item.type];
        return (
          <div
            className={`pointer-events-auto flex min-h-[52px] w-full max-w-[340px] items-center justify-between gap-3 rounded-2xl border px-4 py-3 animate-in fade-in-0 slide-in-from-bottom-5 duration-300 ${config.className}`}
            key={item.id}
          >
            <div className="flex items-center gap-3 min-w-0">
              {config.icon}
              <p className="text-sm font-medium leading-tight truncate">{item.message}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {item.actionLabel && item.onAction && (
                <button
                  className="rounded-full bg-current/10 px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-wider hover:bg-current/20 transition-colors"
                  onClick={() => {
                    item.onAction?.();
                    dismissToast(item.id);
                  }}
                  type="button"
                >
                  {item.actionLabel}
                </button>
              )}
              <button
                aria-label="Fechar"
                className="rounded-full p-1.5 hover:bg-current/10 transition-colors"
                onClick={() => dismissToast(item.id)}
                type="button"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
