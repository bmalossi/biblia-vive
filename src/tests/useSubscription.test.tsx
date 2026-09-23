import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/lib/supabase";
import * as authHook from "@/hooks/useAuth";

vi.mock("@/lib/supabase", () => {
  const channelMock = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  };

  return {
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "test-user-1" } } }, error: null }),
        refreshSession: vi.fn().mockResolvedValue({ data: {}, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { status: "active", plan_type: "pro", current_period_end: "2026-12-31" },
              error: null,
            }),
          }),
        }),
      }),
      channel: vi.fn().mockReturnValue(channelMock),
      removeChannel: vi.fn(),
    },
  };
});

describe("useSubscription Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("does not throw ReferenceError: lastSubFetchTime is not defined and returns subscription data", async () => {
    vi.spyOn(authHook, "useAuth").mockReturnValue({
      user: { id: "test-user-1", email: "teste@bibliavive.com.br" } as any,
      loading: false,
      signOut: vi.fn(),
    });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isPro).toBe(true);
    expect(result.current.subscription?.status).toBe("active");
    expect(result.current.subscription?.plan_type).toBe("pro");
  });

  it("handles unauthenticated users gracefully without errors", async () => {
    vi.spyOn(authHook, "useAuth").mockReturnValue({
      user: null,
      loading: false,
      signOut: vi.fn(),
    });

    const { result } = renderHook(() => useSubscription());

    expect(result.current.subscription).toBeNull();
    expect(result.current.isPro).toBe(false);
    expect(result.current.loading).toBe(false);
  });
});
