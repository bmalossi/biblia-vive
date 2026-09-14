import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MemorialCard from "@/components/memorial/MemorialCard";
import type { MemorialEntry } from "@/lib/noteStore";

const mockPrayer: MemorialEntry = {
  id: "prayer-1",
  userId: "user-1",
  bookId: "fp",
  bookName: "Filipenses",
  chapter: 4,
  verse: 6,
  version: "acf",
  type: "prayer",
  title: "Clamor por Paz",
  content: "Não andeis ansiosos por coisa alguma.",
  createdAt: "2026-03-01T10:00:00Z",
  updatedAt: "2026-03-01T10:00:00Z",
};

const mockAnsweredPrayer: MemorialEntry = {
  ...mockPrayer,
  id: "prayer-answered",
  answeredAt: "2026-03-10T12:00:00Z",
  answeredNote: "Deus trouxe paz completa e abriu a porta certa.",
};

const mockTestimony: MemorialEntry = {
  id: "testimony-1",
  userId: "user-1",
  bookId: "sl",
  bookName: "Salmos",
  chapter: 23,
  verse: 1,
  version: "acf",
  type: "testimony",
  title: "Provisão na Tempestade",
  content: "O Senhor é o meu pastor, nada me faltará.",
  createdAt: "2026-02-15T08:00:00Z",
  updatedAt: "2026-02-15T08:00:00Z",
};

describe("MemorialCard Component", () => {
  it("renders entry title, book reference and content", () => {
    render(
      <MemoryRouter>
        <MemorialCard entry={mockTestimony} />
      </MemoryRouter>
    );

    expect(screen.getByText("Provisão na Tempestade")).toBeInTheDocument();
    expect(screen.getByText(/Salmos 23:1/)).toBeInTheDocument();
    expect(screen.getByText(/O Senhor é o meu pastor/)).toBeInTheDocument();
  });

  it("renders 'Marcar como respondida' button for active prayers and handles click", () => {
    const handleAnswer = vi.fn();

    render(
      <MemoryRouter>
        <MemorialCard entry={mockPrayer} onMarkAnswered={handleAnswer} />
      </MemoryRouter>
    );

    const btn = screen.getByRole("button", { name: /Marcar como respondida/i });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(handleAnswer).toHaveBeenCalledWith(mockPrayer);
  });

  it("does NOT render 'Marcar como respondida' button for answered prayers or testimonies", () => {
    const { rerender } = render(
      <MemoryRouter>
        <MemorialCard entry={mockAnsweredPrayer} />
      </MemoryRouter>
    );

    expect(
      screen.queryByRole("button", { name: /Marcar como respondida/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Respondida/i)).toBeInTheDocument();
    expect(screen.getByText(/Deus trouxe paz completa/i)).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <MemorialCard entry={mockTestimony} />
      </MemoryRouter>
    );

    expect(
      screen.queryByRole("button", { name: /Marcar como respondida/i })
    ).not.toBeInTheDocument();
  });

  it("calls onCardClick when clicking the card", () => {
    const handleCardClick = vi.fn();

    render(
      <MemoryRouter>
        <MemorialCard entry={mockTestimony} onCardClick={handleCardClick} />
      </MemoryRouter>
    );

    const card = screen.getByTestId("memorial-card");
    fireEvent.click(card);

    expect(handleCardClick).toHaveBeenCalledWith(mockTestimony);
  });

  it("does NOT display 'Geral 0' or any biblical reference when entry is not linked to scripture", () => {
    const mockUnlinkedEntry: MemorialEntry = {
      id: "unlinked-1",
      userId: "user-1",
      bookId: "geral",
      bookName: "Geral",
      chapter: 0,
      verse: null,
      version: "",
      type: "reflection",
      title: "Reflexão Espontânea",
      content: "Uma reflexão livre sem vínculo com versículo específico.",
      createdAt: "2026-03-01T10:00:00Z",
      updatedAt: "2026-03-01T10:00:00Z",
    };

    render(
      <MemoryRouter>
        <MemorialCard entry={mockUnlinkedEntry} />
      </MemoryRouter>
    );

    expect(screen.getByText("Reflexão Espontânea")).toBeInTheDocument();
    expect(screen.getByText(/Uma reflexão livre/)).toBeInTheDocument();
    // Ensure "Geral" or "Geral 0" is NOT rendered anywhere in the document
    expect(screen.queryByText(/Geral 0/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Geral/i)).not.toBeInTheDocument();
    expect(screen.queryByTitle(/Ir para o texto bíblico/i)).not.toBeInTheDocument();
  });
});
