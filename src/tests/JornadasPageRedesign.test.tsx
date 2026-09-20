import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import JornadasPage from "@/pages/JornadasPage";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mock Layout inner components to keep tests focused on JornadasPage
vi.mock("@/components/Header", () => ({
  default: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock("@/components/HarpaPlayerBar", () => ({
  default: () => null,
}));

vi.mock("@/components/NotificationSoftAsk", () => ({
  default: () => null,
}));

// Mock hooks
vi.mock("@/hooks/useEditorialJornadas", () => ({
  useEditorialJornadas: () => ({
    seriesGroups: [],
    loading: false,
    error: null,
  }),
}));

vi.mock("@/hooks/useEditorialChapter", () => ({
  useEditorialChapter: () => ({
    chapter: null,
    loading: false,
    error: null,
  }),
}));

vi.mock("@/hooks/usePageMeta", () => ({
  usePageMeta: () => {},
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <TooltipProvider>{ui}</TooltipProvider>
    </BrowserRouter>
  );
};

describe("JornadasPage Redesign", () => {
  it("renderiza o cabeçalho central clássico com o overline e o título em duas linhas", () => {
    renderWithRouter(<JornadasPage />);

    expect(screen.getByText("CAPÍTULOS PARA A CAMINHADA")).toBeInTheDocument();
    expect(
      screen.getByText(/Pequenos encontros com a Palavra,/i)
    ).toBeInTheDocument();
  });

  it("renderiza o card principal com o capítulo de hoje, imagem da montanha e botão Ler capítulo", () => {
    renderWithRouter(<JornadasPage />);

    expect(screen.getByRole("region", { name: /capítulo de hoje/i })).toBeInTheDocument();
    expect(screen.getByText(/CAPÍTULO DE HOJE • ESCUTA/i)).toBeInTheDocument();
    expect(screen.getByText("A Palavra não é genérica")).toBeInTheDocument();
    expect(screen.getByText("Romanos 15:4")).toBeInTheDocument();

    const mountainImg = screen.getByAltText(/Montanhas ao amanhecer/i);
    expect(mountainImg).toBeInTheDocument();
    expect(mountainImg).toHaveAttribute("src", "/images/jornadas-mountain-hero.jpg");

    const lerCapituloLink = screen.getByRole("link", { name: /ler capítulo/i });
    expect(lerCapituloLink).toBeInTheDocument();
    expect(lerCapituloLink).toHaveAttribute("href", "/nvi/romanos/15#v4");
  });

  it("renderiza as 8 séries canônicas na seção Sua Caminhada sem ícones no título", () => {
    const { container } = renderWithRouter(<JornadasPage />);

    expect(screen.getByText("SUA CAMINHADA")).toBeInTheDocument();
    expect(
      screen.getByText("Cada série é um passo na mesma direção: mais perto da Palavra.")
    ).toBeInTheDocument();

    // 8 séries canônicas
    expect(screen.getByText("Permanecer")).toBeInTheDocument();
    expect(screen.getByText("Cultivo")).toBeInTheDocument();
    expect(screen.getByText("Discernimento")).toBeInTheDocument();
    expect(screen.getByText("Escuta")).toBeInTheDocument();
    expect(screen.getByText("Formação")).toBeInTheDocument();
    expect(screen.getByText("Descanso")).toBeInTheDocument();
    expect(screen.getByText("Habitação")).toBeInTheDocument();
    expect(screen.getByText("Transbordamento")).toBeInTheDocument();

    // Frases de resumo de cada série
    expect(screen.getByText("Voltar à Palavra. Criar espaço. Permanecer.")).toBeInTheDocument();
    expect(screen.getByText("O que permanece começa a criar raízes.")).toBeInTheDocument();
    expect(screen.getByText("A Palavra começa a transformar o modo de olhar.")).toBeInTheDocument();
    expect(screen.getByText("Quando a Palavra deixa de ser apenas lida e passa a nos interpelar.")).toBeInTheDocument();
    expect(screen.getByText("O que foi percebido e acolhido começa a moldar o caráter.")).toBeInTheDocument();
    expect(screen.getByText("A Palavra sustenta quando as forças se esgotam.")).toBeInTheDocument();
    expect(screen.getByText("A Palavra acompanha a vida em todos os lugares.")).toBeInTheDocument();
    expect(screen.getByText("O que foi acolhido transborda na vida e alcança outros.")).toBeInTheDocument();
  });

  it("garante que nenhum card das séries possui a barra lateral esquerda (border-l) e renderiza 8 séries", () => {
    const { container } = renderWithRouter(<JornadasPage />);

    // Seleciona todos os cards com aria-label de série
    const seriesCards = container.querySelectorAll('[aria-label^="Ver capítulos da série"]');
    expect(seriesCards.length).toBe(8);

    seriesCards.forEach((card) => {
      const classNames = card.className;
      // Nenhuma classe de borda lateral esquerda (ex: border-l-4, border-l-amber, etc.)
      expect(classNames).not.toMatch(/border-l-\d+/);
      expect(classNames).not.toMatch(/border-l-\[/);
      expect(classNames).toContain("border-[#382f23]/80");
    });
  });

  it("abre modal ao clicar em uma série exibindo seus 6 capítulos", () => {
    renderWithRouter(<JornadasPage />);

    const permanecerCard = screen.getByLabelText("Ver capítulos da série Permanecer");
    fireEvent.click(permanecerCard);

    // Modal aberto com os dados da série
    expect(screen.getByText("Série 1 · Permanecer")).toBeInTheDocument();
    expect(screen.getByText("O primeiro passo é parar")).toBeInTheDocument();
    expect(screen.getByText("A raiz que não seca")).toBeInTheDocument();
    expect(screen.getByText("Continue: a constância da caminhada")).toBeInTheDocument();
  });

  it("abre modal ao clicar em 'Ler reflexão completa' do card principal", () => {
    renderWithRouter(<JornadasPage />);

    const reflexaoBtn = screen.getByRole("button", { name: /ler reflexão completa/i });
    fireEvent.click(reflexaoBtn);

    expect(screen.getByText(/Texto completo da reflexão do capítulo de hoje/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Você não abre as Escrituras como quem observa uma história/i)
    ).toBeInTheDocument();
  });
});
