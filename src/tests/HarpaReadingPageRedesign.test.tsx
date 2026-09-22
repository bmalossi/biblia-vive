import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import HarpaReadingPage from "@/pages/HarpaReadingPage";

// Mock Layout to focus on HarpaReadingPage
vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-layout">{children}</div>,
}));

vi.mock("@/hooks/usePageMeta", () => ({
  usePageMeta: vi.fn(),
}));

const mockPlay = vi.fn();
const mockPause = vi.fn();
const mockResume = vi.fn();
const mockSeek = vi.fn();

vi.mock("@/contexts/HarpaPlayerContext", () => ({
  useHarpaPlayer: () => ({
    state: {
      hymnNumber: 322,
      title: "As Santas Escrituras",
      audioUrl: "https://r2.bibliavive.com.br/harpas/322.mp3",
      isPlaying: false,
      progress: 25,
      duration: 192,
      volume: 1,
      isMuted: false,
      loopMode: false,
      autoAdvance: false,
      error: false,
    },
    play: mockPlay,
    pause: mockPause,
    resume: mockResume,
    seek: mockSeek,
    setVolume: vi.fn(),
    toggleMute: vi.fn(),
    toggleLoop: vi.fn(),
    toggleAutoAdvance: vi.fn(),
    next: vi.fn(),
    close: vi.fn(),
  }),
}));

vi.mock("@/hooks/useHarpaAudio", () => ({
  useHarpaAudio: (hymnNumber: number) => ({
    audioUrl: hymnNumber === 322 ? "https://r2.bibliavive.com.br/harpas/322.mp3" : null,
    isAvailable: hymnNumber === 322,
    checking: false,
  }),
}));

const mockStrophes = [
  {
    numero: 322,
    titulo: "AS SANTAS ESCRITURAS",
    estrofe: 1,
    texto: "1 São as santas Escrituras\nQue nos contam de Jesus\n\nNUNCA MAIS VAI SER OUVIDO\nOUTRO CONTO DE AMOR",
  },
  {
    numero: 322,
    titulo: "AS SANTAS ESCRITURAS",
    estrofe: 2,
    texto: "2 Sobre a cruz foi derramado\nO Seu sangue remidor",
  },
];

describe("HarpaReadingPage Redesign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn((url: string) => {
      if (url.includes("/1.json")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStrophes[0]),
        } as Response);
      }
      if (url.includes("/2.json")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStrophes[1]),
        } as Response);
      }
      return Promise.reject(new Error("Not found"));
    });
  });

  const renderComponent = (hymnNumber = "322") => {
    return render(
      <MemoryRouter initialEntries={[`/harpa/${hymnNumber}`]}>
        <Routes>
          <Route path="/harpa/:hymnNumber" element={<HarpaReadingPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("renderiza o Hero Header com título, overline e os 3 pilares de valor", async () => {
    renderComponent();

    // Overline e título
    expect(screen.getByText("HARPA CRISTÃ")).toBeInTheDocument();
    expect(screen.getByText(/Hinos que alimentam/i)).toBeInTheDocument();
    expect(screen.getByText(/a alma\./i)).toBeInTheDocument();

    // 3 Pilares
    expect(screen.getByText("640 hinos")).toBeInTheDocument();
    expect(screen.getByText("Organizada por temas")).toBeInTheDocument();
    expect(screen.getByText("Ideal para momentos")).toBeInTheDocument();

    // Link de voltar à lista
    expect(screen.getByText("Voltar à lista da Harpa")).toBeInTheDocument();
  });

  it("renderiza o card da letra com estrofes e identificação do coro em duas colunas", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/São as santas Escrituras/i)).toBeInTheDocument();
    });

    // Título e identificadores
    expect(screen.getAllByText("As Santas Escrituras")[0]).toBeInTheDocument();
    expect(screen.getByText(/ESTROFE 1/i)).toBeInTheDocument();
    expect(screen.getByText(/CORO/i)).toBeInTheDocument();
    expect(screen.getByText(/NUNCA MAIS VAI SER OUVIDO/i)).toBeInTheDocument();
    expect(screen.getByText(/ESTROFE 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Sobre a cruz foi derramado/i)).toBeInTheDocument();
  });

  it("NÃO renderiza o card 'SOBRE ESTE HINO' nem citações adicionais abaixo da letra (regras do usuário)", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/São as santas Escrituras/i)).toBeInTheDocument();
    });

    // Card "SOBRE ESTE HINO" não deve existir
    expect(screen.queryByText(/SOBRE ESTE HINO/i)).toBeNull();

    // Nenhum texto/versículo bíblico de rodapé poluidor abaixo da letra
    expect(screen.queryByText(/Lâmpada para os meus pés/i)).toBeNull();
  });

  it("renderiza o player de áudio lateral 'OUVIR HINO' com botão de reprodução e progresso", async () => {
    renderComponent();

    expect(screen.getByText("OUVIR HINO")).toBeInTheDocument();
    const playButton = screen.getByRole("button", { name: /ouvir hino/i });
    expect(playButton).toBeInTheDocument();

    fireEvent.click(playButton);
    expect(mockResume).toHaveBeenCalledTimes(1);
  });

  it("renderiza o card de Créditos da Gravação APENAS quando há créditos reais, descartando textos genéricos", async () => {
    // Hino 322 tem créditos reais (Juscelino Duarte / Violão: Tiago)
    renderComponent("322");

    expect(screen.getByText("CRÉDITOS DA GRAVAÇÃO")).toBeInTheDocument();
    expect(screen.getByText("Juscelino Duarte")).toBeInTheDocument();
    expect(screen.getByText("Tiago")).toBeInTheDocument();

    // Textos genéricos descartados / não exibidos
    expect(screen.queryByText(/Coral Harpa Cristã/i)).toBeNull();
    expect(screen.queryByText(/Editora Harpa Cristã/i)).toBeNull();
    expect(screen.queryByText(/1988/)).toBeNull();

    // Card de citação inspiradora
    expect(screen.getByText(/A Palavra de Deus não é apenas para ser lida/i)).toBeInTheDocument();
    expect(screen.getByText("— Harpa Cristã")).toBeInTheDocument();
  });

  it("OMITE o card de Créditos da Gravação quando o hino não possui créditos reais", async () => {
    // Hino 1 não possui créditos na Harpa
    renderComponent("1");

    expect(screen.queryByText("CRÉDITOS DA GRAVAÇÃO")).toBeNull();
    expect(screen.queryByText(/Coral Harpa Cristã/i)).toBeNull();
    expect(screen.queryByText(/Editora Harpa Cristã/i)).toBeNull();
  });

  it("permite alterar o tamanho da fonte (A A A) da letra", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/São as santas Escrituras/i)).toBeInTheDocument();
    });

    const fontButtons = screen.getAllByRole("button", { name: /^A$/i });
    expect(fontButtons.length).toBe(3);

    fireEvent.click(fontButtons[0]); // Fonte menor
    fireEvent.click(fontButtons[2]); // Fonte maior
  });
});
