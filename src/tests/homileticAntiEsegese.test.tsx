import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SermonStudioPage from "@/pages/SermonStudioPage";
import * as homileticClient from "@/lib/homileticClient";
import type { Sermon } from "@/lib/homileticClient";

vi.mock("@/lib/homileticClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/homileticClient")>(
    "@/lib/homileticClient"
  );
  return {
    ...actual,
    getSermon: vi.fn(),
    saveSermon: vi.fn(),
  };
});

describe("Ticket 3: Trava Anti-Esegese e Bloco 1 (Explicar o Texto)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseSermonWithDesfecho: Sermon = {
    id: "sermon-anti-esegese-1",
    userId: "test-user-123",
    title: "O Soberano Propósito",
    bookId: "ROM",
    bookName: "Romanos",
    chapter: 8,
    verse: 28,
    version: "acf",
    sparkText: "Todas as coisas cooperam para o bem.",
    status: "draft",
    desfechoTipo: "consolacao",
    desfechoTexto: "Confortar os corações na certeza de que Deus conduz a história.",
    bloco1Exegese: "",
    bloco1IntencaoOriginal: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("renderiza o Bloco 1 com campos de exegese e a Pergunta Reflexiva Obrigatória (Trava Anti-Esegese)", async () => {
    vi.mocked(homileticClient.getSermon).mockResolvedValue(baseSermonWithDesfecho);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-anti-esegese-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("bloco-1-container")).toHaveAttribute("data-locked", "false");
    });

    const bloco1 = screen.getByTestId("bloco-1-container");
    expect(
      within(bloco1).getByText(
        /Qual era a intenção do autor sagrado para os primeiros ouvintes deste texto\?/i
      )
    ).toBeInTheDocument();
  });

  it("mantém o Bloco 2 bloqueado enquanto a intenção do autor original não for respondida", async () => {
    vi.mocked(homileticClient.getSermon).mockResolvedValue(baseSermonWithDesfecho);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-anti-esegese-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("bloco-1-container")).toHaveAttribute("data-locked", "false");
    });

    const bloco2 = screen.getByTestId("bloco-2-container");
    expect(bloco2).toHaveAttribute("data-locked", "true");
    expect(within(bloco2).getByText(/Trava Anti-Esegese Ativa/i)).toBeInTheDocument();
  });

  it("desbloqueia o Bloco 2 e persiste no D1 quando o pregador responde à pergunta reflexiva e salva o Bloco 1", async () => {
    vi.mocked(homileticClient.getSermon).mockResolvedValue(baseSermonWithDesfecho);
    vi.mocked(homileticClient.saveSermon).mockImplementation(async (partial) => ({
      ...baseSermonWithDesfecho,
      ...partial,
    }));

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-anti-esegese-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("bloco-1-container")).toHaveAttribute("data-locked", "false");
    });

    // Preenche a Exegese do Bloco 1
    const exegeseInput = screen.getByPlaceholderText(/Pano de fundo histórico/i);
    fireEvent.change(exegeseInput, {
      target: { value: "Contexto de perseguição sob o império romano aos cristãos." },
    });

    // Preenche a Pergunta Reflexiva (Intenção Original)
    const intencaoInput = screen.getByPlaceholderText(
      /O que o autor bíblico pretendia comunicar aos seus ouvintes/i
    );
    fireEvent.change(intencaoInput, {
      target: {
        value: "Paulo escreveu para ancorar a esperança da igreja perseguida em Roma na fidelidade eterna de Deus.",
      },
    });

    // Clica no botão de Salvar Bloco 1
    const salvarBloco1Btn = screen.getByRole("button", { name: /fixar ancoradouro|salvar exegese/i });
    fireEvent.click(salvarBloco1Btn);

    await waitFor(() => {
      expect(homileticClient.saveSermon).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "sermon-anti-esegese-1",
          bloco1Exegese: "Contexto de perseguição sob o império romano aos cristãos.",
          bloco1IntencaoOriginal:
            "Paulo escreveu para ancorar a esperança da igreja perseguida em Roma na fidelidade eterna de Deus.",
        })
      );
      // Bloco 2 agora deve estar desbloqueado
      expect(screen.getByTestId("bloco-2-container")).toHaveAttribute("data-locked", "false");
    });

    // Cabeçalho de Ancoradouro Histórico deve estar visível
    expect(screen.getByTestId("ancoradouro-historico-header")).toBeInTheDocument();
  });

  it("carrega com Bloco 2 já desbloqueado se o rascunho já contiver intenção original válida", async () => {
    const existingSermonWithIntent: Sermon = {
      ...baseSermonWithDesfecho,
      bloco1Exegese: "Análise do grego sunergei...",
      bloco1IntencaoOriginal: "Assegurar que nenhuma adversidade frustra o plano divino redentor.",
    };

    vi.mocked(homileticClient.getSermon).mockResolvedValue(existingSermonWithIntent);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-anti-esegese-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("bloco-1-container")).toHaveAttribute("data-locked", "false");
      expect(screen.getByTestId("bloco-2-container")).toHaveAttribute("data-locked", "false");
      expect(screen.getByTestId("ancoradouro-historico-header")).toHaveTextContent(
        /Assegurar que nenhuma adversidade frustra o plano divino redentor/i
      );
    });
  });
});
