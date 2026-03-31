import { X } from "lucide-react";
import { dismissToast, useToast } from "@/hooks/useToast";

const typeClassMap = {
  success: "border-[hsl(var(--toast-success))] bg-[hsl(var(--toast-success-bg))] text-[hsl(var(--toast-success-fg))]",
  info: "border-[hsl(var(--toast-info))] bg-[hsl(var(--toast-info-bg))] text-[hsl(var(--toast-info-fg))]",
  error: "border-[hsl(var(--toast-error))] bg-[hsl(var(--toast-error-bg))] text-[hsl(var(--toast-error-fg))]",
};

export function ToastViewport() {
  const { toasts } = useToast();

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[120] flex flex-col items-center gap-2 px-3" role="status">
      {toasts.map((item) => (
        <div
          className={`pointer-events-auto flex min-h-11 w-full max-w-md items-center justify-between gap-3 rounded-xl border px-3 py-2 shadow-sm animate-in fade-in-0 slide-in-from-bottom-3 ${typeClassMap[item.type]}`}
          key={item.id}
        >
          <p className="text-sm">{item.message}</p>
          <div className="flex items-center gap-2">
            {item.actionLabel && item.onAction && (
              <button
                className="min-h-11 rounded-md border border-current/25 px-3 text-xs hover:bg-current/10"
                onClick={() => {
                  item.onAction?.();
                  dismissToast(item.id);
                }}
                type="button"
              >
                {item.actionLabel}
              </button>
            )}
            <button aria-label="Fechar toast" className="min-h-11 rounded-md p-2 hover:bg-current/10" onClick={() => dismissToast(item.id)} type="button">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
