import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import HomeQuickActions from "@/components/HomeQuickActions";
import CapituloDeHojeSection from "@/components/CapituloDeHojeSection";
import BookGrid from "@/components/BookGrid";
import type { Book } from "@/lib/books";

import { TooltipProvider } from "@/components/ui/tooltip";

// Wrapper de navegação e tooltip para os componentes
const renderWithRouter = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <TooltipProvider>{ui}</TooltipProvider>
    </BrowserRouter>
  );
};

describe("HomePage Redesign Components", () => {
  describe("HomeQuickActions", () => {
    it("renderiza o link de continuar leitura com o livro e capítulo corretos", () => {
      renderWithRouter(
        <HomeQuickActions
          lastRead={{ livro: "joao", capitulo: 6, versao: "nvi" }}
          lastReadBookName="João"
          version="nvi"
        />
      );

      expect(screen.getByText("Continuar: João 6")).toBeInTheDocument();
      const link = screen.getByRole("link", { name: /continuar: joão 6/i });
      expect(link).toHaveAttribute("href", "/nvi/joao/6");
    });

    it("dispara onStartVoiceRecording ao clicar em Gravar reflexão com voz", () => {
      const onVoice = vi.fn();
      renderWithRouter(
        <HomeQuickActions
          lastRead={null}
          version="nvi"
          onStartVoiceRecording={onVoice}
        />
      );

      const voiceButton = screen.getByRole("button", { name: /gravar reflexão/i });
      fireEvent.click(voiceButton);
      expect(onVoice).toHaveBeenCalledTimes(1);
    });

    it("renderiza o botão de notificações com indicador dourado", () => {
      const onNotif = vi.fn();
      renderWithRouter(
        <HomeQuickActions
          lastRead={null}
          version="nvi"
          onOpenNotifications={onNotif}
        />
      );

      const notifButton = screen.getByRole("button", { name: /notificações/i });
      expect(notifButton).toBeInTheDocument();
      fireEvent.click(notifButton);
      expect(onNotif).toHaveBeenCalledTimes(1);
    });
  });

  describe("CapituloDeHojeSection", () => {
    it("renderiza o banner hero com o overline, título e botões de ação", () => {
      renderWithRouter(<CapituloDeHojeSection />);

      expect(screen.getByText(/CAPÍTULO DE HOJE/i)).toBeInTheDocument();
      expect(screen.getByText("A Palavra não é um texto distante")).toBeInTheDocument();
      expect(screen.getByText(/Você não abre as Escrituras/i)).toBeInTheDocument();
      expect(screen.getByText(/Romanos 15/i)).toBeInTheDocument();
      expect(screen.getByText("Ler capítulo")).toBeInTheDocument();
      expect(screen.getByText("Ver toda a jornada")).toBeInTheDocument();
    });

    it("abre o popup com o texto completo ao clicar no card", () => {
      renderWithRouter(<CapituloDeHojeSection />);

      const cardButton = screen.getByRole("button", { name: /ler reflexão completa/i });
      fireEvent.click(cardButton);

      expect(screen.getByText(/As narrativas bíblicas não são relíquias/i)).toBeInTheDocument();
      expect(screen.getByText(/Permanecer diante do texto é permitir/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /fechar/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /ler capítulo na bíblia/i })).toBeInTheDocument();

      // Fecha o modal
      fireEvent.click(screen.getByRole("button", { name: /fechar/i }));
    });
  });

  describe("BookGrid", () => {
    const mockBooks: Book[] = [
      { id: 1, name: "Gênesis", slug: "genesis", chapters: 50, testament: "AT", group: "Pentateuco" },
      { id: 2, name: "Êxodo", slug: "exodo", chapters: 40, testament: "AT", group: "Pentateuco" },
    ];

    it("renderiza cards com nome do livro, contagem de capítulos e chevron", () => {
      const { container } = renderWithRouter(
        <BookGrid books={mockBooks} version="nvi" />
      );

      expect(screen.getByText("Gênesis")).toBeInTheDocument();
      expect(screen.getByText(/50 capítulos/i)).toBeInTheDocument();
      expect(screen.getByText("Êxodo")).toBeInTheDocument();
      expect(screen.getByText(/40 capítulos/i)).toBeInTheDocument();

      // Checa classe de 6 colunas no desktop
      const grid = container.querySelector(".lg\\:grid-cols-6");
      expect(grid).toBeInTheDocument();
    });

    it("renderiza Antigo e Novo Testamento lado a lado sem necessidade de alternar abas", () => {
      const mockAT: Book[] = [
        { id: "gen", name: "Gênesis", slug: "genesis", chapters: 50, abbrev: "gn" },
        { id: "exo", name: "Êxodo", slug: "exodo", chapters: 40, abbrev: "ex" },
      ];
      const mockNT: Book[] = [
        { id: "mat", name: "Mateus", slug: "mateus", chapters: 28, abbrev: "mt" },
        { id: "rev", name: "Apocalipse", slug: "apocalipse", chapters: 22, abbrev: "ap" },
      ];

      renderWithRouter(
        <BookGrid oldTestament={mockAT} newTestament={mockNT} version="nvi" />
      );

      // Ambos os títulos devem estar visíveis simultaneamente
      expect(screen.getByText("Antigo Testamento")).toBeInTheDocument();
      expect(screen.getByText("Novo Testamento")).toBeInTheDocument();

      // Livros de ambos os testamentos devem estar no DOM
      expect(screen.getByText("Gênesis")).toBeInTheDocument();
      expect(screen.getByText("Êxodo")).toBeInTheDocument();
      expect(screen.getByText("Mateus")).toBeInTheDocument();
      expect(screen.getByText("Apocalipse")).toBeInTheDocument();

      // Links devem apontar para a versão e slug corretos
      expect(screen.getByRole("link", { name: "Gênesis" })).toHaveAttribute("href", "/nvi/genesis");
      expect(screen.getByRole("link", { name: "Mateus" })).toHaveAttribute("href", "/nvi/mateus");
    });
  });
});
