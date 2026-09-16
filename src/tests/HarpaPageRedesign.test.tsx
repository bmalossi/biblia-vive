import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import HarpaPage from "@/pages/HarpaPage";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mock subcomponentes do Layout para focar o teste na HarpaPage
vi.mock("@/components/Header", () => ({
  default: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock("@/components/HarpaPlayerBar", () => ({
  default: () => null,
}));

vi.mock("@/components/NotificationSoftAsk", () => ({
  default: () => null,
}));

vi.mock("@/hooks/usePageMeta", () => ({
  usePageMeta: () => {},
}));

// Mock do HarpaPlayerContext
vi.mock("@/contexts/HarpaPlayerContext", () => ({
  useHarpaPlayer: () => ({
    state: {
      hymnNumber: null,
      title: "",
      audioUrl: "",
      isPlaying: false,
      progress: 0,
      duration: 192,
      volume: 1,
      isMuted: false,
      loopMode: false,
      autoAdvance: false,
      error: false,
    },
    play: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
    toggleMute: vi.fn(),
    toggleLoop: vi.fn(),
    toggleAutoAdvance: vi.fn(),
    next: vi.fn(),
    close: vi.fn(),
  }),
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <TooltipProvider>{ui}</TooltipProvider>
    </BrowserRouter>
  );
};

describe("HarpaPage Redesign", () => {
  it("renderiza o cabeçalho hero com overline e título clássico, sem botão redundante de explorar", () => {
    renderWithRouter(<HarpaPage />);

    expect(screen.getByText("HARPA CRISTÃ")).toBeInTheDocument();
    expect(screen.getByText(/Hinos que acompanham/i)).toBeInTheDocument();
    expect(screen.getByText(/a caminhada./i)).toBeInTheDocument();
    expect(
      screen.getByText(/Cante, ouça e guarde os hinos da Harpa Cristã/i)
    ).toBeInTheDocument();
    // O botão 'Explorar hinos' foi removido pois a página já é a de hinos
    expect(screen.queryByRole("button", { name: /explorar hinos/i })).not.toBeInTheDocument();
  });

  it("renderiza a barra de pesquisa e o botão de História da Harpa", () => {
    renderWithRouter(<HarpaPage />);

    const searchInput = screen.getByPlaceholderText("Buscar hino por número ou título...");
    expect(searchInput).toBeInTheDocument();

    const historiaBtn = screen.getByRole("button", { name: /história da harpa/i });
    expect(historiaBtn).toBeInTheDocument();
  });

  it("renderiza o card do Hino em Destaque sem estrelas falsas quando notas estão zeradas", () => {
    renderWithRouter(<HarpaPage />);

    expect(screen.getByText("HINO EM DESTAQUE")).toBeInTheDocument();
    expect(screen.getAllByText("Nº 001").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Chuvas de Graça").length).toBeGreaterThanOrEqual(1);

    // Notas zeradas não exibem estrelas ou ratings simulados (informação verdadeira)
    expect(screen.queryByText("4.9")).not.toBeInTheDocument();

    // Tags
    expect(screen.getByText("Louvor")).toBeInTheDocument();
    expect(screen.getByText("Graça")).toBeInTheDocument();
    expect(screen.getByText("Vida Cristã")).toBeInTheDocument();

    // Botão de Play e tempo no card principal
    expect(screen.getByRole("button", { name: /ouvir hino/i })).toBeInTheDocument();
    expect(screen.getByText(/0:00 \/ 3:12/i)).toBeInTheDocument();
  });

  it("renderiza a seção 'Em destaque' e exibe o botão de Play APENAS nos hinos com áudio real", () => {
    renderWithRouter(<HarpaPage />);

    expect(screen.getByText("Em destaque")).toBeInTheDocument();
    expect(screen.getByText("Hinos mais cantados e amados da Harpa Cristã.")).toBeInTheDocument();
    expect(screen.getByText("Ver todos os destaques")).toBeInTheDocument();

    // Hinos 1, 2, 3 possuem áudio no harpa-hymns.json
    expect(screen.getByRole("button", { name: /^tocar hino 1$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^tocar hino 2$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^tocar hino 3$/i })).toBeInTheDocument();

    // Hinos 4 e 5 NÃO possuem áudio no harpa-hymns.json (hasAudio: false) -> SEM botão de play
    expect(screen.queryByRole("button", { name: /^tocar hino 4$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^tocar hino 5$/i })).not.toBeInTheDocument();
  });

  it("renderiza os widgets laterais com 'Áudio disponível em alguns hinos' e Colaboração", () => {
    renderWithRouter(<HarpaPage />);

    expect(screen.getByText("Áudio disponível em alguns hinos")).toBeInTheDocument();
    expect(screen.getByText("Colabore com a Harpa")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /saiba mais/i })).toBeInTheDocument();
  });

  it("abre o modal de colaboração ao clicar em 'Saiba mais'", () => {
    renderWithRouter(<HarpaPage />);

    const saibaMaisBtn = screen.getByRole("button", { name: /saiba mais/i });
    fireEvent.click(saibaMaisBtn);

    expect(screen.getByText("Colabore com a Harpa Cristã")).toBeInTheDocument();
    expect(screen.getByText("Comunidade Bíblia Vive")).toBeInTheDocument();
    expect(screen.getByText("suporte@bibliavive.com.br")).toBeInTheDocument();
  });

  it("abre o modal de história ao clicar em 'História da Harpa'", () => {
    renderWithRouter(<HarpaPage />);

    const historiaBtn = screen.getByRole("button", { name: /história da harpa/i });
    fireEvent.click(historiaBtn);

    expect(screen.getByText("A História da Harpa Cristã")).toBeInTheDocument();
    expect(screen.getByText("História e Tradição")).toBeInTheDocument();
  });

  it("filtra hinos em tempo real quando o usuário digita na busca", () => {
    renderWithRouter(<HarpaPage />);

    const searchInput = screen.getByPlaceholderText("Buscar hino por número ou título...");
    fireEvent.change(searchInput, { target: { value: "Conversão" } });

    // Hino com o termo deve ser exibido
    expect(screen.getByText("Conversão")).toBeInTheDocument();
  });
});
