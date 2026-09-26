import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter, MemoryRouter, Route, Routes } from "react-router-dom";
import { MemorialCard } from "@/components/memorial/MemorialCard";
import MemorialEntryModal from "@/components/MemorialEntryModal";
import SermonStudioPage from "@/pages/SermonStudioPage";
import type { MemorialEntry } from "@/lib/noteStore";
import * as homileticClient from "@/lib/homileticClient";
import homileticWorker from "../../cloudflare/homiletic-worker/src/index";

// Mock do cliente homilético
vi.mock("@/lib/homileticClient", () => ({
  createSermonFromInspiration: vi.fn(),
  getSermon: vi.fn(),
  listPreachingLogs: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "test-user-1", email: "user@test.com" },
    isAuthenticated: true,
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "test-user-1", email: "user@test.com" },
    isAuthenticated: true,
  }),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Ticket 1 Tracer Bullet: Semente Homilética no Memorial e Acesso ao Estúdio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockInspirationEntry: MemorialEntry = {
    id: "note-insp-123",
    type: "inspiration",
    title: "Chama em Romanos 8",
    content: "Linha 1: Sentimento profundo de consolo.\nLinha 2: O Espírito intercede com gemidos inexprimíveis.\nLinha 3: Certeza absoluta da vitória em Cristo.",
    bookId: "ROM",
    bookName: "Romanos",
    chapter: 8,
    verse: 26,
    version: "acf",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("renderiza o botão [ 🏛️ Desenvolver no Estúdio 3x4 ] para notas de inspiração", () => {
    render(
      <BrowserRouter>
        <MemorialCard entry={mockInspirationEntry} />
      </BrowserRouter>
    );

    const developButton = screen.getByRole("button", {
      name: /desenvolver no estúdio 3x4/i,
    });
    expect(developButton).toBeInTheDocument();
  });

  it("ao clicar no botão [ Desenvolver no Estúdio 3x4 ], chama o cliente homilético e redireciona para /estudio/:id", async () => {
    vi.mocked(homileticClient.createSermonFromInspiration).mockResolvedValue({
      id: "sermon-xyz-789",
      userId: "user-1",
      inspirationNoteId: "note-insp-123",
      title: "Chama em Romanos 8",
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(
      <BrowserRouter>
        <MemorialCard entry={mockInspirationEntry} />
      </BrowserRouter>
    );

    const developButton = screen.getByRole("button", {
      name: /desenvolver no estúdio 3x4/i,
    });
    fireEvent.click(developButton);

    await waitFor(() => {
      expect(homileticClient.createSermonFromInspiration).toHaveBeenCalledWith(
        mockInspirationEntry
      );
      expect(mockNavigate).toHaveBeenCalledWith("/estudio/sermon-xyz-789");
    });
  });

  it("MemorialEntryModal exige no mínimo 3 linhas para a categoria Inspiração", async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);

    render(
      <MemorialEntryModal
        isOpen={true}
        onClose={vi.fn()}
        category="inspiration"
        bookId="ROM"
        bookName="Romanos"
        chapter={8}
        verse={26}
        version="acf"
        onSave={handleSave}
      />
    );

    // Categoria Inspiração selecionada
    const textarea = screen.getByPlaceholderText(/Linha 1: Percepção espiritual sobre o texto/i);

    // Digita apenas 1 linha curta
    fireEvent.change(textarea, { target: { value: "Apenas uma linha curta de reflexão." } });

    // Clica no botão Salvar
    const submitBtn = screen.getByRole("button", { name: /guardar memória/i });
    fireEvent.click(submitBtn);

    // Deve bloquear o salvamento
    expect(handleSave).not.toHaveBeenCalled();

    // Espera o botão de salvar retornar ao estado idle
    await waitFor(
      () => {
        expect(screen.queryByText(/guardando\.\.\./i)).not.toBeInTheDocument();
      },
      { timeout: 1500 }
    );

    // Agora digita 3 linhas completas
    fireEvent.change(textarea, {
      target: {
        value: "Linha 1: O clamor do espírito.\nLinha 2: A consolação da graça.\nLinha 3: O desfecho da salvação.",
      },
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "inspiration",
          content: expect.stringContaining("Linha 3: O desfecho da salvação."),
          metadata: expect.objectContaining({
            inspiration: expect.objectContaining({
              spark: expect.stringContaining("Linha 1"),
            }),
          }),
        })
      );
    });
  });

  it("SermonStudioPage renderiza o cabeçalho 'Eu e Deus' com o texto da inspiração", async () => {
    vi.mocked(homileticClient.getSermon).mockResolvedValue({
      id: "sermon-100",
      userId: "user-1",
      inspirationNoteId: "note-insp-123",
      title: "Consolação em Romanos",
      bookId: "ROM",
      bookName: "Romanos",
      chapter: 8,
      verse: 26,
      version: "acf",
      sparkText: "O Espírito intercede por nós com gemidos inexprimíveis.",
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-100"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Eu e Deus — A Chama Inicial/i)).toBeInTheDocument();
      expect(
        screen.getByText(/O Espírito intercede por nós com gemidos inexprimíveis/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Consolação em Romanos/i)).toBeInTheDocument();
    });
  });

  describe("Cloudflare Worker Homilético: Contrato de Autenticação", () => {
    it("retorna 401 Unauthorized se requisição não contiver JWT Bearer token", async () => {
      const mockDb = {
        prepare: vi.fn(),
      } as any;

      const req = new Request("https://estudio.bibliavive.com.br/api/sermons", {
        method: "GET",
      });

      const res = await homileticWorker.fetch(req, { DB: mockDb });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("Unauthorized");
    });
  });
});
