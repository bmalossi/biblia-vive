import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
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

describe("Persistência de Passagem Bíblica Base e Título da Pregação", () => {
  const baseSermon: Sermon = {
    id: "sermon-passage-title-1",
    userId: "test-user-123",
    title: "O Bom Pastor",
    bookId: undefined,
    bookName: undefined,
    chapter: undefined,
    verse: undefined,
    version: "acf",
    sparkText: "O Senhor é o meu pastor e nada me faltará.",
    status: "draft",
    desfechoTipo: "consolacao",
    desfechoTexto: "Confortar a congregação.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

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
      isAdmin: false,
      loading: false,
      checkout: vi.fn(),
      manageSubscription: vi.fn(),
    });
  });

  it("permite definir e salvar a passagem bíblica base no cabeçalho persistindo via saveSermon", async () => {
    vi.mocked(homileticClient.getSermon).mockResolvedValue(baseSermon);
    vi.mocked(homileticClient.saveSermon).mockImplementation(async (patch) => ({
      ...baseSermon,
      ...patch,
    }));

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-passage-title-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Aguarda carregar
    await waitFor(() => {
      expect(screen.getByTestId("base-scripture-field")).toBeInTheDocument();
    });

    // Clica no botão para abrir os inputs de passagem
    const editPassageBtn = screen.getByTestId("edit-passage-btn");
    fireEvent.click(editPassageBtn);

    // Preenche livro, capítulo e versículo
    const bookInput = screen.getByTestId("passage-book-input");
    const chapterInput = screen.getByTestId("passage-chapter-input");
    const verseInput = screen.getByTestId("passage-verse-input");
    const savePassageBtn = screen.getByTestId("save-passage-btn");

    fireEvent.change(bookInput, { target: { value: "Salmos" } });
    fireEvent.change(chapterInput, { target: { value: "23" } });
    fireEvent.change(verseInput, { target: { value: "1" } });

    // Salva a passagem
    fireEvent.click(savePassageBtn);

    await waitFor(() => {
      expect(homileticClient.saveSermon).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "sermon-passage-title-1",
          bookName: "Salmos",
          chapter: 23,
          verse: 1,
        })
      );
    });
  });

  it("permite editar e salvar o título da pregação diretamente no cabeçalho do estúdio", async () => {
    vi.mocked(homileticClient.getSermon).mockResolvedValue(baseSermon);
    vi.mocked(homileticClient.saveSermon).mockImplementation(async (patch) => ({
      ...baseSermon,
      ...patch,
    }));

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-passage-title-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("sermon-title-editor")).toBeInTheDocument();
      expect(screen.getByText("O Bom Pastor")).toBeInTheDocument();
    });

    // Clica para editar título
    const editTitleBtn = screen.getByTestId("edit-title-btn");
    fireEvent.click(editTitleBtn);

    const titleInput = screen.getByTestId("sermon-title-input");
    fireEvent.change(titleInput, { target: { value: "O Cuidado do Bom Pastor no Vale" } });

    const saveTitleBtn = screen.getByTestId("save-title-btn");
    fireEvent.click(saveTitleBtn);

    await waitFor(() => {
      expect(homileticClient.saveSermon).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "sermon-passage-title-1",
          title: "O Cuidado do Bom Pastor no Vale",
        })
      );
    });
  });

  it("permite criar um novo sermão com título e passagem personalizados pelo modal do painel", async () => {
    vi.mocked(homileticClient.listSermons).mockResolvedValue([]);
    vi.mocked(homileticClient.saveSermon).mockImplementation(async (payload) => ({
      ...baseSermon,
      ...payload,
    }));

    render(
      <MemoryRouter initialEntries={["/estudio"]}>
        <Routes>
          <Route path="/estudio" element={<SermonDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("create-sermon-btn")).toBeInTheDocument();
    });

    // Abre modal de criação
    fireEvent.click(screen.getByTestId("create-sermon-btn"));

    expect(screen.getByTestId("create-sermon-modal")).toBeInTheDocument();

    // Preenche Título e Passagem
    const inputTitle = screen.getByTestId("new-sermon-title-input");
    const inputPassage = screen.getByTestId("new-sermon-passage-input");
    const submitBtn = screen.getByTestId("confirm-create-sermon-btn");

    fireEvent.change(inputTitle, { target: { value: "A Parábola do Filho Pródigo" } });
    fireEvent.change(inputPassage, { target: { value: "Lucas 15:11" } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(homileticClient.saveSermon).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "A Parábola do Filho Pródigo",
          bookName: "Lucas",
          chapter: 15,
          verse: 11,
        })
      );
    });
  });

  it("permite salvar passagem com intervalo de versículos (ex: Lucas 10:15-18) e abrir o popup de inspiração completa", async () => {
    const rangeSermon: Sermon = {
      ...baseSermon,
      id: "sermon-lucas-range",
      bookName: "Lucas",
      chapter: 10,
      verse: "15-18",
    };

    vi.mocked(homileticClient.getSermon).mockResolvedValue(rangeSermon);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-lucas-range"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Aguarda carregar Card 1 EU E DEUS
    await waitFor(() => {
      expect(screen.getByTestId("eu-e-deus-section")).toBeInTheDocument();
    });

    // Botão de Inspiração Completa deve estar presente
    const fullInspirationBtn = screen.getByTestId("open-full-inspiration-btn");
    expect(fullInspirationBtn).toBeInTheDocument();

    // Clica para abrir o popup de Inspiração Completa
    fireEvent.click(fullInspirationBtn);

    // O modal deve estar aberto
    await waitFor(() => {
      expect(screen.getByTestId("full-passage-modal")).toBeInTheDocument();
    });

    // Fecha o modal
    const closeBtn = screen.getByTestId("close-full-passage-modal-btn");
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByTestId("full-passage-modal")).not.toBeInTheDocument();
    });
  });
});
