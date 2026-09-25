import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import SearchPage from "@/pages/SearchPage";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mock usePageMeta
vi.mock("@/hooks/usePageMeta", () => ({
  usePageMeta: vi.fn(),
}));

// Mock Header
vi.mock("@/components/Header", () => ({
  default: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock("@/components/HarpaPlayerBar", () => ({
  default: () => null,
}));

vi.mock("@/components/NotificationSoftAsk", () => ({
  default: () => null,
}));

const mockVerses = [
  {
    id: "lucas-15-10",
    version: "kja",
    bookId: "lucas",
    bookName: "Lucas",
    testament: "NT",
    chapter: 15,
    verse: 10,
    reference: "Lucas 15:10",
    text: "Eu vos asseguro que, de igual modo, há grande júbilo na presença dos anjos de Deus por um pecador que se arrepende.",
  },
  {
    id: "atos-16-34",
    version: "kja",
    bookId: "atos",
    bookName: "Atos",
    testament: "NT",
    chapter: 16,
    verse: 34,
    reference: "Atos 16:34",
    text: "Então, insistiu para que subissem à sua casa, onde lhes preparou mesa farta; e, com todos os seus, expressava grande júbilo, por haverem crido em Deus.",
  },
  {
    id: "1cronicas-15-28",
    version: "kja",
    bookId: "1cronicas",
    bookName: "1 Crônicas",
    testament: "AT",
    chapter: 15,
    verse: 28,
    reference: "1 Crônicas 15:28",
    text: "E toda a nação de Israel acompanhou a Arca da Aliança de Yahweh com grande júbilo e brados de alegria, ao som de trombetas, cornetas e címbalos, ao toque de liras e de harpas.",
  },
];

vi.mock("@/lib/bibleSearchClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/bibleSearchClient")>();
  return {
    ...actual,
    searchBibleWorker: vi.fn().mockImplementation((options) => {
      const isMatch = options.query?.includes("júbilo") || options.query?.includes("jubilo");
      return Promise.resolve({
        verses: isMatch ? mockVerses : [],
        total: isMatch ? mockVerses.length : 0,
        limit: 1000,
        offset: 0,
        query: options.query,
        version: options.version || "kja",
      });
    }),
  };
});

const renderSearchPage = (route = "/busca?q=há grande júbilo&v=kja&mode=text") => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <TooltipProvider>
        <Routes>
          <Route path="/busca" element={<SearchPage />} />
        </Routes>
      </TooltipProvider>
    </MemoryRouter>
  );
};

describe("SearchPage Redesign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza o cabeçalho com botão Início, título Buscar na Bíblia e subtítulo", async () => {
    renderSearchPage("/busca");

    expect(screen.getByTestId("search-back-link")).toHaveAttribute("href", "/");
    expect(screen.getByRole("heading", { name: "Buscar na Bíblia" })).toBeInTheDocument();
    expect(
      screen.getByText("Encontre uma palavra, expressão ou referência.")
    ).toBeInTheDocument();
  });

  it("renderiza a barra de busca em pílula com campo de texto e seletor de versão integrado", async () => {
    renderSearchPage("/busca?q=há grande júbilo&v=kja&mode=text");

    const searchInput = screen.getByLabelText("Buscar na Bíblia");
    expect(searchInput).toHaveValue("há grande júbilo");

    const versionSelect = screen.getByLabelText("Selecionar versão bíblica para busca");
    expect(versionSelect).toHaveValue("kja");
  });

  it("exibe o botão Buscar somente quando há termo preenchido e omite quando vazio", async () => {
    // 1. Quando vazio na página /busca
    const { unmount } = renderSearchPage("/busca");
    expect(screen.queryByTestId("search-submit-btn")).not.toBeInTheDocument();
    unmount();

    // 2. Quando preenchido com termo
    renderSearchPage("/busca?q=fé&v=kja&mode=text");
    const submitBtn = screen.getByTestId("search-submit-btn");
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toHaveTextContent("Buscar");
  });

  it("renderiza as abas de modo de busca Texto e Referência", async () => {
    renderSearchPage("/busca?q=há grande júbilo&v=kja&mode=text");

    const tabsContainer = screen.getByTestId("search-mode-tabs");
    expect(within(tabsContainer).getByRole("button", { name: /texto/i })).toBeInTheDocument();
    expect(within(tabsContainer).getByRole("button", { name: /referência/i })).toBeInTheDocument();
  });

  it("renderiza a barra de contagem e alternador de Correspondência flexível / Frase exata", async () => {
    renderSearchPage("/busca?q=há grande júbilo&v=kja&mode=text");

    await waitFor(() => {
      expect(screen.getByTestId("search-results-header")).toBeInTheDocument();
    });

    const header = within(screen.getByTestId("search-results-header"));
    expect(header.getByText("3")).toBeInTheDocument();
    expect(header.getByText(/resultados para/i)).toBeInTheDocument();
    expect(header.getByText(/“há grande júbilo”/i)).toBeInTheDocument();
    expect(header.getByRole("button", { name: /correspondência flexível/i })).toBeInTheDocument();
    expect(header.getByRole("button", { name: /frase exata/i })).toBeInTheDocument();
  });

  it("renderiza os resultados no layout de 3 colunas por linha (Referência, Versículo com realce e Ação)", async () => {
    renderSearchPage("/busca?q=há grande júbilo&v=kja&mode=text");

    await waitFor(() => {
      const rows = screen.getAllByTestId("search-result-row");
      expect(rows.length).toBe(3);
    });

    const rows = screen.getAllByTestId("search-result-row");

    // Linha 1: Lucas 15:10
    const row1 = within(rows[0]);
    expect(row1.getByRole("heading", { name: "Lucas 15:10" })).toBeInTheDocument();
    expect(row1.getByText("KJA")).toBeInTheDocument();
    expect(row1.getByText(/anjo/i)).toBeInTheDocument();
    expect(row1.getByRole("link", { name: "Abrir Lucas 15" })).toHaveAttribute(
      "href",
      "/kja/lc/15#v10"
    );

    // Linha 2: Atos 16:34
    const row2 = within(rows[1]);
    expect(row2.getByRole("heading", { name: "Atos 16:34" })).toBeInTheDocument();
    expect(row2.getByRole("link", { name: "Abrir Atos 16" })).toHaveAttribute(
      "href",
      "/kja/atos/16#v34"
    );

    // Linha 3: 1 Crônicas 15:28
    const row3 = within(rows[2]);
    expect(row3.getByRole("heading", { name: "1 Crônicas 15:28" })).toBeInTheDocument();
    expect(row3.getByRole("link", { name: "Abrir 1 Crônicas 15" })).toHaveAttribute(
      "href",
      "/kja/1cr/15#v28"
    );
  });

  it("renderiza o rodapé sagrado inspirador com Salmo 119:105 e o lema da Bíblia Vive", async () => {
    renderSearchPage("/busca?q=há grande júbilo&v=kja&mode=text");

    const footer = screen.getByTestId("search-sacred-footer");
    expect(
      within(footer).getByText(/Lâmpada para os meus pés é a tua palavra/i)
    ).toBeInTheDocument();
    expect(within(footer).getByText(/Salmo 119:105/i)).toBeInTheDocument();
    expect(
      within(footer).getByText(/A Palavra de Deus sempre nos encontra/i)
    ).toBeInTheDocument();
  });
});
