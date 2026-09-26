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

describe("Ajustes de Refinamento do Estúdio Homilético (7 Itens)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseSermon: Sermon = {
    id: "sermon-refine-1",
    userId: "test-user-123",
    title: "A Graça que Transforma",
    bookId: "ROM",
    bookName: "Romanos",
    chapter: 8,
    verse: 28,
    version: "acf",
    sparkText: "Deus coopera em todas as coisas para o bem.",
    status: "draft",
    desfechoTipo: "consolacao",
    desfechoTexto: "Confortar a igreja na certeza do cuidado divino.",
    bloco1Exegese: "Contexto de sofrimento presente sob a glória futura.",
    bloco1IntencaoOriginal: "Paulo escreveu para consolar os cristãos perseguidos em Roma.",
    bloco2Topicos: [
      {
        id: "top-1",
        title: "A Promessa Soberana",
        steps: {
          stepA_fato: "Deus governa a história.",
          stepB_porque: "Sua fidelidade é inabalável.",
          stepC_contraste: "O mundo confia em forças humanas passageiras.",
          stepD_tensao: "Em quem você ancora sua confiança quando a dor chega?",
        },
      },
    ],
    bloco3Aplicacao: "Como viver na segunda-feira sem desespero diante das notícias.",
    introducao: "Imagine acordar em Roma sob a ameaça de perder tudo.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("1. Reordenar a Introdução no Modo Visão Consolidada: renderiza a Introdução no topo da mensagem", async () => {
    vi.mocked(homileticClient.getSermon).mockResolvedValue(baseSermon);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-refine-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("A Graça que Transforma")).toBeInTheDocument();
    });

    // Clica no modo Visão Consolidada
    const consolidatedBtn = screen.getByTestId("view-mode-consolidada");
    fireEvent.click(consolidatedBtn);

    const consolidatedView = screen.getByTestId("consolidated-sermon-view");
    expect(consolidatedView).toBeInTheDocument();

    // Verifica que a Introdução está presente no cabeçalho do esboço consolidado
    expect(within(consolidatedView).getByText(/1\. Introdução \(Gancho de Entrada\)/i)).toBeInTheDocument();
    expect(within(consolidatedView).getByText(/Imagine acordar em Roma sob a ameaça/i)).toBeInTheDocument();
  });

  it("2. Adicionar o campo dedicado '📖 Passagem Bíblica Base' no cabeçalho", async () => {
    vi.mocked(homileticClient.getSermon).mockResolvedValue(baseSermon);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-refine-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const scriptureField = screen.getByTestId("base-scripture-field");
      expect(scriptureField).toBeInTheDocument();
      expect(within(scriptureField).getByText(/Romanos 8:28/i)).toBeInTheDocument();
    });
  });

  it("3. Unificar o Ancoradouro Histórico no fecho do Bloco 1 com liberação do Bloco 2", async () => {
    vi.mocked(homileticClient.getSermon).mockResolvedValue(baseSermon);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-refine-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("ancoradouro-historico-box")).toBeInTheDocument();
      expect(screen.getByText(/⚓ Ancorado · Bloco 2 Liberado/i)).toBeInTheDocument();
    });
  });

  it("4. Incluir as pílulas de Marcadores de Tom de Voz ([ 💡 Ilustração ], [ 🤫 Pausa ], [ ⚡ Tom ])", async () => {
    vi.mocked(homileticClient.getSermon).mockResolvedValue(baseSermon);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-refine-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByTitle(/Inserir marcador de Ilustração/i).length).toBeGreaterThan(0);
      expect(screen.getAllByTitle(/Inserir pausa silenciosa/i).length).toBeGreaterThan(0);
      expect(screen.getAllByTitle(/Inserir inflexão de tom ou apelo/i).length).toBeGreaterThan(0);
    });
  });

  it("5. Adicionar o Badge de Status do JEV ao lado do botão [ 🏛️ Testar Ortodoxia ]", async () => {
    vi.mocked(homileticClient.getSermon).mockResolvedValue(baseSermon);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-refine-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("jev-status-badge")).toBeInTheDocument();
      expect(screen.getByTestId("test-orthodoxy-btn")).toBeInTheDocument();
    });
  });

  it("6. Substituir botões de salvar repetidos por Auto-save com indicador no cabeçalho", async () => {
    vi.mocked(homileticClient.getSermon).mockResolvedValue(baseSermon);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-refine-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("autosave-indicator")).toBeInTheDocument();
      expect(screen.getByText("Salvo")).toBeInTheDocument();
    });
  });

  it("7. Implementar Abas (Tabs) para os 4 Degraus na visualização Mobile", async () => {
    vi.mocked(homileticClient.getSermon).mockResolvedValue(baseSermon);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-refine-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "A. Fato" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "B. Porquê" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "C. Contraste" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "D. Tensão" })).toBeInTheDocument();
    });
  });
});
