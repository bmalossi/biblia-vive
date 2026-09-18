import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ReadingPlansPage from "@/pages/ReadingPlansPage";
import { TooltipProvider } from "@/components/ui/tooltip";

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

// Mock readingPlanSync
vi.mock("@/lib/readingPlanSync", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/readingPlanSync")>();
  return {
    ...actual,
    loadPlanProgressesFromCloud: vi.fn().mockImplementation(() => Promise.resolve({})),
    savePlanProgressToCloud: vi.fn().mockImplementation(() => Promise.resolve(undefined)),
  };
});

const renderWithRouter = (ui: React.ReactElement, { route = "/planos" } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <TooltipProvider>{ui}</TooltipProvider>
    </MemoryRouter>
  );
};

describe("ReadingPlansPage Redesign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza o Hero Header com arte de montanha, overline, títulos e os 3 pilares de valor", async () => {
    renderWithRouter(<ReadingPlansPage />);

    await screen.findByText("PLANOS DE LEITURA");
    expect(screen.getByText(/Caminhe com Deus/i)).toBeInTheDocument();
    expect(screen.getByText(/todos os dias./i)).toBeInTheDocument();
    expect(
      screen.getByText(/Planos de leitura bíblica para cada momento da sua jornada./i)
    ).toBeInTheDocument();

    // 3 Pilares de Valor
    expect(screen.getByText("Mais foco")).toBeInTheDocument();
    expect(screen.getByText("na Palavra")).toBeInTheDocument();
    expect(screen.getByText("Disciplina")).toBeInTheDocument();
    expect(screen.getByText("com propósito")).toBeInTheDocument();
    expect(screen.getByText("Crescimento")).toBeInTheDocument();
    expect(screen.getByText("espiritual")).toBeInTheDocument();
  });

  it("renderiza a Barra de Ações com busca em pílula e os 5 filtros de categoria", async () => {
    renderWithRouter(<ReadingPlansPage />);

    await screen.findByText("PLANOS DE LEITURA");
    const searchInput = screen.getByPlaceholderText(
      "Buscar por plano, livro, tema ou palavra..."
    );
    expect(searchInput).toBeInTheDocument();

    expect(screen.getByRole("tab", { name: "Todos" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Em destaque" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Temáticos" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Livros" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Sazonais" })).toBeInTheDocument();
  });

  it("renderiza a Sidebar com os widgets 'MARCOS DE FÉ — EBENÉZER' e 'SEU MOMENTO'", async () => {
    renderWithRouter(<ReadingPlansPage />);

    await screen.findByText("PLANOS DE LEITURA");
    // Widget Ebenézer
    expect(screen.getByText("MARCOS DE FÉ — EBENÉZER")).toBeInTheDocument();
    expect(screen.getByText(/16 marcos de fé preservados/i)).toBeInTheDocument();
    expect(screen.getByText(/"Até aqui nos ajudou o Senhor."/i)).toBeInTheDocument();
    expect(screen.getByText(/— 1 Samuel 7:12/i)).toBeInTheDocument();

    // Widget Seu Momento
    expect(screen.getByText("SEU MOMENTO")).toBeInTheDocument();
    expect(screen.getByText(/Você já percorreu/i)).toBeInTheDocument();
    expect(screen.getByText(/de leitura\./i)).toBeInTheDocument();
    expect(
      screen.getByText(/Continue de onde parou e mantenha o ritmo da sua jornada./i)
    ).toBeInTheDocument();
  });

  it("renderiza o grid com os 9 planos de leitura e seus respectivos selos", async () => {
    renderWithRouter(<ReadingPlansPage />);

    await screen.findByText("PLANOS DE LEITURA");
    expect(screen.getByText("Provérbios em 31 dias")).toBeInTheDocument();
    expect(screen.getByText("Salmos em 30 dias")).toBeInTheDocument();
    expect(screen.getByText("Os 4 Evangelhos")).toBeInTheDocument();
    expect(screen.getByText("Novo Testamento em 90 dias")).toBeInTheDocument();
    expect(screen.getByText("Bíblia em 1 ano")).toBeInTheDocument();
    expect(screen.getByText("Gênesis em 30 dias")).toBeInTheDocument();
    expect(screen.getByText("Vida de Cristo em 40 dias")).toBeInTheDocument();
    expect(screen.getByText("Cartas de Paulo em 30 dias")).toBeInTheDocument();
    expect(screen.getByText("Esperança em Cristo")).toBeInTheDocument();

    // Selo Em Destaque
    expect(screen.getAllByText("EM DESTAQUE").length).toBeGreaterThanOrEqual(1);

    // Selos de Categoria
    expect(screen.getAllByText("TEMÁTICO").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("LIVROS").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("SAZONAL").length).toBeGreaterThanOrEqual(1);
  });

  it("filtra planos ao clicar nas pílulas de categoria", async () => {
    renderWithRouter(<ReadingPlansPage />);

    await screen.findByText("PLANOS DE LEITURA");
    // Clicar em "Livros"
    const livrosTab = screen.getByRole("tab", { name: "Livros" });
    fireEvent.click(livrosTab);

    await waitFor(() => {
      // Devem aparecer os planos da categoria livros
      expect(screen.getByText("Os 4 Evangelhos")).toBeInTheDocument();
      expect(screen.getByText("Gênesis em 30 dias")).toBeInTheDocument();
      expect(screen.getByText("Cartas de Paulo em 30 dias")).toBeInTheDocument();

      // Não devem aparecer os sazonais ou puramente temáticos
      expect(screen.queryByText("Novo Testamento em 90 dias")).not.toBeInTheDocument();
      expect(screen.queryByText("Esperança em Cristo")).not.toBeInTheDocument();
    });

    // Clicar em "Sazonais"
    const sazonaisTab = screen.getByRole("tab", { name: "Sazonais" });
    fireEvent.click(sazonaisTab);

    await waitFor(() => {
      expect(screen.getByText("Novo Testamento em 90 dias")).toBeInTheDocument();
      expect(screen.getByText("Esperança em Cristo")).toBeInTheDocument();
      expect(screen.queryByText("Os 4 Evangelhos")).not.toBeInTheDocument();
    });
  });

  it("filtra planos em tempo real no campo de busca", async () => {
    renderWithRouter(<ReadingPlansPage />);

    await screen.findByText("PLANOS DE LEITURA");
    const searchInput = screen.getByPlaceholderText(
      "Buscar por plano, livro, tema ou palavra..."
    );
    fireEvent.change(searchInput, { target: { value: "Provérbios" } });

    await waitFor(() => {
      expect(screen.getByText("Provérbios em 31 dias")).toBeInTheDocument();
      expect(screen.queryByText("Os 4 Evangelhos")).not.toBeInTheDocument();
      expect(screen.queryByText("Bíblia em 1 ano")).not.toBeInTheDocument();
    });
  });

  it("renderiza o dashboard do plano ativo com timeline e métricas ao selecionar um plano", async () => {
    // Renderiza com rota do plano "Os 4 Evangelhos"
    renderWithRouter(<ReadingPlansPage />, { route: "/planos?id=gospels-30-days" });

    // Hero do Plano Ativo
    await screen.findByText("Os 4 Evangelhos");
    expect(screen.getByText(/Voltar à lista de planos/i)).toBeInTheDocument();
    expect(screen.getByText("Duração")).toBeInTheDocument();
    expect(screen.getByText("Leitura diária")).toBeInTheDocument();
    expect(screen.getByText("Foco do plano")).toBeInTheDocument();

    // Timeline de Dias
    expect(screen.getByTestId("day-row-1")).toBeInTheDocument();
    expect(screen.getByTestId("day-row-2")).toBeInTheDocument();
    // Título sintetizado: "Mateus 1, 2 e 3"
    expect(screen.getByText("Mateus 1, 2 e 3")).toBeInTheDocument();

    // Botão Ler Hoje no dia 1 ativo
    const lerHojeBtn = screen.getByRole("button", { name: /Ler hoje/i });
    expect(lerHojeBtn).toBeInTheDocument();

    // Dias posteriores bloqueados
    const bloqueados = screen.getAllByText("Bloqueado");
    expect(bloqueados.length).toBeGreaterThan(0);
  });
});
