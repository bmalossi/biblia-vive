import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import MemorialPage from "@/pages/MemorialPage";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { MemorialEntry } from "@/lib/noteStore";

const mockEntries: MemorialEntry[] = [
  {
    id: "entry-1",
    bookId: "sl",
    bookName: "Salmos",
    chapter: 121,
    verse: 1,
    version: "acf",
    type: "testimony",
    title: "Deus cuidou de tudo",
    content: "Quando eu já não sabia mais o que fazer, Ele abriu uma porta que eu não conseguia ver.",
    favorite: true,
    tags: ["Providência", "Fé", "Gratidão"],
    createdAt: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString(), // 42 dias atrás
    updatedAt: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "entry-2",
    bookId: "sl",
    bookName: "Salmos",
    chapter: 46,
    verse: 10,
    version: "acf",
    type: "prayer",
    title: "Por minha família",
    content: "Senhor, cuida da minha família, dá sabedoria, proteção e mantém-nos unidos em Ti.",
    tags: ["Família", "Proteção", "Paz"],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "entry-3",
    bookId: "is",
    bookName: "Isaías",
    chapter: 40,
    verse: 31,
    version: "acf",
    type: "reflection",
    title: "O valor da presença",
    content: "Hoje entendi que não é sobre fazer mais, mas sobre estar mais presente.",
    tags: ["Presença", "Descanso"],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "test-user-1", email: "user@test.com" },
    isAuthenticated: true,
  }),
}));

// Mock useSubscription
vi.mock("@/hooks/useSubscription", () => ({
  useSubscription: () => ({
    isPro: false,
  }),
}));

// Mock usePageMeta
vi.mock("@/hooks/usePageMeta", () => ({
  usePageMeta: () => {},
}));

const mockStore = {
  getAll: vi.fn().mockImplementation(() => Promise.resolve(mockEntries)),
  getByChapter: vi.fn().mockImplementation(() => Promise.resolve([])),
  create: vi.fn().mockImplementation(() => Promise.resolve({ id: "new-entry" })),
  update: vi.fn().mockImplementation(() => Promise.resolve(undefined)),
  delete: vi.fn().mockImplementation(() => Promise.resolve(undefined)),
  toggleFavorite: vi.fn().mockImplementation(() => Promise.resolve(true)),
  markAnswered: vi.fn().mockImplementation(() => Promise.resolve(undefined)),
};

// Mock noteStore createNoteStore
vi.mock("@/lib/noteStore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/noteStore")>();
  return {
    ...actual,
    createNoteStore: () => mockStore,
  };
});

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

const renderWithRouter = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <TooltipProvider>{ui}</TooltipProvider>
    </BrowserRouter>
  );
};

describe("MemorialPage Redesign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza o Hero Header com arte da Bíblia clássica, títulos e versículo do Salmo 77:11", async () => {
    renderWithRouter(<MemorialPage />);

    expect(screen.getByText("MEU MEMORIAL")).toBeInTheDocument();
    expect(screen.getByText(/Tudo o que Deus tem/i)).toBeInTheDocument();
    expect(screen.getByText(/feito, permanece./i)).toBeInTheDocument();
    expect(
      screen.getByText(/Aqui estão as suas memórias espirituais/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Eu me lembrarei das obras do Senhor/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Salmo 77:11/i)).toBeInTheDocument();
  });

  it("renderiza a Barra de Ações com busca em pílula, botão Nova memória e abas de filtro", async () => {
    renderWithRouter(<MemorialPage />);

    const searchInput = screen.getByPlaceholderText(
      "Buscar por texto, título, livro, capítulo ou tags..."
    );
    expect(searchInput).toBeInTheDocument();

    const novaMemoriaBtns = screen.getAllByRole("button", { name: /nova memória/i });
    expect(novaMemoriaBtns.length).toBeGreaterThanOrEqual(1);

    expect(screen.getByRole("tab", { name: "Todos" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Reflexões" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Orações" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Testemunhos" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Propósitos" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Respostas" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Favoritos" })).toBeInTheDocument();
  });

  it("renderiza a Sidebar com APENAS 'X marcos de fé preservados' e SEM métricas numéricas frias", async () => {
    renderWithRouter(<MemorialPage />);

    // Deve exibir a métrica preservada autorizada pelo usuário
    await waitFor(() => {
      expect(screen.getByText(/marcos de fé preservados/i)).toBeInTheDocument();
    });

    // NÃO deve exibir as métricas numéricas frias da imagem que o usuário proibiu
    expect(screen.queryByText(/pedidos registrados/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/momentos no Caderno/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/respostas e provisões/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tipos de memória/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/SEU ARQUIVO ESPIRITUAL/i)).not.toBeInTheDocument();
  });

  it("renderiza o widget 'Para recordar... Há tantos dias você registrou...' na sidebar", async () => {
    renderWithRouter(<MemorialPage />);

    await waitFor(() => {
      expect(screen.getByText("Para recordar...")).toBeInTheDocument();
      expect(screen.getByText("ECO DO MEMORIAL")).toBeInTheDocument();
      expect(screen.getByText(/você registrou:/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /revisitar marco/i })).toBeInTheDocument();
    });
  });

  it("renderiza o card de citação bíblica 'Palavra de Firmeza' e o CTA 'Registre uma nova memória'", async () => {
    renderWithRouter(<MemorialPage />);

    expect(screen.getByText(/Porque Ele não é Deus de mortos, mas de vivos./i)).toBeInTheDocument();
    expect(screen.getByText(/Mateus 22:32/i)).toBeInTheDocument();

    expect(screen.getByText("Registre uma nova memória")).toBeInTheDocument();
    expect(screen.getByText("Guarde o que Deus está fazendo na sua vida.")).toBeInTheDocument();
  });

  it("renderiza a Linha do Tempo com a Memória em Destaque e os cards de memória", async () => {
    renderWithRouter(<MemorialPage />);

    await waitFor(() => {
      const timeline = screen.getByTestId("sacred-timeline-axis");
      // O card em destaque deve ser exibido com o título 'Deus cuidou de tudo'
      expect(within(timeline).getByText("Deus cuidou de tudo")).toBeInTheDocument();
      expect(within(timeline).getByText("Destaque")).toBeInTheDocument();

      // Demais memórias na timeline
      expect(within(timeline).getByText("Por minha família")).toBeInTheDocument();
      expect(within(timeline).getByText("O valor da presença")).toBeInTheDocument();
    });
  });

  it("filtra registros em tempo real na busca", async () => {
    renderWithRouter(<MemorialPage />);

    await waitFor(() => {
      expect(screen.getByText("Deus cuidou de tudo")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      "Buscar por texto, título, livro, capítulo ou tags..."
    );
    fireEvent.change(searchInput, { target: { value: "família" } });

    await waitFor(() => {
      const timeline = screen.getByTestId("sacred-timeline-axis");
      // Na timeline, 'Por minha família' deve estar presente e 'O valor da presença' filtrado
      expect(timeline).toHaveTextContent("Por minha família");
      expect(timeline).not.toHaveTextContent("O valor da presença");
    });
  });
});
