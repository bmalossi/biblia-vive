import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SaveMemorialButton } from "@/components/SaveMemorialButton";

describe("SaveMemorialButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, "vibrate", {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders idle state by default", () => {
    const onSave = vi.fn().mockResolvedValue(true);
    render(<SaveMemorialButton onSave={onSave} />);

    expect(screen.getByRole("button")).toHaveTextContent("Guardar");
  });

  it("handles successful save flow with haptic vibration and callback", async () => {
    let resolveSave!: (val: boolean) => void;
    const onSave = vi.fn().mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveSave = resolve;
        })
    );
    const onSuccessComplete = vi.fn();

    render(
      <SaveMemorialButton onSave={onSave} onSuccessComplete={onSuccessComplete} />
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Should transition to saving
    expect(screen.getByText("Guardando...")).toBeInTheDocument();
    expect(button).toBeDisabled();

    // Resolve save promise
    await act(async () => {
      resolveSave(true);
    });

    // Advance timer past the deliberate window
    act(() => {
      vi.advanceTimersByTime(400);
    });

    // Should transition to success state
    expect(screen.getByText("Guardado")).toBeInTheDocument();
    expect(navigator.vibrate).toHaveBeenCalledWith(35);

    // Advance timer to trigger onSuccessComplete (SUCCESS_HOLD_MS = 1800)
    act(() => {
      vi.advanceTimersByTime(1800);
    });

    expect(onSuccessComplete).toHaveBeenCalledTimes(1);
  });

  it("reverts to idle if onSave returns false", async () => {
    const onSave = vi.fn().mockResolvedValue(false);
    render(<SaveMemorialButton onSave={onSave} />);

    const button = screen.getByRole("button");
    
    await act(async () => {
      fireEvent.click(button);
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText("Guardar")).toBeInTheDocument();
    expect(button).not.toBeDisabled();
    expect(navigator.vibrate).not.toHaveBeenCalled();
  });
});
