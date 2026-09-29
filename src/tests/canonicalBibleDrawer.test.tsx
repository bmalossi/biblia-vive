import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SermonStudioPage from "@/pages/SermonStudioPage";
import * as homileticClient from "@/lib/homileticClient";
import * as bibleApi from "@/lib/bibleApi";
import type { Sermon } from "@/lib/homileticClient";
import type { Chapter } from "@/lib/bibleApi";

vi.mock("@/lib/homileticClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/homileticClient")>(
    "@/lib/homileticClient"
  );
  return {
    ...actual,
    getSermon: vi.fn(),
    saveSermon: vi.fn(),
    listPreachingLogs: vi.fn().mockResolvedValue([]),
  };
});

vi.mock("@/lib/bibleApi", async () => {
  const actual = await vi.importActual<typeof import("@/lib/bibleApi")>(
    "@/lib/bibleApi"
  );
  return {
    ...actual,
    fetchChapter: vi.fn(),
  };
});

describe("Bíblia Canônica no Menu de Ferramentas do Estúdio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPsalmsChapter: Chapter = {
    id: "sl.23",
    bookId: "sl",
    number: "23",
    reference: "Salmos 23",
    source: "local",
    verses: [
      {
        id: "sl.23.1",
        orgId: "local",
        bookId: "sl",
        chapterId: "sl.23",
        content: "O SENHOR é o meu pastor, nada me faltará.",
        reference: "Salmos 23:1",
        number: 1,
        text: "O SENHOR é o meu pastor, nada me faltará.",
      },
      {
        id: "sl.23.2",
        orgId: "local",
        bookId: "sl",
        chapterId: "sl.23",
        content: "Deitar-me faz em verdes pastos, guia-me mansamente a águas tranqüilas.",
        reference: "Salmos 23:2",
        number: 2,
        text: "Deitar-me faz em verdes pastos, guia-me mansamente a águas tranqüilas.",
      },
    ],
  };

  const mockLukeChapter: Chapter = {
    id: "lc.1",
    bookId: "lc",
    number: "1",
    reference: "Lucas 1",
    source: "local",
    verses: [
      {
        id: "lc.1.1",
        orgId: "local",
        bookId: "lc",
        chapterId: "lc.1",
        content: "Tendo, pois, muitos empreendido pôr em ordem a narração dos fatos...",
        reference: "Lucas 1:1",
        number: 1,
        text: "Tendo, pois, muitos empreendido pôr em ordem a narração dos fatos...",
      },
    ],
  };

  const mockGenesisChapter: Chapter = {
    id: "gn.1",
    bookId: "gn",
    number: "1",
    reference: "Gênesis 1",
    source: "local",
    verses: [
      {
        id: "gn.1.1",
        orgId: "local",
        bookId: "gn",
        chapterId: "gn.1",
        content: "No princípio criou Deus os céus e a terra.",
        reference: "Gênesis 1:1",
        number: 1,
        text: "No princípio criou Deus os céus e a terra.",
      },
    ],
  };

  it("1. Abre a Bíblia Canônica pela barra de ferramentas e carrega a passagem base do sermão (Salmos 23)", async () => {
    const sermonWithPsalms: Sermon = {
      id: "sermon-sl23",
      userId: "user-1",
      title: "O Bom Pastor",
      bookId: "sl",
      bookName: "Salmos",
      chapter: 23,
      verse: 1,
      version: "acf",
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.mocked(homileticClient.getSermon).mockResolvedValue(sermonWithPsalms);
    vi.mocked(bibleApi.fetchChapter).mockResolvedValue(mockPsalmsChapter);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-sl23"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Aguarda carregar o sermão
    await waitFor(() => {
      expect(screen.getByText("O Bom Pastor")).toBeInTheDocument();
    });

    // Clica no botão 'Bíblia Canônica' na barra de ferramentas da direita
    const canonicalBtn = screen.getByTestId("tools-canonical-bible-btn");
    expect(canonicalBtn).toBeInTheDocument();
    fireEvent.click(canonicalBtn);

    // Verifica que o drawer foi aberto
    await waitFor(() => {
      expect(screen.getByTestId("biblical-text-floating-card")).toBeInTheDocument();
    });

    // Verifica se fetchChapter foi chamado com o livro correto ("sl" / Salmos) e capítulo 23, e NUNCA "rom"
    expect(bibleApi.fetchChapter).toHaveBeenCalledWith("acf", "sl", "23");

    // Verifica que o texto do versículo é renderizado dentro do drawer
    const drawer = screen.getByTestId("biblical-text-floating-card");
    expect(
      within(drawer).getByText(/O SENHOR é o meu pastor, nada me faltará/i)
    ).toBeInTheDocument();
  });

  it("2. Abre graciosa e confiavelmente em Lucas 1 se o sermão ainda não tiver passagem base definida", async () => {
    const emptySermon: Sermon = {
      id: "sermon-empty",
      userId: "user-1",
      title: "Sermão Novo Sem Passagem",
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.mocked(homileticClient.getSermon).mockResolvedValue(emptySermon);
    vi.mocked(bibleApi.fetchChapter).mockResolvedValue(mockLukeChapter);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-empty"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Sermão Novo Sem Passagem")).toBeInTheDocument();
    });

    // Clica em 'Bíblia Canônica'
    const canonicalBtn = screen.getByTestId("tools-canonical-bible-btn");
    fireEvent.click(canonicalBtn);

    // Verifica que abre com Lucas 1 sem tela de erro
    await waitFor(() => {
      expect(screen.getByTestId("biblical-text-floating-card")).toBeInTheDocument();
    });

    expect(bibleApi.fetchChapter).toHaveBeenCalledWith("acf", "lc", "1");
    expect(
      screen.getByText(/Tendo, pois, muitos empreendido pôr em ordem a narração dos fatos/i)
    ).toBeInTheDocument();
  });

  it("3. Permite ao pregador navegar entre livros e capítulos dentro da Bíblia Canônica", async () => {
    const sermon: Sermon = {
      id: "sermon-nav",
      userId: "user-1",
      title: "Navegação Canônica",
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.mocked(homileticClient.getSermon).mockResolvedValue(sermon);
    vi.mocked(bibleApi.fetchChapter)
      .mockResolvedValueOnce(mockLukeChapter)
      .mockResolvedValueOnce(mockGenesisChapter);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-nav"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Navegação Canônica")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("tools-canonical-bible-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("biblical-text-floating-card")).toBeInTheDocument();
    });

    // Troca o livro para Gênesis no seletor canônico
    const bookSelect = screen.getByTestId("canonical-book-select");
    fireEvent.change(bookSelect, { target: { value: "gn" } });

    await waitFor(() => {
      expect(bibleApi.fetchChapter).toHaveBeenCalledWith("acf", "gn", "1");
    });

    expect(
      screen.getByText(/No princípio criou Deus os céus e a terra/i)
    ).toBeInTheDocument();
  });

  it("4. Permite definir a passagem canônica consultada como a passagem base do sermão", async () => {
    const sermon: Sermon = {
      id: "sermon-set-base",
      userId: "user-1",
      title: "Definir Base do Sermão",
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.mocked(homileticClient.getSermon).mockResolvedValue(sermon);
    vi.mocked(homileticClient.saveSermon).mockResolvedValue({
      ...sermon,
      bookName: "Gênesis",
      bookId: "gn",
      chapter: 1,
      version: "acf",
    });
    vi.mocked(bibleApi.fetchChapter)
      .mockResolvedValueOnce(mockLukeChapter)
      .mockResolvedValueOnce(mockGenesisChapter);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-set-base"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Definir Base do Sermão")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("tools-canonical-bible-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("biblical-text-floating-card")).toBeInTheDocument();
    });

    // Troca para Gênesis
    fireEvent.change(screen.getByTestId("canonical-book-select"), {
      target: { value: "gn" },
    });

    await waitFor(() => {
      expect(bibleApi.fetchChapter).toHaveBeenCalledWith("acf", "gn", "1");
    });

    // Clica no botão [ 📌 Usar no Sermão ]
    const setBaseBtn = screen.getByTestId("set-as-sermon-base-btn");
    expect(setBaseBtn).toBeInTheDocument();
    fireEvent.click(setBaseBtn);

    await waitFor(() => {
      expect(homileticClient.saveSermon).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "sermon-set-base",
          bookName: "Gênesis",
          bookId: "gn",
          chapter: 1,
          version: "acf",
        })
      );
    });
  });
});
