import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  saveSermon,
  getSermon,
  listSermons,
  type Sermon,
} from "@/lib/homileticClient";
import { supabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => {
  const mockFrom = vi.fn();
  return {
    supabase: {
      auth: {
        getSession: vi.fn(),
      },
      from: mockFrom,
    },
  };
});

describe("Sincronização de Sermões na Conta do Usuário (Supabase + Auto-Sync Local)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("salva o sermão no Supabase com o user.id autenticado e atualiza o cache local", async () => {
    const mockUserId = "usr-pastor-777";
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: mockUserId },
        } as any,
      },
      error: null,
    });

    const mockUpsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "sermon-101",
            user_id: mockUserId,
            title: "O Bom Pastor",
            status: "draft",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        }),
      }),
    });

    vi.mocked(supabase.from).mockReturnValue({
      upsert: mockUpsert,
    } as any);

    const saved = await saveSermon({
      id: "sermon-101",
      title: "O Bom Pastor",
      status: "draft",
    });

    expect(saved.id).toBe("sermon-101");
    expect(saved.userId).toBe(mockUserId);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "sermon-101",
        user_id: mockUserId,
        title: "O Bom Pastor",
      })
    );

    // Verifica que também foi salvo no localStorage
    const local = localStorage.getItem("bv_sermon_sermon-101");
    expect(local).not.toBeNull();
    expect(JSON.parse(local!).title).toBe("O Bom Pastor");
  });

  it("auto-sincroniza sermões criados offline no localStorage para a conta Supabase ao listar", async () => {
    const mockUserId = "usr-pastor-777";
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: mockUserId },
        } as any,
      },
      error: null,
    });

    // Simula 2 sermões que já estavam no navegador (localStorage)
    const sermonLocal1: Sermon = {
      id: "sermon-local-1",
      userId: "guest",
      title: "Graça sobre Graça",
      status: "draft",
      createdAt: "2026-09-26T10:00:00Z",
      updatedAt: "2026-09-26T10:00:00Z",
    };
    const sermonLocal2: Sermon = {
      id: "sermon-local-2",
      userId: "guest",
      title: "O Farol da Esperança",
      status: "completed",
      createdAt: "2026-09-26T12:00:00Z",
      updatedAt: "2026-09-26T12:00:00Z",
    };

    localStorage.setItem("bv_sermon_sermon-local-1", JSON.stringify(sermonLocal1));
    localStorage.setItem("bv_sermon_sermon-local-2", JSON.stringify(sermonLocal2));

    const mockUpsert = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [], // Supabase ainda não tem nada
          error: null,
        }),
      }),
      upsert: mockUpsert,
    } as any);

    const sermons = await listSermons();

    // Deve auto-migrar os 2 sermões locais para a conta Supabase
    expect(mockUpsert).toHaveBeenCalledTimes(2);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "sermon-local-1",
        user_id: mockUserId,
        title: "Graça sobre Graça",
      })
    );
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "sermon-local-2",
        user_id: mockUserId,
        title: "O Farol da Esperança",
      })
    );

    expect(sermons.length).toBe(2);
  });
});
