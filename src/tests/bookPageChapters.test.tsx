import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
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

describe("BookPage - Marcações Editoriais de Capítulos Lidos (Marcador de Fita)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("destaca capítulos lidos com o marcador de fita dourada e borda refinada, sem halos de IA", async () => {
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
    const ch13Link = await screen.findByRole("link", { name: /13/i });
    const ch14Link = await screen.findByRole("link", { name: /14/i });
    const ch15Link = await screen.findByRole("link", { name: /15/i });
    const ch32Link = await screen.findByRole("link", { name: /32/i });

    // Capítulos 13, 14, 15 (lidos) possuem contorno dourado refinado e o marcador de fita no topo
    expect(ch13Link.className).toMatch(/border-gold/);
    expect(ch13Link.className).not.toContain("ring-1");
    expect(ch13Link.className).not.toContain("shadow-[0_0_");

    const ribbon13 = within(ch13Link).getByTestId("ribbon-bookmark");
    expect(ribbon13).toBeInTheDocument();
    expect(ribbon13).toHaveClass("bg-gold");

    const ribbon14 = within(ch14Link).getByTestId("ribbon-bookmark");
    expect(ribbon14).toBeInTheDocument();

    const ribbon15 = within(ch15Link).getByTestId("ribbon-bookmark");
    expect(ribbon15).toBeInTheDocument();

    // Capítulo 32 (não lido) não possui marcador de fita e usa borda neutra
    expect(ch32Link).not.toHaveClass("border-gold/80");
    expect(ch32Link).toHaveClass("border-border/80");
    expect(within(ch32Link).queryByTestId("ribbon-bookmark")).toBeNull();
  });
});
