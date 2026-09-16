import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import GoldenAmbientMist from "@/components/GoldenAmbientMist";
import ReadingChapterGridCard from "@/components/ReadingChapterGridCard";
import BookPickerModal from "@/components/BookPickerModal";
import VersionPickerModal from "@/components/VersionPickerModal";
import ReadingBottomNav from "@/components/ReadingBottomNav";
import { COLUMN_WIDTH_MAP } from "@/hooks/useReadingPreferences";

import { setTheme } from "@/lib/themes";

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("ReadingPage Redesign Components", () => {
  describe("GoldenAmbientMist", () => {
    it("renderiza o container de fumacinhas douradas com aria-hidden", () => {
      const { container } = render(<GoldenAmbientMist />);
      const mistContainer = container.querySelector('[aria-hidden="true"]');
      expect(mistContainer).toBeInTheDocument();
      expect(mistContainer).toHaveClass("pointer-events-none");
    });

    it("adapta o gradiente de fundo aos modos dark, sepia e light", () => {
      setTheme("dark");
      const { container: darkContainer, unmount: unmountDark } = render(<GoldenAmbientMist />);
      const darkEl = darkContainer.querySelector('[aria-hidden="true"]');
      expect(darkEl?.className).toContain("from-[#1c1814]");
      unmountDark();

      setTheme("sepia");
      const { container: sepiaContainer, unmount: unmountSepia } = render(<GoldenAmbientMist />);
      const sepiaEl = sepiaContainer.querySelector('[aria-hidden="true"]');
      expect(sepiaEl?.className).toContain("from-[#f8f3e8]");
      unmountSepia();

      setTheme("light");
      const { container: lightContainer, unmount: unmountLight } = render(<GoldenAmbientMist />);
      const lightEl = lightContainer.querySelector('[aria-hidden="true"]');
      expect(lightEl?.className).toContain("from-[#ffffff]");
      unmountLight();
    });

    it("renderiza 4 orbs de blush dourado discretos adaptados para sépia e light", () => {
      setTheme("sepia");
      const { container: sepiaContainer, unmount: unmountSepia } = render(<GoldenAmbientMist />);
      const sepiaOrbs = sepiaContainer.querySelectorAll('[aria-hidden="true"] > div');
      expect(sepiaOrbs.length).toBe(4);
      sepiaOrbs.forEach((orb) => {
        expect(orb.className).toContain("rounded-full");
      });
      unmountSepia();

      setTheme("light");
      const { container: lightContainer, unmount: unmountLight } = render(<GoldenAmbientMist />);
      const lightOrbs = lightContainer.querySelectorAll('[aria-hidden="true"] > div');
      expect(lightOrbs.length).toBe(4);
      lightOrbs.forEach((orb) => {
        expect(orb.className).toContain("rounded-full");
      });
      unmountLight();
    });
  });

  describe("ReadingChapterGridCard", () => {
    it("renderiza cabeçalho, total de capítulos e destaca o capítulo ativo no modo dark", () => {
      setTheme("dark");
      const onSelect = vi.fn();
      render(
        <ReadingChapterGridCard
          totalChapters={50}
          currentChapter={1}
          onSelectChapter={onSelect}
        />
      );

      expect(screen.getByText("Capítulos")).toBeInTheDocument();
      expect(screen.getAllByText("50").length).toBeGreaterThanOrEqual(1);

      const activeBtn = screen.getByRole("button", { name: "Capítulo 1" });
      expect(activeBtn).toHaveAttribute("aria-current", "page");
      expect(activeBtn).toHaveClass("bg-[#e5b869]");

      const ch2Btn = screen.getByRole("button", { name: "Capítulo 2" });
      expect(ch2Btn).not.toHaveAttribute("aria-current", "page");

      fireEvent.click(ch2Btn);
      expect(onSelect).toHaveBeenCalledWith(2);
    });

    it("adapta o destaque do capítulo ativo no modo sépia e light", () => {
      setTheme("sepia");
      const { unmount: unmountSepia } = render(
        <ReadingChapterGridCard totalChapters={10} currentChapter={1} onSelectChapter={vi.fn()} />
      );
      expect(screen.getByRole("button", { name: "Capítulo 1" })).toHaveClass("bg-[#c4973b]");
      unmountSepia();

      setTheme("light");
      const { unmount: unmountLight } = render(
        <ReadingChapterGridCard totalChapters={10} currentChapter={1} onSelectChapter={vi.fn()} />
      );
      expect(screen.getByRole("button", { name: "Capítulo 1" })).toHaveClass("bg-[#d4a034]");
      unmountLight();
    });
  });

  describe("BookPickerModal", () => {
    it("renderiza lista de livros, abas e permite selecionar livro", () => {
      const onSelectBook = vi.fn();
      const onOpenChange = vi.fn();

      render(
        <BookPickerModal
          open={true}
          onOpenChange={onOpenChange}
          currentBookSlug="genesis"
          onSelectBook={onSelectBook}
        />
      );

      expect(screen.getByText("Livros da Bíblia")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/buscar livro/i)).toBeInTheDocument();

      const genesisBtn = screen.getByRole("button", { name: /Gênesis/i });
      expect(genesisBtn).toBeInTheDocument();
      fireEvent.click(genesisBtn);
      expect(onSelectBook).toHaveBeenCalledWith("gn");
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("VersionPickerModal", () => {
    it("renderiza catálogo de versões bíblicas e permite trocar versão", () => {
      const onSelectVersion = vi.fn();
      const onOpenChange = vi.fn();

      render(
        <VersionPickerModal
          open={true}
          onOpenChange={onOpenChange}
          currentVersion="kja"
          onSelectVersion={onSelectVersion}
        />
      );

      expect(screen.getByText("Versões da Bíblia")).toBeInTheDocument();
      expect(screen.getByText("King James Atualizada")).toBeInTheDocument();

      const nviBtn = screen.getByRole("button", { name: /Nova Versão Internacional/i });
      expect(nviBtn).toBeInTheDocument();
      fireEvent.click(nviBtn);
      expect(onSelectVersion).toHaveBeenCalledWith("nvi");
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("ReadingBottomNav", () => {
    it("renderiza a pílula de versão e navegação anterior/próximo", () => {
      const onNavigate = vi.fn();
      const onVersionChange = vi.fn();

      renderWithRouter(
        <ReadingBottomNav
          currentVersion="kja"
          onVersionChange={onVersionChange}
          prevChapterInfo={{ book: { name: "Gênesis", slug: "genesis" }, chapter: 1 }}
          nextChapterInfo={{ book: { name: "Gênesis", slug: "genesis" }, chapter: 3 }}
          onNavigate={onNavigate}
        />
      );

      expect(screen.getByText("KJA")).toBeInTheDocument();

      const prevBtn = screen.getByRole("button", { name: /capítulo anterior/i });
      fireEvent.click(prevBtn);
      expect(onNavigate).toHaveBeenCalledWith(1, "genesis");

      const nextBtn = screen.getByRole("button", { name: /próximo capítulo/i });
      fireEvent.click(nextBtn);
      expect(onNavigate).toHaveBeenCalledWith(3, "genesis");
    });

    it("desabilita botão de anterior se não houver capítulo anterior", () => {
      const onNavigate = vi.fn();
      const onVersionChange = vi.fn();

      renderWithRouter(
        <ReadingBottomNav
          currentVersion="kja"
          onVersionChange={onVersionChange}
          prevChapterInfo={null}
          nextChapterInfo={{ book: { name: "Gênesis", slug: "genesis" }, chapter: 2 }}
          onNavigate={onNavigate}
        />
      );

      const prevBtn = screen.getByRole("button", { name: /capítulo anterior/i });
      expect(prevBtn).toBeDisabled();
    });

    it("exibe botão de concluir leitura no último capítulo", () => {
      const onFinish = vi.fn();
      renderWithRouter(
        <ReadingBottomNav
          currentVersion="kja"
          onVersionChange={vi.fn()}
          prevChapterInfo={{ book: { name: "Apocalipse", slug: "apocalipse" }, chapter: 21 }}
          nextChapterInfo={null}
          onNavigate={vi.fn()}
          onFinish={onFinish}
        />
      );

      const finishBtn = screen.getByRole("button", { name: /concluir leitura/i });
      expect(finishBtn).toBeInTheDocument();
      fireEvent.click(finishBtn);
      expect(onFinish).toHaveBeenCalledTimes(1);
    });
  });

  describe("Column Width Preferences", () => {
    it("mapeia as larguras de coluna estreita, normal e larga corretamente", () => {
      expect(COLUMN_WIDTH_MAP.normal).toBe("680px");
      expect(COLUMN_WIDTH_MAP.narrow).toBe("520px");
      expect(COLUMN_WIDTH_MAP.wide).toBe("860px");
    });
  });
});
