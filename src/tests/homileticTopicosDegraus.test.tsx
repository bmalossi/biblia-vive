import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SermonStudioPage from "@/pages/SermonStudioPage";
import * as homileticClient from "@/lib/homileticClient";
import type { Sermon, HomileticTopic } from "@/lib/homileticClient";

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

describe("Ticket 4: Bloco 2 com Guardrails de Tópicos (1 a 4) e os 4 Degraus (A, B, C, D)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseSermonWithBloco1: Sermon = {
    id: "sermon-topicos-1",
    userId: "test-user-123",
    title: "O Triunfo da Esperança",
    bookId: "ROM",
    bookName: "Romanos",
    chapter: 8,
    verse: 28,
    version: "acf",
    sparkText: "Todas as coisas cooperam para o bem.",
    status: "draft",
    desfechoTipo: "consolacao",
    desfechoTexto: "Confortar os corações na certeza de que Deus conduz a história.",
    bloco1Exegese: "Contexto histórico romano de aflição...",
    bloco1IntencaoOriginal: "Paulo escreveu para ancorar a igreja na soberania de Deus.",
    bloco2Topicos: [],
    bloco3Aplicacao: "",
    introducao: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("inicializa o Bloco 2 com 3 tópicos por padrão e renderiza os 4 Degraus (A, B, C, D) em cada um", async () => {
    vi.mocked(homileticClient.getSermon).mockResolvedValue(baseSermonWithBloco1);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-topicos-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("bloco-2-container")).toHaveAttribute("data-locked", "false");
    });

    const topicCards = screen.getAllByTestId(/topic-card-/i);
    expect(topicCards).toHaveLength(3);

    // Cada tópico possui os 4 Degraus
    topicCards.forEach((card) => {
      expect(within(card).getByText(/Degrau A: Fato/i)).toBeInTheDocument();
      expect(within(card).getByText(/Degrau B: Porquê/i)).toBeInTheDocument();
      expect(within(card).getByText(/Degrau C: Contraste/i)).toBeInTheDocument();
      expect(within(card).getByText(/Degrau D: Tensão \/ Gancho/i)).toBeInTheDocument();
    });
  });

  it("respeita o teto máximo inegociável de 4 tópicos ao adicionar", async () => {
    vi.mocked(homileticClient.getSermon).mockResolvedValue(baseSermonWithBloco1);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-topicos-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("bloco-2-container")).toHaveAttribute("data-locked", "false");
    });

    const addBtn = screen.getByRole("button", { name: /\+ adicionar tópico/i });
    expect(addBtn).not.toBeDisabled();

    // Adiciona o 4º tópico
    fireEvent.click(addBtn);

    const topicCards = screen.getAllByTestId(/topic-card-/i);
    expect(topicCards).toHaveLength(4);

    // O botão deve estar desabilitado no teto de 4 tópicos
    expect(addBtn).toBeDisabled();
  });

  it("respeita o piso mínimo inegociável de 1 tópico ao remover", async () => {
    vi.mocked(homileticClient.getSermon).mockResolvedValue(baseSermonWithBloco1);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-topicos-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("bloco-2-container")).toHaveAttribute("data-locked", "false");
    });

    // Remove tópico 3
    let deleteBtns = screen.getAllByRole("button", { name: /remover tópico/i });
    fireEvent.click(deleteBtns[deleteBtns.length - 1]);
    expect(screen.getAllByTestId(/topic-card-/i)).toHaveLength(2);

    // Remove tópico 2
    deleteBtns = screen.getAllByRole("button", { name: /remover tópico/i });
    fireEvent.click(deleteBtns[deleteBtns.length - 1]);
    expect(screen.getAllByTestId(/topic-card-/i)).toHaveLength(1);

    // Com 1 tópico restante, o botão de remoção deve estar desabilitado
    deleteBtns = screen.getAllByRole("button", { name: /remover tópico/i });
    expect(deleteBtns[0]).toBeDisabled();
  });

  it("salva tópicos no D1 e desbloqueia o Bloco 3 (Aplicação) e a Introdução", async () => {
    vi.mocked(homileticClient.getSermon).mockResolvedValue(baseSermonWithBloco1);
    vi.mocked(homileticClient.saveSermon).mockImplementation(async (partial) => ({
      ...baseSermonWithBloco1,
      ...partial,
    }));

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-topicos-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("bloco-2-container")).toHaveAttribute("data-locked", "false");
    });

    // Inicialmente Bloco 3 e Introdução estão bloqueados (aguardando tópicos serem salvos)
    expect(screen.getByTestId("bloco-3-container")).toHaveAttribute("data-locked", "true");
    expect(screen.getByTestId("introducao-container")).toHaveAttribute("data-locked", "true");

    // Edita o Fato do primeiro tópico
    const fatoInput = screen.getAllByPlaceholderText(/O que o texto afirma expressamente/i)[0];
    fireEvent.change(fatoInput, {
      target: { value: "Deus age em todas as circunstâncias em favor dos que o amam." },
    });

    // Salva Bloco 2
    const salvarTopicosBtn = screen.getByRole("button", { name: /salvar tópicos|concluir bloco 2/i });
    fireEvent.click(salvarTopicosBtn);

    await waitFor(() => {
      expect(homileticClient.saveSermon).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "sermon-topicos-1",
          bloco2Topicos: expect.arrayContaining([
            expect.objectContaining({
              steps: expect.objectContaining({
                stepA_fato: "Deus age em todas as circunstâncias em favor dos que o amam.",
              }),
            }),
          ]),
        })
      );

      // Bloco 3 e Introdução agora estão desbloqueados
      expect(screen.getByTestId("bloco-3-container")).toHaveAttribute("data-locked", "false");
      expect(screen.getByTestId("introducao-container")).toHaveAttribute("data-locked", "false");
    });
  });

  it("carrega sermão com tópicos já salvos com Bloco 3 e Introdução previamente desbloqueados", async () => {
    const existingTopics: HomileticTopic[] = [
      {
        id: "t-1",
        title: "A Soberania Providencial",
        steps: {
          stepA_fato: "Deus reina sobre os detalhes.",
          stepB_porque: "Sua natureza é onipotente e compassiva.",
          stepC_contraste: "Sem essa verdade, o acaso gera desespero.",
          stepD_tensao: "Como você reage quando os planos dão errado?",
        },
      },
    ];

    const existingSermonWithTopics: Sermon = {
      ...baseSermonWithBloco1,
      bloco2Topicos: existingTopics,
      bloco3Aplicacao: "Praticar o descanso na oração diária.",
      introducao: "Uma história sobre a tempestade no mar.",
    };

    vi.mocked(homileticClient.getSermon).mockResolvedValue(existingSermonWithTopics);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-topicos-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("bloco-2-container")).toHaveAttribute("data-locked", "false");
      expect(screen.getByTestId("bloco-3-container")).toHaveAttribute("data-locked", "false");
      expect(screen.getByTestId("introducao-container")).toHaveAttribute("data-locked", "false");
      expect(screen.getByDisplayValue("A Soberania Providencial")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Deus reina sobre os detalhes.")).toBeInTheDocument();
    });
  });
});
