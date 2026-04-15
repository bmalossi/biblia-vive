import { X } from "lucide-react";
import { dismissToast, useToast } from "@/hooks/useToast";

const ICON = "✦";

const typeConfig = {
  success: { icon: ICON, className: "border-border bg-app-surface text-app-text" },
  info: { icon: ICON, className: "border-border bg-app-surface text-app-text" },
  error: { icon: ICON, className: "border-border bg-app-surface text-app-text" },
  prompt: { icon: ICON, className: "border-border bg-app-surface text-app-text" },
};

export function ToastViewport() {
  const { toasts } = useToast();

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-8 z-[1100] flex flex-col items-center gap-3 px-4" role="status">
      {toasts.map((item) => {
        if (item.type === "prompt") {
          return (
            <div
              key={item.id}
              className="pointer-events-auto flex min-h-[52px] w-full max-w-[340px] items-center gap-3 rounded-2xl border border-border bg-app-surface px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-in fade-in-0 slide-in-from-bottom-5 duration-300 sm:max-w-[420px]"
            >
              <div aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-gold">{ICON}</div>
              <p className="flex-1 text-sm text-app-text">{item.message}</p>
              <button
                className="min-h-11 shrink-0 rounded-md px-3 text-sm font-medium text-app-text-muted hover:bg-app-raised transition-colors"
                onClick={() => dismissToast(item.id)}
                type="button"
              >
                Entendi
              </button>
            </div>
          );
        }

        const config = typeConfig[item.type as keyof typeof typeConfig] ?? typeConfig.info;
        return (
          <div
            key={item.id}
            className={`pointer-events-auto flex min-h-[52px] w-full max-w-[340px] items-center justify-between gap-3 rounded-2xl border border-border bg-app-surface px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-in fade-in-0 slide-in-from-bottom-5 duration-300 sm:max-w-[420px] ${config.className}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-accent text-gold text-xs">{config.icon}</div>
              <p className="text-sm font-medium leading-tight truncate">{item.message}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {item.actionLabel && item.onAction && (
                <button
                  className="rounded-full bg-current/10 px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-wider hover:bg-current/20 transition-colors"
                  onClick={() => { item.onAction?.(); dismissToast(item.id); }}
                  type="button"
                >
                  {item.actionLabel}
                </button>
              )}
              <button
                aria-label="Fechar"
                className="rounded-full p-1.5 hover:bg-app-raised transition-colors"
                onClick={() => dismissToast(item.id)}
                type="button"
              >
                <X className="h-3.5 w-3.5 text-app-text-muted" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
