import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SermonStudioGuidePage from "@/pages/SermonStudioGuidePage";
import SermonStudioPage from "@/pages/SermonStudioPage";
import SermonDashboardPage from "@/pages/SermonDashboardPage";
import * as homileticClient from "@/lib/homileticClient";
import * as useSubscriptionHook from "@/hooks/useSubscription";
import * as useAuthHook from "@/hooks/useAuth";
import type { Sermon } from "@/lib/homileticClient";

vi.mock("@/lib/homileticClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/homileticClient")>(
    "@/lib/homileticClient"
  );
  return {
    ...actual,
    getSermon: vi.fn(),
    saveSermon: vi.fn(),
    listSermons: vi.fn(),
  };
});

vi.mock("@/hooks/useSubscription", () => ({
  useSubscription: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe("Guia Prático de Construção: Passo a Passo no Estúdio (SermonStudioGuidePage)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: { id: "user-templo-1", email: "pastor@exemplo.com" } as any,
      signOut: vi.fn(),
      isPending: false,
    });
    vi.mocked(useSubscriptionHook.useSubscription).mockReturnValue({
      subscription: { plan_type: "templo", status: "active" } as any,
      isPro: true,
      isTemplo: true,
      loading: false,
      checkout: vi.fn(),
      openCustomerPortal: vi.fn(),
    });
  });

  it("renderiza o cabeçalho e metadados com Lucas 24:13-35 e o tema da mensagem", () => {
    render(
      <MemoryRouter initialEntries={["/estudio/aprenda-a-usar"]}>
        <SermonStudioGuidePage />
      </MemoryRouter>
    );

    expect(
      screen.getAllByText(/Guia Prático de Construção:/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/Passo a Passo no Estúdio/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/Lucas 24:13-35/i).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(
        /Quando a Frustração Cega os Olhos, mas a Palavra Aquece/i
      ).length
    ).toBeGreaterThanOrEqual(1);
  });

  it("renderiza todos os 6 campos estruturados do estúdio homilético", () => {
    render(
      <MemoryRouter initialEntries={["/estudio/aprenda-a-usar"]}>
        <SermonStudioGuidePage />
      </MemoryRouter>
    );

    // 1. Chama Inicial
    expect(screen.getByText(/Chama Inicial/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Estava orando sobre o desânimo de alguns irmãos da igreja/i)
    ).toBeInTheDocument();

    // 2. Método da Marcha-Ré
    expect(
      screen.getByText(/Método da Marcha-Ré \(Desfecho \/ Conclusão Pretendida\)/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Confronto & Consolação/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Levar a igreja a renunciar às suas próprias expectativas humanas/i)
    ).toBeInTheDocument();

    // 3. Bloco 1 Exegese & Trava Anti-Esegese
    expect(
      screen.getByText(/Bloco 1 — Explicar o Texto \(Exegese & Ancoradouro Histórico\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Trava Anti-Esegese \(Pergunta Reflexiva Obrigatória\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Emaús ficava a cerca de 11 km de Jerusalém/i)
    ).toBeInTheDocument();

    // 4. Bloco 2 Tópicos com 4 Degraus
    expect(
      screen.getByText(/Bloco 2 — Pregar a Inspiração \(Tópicos com os 4 Degraus\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/A Frustração Humana Cega a Visão do Sagrado/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/A Palavra Exposta é o Remédio que Queima por Dentro/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/A Revelação de Cristo Transforma a Fuga em Missão/i)
    ).toBeInTheDocument();

    // Marcadores retóricos
    expect(screen.getByText(/\[ 🤫 Pausa de 3 segundos \]/i)).toBeInTheDocument();
    expect(
      screen.getByText(/\[ 💡 Ilustração: A diferença entre o fogo de palha/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/\[ ⚡ Elevar o Tom de Voz \]/i)).toBeInTheDocument();

    // 5. Bloco 3 Conexão Prática
    expect(
      screen.getByText(/Bloco 3 — Aplicar à Vida Real \(Conexão Prática\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Amanhã, segunda-feira às 7h da manhã/i)
    ).toBeInTheDocument();

    // 6. Passo Final Introdução
    expect(
      screen.getByText(/Passo Final da Marcha-Ré — Introdução \(Gancho de Entrada\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Você já esteve em um lugar onde fez tudo certo, mas no final tudo pareceu dar errado\?/i)
    ).toBeInTheDocument();
  });

  it("permite alternar entre visualização formatada e visualização em texto (ASCII) do pergaminho do púlpito", () => {
    render(
      <MemoryRouter initialEntries={["/estudio/aprenda-a-usar"]}>
        <SermonStudioGuidePage />
      </MemoryRouter>
    );

    // Inicia no modo formatado
    expect(screen.getByText(/Simulação do Pergaminho/i)).toBeInTheDocument();
    expect(screen.getByText(/TELA ATIVA/i)).toBeInTheDocument();

    // Alternar para modo texto (ASCII)
    const rawBtn = screen.getByRole("button", { name: /Visão em Texto \(ASCII\)/i });
    fireEvent.click(rawBtn);

    expect(screen.getByText(/DESFECHO & APELO FINAL/i)).toBeInTheDocument();
  });

  it("renderiza as 4 dicas de ouro para memorização e fluidez", () => {
    render(
      <MemoryRouter initialEntries={["/estudio/aprenda-a-usar"]}>
        <SermonStudioGuidePage />
      </MemoryRouter>
    );

    // Técnica 1: Tríptico de Palavras-Âncoras
    expect(
      screen.getByText(/A Regra do “Tríptico de Palavras-Âncoras”/i)
    ).toBeInTheDocument();
    expect(screen.getByText("CEGUEIRA")).toBeInTheDocument();
    expect(screen.getByText("ESCRITURA")).toBeInTheDocument();
    expect(screen.getByText("RETORNO")).toBeInTheDocument();

    // Técnica 2: Efeito Dominó do Degrau D
    expect(
      screen.getByText(/O “Efeito Dominó” do Degrau D/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/O que Jesus faz quando nos encontra cegos\?/i)
    ).toBeInTheDocument();

    // Técnica 3: Âncora Ocular
    expect(
      screen.getByText(/A Técnica da “Âncora Ocular”/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Nunca leia o texto enquanto fala!/i)
    ).toBeInTheDocument();

    // Técnica 4: Marcadores de Dinâmica
    expect(
      screen.getByText(/Respeite os Marcadores de Dinâmica/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/O silêncio no púlpito gera um impacto emocional e espiritual/i)
    ).toBeInTheDocument();
  });

  it("verifica que a barra lateral direita do SermonStudioPage contém o link 'Aprenda a Usar' apontando para /estudio/aprenda-a-usar", async () => {
    const mockSermon: Sermon = {
      id: "sermon-guide-link-1",
      userId: "user-templo-1",
      title: "Mensagem de Exemplo",
      bookName: "Lucas",
      chapter: 24,
      verse: "13-35",
      version: "acf",
      sparkText: "Semente no memorial",
      status: "draft",
      desfechoTipo: "consolacao",
      desfechoTexto: "Conclusão pretendida.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.mocked(homileticClient.getSermon).mockResolvedValue(mockSermon);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-guide-link-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    const link = await screen.findByTestId("link-aprenda-a-usar");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/estudio/aprenda-a-usar");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveTextContent("Aprenda a Usar");
  });

  it("verifica que o cabeçalho do SermonDashboardPage contém o botão 'Aprenda a Usar'", async () => {
    vi.mocked(homileticClient.listSermons).mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/estudio"]}>
        <Routes>
          <Route path="/estudio" element={<SermonDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    const dashboardLink = await screen.findByTestId("dashboard-aprenda-a-usar");
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute("href", "/estudio/aprenda-a-usar");
    expect(dashboardLink).toHaveTextContent("Aprenda a Usar");
  });
});
