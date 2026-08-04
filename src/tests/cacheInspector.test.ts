import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkBibleCache, cleanBibleCache } from "../utils/cacheInspector";

describe("cacheInspector", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should handle missing caches API gracefully", async () => {
    // @ts-ignore
    delete window.caches;
    const summaries = await checkBibleCache();
    expect(summaries).toEqual([]);
  });

  it("should inspect cache buckets and calculate sizes correctly", async () => {
    const mockBlob = { size: 1024 };
    const mockResponse = {
      clone: () => ({
        blob: () => Promise.resolve(mockBlob),
      }),
    };

    const mockCache = {
      keys: vi.fn().mockResolvedValue([{ url: "http://localhost/test.json" }]),
      match: vi.fn().mockResolvedValue(mockResponse),
    };

    // @ts-ignore
    window.caches = {
      keys: vi.fn().mockResolvedValue(["bv-static-v1"]),
      open: vi.fn().mockResolvedValue(mockCache),
      delete: vi.fn().mockResolvedValue(true),
    };

    const summaries = await checkBibleCache();
    expect(summaries).toHaveLength(1);
    expect(summaries[0].cacheName).toBe("bv-static-v1");
    expect(summaries[0].itemCount).toBe(1);
    expect(summaries[0].estimatedSizeBytes).toBe(1024);
    expect(summaries[0].estimatedSizeFormatted).toBe("1.00 KB");
  });

  it("should clean specified caches correctly", async () => {
    const deleteSpy = vi.fn().mockResolvedValue(true);

    // @ts-ignore
    window.caches = {
      keys: vi.fn().mockResolvedValue(["bv-bible-runtime-v1", "workbox-precache-v1"]),
      open: vi.fn().mockResolvedValue({
        keys: vi.fn().mockResolvedValue([]),
        match: vi.fn().mockResolvedValue(null),
      }),
      delete: deleteSpy,
    };

    await cleanBibleCache(["bv-bible-runtime-v1"]);
    expect(deleteSpy).toHaveBeenCalledWith("bv-bible-runtime-v1");
    expect(deleteSpy).not.toHaveBeenCalledWith("workbox-precache-v1");
  });
});
