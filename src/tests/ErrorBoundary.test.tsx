import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ErrorBoundary from "@/components/ErrorBoundary";
import * as Sentry from "@sentry/react";

vi.mock("@sentry/react", () => ({
  captureException: vi.fn(),
}));

const ThrowError = ({ message }: { message: string }) => {
  throw new Error(message);
};

describe("ErrorBoundary Component", () => {
  const originalReload = window.location.reload;
  let reloadMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...window.location,
        reload: reloadMock,
      },
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...window.location,
        reload: originalReload,
      },
    });
  });

  it("renders children normally when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div>Página Bíblia Vive</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Página Bíblia Vive")).toBeInTheDocument();
  });

  it("identifies 'Cannot read properties of undefined (reading \\'default\\')' as chunk error and triggers reload without reporting to Sentry", () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Cannot read properties of undefined (reading 'default')" />
      </ErrorBoundary>
    );

    expect(reloadMock).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("identifies 'Failed to fetch dynamically imported module' as chunk error and triggers reload without reporting to Sentry", () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Failed to fetch dynamically imported module: /assets/BookPage-123.js" />
      </ErrorBoundary>
    );

    expect(reloadMock).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("prevents infinite reload loops if chunk error persists within 15 seconds", () => {
    sessionStorage.setItem("bv_chunk_error_reload_ts", String(Date.now()));

    render(
      <ErrorBoundary>
        <ThrowError message="Cannot read properties of undefined (reading 'default')" />
      </ErrorBoundary>
    );

    // Como já recarregou recentemente, não deve recarregar de novo
    expect(reloadMock).not.toHaveBeenCalled();
    // Exibe a tela de fallback e reporta o erro persistente
    expect(screen.getByText("Algo deu errado")).toBeInTheDocument();
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });

  it("captures non-chunk application errors and reports to Sentry", () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Erro de lógica na renderização de componente" />
      </ErrorBoundary>
    );

    expect(reloadMock).not.toHaveBeenCalled();
    expect(screen.getByText("Algo deu errado")).toBeInTheDocument();
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });
});
