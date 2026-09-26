import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SermonPulpitPage from "@/pages/SermonPulpitPage";
import SermonStudioPage from "@/pages/SermonStudioPage";
import * as homileticClient from "@/lib/homileticClient";
import * as noteStoreModule from "@/lib/noteStore";
import type { Sermon, PreachingLog } from "@/lib/homileticClient";

vi.mock("@/lib/homileticClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/homileticClient")>(
    "@/lib/homileticClient"
  );
  return {
    ...actual,
    getSermon: vi.fn(),
    savePreachingLog: vi.fn(),
    listPreachingLogs: vi.fn(),
  };
});

vi.mock("@/lib/bibleApi", () => ({
  fetchChapter: vi.fn(),
}));

vi.mock("@/lib/noteStore", async () => {
  const actual = await vi.importActual<typeof import("@/lib/noteStore")>(
    "@/lib/noteStore"
  );
  return {
    ...actual,
    createNoteStore: vi.fn(),
  };
});

describe("Ticket 7: Registro Pós-Pregação no D1 e Prevenção de Repetição", () => {
  const mockSermon: Sermon = {
    id: "sermon-preaching-1",
    userId: "user-123",
    title: "O Cordeiro e o Trono",
    bookId: "ap",
    bookName: "Apocalipse",
    chapter: 5,
    verse: 12,
    version: "acf",
    sparkText: "Digno é o Cordeiro que foi morto.",
    status: "completed",
    desfechoTipo: "conversao",
    desfechoTexto: "Render todas as coroas aos pés de Jesus.",
    bloco1Exegese: "João chora porque ninguém podia abrir o livro, até que o Cordeiro surge.",
    bloco1IntencaoOriginal: "Consolar a igreja perseguida na Ásia Menor.",
    bloco2Topicos: [
      {
        id: "top-1",
        title: "A Vitória pelo Sacrifício",
        steps: {
          stepA_fato: "O Leão venceu como Cordeiro.",
          stepB_porque: "A soberania divina opera na fraqueza da cruz.",
          stepC_contraste: "O império humano domina pela espada; Cristo vence pelo amor.",
          stepD_tensao: "Você tem buscado poder na força humana ou na cruz?",
        },
      },
    ],
    bloco3Aplicacao: "Viver em santidade e testemunho corajoso.",
    introducao: "Quando todas as portas parecem fechadas...",
    createdAt: "2026-09-10T10:00:00Z",
    updatedAt: "2026-09-10T12:00:00Z",
  };

  const mockPreachingLogs: PreachingLog[] = [
    {
      id: "log-1",
      sermonId: "sermon-preaching-1",
      userId: "user-123",
      churchName: "Igreja Batista Esperança",
      city: "Curitiba, PR",
      preachedAt: "2026-09-15",
      notes: "Grande quebrantamento, várias reconciliações ao final.",
      createdAt: "2026-09-15T21:00:00Z",
    },
  ];

  let mockSaveNote: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveNote = vi.fn().mockResolvedValue(undefined);
    vi.mocked(noteStoreModule.createNoteStore).mockReturnValue({
      save: mockSaveNote,
      getAll: vi.fn().mockResolvedValue([]),
      getByChapter: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
    } as any);

    vi.mocked(homileticClient.getSermon).mockResolvedValue(mockSermon);
    vi.mocked(homileticClient.listPreachingLogs).mockResolvedValue(mockPreachingLogs);
    vi.mocked(homileticClient.savePreachingLog).mockResolvedValue({
      id: "log-new",
      sermonId: "sermon-preaching-1",
      userId: "user-123",
      churchName: "Comunidade Graça Plena",
      city: "Campinas, SP",
      preachedAt: "2026-09-26",
      notes: "Culto de jovens com profunda unção.",
      createdAt: new Date().toISOString(),
    });
  });

  it("abre o modal solene de registro pós-pregação ao clicar em Encerrar Pregação no Modo Púlpito", async () => {
    render(
      <MemoryRouter initialEntries={["/pulpito/sermon-preaching-1"]}>
        <Routes>
          <Route path="/pulpito/:sermonId" element={<SermonPulpitPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("O Cordeiro e o Trono")).toBeInTheDocument();
    });

    // Localiza e clica no botão Encerrar Pregação
    const finishBtn = screen.getByTestId("finish-preaching-btn");
    expect(finishBtn).toBeInTheDocument();
    fireEvent.click(finishBtn);

    // O modal deve ser exibido com todos os campos solenes
    expect(screen.getByTestId("preaching-log-modal")).toBeInTheDocument();
    expect(screen.getByText(/Registro Pós-Pregação/i)).toBeInTheDocument();
    expect(screen.getByTestId("preaching-church-input")).toBeInTheDocument();
    expect(screen.getByTestId("preaching-city-input")).toBeInTheDocument();
    expect(screen.getByTestId("preaching-date-input")).toBeInTheDocument();
    expect(screen.getByTestId("preaching-notes-input")).toBeInTheDocument();
    expect(screen.getByTestId("preaching-mirror-memorial-checkbox")).toBeInTheDocument();
  });

  it("salva o registro pós-pregação no D1 e cria testemunho no Memorial quando solicitado", async () => {
    render(
      <MemoryRouter initialEntries={["/pulpito/sermon-preaching-1"]}>
        <Routes>
          <Route path="/pulpito/:sermonId" element={<SermonPulpitPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("O Cordeiro e o Trono")).toBeInTheDocument();
    });

    // Abre o modal
    fireEvent.click(screen.getByTestId("finish-preaching-btn"));

    // Preenche os campos
    fireEvent.change(screen.getByTestId("preaching-church-input"), {
      target: { value: "Comunidade Graça Plena" },
    });
    fireEvent.change(screen.getByTestId("preaching-city-input"), {
      target: { value: "Campinas, SP" },
    });
    fireEvent.change(screen.getByTestId("preaching-date-input"), {
      target: { value: "2026-09-26" },
    });
    fireEvent.change(screen.getByTestId("preaching-notes-input"), {
      target: { value: "Culto de jovens com profunda unção." },
    });

    // Marca espelhar no Memorial como Testemunho
    const mirrorCheckbox = screen.getByTestId("preaching-mirror-memorial-checkbox");
    fireEvent.click(mirrorCheckbox);

    // Clica em salvar
    fireEvent.click(screen.getByTestId("save-preaching-log-btn"));

    await waitFor(() => {
      expect(homileticClient.savePreachingLog).toHaveBeenCalledWith({
        sermonId: "sermon-preaching-1",
        churchName: "Comunidade Graça Plena",
        city: "Campinas, SP",
        preachedAt: "2026-09-26",
        notes: "Culto de jovens com profunda unção.",
      });
    });

    // Deve ter criado o registro de Testemunho no Memorial
    await waitFor(() => {
      expect(mockSaveNote).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "testimony",
          bookId: "ap",
          bookName: "Apocalipse",
          chapter: 5,
        })
      );
    });
  });

  it("exibe alerta preventivo no Estúdio Homilético quando o sermão já foi pregado anteriormente", async () => {
    render(
      <MemoryRouter initialEntries={["/estudio/sermon-preaching-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("O Cordeiro e o Trono")).toBeInTheDocument();
    });

    // O Estúdio deve consultar o histórico e exibir o card de alerta de ministração anterior
    await waitFor(() => {
      const alert = screen.getByTestId("preaching-repetition-alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent("Igreja Batista Esperança");
      expect(alert).toHaveTextContent("Curitiba, PR");
    });
  });

  it("não exibe o alerta preventivo no Estúdio quando o sermão nunca foi pregado", async () => {
    vi.mocked(homileticClient.listPreachingLogs).mockResolvedValueOnce([]);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-preaching-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("O Cordeiro e o Trono")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("preaching-repetition-alert")).not.toBeInTheDocument();
  });
});
