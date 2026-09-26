import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SermonPulpitPage from "@/pages/SermonPulpitPage";
import * as homileticClient from "@/lib/homileticClient";
import * as bibleApi from "@/lib/bibleApi";
import type { Sermon } from "@/lib/homileticClient";

vi.mock("@/lib/homileticClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/homileticClient")>(
    "@/lib/homileticClient"
  );
  return {
    ...actual,
    getSermon: vi.fn(),
  };
});

vi.mock("@/lib/bibleApi", () => ({
  fetchChapter: vi.fn(),
}));

describe("Ticket 6: Modo Púlpito Solene com Screen Wake Lock e Versículos Interativos", () => {
  let mockWakeLockRelease: any;
  let mockWakeLockRequest: any;

  const mockSermon: Sermon = {
    id: "sermon-pulpito-1",
    userId: "test-user-1",
    title: "O Alicerce Inabalável da Graça",
    bookId: "ROM",
    bookName: "Romanos",
    chapter: 8,
    verse: 28,
    version: "acf",
    sparkText: "Deus coopera em todas as coisas para o bem.",
    status: "completed",
    desfechoTipo: "consolacao",
    desfechoTexto: "Descansar na certeza da salvação irrevogável.",
    introducao: "Uma história sobre o barco no mar turbulento.",
    bloco1Exegese: "No contexto da perseguição romana, Paulo recorda o plano eterno.",
    bloco1IntencaoOriginal: "Ancorar a fé dos crentes perseguidos.",
    bloco2Topicos: [
      {
        id: "top-1",
        title: "A Providência Ativa de Deus",
        steps: {
          stepA_fato: "Todas as coisas cooperam.",
          stepB_porque: "Deus é o Senhor Soberano da história.",
          stepC_contraste: "Sem providência, o mundo é refém do caos.",
          stepD_tensao: "Você confia quando tudo parece dar errado?",
        },
      },
    ],
    bloco3Aplicacao: "Orar diariamente entregando os medos nas mãos do Pai.",
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-01T12:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWakeLockRelease = vi.fn().mockResolvedValue(undefined);
    mockWakeLockRequest = vi.fn().mockResolvedValue({
      release: mockWakeLockRelease,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    Object.defineProperty(navigator, "wakeLock", {
      value: {
        request: mockWakeLockRequest,
      },
      configurable: true,
      writable: true,
    });

    vi.mocked(homileticClient.getSermon).mockResolvedValue(mockSermon);
    vi.mocked(bibleApi.fetchChapter).mockResolvedValue({
      book: "Romanos",
      chapter: "8",
      verses: [
        { number: 28, text: "E sabemos que todas as coisas cooperam para o bem daqueles que amam a Deus." },
      ],
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("aciona a Screen Wake Lock API ao montar o Modo Púlpito e libera ao desmontar", async () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={["/pulpito/sermon-pulpito-1"]}>
        <Routes>
          <Route path="/pulpito/:sermonId" element={<SermonPulpitPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockWakeLockRequest).toHaveBeenCalledWith("screen");
    });

    unmount();

    await waitFor(() => {
      expect(mockWakeLockRelease).toHaveBeenCalled();
    });
  });

  it("renderiza a interface solene com cronômetro, mapa do sermão e tipografia serifada", async () => {
    render(
      <MemoryRouter initialEntries={["/pulpito/sermon-pulpito-1"]}>
        <Routes>
          <Route path="/pulpito/:sermonId" element={<SermonPulpitPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("pulpit-header")).toBeInTheDocument();
      expect(screen.getByTestId("pulpit-stopwatch")).toBeInTheDocument();
      expect(screen.getByText("O Alicerce Inabalável da Graça")).toBeInTheDocument();
    });

    // Pílulas do Mapa do Sermão
    expect(screen.getByRole("button", { name: /0\. Eu e Deus/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Introd\./i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /1\. Exegese/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /2\. Tópicos/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /3\. Aplicação/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /4\. Desfecho/i })).toBeInTheDocument();
  });

  it("renderiza marcadores de dinâmica vocal e retórica com estilização destacada", async () => {
    const sermonWithMarkers: Sermon = {
      ...mockSermon,
      bloco1Exegese: "[Ilustração] O exemplo do artesão que lapida o ouro. [Pausa Silenciosa] [Tom de Voz / Apelo] Olhe para a cruz!",
    };
    vi.mocked(homileticClient.getSermon).mockResolvedValue(sermonWithMarkers);

    render(
      <MemoryRouter initialEntries={["/pulpito/sermon-pulpito-1"]}>
        <Routes>
          <Route path="/pulpito/:sermonId" element={<SermonPulpitPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("dynamic-chip-ilustracao")).toBeInTheDocument();
      expect(screen.getByTestId("dynamic-chip-pausa")).toBeInTheDocument();
      expect(screen.getByTestId("dynamic-chip-apelo")).toBeInTheDocument();
    });
  });

  it("abre o texto bíblico canônico em card flutuante sem perder o scroll ao clicar na pílula de versículo", async () => {
    render(
      <MemoryRouter initialEntries={["/pulpito/sermon-pulpito-1"]}>
        <Routes>
          <Route path="/pulpito/:sermonId" element={<SermonPulpitPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("scripture-pill-main")).toBeInTheDocument();
    });

    // Clica na pílula de versículo
    fireEvent.click(screen.getByTestId("scripture-pill-main"));

    await waitFor(() => {
      expect(screen.getByTestId("biblical-text-floating-card")).toBeInTheDocument();
      expect(
        screen.getByText(/todas as coisas cooperam para o bem/i)
      ).toBeInTheDocument();
    });

    // Fecha o card flutuante
    const closeBtn = screen.getByRole("button", { name: /fechar passagem|fechar card/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByTestId("biblical-text-floating-card")).not.toBeInTheDocument();
    });
  });

  describe("Ajustes Ergonômicos do Altar no Modo Púlpito (5 Itens)", () => {
    it("1. Reordena blocos na ordem cronológica: Introdução no topo e Desfecho na conclusão", async () => {
      render(
        <MemoryRouter initialEntries={["/pulpito/sermon-pulpito-1"]}>
          <Routes>
            <Route path="/pulpito/:sermonId" element={<SermonPulpitPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId("pulpit-main-content")).toBeInTheDocument();
      });

      const introSec = document.getElementById("sec-intro");
      const exegesisSec = document.getElementById("sec-bloco-1");
      const topicsSec = document.getElementById("sec-bloco-2");
      const appSec = document.getElementById("sec-bloco-3");
      const desfechoSec = document.getElementById("sec-desfecho");

      expect(introSec).toBeInTheDocument();
      expect(exegesisSec).toBeInTheDocument();
      expect(topicsSec).toBeInTheDocument();
      expect(appSec).toBeInTheDocument();
      expect(desfechoSec).toBeInTheDocument();

      // Verifica ordem cronológica no DOM: Intro vem antes de Exegese, e Desfecho por último
      expect(introSec!.compareDocumentPosition(exegesisSec!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(exegesisSec!.compareDocumentPosition(topicsSec!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(topicsSec!.compareDocumentPosition(appSec!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(appSec!.compareDocumentPosition(desfechoSec!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("2. Tipografia padrão para leitura ergonômica a 60cm de distância (18px-20px)", async () => {
      render(
        <MemoryRouter initialEntries={["/pulpito/sermon-pulpito-1"]}>
          <Routes>
            <Route path="/pulpito/:sermonId" element={<SermonPulpitPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        const main = screen.getByTestId("pulpit-main-content");
        // Índice 1 é o padrão altar: text-[20px] leading-[1.85]
        expect(main.className).toContain("text-[20px]");
      });
    });

    it("3. Renderiza os 4 Degraus em parágrafos contínuos com badges sutis na margem", async () => {
      render(
        <MemoryRouter initialEntries={["/pulpito/sermon-pulpito-1"]}>
          <Routes>
            <Route path="/pulpito/:sermonId" element={<SermonPulpitPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId("badge-degrau-a-0")).toHaveTextContent(/A · Fato/i);
        expect(screen.getByTestId("badge-degrau-b-0")).toHaveTextContent(/B · Porquê/i);
        expect(screen.getByTestId("badge-degrau-c-0")).toHaveTextContent(/C · Contraste/i);
        expect(screen.getByTestId("badge-degrau-d-0")).toHaveTextContent(/D · Tensão/i);
      });
    });

    it("4. Barra Fixa Superior contém Tema, Versículo Flutuante, Cronômetro e Trava de Tela", async () => {
      render(
        <MemoryRouter initialEntries={["/pulpito/sermon-pulpito-1"]}>
          <Routes>
            <Route path="/pulpito/:sermonId" element={<SermonPulpitPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId("pulpit-header")).toBeInTheDocument();
        // Tema
        expect(screen.getByText("O Alicerce Inabalável da Graça")).toBeInTheDocument();
        // Versículo Flutuante
        expect(screen.getByTestId("scripture-pill-main")).toBeInTheDocument();
        // Cronômetro
        expect(screen.getByTestId("pulpit-stopwatch")).toBeInTheDocument();
        // Trava de Tela (Screen Wake Lock)
        expect(screen.getByTestId("wake-lock-status-indicator")).toBeInTheDocument();
      });
    });

    it("5. Botão [ 📖 Pregar Agora ] oculta menus secundários e ativa o Modo Altar contra toques acidentais", async () => {
      render(
        <MemoryRouter initialEntries={["/pulpito/sermon-pulpito-1"]}>
          <Routes>
            <Route path="/pulpito/:sermonId" element={<SermonPulpitPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId("enter-altar-mode-btn")).toBeInTheDocument();
      });

      // Antes de clicar: menus e pílulas do mapa do sermão estão visíveis
      expect(screen.getByRole("button", { name: /1\. Exegese/i })).toBeInTheDocument();

      // Clica em [ 📖 Pregar Agora ]
      fireEvent.click(screen.getByTestId("enter-altar-mode-btn"));

      // Menus secundários e pílulas de navegação são ocultos para evitar toques acidentais
      await waitFor(() => {
        expect(screen.getByTestId("altar-mode-banner")).toBeInTheDocument();
        expect(screen.getByTestId("exit-altar-mode-btn")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /1\. Exegese/i })).not.toBeInTheDocument();
      });

      // Ao clicar em Desbloquear / Sair do modo altar, restaura os menus
      fireEvent.click(screen.getByTestId("exit-altar-mode-btn"));

      await waitFor(() => {
        expect(screen.queryByTestId("altar-mode-banner")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: /1\. Exegese/i })).toBeInTheDocument();
      });
    });
  });
});
