import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ScriptureThreadBanner from "@/components/ScriptureThreadBanner";
import ScriptureThreadModal from "@/components/ScriptureThreadModal";
import type { ScriptureThreadResult } from "@/lib/scriptureThread";
import type { MemorialEntry } from "@/lib/noteStore";

const mockCandidate: MemorialEntry = {
  id: "entry-42",
  type: "prayer",
  title: "Paz em tempos difíceis",
  content: "Senhor, renova minha mente e guarda meu coração.",
  bookId: "fp",
  bookName: "Filipenses",
  chapter: 4,
  verse: 7,
  favorite: true,
  createdAt: new Date("2025-06-15T10:00:00Z").toISOString(),
  updatedAt: new Date("2025-06-15T10:00:00Z").toISOString(),
};

const mockResult: ScriptureThreadResult = {
  category: "Resposta_de_Oracao",
  confidence: 0.94,
  relevanceScore: 9.2,
  matchedNoteId: "entry-42",
  evaluatedAt: new Date().toISOString(),
  notesVersion: "1",
};

describe("ScriptureThreadBanner", () => {
  it("não renderiza nada quando result é nulo", () => {
    const { container } = render(
      <ScriptureThreadBanner
        result={null}
        candidateNote={null}
        onOpenModal={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renderiza selo de categoria e dispara onOpenModal ao clicar em Revelar o Fio", () => {
    const handleOpen = vi.fn();
    render(
      <ScriptureThreadBanner
        result={mockResult}
        candidateNote={mockCandidate}
        chapterRef="João 14"
        onOpenModal={handleOpen}
      />
    );

    expect(screen.getByText("Fio da Escritura")).toBeInTheDocument();
    expect(screen.getByText("Resposta de Oração")).toBeInTheDocument();
    expect(screen.getByText(/"Paz em tempos difíceis"/i)).toBeInTheDocument();

    const button = screen.getByRole("button", { name: /revelar o fio/i });
    fireEvent.click(button);
    expect(handleOpen).toHaveBeenCalledTimes(1);
  });
});

describe("ScriptureThreadModal", () => {
  it("não renderiza nada quando isOpen é false", () => {
    const { container } = render(
      <BrowserRouter>
        <ScriptureThreadModal
          isOpen={false}
          onClose={() => {}}
          result={mockResult}
          candidateNote={mockCandidate}
          chapterRef="João 14"
        />
      </BrowserRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renderiza categoria, nota candidata e preserva palavras originais do leitor", () => {
    const handleClose = vi.fn();
    render(
      <BrowserRouter>
        <ScriptureThreadModal
          isOpen={true}
          onClose={handleClose}
          result={mockResult}
          candidateNote={mockCandidate}
          chapterRef="João 14"
        />
      </BrowserRouter>
    );

    expect(screen.getByText("Fio da Escritura")).toBeInTheDocument();
    expect(screen.getByText("Resposta de Oração")).toBeInTheDocument();
    expect(screen.getByText("Senhor, renova minha mente e guarda meu coração.")).toBeInTheDocument();
    expect(screen.getByText("Filipenses 4:7")).toBeInTheDocument();

    // Link para abrir o registro no Memorial
    const memorialLink = screen.getByRole("link", { name: /abrir registro no meu memorial/i });
    expect(memorialLink).toHaveAttribute("href", "/memorial/entry-42");

    // Fechar ao clicar no botão de fechar
    const closeButtons = screen.getAllByRole("button", { name: /fechar/i });
    expect(closeButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(closeButtons[0]);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("fecha o modal ao pressionar a tecla Escape", () => {
    const handleClose = vi.fn();
    render(
      <BrowserRouter>
        <ScriptureThreadModal
          isOpen={true}
          onClose={handleClose}
          result={mockResult}
          candidateNote={mockCandidate}
          chapterRef="João 14"
        />
      </BrowserRouter>
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
