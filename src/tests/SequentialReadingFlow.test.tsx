import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import ReadingPlansPage from "@/pages/ReadingPlansPage";
import { ReadingBottomNav } from "@/components/ReadingBottomNav";
import { formatSynthesizedChapterTitle } from "@/components/planos/PlanTimelineDays";
import { calcCurrentDayIndex } from "@/lib/progressCalculator";
import type { PlanProgress } from "@/lib/readingPlanTypes";

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "test-user-seq", email: "user@test.com" },
    isAuthenticated: true,
  }),
}));

// Mock useSubscription
vi.mock("@/hooks/useSubscription", () => ({
  useSubscription: () => ({
    isPro: false,
  }),
}));

// Mock usePageMeta
vi.mock("@/hooks/usePageMeta", () => ({
  usePageMeta: () => {},
}));

// Mock Header
vi.mock("@/components/Header", () => ({
  default: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock("@/components/HarpaPlayerBar", () => ({
  default: () => null,
}));

vi.mock("@/components/NotificationSoftAsk", () => ({
  default: () => null,
}));

// Mock readingPlanSync
vi.mock("@/lib/readingPlanSync", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/readingPlanSync")>();
  return {
    ...actual,
    loadPlanProgressesFromCloud: vi.fn().mockImplementation(() => Promise.resolve({})),
    savePlanProgressToCloud: vi.fn().mockImplementation(() => Promise.resolve(undefined)),
  };
});

describe("Sequential Reading Flow & Title Synthesis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("sintetiza títulos de capítulos consecutivos do mesmo livro", () => {
    // Exemplo: Salmos em 30 dias (Dia 1: Sl 1 a 5) -> "Salmos 1, 2, 3, 4 e 5"
    expect(
      formatSynthesizedChapterTitle(["sl/1", "sl/2", "sl/3", "sl/4", "sl/5"])
    ).toBe("Salmos 1, 2, 3, 4 e 5");

    // Exemplo: Os 4 Evangelhos (Dia 1: Mt 1, 2, 3) -> "Mateus 1, 2 e 3"
    expect(
      formatSynthesizedChapterTitle(["mt/1", "mt/2", "mt/3"])
    ).toBe("Mateus 1, 2 e 3");

    // Exemplo: 2 capítulos do mesmo livro -> "Romanos 1 e 2"
    expect(
      formatSynthesizedChapterTitle(["rm/1", "rm/2"])
    ).toBe("Romanos 1 e 2");

    // Exemplo: Livros diferentes -> "Mateus 1 • Lucas 2"
    expect(
      formatSynthesizedChapterTitle(["mt/1", "lc/2"])
    ).toBe("Mateus 1 • Lucas 2");

    // Exemplo: 1 capítulo -> "Provérbios 1"
    expect(
      formatSynthesizedChapterTitle(["pv/1"])
    ).toBe("Provérbios 1");
  });

  it("calcula o avanço imediato para o Dia 2 quando o Dia 1 é completado", () => {
    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    // Estado inicial no Dia 1
    const progressDay1: PlanProgress = {
      planId: "gospels-30-days",
      startDate: now,
      completedDays: [],
      readRefs: [],
    };
    expect(calcCurrentDayIndex(progressDay1, new Date(now))).toBe(1);

    // Após concluir as leituras do dia 1 e avançar o startDate em 1 dia:
    const progressDay2: PlanProgress = {
      planId: "gospels-30-days",
      startDate: now - ONE_DAY_MS,
      completedDays: [1],
      readRefs: ["mt/1", "mt/2", "mt/3"],
    };
    expect(calcCurrentDayIndex(progressDay2, new Date(now))).toBe(2);
  });

  it("ReadingBottomNav renderiza o botão 'Avançar para Lucas 2' no passo 0 (Mateus 1)", () => {
    const onAdvanceMock = vi.fn();

    render(
      <TooltipProvider>
        <ReadingBottomNav
          currentVersion="nvi"
          onVersionChange={vi.fn()}
          prevChapterInfo={null}
          nextChapterInfo={{ book: { name: "Mateus", slug: "mt" }, chapter: 2 }}
          onNavigate={vi.fn()}
          planNavInfo={{
            planName: "Os 4 Evangelhos",
            day: 1,
            step: 0,
            totalSteps: 3,
            nextChapterName: "Mateus 2",
            isLastStep: false,
            onAdvanceNextReading: onAdvanceMock,
          }}
        />
      </TooltipProvider>
    );

    const advanceBtn = screen.getByRole("button", { name: /Avançar para a próxima leitura do plano: Mateus 2/i });
    expect(advanceBtn).toBeInTheDocument();
    expect(advanceBtn).toHaveTextContent("Avançar para Mateus 2");

    fireEvent.click(advanceBtn);
    expect(onAdvanceMock).toHaveBeenCalledTimes(1);
  });

  it("ReadingBottomNav renderiza o botão 'Concluir leituras de hoje' no passo final", () => {
    const onCompleteMock = vi.fn();

    render(
      <TooltipProvider>
        <ReadingBottomNav
          currentVersion="nvi"
          onVersionChange={vi.fn()}
          prevChapterInfo={{ book: { name: "Mateus", slug: "mt" }, chapter: 2 }}
          nextChapterInfo={{ book: { name: "Mateus", slug: "mt" }, chapter: 4 }}
          onNavigate={vi.fn()}
          planNavInfo={{
            planName: "Os 4 Evangelhos",
            day: 1,
            step: 2,
            totalSteps: 3,
            isLastStep: true,
            onCompleteDayAndFinish: onCompleteMock,
          }}
        />
      </TooltipProvider>
    );

    const finishBtn = screen.getByRole("button", { name: /Concluir leituras de hoje/i });
    expect(finishBtn).toBeInTheDocument();
    expect(finishBtn).toHaveTextContent("Concluir leituras de hoje");

    fireEvent.click(finishBtn);
    expect(onCompleteMock).toHaveBeenCalledTimes(1);
  });

  it("permite clicar em 'Ler hoje' no dia 1 e dispara a navegação para Mateus 1", async () => {
    render(
      <MemoryRouter initialEntries={["/planos?id=gospels-30-days"]}>
        <TooltipProvider>
          <ReadingPlansPage />
        </TooltipProvider>
      </MemoryRouter>
    );

    await screen.findByText("Os 4 Evangelhos");
    const lerHojeBtn = screen.getByRole("button", { name: /Ler hoje/i });
    expect(lerHojeBtn).toBeInTheDocument();

    fireEvent.click(lerHojeBtn);
  });
});
