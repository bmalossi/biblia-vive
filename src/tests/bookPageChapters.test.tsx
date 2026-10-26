import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import BookPage from "@/pages/BookPage";

vi.mock("@/components/HarpaPlayerBar", () => ({
  default: () => null,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "test-user-123" } }),
}));

const mockLoadForBook = vi.fn();
vi.mock("@/hooks/useChapterViews", () => ({
  useChapterViews: () => ({
    loadForBook: mockLoadForBook,
  }),
  formatViewedAt: (d: Date) => "26/10/2026 10:00",
}));

describe("BookPage - Marcações de Capítulos Lidos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("destaca capítulos lidos com contorno dourado evidente (border-gold, ring-1, text-gold e sombra dourada)", async () => {
    // Simula capítulos 13, 14, 15 como lidos
    mockLoadForBook.mockResolvedValue({
      13: new Date(),
      14: new Date(),
      15: new Date(),
    });

    render(
      <MemoryRouter initialEntries={["/nvi/gn"]}>
        <Routes>
          <Route path="/:version/:book" element={<BookPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Espera os capítulos serem renderizados
    const ch13Link = await screen.findByRole("link", { name: "13" });
    const ch14Link = await screen.findByRole("link", { name: "14" });
    const ch15Link = await screen.findByRole("link", { name: "15" });
    const ch32Link = await screen.findByRole("link", { name: "32" });

    // Capítulos 13, 14, 15 (lidos) possuem contorno dourado evidente
    expect(ch13Link).toHaveClass("border-gold");
    expect(ch13Link).toHaveClass("ring-1");
    expect(ch13Link).toHaveClass("text-gold");
    expect(ch13Link).toHaveClass("bg-gold/10");

    expect(ch14Link).toHaveClass("border-gold");
    expect(ch15Link).toHaveClass("border-gold");

    // Capítulo 32 (não lido) não possui contorno dourado
    expect(ch32Link).not.toHaveClass("border-gold");
    expect(ch32Link).toHaveClass("border-border/80");
  });
});
