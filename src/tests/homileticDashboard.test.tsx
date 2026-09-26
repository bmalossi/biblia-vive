import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SermonDashboardPage from "@/pages/SermonDashboardPage";
import Header from "@/components/Header";
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
    listSermons: vi.fn(),
    saveSermon: vi.fn(),
  };
});

vi.mock("@/hooks/useSubscription", () => ({
  useSubscription: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

describe("Ticket 5: Painel do Estúdio (/estudio) e Gate de Acesso Templo", () => {
  const mockSermons: Sermon[] = [
    {
      id: "sermon-1",
      userId: "user-templo-1",
      title: "A Esperança da Glória",
      bookName: "Romanos",
      chapter: 8,
      verse: 28,
      status: "draft",
      desfechoTipo: "consolacao",
      desfechoTexto: "Confortar a igreja.",
      createdAt: "2026-09-01T10:00:00Z",
      updatedAt: "2026-09-01T12:00:00Z",
    },
    {
      id: "sermon-2",
      userId: "user-templo-1",
      title: "O Cordeiro que Venceu",
      bookName: "Apocalipse",
      chapter: 5,
      verse: 9,
      status: "completed",
      desfechoTipo: "conversao",
      desfechoTexto: "Chamada à entrega.",
      createdAt: "2026-09-10T10:00:00Z",
      updatedAt: "2026-09-10T12:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: { id: "user-templo-1", email: "pastor@exemplo.com" } as any,
      signOut: vi.fn(),
      isPending: false,
    });
  });

  it("exibe o Gate Institucional Templo para usuários sem plano Templo", async () => {
    vi.mocked(useSubscriptionHook.useSubscription).mockReturnValue({
      subscription: null,
      isPro: true,
      isTemplo: false,
      isAdmin: false,
      loading: false,
      checkout: vi.fn(),
      manageSubscription: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/estudio"]}>
        <Routes>
          <Route path="/estudio" element={<SermonDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("templo-gate-container")).toBeInTheDocument();
    expect(screen.getByText(/Módulo Exclusivo — Plano Templo/i)).toBeInTheDocument();
    expect(screen.getByText(/Estúdio Homilético 3x4/i)).toBeInTheDocument();
    expect(screen.queryByTestId("templo-dashboard")).not.toBeInTheDocument();
  });

  it("exibe o Painel do Estúdio com a lista de sermões para usuários do plano Templo", async () => {
    vi.mocked(useSubscriptionHook.useSubscription).mockReturnValue({
      subscription: { plan_type: "templo", status: "active" } as any,
      isPro: true,
      isTemplo: true,
      isAdmin: false,
      loading: false,
      checkout: vi.fn(),
      manageSubscription: vi.fn(),
    });

    vi.mocked(homileticClient.listSermons).mockResolvedValue(mockSermons);

    render(
      <MemoryRouter initialEntries={["/estudio"]}>
        <Routes>
          <Route path="/estudio" element={<SermonDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("templo-dashboard")).toBeInTheDocument();
      expect(screen.getByText("A Esperança da Glória")).toBeInTheDocument();
      expect(screen.getByText("O Cordeiro que Venceu")).toBeInTheDocument();
    });

    // Passagens bíblicas visíveis
    expect(screen.getByText(/Romanos 8:28/i)).toBeInTheDocument();
    expect(screen.getByText(/Apocalipse 5:9/i)).toBeInTheDocument();
  });

  it("filtra sermões por título ou referência bíblica no campo de busca", async () => {
    vi.mocked(useSubscriptionHook.useSubscription).mockReturnValue({
      subscription: { plan_type: "templo", status: "active" } as any,
      isPro: true,
      isTemplo: true,
      isAdmin: false,
      loading: false,
      checkout: vi.fn(),
      manageSubscription: vi.fn(),
    });

    vi.mocked(homileticClient.listSermons).mockResolvedValue(mockSermons);

    render(
      <MemoryRouter initialEntries={["/estudio"]}>
        <Routes>
          <Route path="/estudio" element={<SermonDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("A Esperança da Glória")).toBeInTheDocument();
      expect(screen.getByText("O Cordeiro que Venceu")).toBeInTheDocument();
    });

    // Digita "Apocalipse" na busca
    const searchInput = screen.getByPlaceholderText(/Buscar por título ou passagem/i);
    fireEvent.change(searchInput, { target: { value: "Apocalipse" } });

    expect(screen.queryByText("A Esperança da Glória")).not.toBeInTheDocument();
    expect(screen.getByText("O Cordeiro que Venceu")).toBeInTheDocument();
  });

  it("renderiza o atalho 'Estúdio' no menu de navegação apenas para usuários Templo", async () => {
    // 1. Usuário sem plano Templo -> link não aparece
    vi.mocked(useSubscriptionHook.useSubscription).mockReturnValue({
      subscription: null,
      isPro: true,
      isTemplo: false,
      isAdmin: false,
      loading: false,
      checkout: vi.fn(),
      manageSubscription: vi.fn(),
    });

    const { unmount } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.queryByRole("link", { name: /^estúdio$/i })).not.toBeInTheDocument();
    unmount();

    // 2. Usuário com plano Templo -> link visível
    vi.mocked(useSubscriptionHook.useSubscription).mockReturnValue({
      subscription: { plan_type: "templo", status: "active" } as any,
      isPro: true,
      isTemplo: true,
      isAdmin: false,
      loading: false,
      checkout: vi.fn(),
      manageSubscription: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: /^estúdio$/i })).toBeInTheDocument();
  });
});
