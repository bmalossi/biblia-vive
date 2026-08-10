import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInactivity } from "../hooks/useInactivity";

describe("useInactivity", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should start with isInactive = false", () => {
    const { result } = renderHook(() => useInactivity({ timeoutMs: 30000 }));
    expect(result.current.isInactive).toBe(false);
  });

  it("should set isInactive = true after timeoutMs of no activity", () => {
    const { result } = renderHook(() => useInactivity({ timeoutMs: 30000 }));

    expect(result.current.isInactive).toBe(false);

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(result.current.isInactive).toBe(true);
  });

  it("should reset timer on mousedown event", () => {
    const { result } = renderHook(() => useInactivity({ timeoutMs: 30000 }));

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(result.current.isInactive).toBe(true);

    act(() => {
      window.dispatchEvent(new MouseEvent("mousedown"));
    });

    expect(result.current.isInactive).toBe(false);
  });

  it("should reset timer on touchstart event", () => {
    const { result } = renderHook(() => useInactivity({ timeoutMs: 30000 }));

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(result.current.isInactive).toBe(true);

    act(() => {
      window.dispatchEvent(new TouchEvent("touchstart"));
    });

    expect(result.current.isInactive).toBe(false);
  });

  it("should reset timer on keydown event", () => {
    const { result } = renderHook(() => useInactivity({ timeoutMs: 30000 }));

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(result.current.isInactive).toBe(true);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(result.current.isInactive).toBe(false);
  });

  it("should ignore mousemove with displacement <= 10px", () => {
    const { result } = renderHook(() => useInactivity({ timeoutMs: 30000, mouseThreshold: 10 }));

    // Baseline mouse move
    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 100 }));
    });

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(result.current.isInactive).toBe(true);

    // Small move (5px dx, 5px dy -> distance ~7.07px <= 10px)
    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 105, clientY: 105 }));
    });

    // Should still be inactive because displacement was <= 10px
    expect(result.current.isInactive).toBe(true);

    // Another small move (5px dx, 5px dy from 105,105 -> 110,110; distance from previous ~7.07px <= 10px)
    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 110, clientY: 110 }));
    });

    // Should remain inactive because each step was <= 10px relative to previous position
    expect(result.current.isInactive).toBe(true);
  });

  it("should reset timer on mousemove with displacement > 10px", () => {
    const { result } = renderHook(() => useInactivity({ timeoutMs: 30000, mouseThreshold: 10 }));

    // Baseline mouse move
    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 100 }));
    });

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(result.current.isInactive).toBe(true);

    // Large move (20px dx, 20px dy -> distance ~28.28px > 10px)
    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 120, clientY: 120 }));
    });

    // Should exit inactive mode
    expect(result.current.isInactive).toBe(false);
  });

  it("should NOT reset timer on scroll event", () => {
    const { result } = renderHook(() => useInactivity({ timeoutMs: 30000 }));

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(result.current.isInactive).toBe(true);

    // Dispatch scroll event
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    // Should remain inactive
    expect(result.current.isInactive).toBe(true);
  });

  it("should never activate when disabled = true", () => {
    const { result } = renderHook(() => useInactivity({ timeoutMs: 30000, disabled: true }));

    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(result.current.isInactive).toBe(false);
  });
});
