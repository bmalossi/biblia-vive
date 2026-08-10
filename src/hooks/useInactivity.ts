import { useState, useEffect, useRef, useCallback } from "react";

export interface UseInactivityOptions {
  timeoutMs?: number;
  disabled?: boolean;
  mouseThreshold?: number;
}

export interface UseInactivityReturn {
  isInactive: boolean;
  resetTimer: () => void;
}

export function useInactivity({
  timeoutMs = 15000,
  disabled = false,
  mouseThreshold = 10,
}: UseInactivityOptions = {}): UseInactivityReturn {
  const [isInactive, setIsInactive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);

  const clearInactivityTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    clearInactivityTimer();
    setIsInactive(false);

    if (disabled) {
      return;
    }

    timerRef.current = setTimeout(() => {
      setIsInactive(true);
    }, timeoutMs);
  }, [clearInactivityTimer, disabled, timeoutMs]);

  useEffect(() => {
    if (disabled) {
      clearInactivityTimer();
      setIsInactive(false);
      lastMousePosRef.current = null;
    } else {
      resetTimer();
    }

    return () => {
      clearInactivityTimer();
    };
  }, [disabled, resetTimer, clearInactivityTimer]);

  useEffect(() => {
    if (disabled) return;

    const handlePointerInteraction = () => {
      resetTimer();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!lastMousePosRef.current) {
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      const dist = Math.hypot(dx, dy);

      // Sempre atualiza o ponto de referência para evitar que micro-movimentos
      // acumulados em relação a uma posição antiga ultrapassem a tolerância
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      if (dist > mouseThreshold) {
        resetTimer();
      }
    };

    const listenerOptions = { passive: true };

    window.addEventListener("mousedown", handlePointerInteraction, listenerOptions);
    window.addEventListener("touchstart", handlePointerInteraction, listenerOptions);
    window.addEventListener("keydown", handlePointerInteraction, listenerOptions);
    window.addEventListener("mousemove", handleMouseMove, listenerOptions);

    return () => {
      window.removeEventListener("mousedown", handlePointerInteraction);
      window.removeEventListener("touchstart", handlePointerInteraction);
      window.removeEventListener("keydown", handlePointerInteraction);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [disabled, mouseThreshold, resetTimer]);

  return { isInactive, resetTimer };
}
