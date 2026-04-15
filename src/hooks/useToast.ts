import { useEffect, useState } from "react";

export type ToastType = "success" | "info" | "error" | "prompt";

export interface ToastInput {
  actionLabel?: string;
  duration?: number;
  message: string;
  onAction?: () => void;
  type?: ToastType;
}

export interface ToastItem extends ToastInput {
  id: string;
  type: ToastType;
}

const MAX_TOASTS = 3;
const DEFAULT_DURATION = 2500;

let toastState: ToastItem[] = [];
let counter = 0;
const listeners = new Set<(toasts: ToastItem[]) => void>();

const emit = () => listeners.forEach((listener) => listener(toastState));

export const dismissToast = (id: string) => {
  toastState = toastState.filter((item) => item.id !== id);
  emit();
};

export const toast = ({ type = "info", duration = DEFAULT_DURATION, ...payload }: ToastInput) => {
  counter += 1;
  const item: ToastItem = {
    ...payload,
    type,
    duration,
    id: `toast-${counter}`,
  };

  toastState = [...toastState, item].slice(-MAX_TOASTS);
  emit();

  if (duration !== Infinity) {
    window.setTimeout(() => dismissToast(item.id), duration);
  }
  return item.id;
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>(toastState);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  return { dismissToast, toast, toasts };
}
