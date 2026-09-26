import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SermonStudioPage from "@/pages/SermonStudioPage";
import * as homileticClient from "@/lib/homileticClient";
import * as jevHomileticService from "@/lib/jevHomileticService";
import type { Sermon } from "@/lib/homileticClient";
import type { HomileticAuditResult } from "@/lib/jevHomileticService";

vi.mock("@/lib/homileticClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/homileticClient")>(
    "@/lib/homileticClient"
  );
  return {
    ...actual,
    getSermon: vi.fn(),
    listPreachingLogs: vi.fn().mockResolvedValue([]),
    saveSermon: vi.fn(),
  };
});

vi.mock("@/lib/jevHomileticService", async () => {
  const actual = await vi.importActual<typeof import("@/lib/jevHomileticService")>(
    "@/lib/jevHomileticService"
  );
  return {
    ...actual,
    auditSermonOrthodoxy: vi.fn(),
  };
});

describe("Ticket 8: Guardião do Evangelho (Gálatas 1:8) e Teste de Ortodoxia via JEV", () => {
  const mockSermon: Sermon = {
    id: "sermon-jev-1",
    userId: "pastor-777",
    title: "O Custo do Discipulado",
    bookId: "lc",
    bookName: "Lucas",
    chapter: 14,
    verse: 27,
    version: "acf",
    sparkText: "Quem não leva a sua cruz e não me segue não pode ser meu discípulo.",
    status: "completed",
    desfechoTipo: "confronto",
    desfechoTexto: "Renunciar a tudo e tomar a cruz a cada dia.",
    bloco1Exegese: "Jesus discursa para grandes multidões e peneira a motivação superficial.",
    bloco1IntencaoOriginal: "Desafiar os ouvintes a calcularem o custo real do reino de Deus.",
    bloco2Topicos: [
      {
        id: "top-1",
        title: "Calculando a Torre",
        steps: {
          stepA_fato: "Nenhum construtor começa sem calcular.",
          stepB_porque: "A graça é gratuita, mas custa toda a nossa vida.",
          stepC_contraste: "A religião fácil promete bênçãos sem compromisso.",
          stepD_tensao: "Você quer apenas os pães ou o próprio Cristo?",
        },
      },
    ],
    bloco3Aplicacao: "Examine suas prioridades nesta semana à luz da cruz.",
    introducao: "Todos querem seguir um mestre vitorioso, mas poucos querem a cruz.",
    createdAt: "2026-09-20T10:00:00Z",
    updatedAt: "2026-09-20T12:00:00Z",
  };

  const orthodoxResult: HomileticAuditResult = {
    is_grace_centered: true,
    theological_deviation: "Fiel_Ao_Texto",
    confidence: 0.94,
    reasoning: "O esboço expõe fielmente Lucas 14 mantendo a soberania de Cristo e o chamado da cruz.",
    historical_alignment: "Em consonância com os comentários de Matthew Henry e Albert Barnes sobre o discipulado bíblico.",
    evaluatedAt: new Date().toISOString(),
  };

  const deviationResult: HomileticAuditResult = {
    is_grace_centered: false,
    theological_deviation: "Teologia_Prosperidade",
    confidence: 0.91,
    reasoning: "O sermão promete que o discipulado trará enriquecimento financeiro e sucesso imediato nos negócios terrenos.",
    historical_alignment: "Diverge frontalmente do ensino dos Pais da Igreja e Reformadores sobre o sofrimento no discipulado.",
    evaluatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(homileticClient.getSermon).mockResolvedValue(mockSermon);
    vi.mocked(homileticClient.listPreachingLogs).mockResolvedValue([]);
  });

  describe("Construção do Payload Estrito (ADR-0016)", () => {
    it("constrói o payload contendo estritamente os campos do sermão sem as 30 notas do Memorial", () => {
      const payload = jevHomileticService.buildHomileticPayload(mockSermon, "E qualquer que não levar a sua cruz...");

      expect(payload).toHaveProperty("sermonId", "sermon-jev-1");
      expect(payload).toHaveProperty("biblical_passage_text");
      expect(payload).toHaveProperty("sermon_initial_spark");
      expect(payload).toHaveProperty("sermon_intended_outcome");
      expect(payload).toHaveProperty("sermon_block_1_exegesis");
      expect(payload).toHaveProperty("sermon_block_2_topics");
      expect(payload).toHaveProperty("sermon_block_3_application");

      // Inegociável: Não pode conter propriedade 'notes' ou 'memorialEntries'
      expect((payload as any).notes).toBeUndefined();
      expect((payload as any).memorialNotes).toBeUndefined();
      expect((payload as any).allNotes).toBeUndefined();
    });
  });

  describe("Interface do Estúdio: Botão [ 🏛️ Testar Ortodoxia ]", () => {
    it("renderiza o botão [ 🏛️ Testar Ortodoxia ] no Estúdio Homilético", async () => {
      render(
        <MemoryRouter initialEntries={["/estudio/sermon-jev-1"]}>
          <Routes>
            <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("O Custo do Discipulado")).toBeInTheDocument();
      });

      expect(screen.getByTestId("test-orthodoxy-btn")).toBeInTheDocument();
    });

    it("ao clicar em Testar Ortodoxia com sermão ortodoxo, exibe confirmação de fidelidade à Graça", async () => {
      vi.mocked(jevHomileticService.auditSermonOrthodoxy).mockResolvedValue(orthodoxResult);

      render(
        <MemoryRouter initialEntries={["/estudio/sermon-jev-1"]}>
          <Routes>
            <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("O Custo do Discipulado")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("test-orthodoxy-btn"));

      await waitFor(() => {
        expect(jevHomileticService.auditSermonOrthodoxy).toHaveBeenCalled();
        expect(screen.getByTestId("orthodoxy-faithful-badge")).toBeInTheDocument();
        expect(screen.getByText(/Fiel ao Texto & Centrado na Graça/i)).toBeInTheDocument();
      });
    });

    it("ao clicar em Testar Ortodoxia com desvio >= 0.85, renderiza o Card de Alerta Solene (Gálatas 1:8)", async () => {
      vi.mocked(jevHomileticService.auditSermonOrthodoxy).mockResolvedValue(deviationResult);

      render(
        <MemoryRouter initialEntries={["/estudio/sermon-jev-1"]}>
          <Routes>
            <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("O Custo do Discipulado")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("test-orthodoxy-btn"));

      await waitFor(() => {
        const galatasAlert = screen.getByTestId("galatas-alert-card");
        expect(galatasAlert).toBeInTheDocument();
        expect(galatasAlert).toHaveTextContent(/Guardião do Evangelho/i);
        expect(galatasAlert).toHaveTextContent(/Gálatas 1:8/i);
        expect(galatasAlert).toHaveTextContent(/Teologia da Prosperidade/i);
      });
    });
  });

  describe("Checagem Automática ao Clicar em [ 📖 Pregar Agora ]", () => {
    it("se detectado desvio >= 0.85 ao clicar em Pregar Agora, exibe o alerta pastoral reflexivo e não bloqueia autoritariamente", async () => {
      vi.mocked(jevHomileticService.auditSermonOrthodoxy).mockResolvedValue(deviationResult);

      render(
        <MemoryRouter initialEntries={["/estudio/sermon-jev-1"]}>
          <Routes>
            <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
            <Route path="/pulpito/:sermonId" element={<div data-testid="pulpit-page-mock">Modo Púlpito</div>} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("O Custo do Discipulado")).toBeInTheDocument();
      });

      // Clica em Pregar Agora
      fireEvent.click(screen.getByRole("button", { name: /Pregar Agora/i }));

      // Como o desvio tem confiança 91% (>= 85%), o Alerta Gálatas 1:8 deve aparecer
      await waitFor(() => {
        expect(screen.getByTestId("galatas-alert-card")).toBeInTheDocument();
      });

      // Pregações não são bloqueadas de forma autoritária: o pregador pode escolher prosseguir consciente
      const proceedBtn = screen.getByTestId("proceed-to-pulpit-anyway");
      expect(proceedBtn).toBeInTheDocument();
      fireEvent.click(proceedBtn);

      // Deve navegar para o púlpito após decisão consciente
      await waitFor(() => {
        expect(screen.getByTestId("pulpit-page-mock")).toBeInTheDocument();
      });
    });
  });
});
