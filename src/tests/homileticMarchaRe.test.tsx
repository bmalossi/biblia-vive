import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SermonStudioPage from "@/pages/SermonStudioPage";
import * as homileticClient from "@/lib/homileticClient";
import type { Sermon } from "@/lib/homileticClient";

vi.mock("@/lib/homileticClient", async () => {
  const actual = await vi.importActual("@/lib/homileticClient");
  return {
    ...actual,
    getSermon: vi.fn(),
    saveSermon: vi.fn(),
  };
});

describe("Ticket 2: Método da Marcha-Ré e Desbloqueio Progressivo no Estúdio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseDraftSermon: Sermon = {
    id: "sermon-marcha-re-1",
    userId: "user-1",
    title: "O Ponto de Chegada",
    bookId: "ROM",
    bookName: "Romanos",
    chapter: 8,
    verse: 28,
    version: "acf",
    sparkText: "Todas as coisas cooperam para o bem.",
    status: "draft",
    desfechoTipo: null,
    desfechoTexto: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("exibe o seletor das 4 categorias de Desfecho Homilético (Consolação, Confronto, Conversão, Oração)", async () => {
    vi.mocked(homileticClient.getSermon).mockResolvedValue(baseDraftSermon);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-marcha-re-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Consolação/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Confronto/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Conversão/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Oração/i })).toBeInTheDocument();
    });
  });

  it("mantém os blocos subsequentes bloqueados enquanto o Desfecho não for definido", async () => {
    vi.mocked(homileticClient.getSermon).mockResolvedValue(baseDraftSermon);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-marcha-re-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("bloco-1-container")).toHaveAttribute("data-locked", "true");
      expect(screen.getByTestId("bloco-2-container")).toHaveAttribute("data-locked", "true");
      expect(screen.getByTestId("bloco-3-container")).toHaveAttribute("data-locked", "true");
    });
  });

  it("desbloqueia os blocos e persiste no D1 quando o pregador define e salva o Desfecho", async () => {
    vi.mocked(homileticClient.getSermon).mockResolvedValue(baseDraftSermon);
    vi.mocked(homileticClient.saveSermon).mockImplementation(async (partial) => ({
      ...baseDraftSermon,
      ...partial,
    }));

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-marcha-re-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Consolação/i)).toBeInTheDocument();
    });

    // Clica em 'Consolação'
    const consolacaoBtn = screen.getByRole("button", { name: /consolação/i });
    fireEvent.click(consolacaoBtn);

    // Preenche o texto do desfecho
    const textarea = screen.getByPlaceholderText(/Onde a mensagem vai terminar/i);
    fireEvent.change(textarea, {
      target: { value: "Trazer paz à igreja em meio à tribulação presente." },
    });

    // Clica no botão Salvar Desfecho
    const saveBtn = screen.getByRole("button", { name: /fixar desfecho/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(homileticClient.saveSermon).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "sermon-marcha-re-1",
          desfechoTipo: "consolacao",
          desfechoTexto: "Trazer paz à igreja em meio à tribulação presente.",
        })
      );
      // Bloco 1 deve estar desbloqueado
      expect(screen.getByTestId("bloco-1-container")).toHaveAttribute("data-locked", "false");
    });
  });

  it("sermão que já possui desfecho salvo carrega com os blocos desbloqueados e permite edição livre", async () => {
    const existingUnlockedSermon: Sermon = {
      ...baseDraftSermon,
      desfechoTipo: "confronto",
      desfechoTexto: "Despertar a igreja do comodismo espiritual.",
    };

    vi.mocked(homileticClient.getSermon).mockResolvedValue(existingUnlockedSermon);

    render(
      <MemoryRouter initialEntries={["/estudio/sermon-marcha-re-1"]}>
        <Routes>
          <Route path="/estudio/:sermonId" element={<SermonStudioPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("bloco-1-container")).toHaveAttribute("data-locked", "false");
      expect(screen.getByDisplayValue(/Despertar a igreja do comodismo espiritual/i)).toBeInTheDocument();
    });
  });
});
