import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MemorialNoteModal from "@/components/memorial/MemorialNoteModal";
import type { MemorialEntry } from "@/lib/noteStore";

const mockPrayer: MemorialEntry = {
  id: "prayer-1",
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
  answeredNote: "Deus supriu com paz inefável em meu coração.",
};

const mockUnlinkedNote: MemorialEntry = {
  id: "unlinked-1",
  bookId: "geral",
  bookName: "Geral",
  chapter: 0,
  verse: null,
  version: "acf",
  type: "reflection",
  title: "Anotação Pessoal",
  content: "Reflexão íntima gravada durante a vigília.",
  createdAt: "2026-05-10T20:00:00Z",
  updatedAt: "2026-05-10T20:00:00Z",
};

const mockSoapEntry: MemorialEntry = {
  id: "soap-1",
  bookId: "sl",
  bookName: "Salmos",
  chapter: 23,
  verse: 1,
  version: "acf",
  type: "reflection",
  title: "O Senhor é o Meu Pastor",
  content: "S: O Senhor é o meu pastor...\nO: Confiança...\nA: Descansar...\nP: Amém.",
  verseText: "O Senhor é o meu pastor, nada me faltará.",
  metadata: {
    soap: {
      scripture: "O Senhor é o meu pastor, nada me faltará.",
      observation: "Davi expressa certeza de cuidado mesmo na escassez.",
      application: "Entregar hoje todas as minhas ansiedades e finanças a Deus.",
      prayer: "Pai, ensina-me a descansar no Teu pastoreio hoje e sempre.",
    },
  },
  createdAt: "2026-04-12T07:00:00Z",
  updatedAt: "2026-04-12T07:00:00Z",
};

describe("MemorialNoteModal Component", () => {
  it("does not render when isOpen is false", () => {
    render(
      <MemoryRouter>
        <MemorialNoteModal
          note={mockPrayer}
          isOpen={false}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders note details (category, title, content, solemn date) when open", () => {
    render(
      <MemoryRouter>
        <MemorialNoteModal
          note={mockPrayer}
          isOpen={true}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByText("Oração").length).toBeGreaterThan(0);
    expect(screen.getByText("Clamor por Paz")).toBeInTheDocument();
    expect(screen.getByText("Não andeis ansiosos por coisa alguma.")).toBeInTheDocument();
    expect(screen.getByText(/Filipenses 4:6/i)).toBeInTheDocument();
  });

  it("does NOT render 'Geral 0' or invalid bible reference for unlinked notes", () => {
    render(
      <MemoryRouter>
        <MemorialNoteModal
          note={mockUnlinkedNote}
          isOpen={true}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.queryByText(/Geral 0/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Geral$/i)).not.toBeInTheDocument();
    expect(screen.getByText("Anotação Pessoal")).toBeInTheDocument();
    expect(screen.getByText("Reflexão íntima gravada durante a vigília.")).toBeInTheDocument();
  });

  it("renders structured single SOAP card for reflections with SOAP metadata", () => {
    render(
      <MemoryRouter>
        <MemorialNoteModal
          note={mockSoapEntry}
          isOpen={true}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/Escritura \(S\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Observação \(O\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Aplicação \(A\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Oração \(P\)/i)).toBeInTheDocument();
    expect(screen.getByText("Davi expressa certeza de cuidado mesmo na escassez.")).toBeInTheDocument();
    expect(screen.getByText("Entregar hoje todas as minhas ansiedades e finanças a Deus.")).toBeInTheDocument();
  });

  it("renders 'Marcar como Oração Respondida' button for active prayer and handles click", () => {
    const handleAnswer = vi.fn();

    render(
      <MemoryRouter>
        <MemorialNoteModal
          note={mockPrayer}
          isOpen={true}
          onClose={vi.fn()}
          onMarkAnswered={handleAnswer}
        />
      </MemoryRouter>
    );

    const btn = screen.getByRole("button", { name: /Marcar como Oração Respondida/i });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(handleAnswer).toHaveBeenCalledWith(mockPrayer);
  });

  it("renders answered prayer section for answered prayer", () => {
    render(
      <MemoryRouter>
        <MemorialNoteModal
          note={mockAnsweredPrayer}
          isOpen={true}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/Oração Respondida/i)).toBeInTheDocument();
    expect(screen.getByText(/Deus supriu com paz inefável/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Marcar como Oração Respondida/i })).not.toBeInTheDocument();
  });

  it("contains NO audio player elements (no <audio>, audio controls or waveforms)", () => {
    const { container } = render(
      <MemoryRouter>
        <MemorialNoteModal
          note={{
            ...mockPrayer,
            content: "Transcrição fiel do áudio gravado durante a oração.",
          }}
          isOpen={true}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(container.querySelector("audio")).toBeNull();
    expect(container.querySelector("waveform")).toBeNull();
    expect(screen.getByText("Transcrição fiel do áudio gravado durante a oração.")).toBeInTheDocument();
  });

  it("calls onClose when clicking close button or pressing Escape", () => {
    const handleClose = vi.fn();

    render(
      <MemoryRouter>
        <MemorialNoteModal
          note={mockPrayer}
          isOpen={true}
          onClose={handleClose}
        />
      </MemoryRouter>
    );

    const closeBtn = screen.getByRole("button", { name: /^fechar$/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
