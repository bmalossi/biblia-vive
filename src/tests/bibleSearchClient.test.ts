import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  extractSearchTokens,
  buildHighlightRegex,
  searchBibleWorker,
} from "../lib/bibleSearchClient";

describe("bibleSearchClient", () => {
  describe("extractSearchTokens", () => {
    it("should extract individual words separated by whitespace", () => {
      const tokens = extractSearchTokens("há grande júbilo");
      expect(tokens).toEqual(["há", "grande", "júbilo"]);
    });

    it("should preserve exact phrase inside quotes", () => {
      const tokens = extractSearchTokens('"no princípio criou Deus"');
      expect(tokens).toEqual(["no princípio criou Deus"]);
    });

    it("should remove punctuation and handle extra whitespace", () => {
      const tokens = extractSearchTokens("  graça, paz e misericórdia!  ");
      expect(tokens).toEqual(["graça", "paz", "e", "misericórdia"]);
    });

    it("should return empty array for empty or whitespace query", () => {
      expect(extractSearchTokens("")).toEqual([]);
      expect(extractSearchTokens("   ")).toEqual([]);
    });
  });

  describe("buildHighlightRegex", () => {
    it("should match accented variations of search tokens", () => {
      const regex = buildHighlightRegex(["jubilo"]);
      expect(regex).not.toBeNull();

      const text = "Nas tendas dos justos há voz de júbilo e de salvação.";
      const matches = text.match(regex!);
      expect(matches).not.toBeNull();
      expect(matches![0]).toBe("júbilo");
    });

    it("should match unaccented tokens against accented text (exortacao -> exortação)", () => {
      const regex = buildHighlightRegex(["exortacao"]);
      expect(regex).not.toBeNull();

      const text = "Atende à leitura, à exortação e ao ensino.";
      const matches = text.match(regex!);
      expect(matches).not.toBeNull();
      expect(matches![0]).toBe("exortação");
    });

    it("should match multiple tokens in any order", () => {
      const regex = buildHighlightRegex(["ha", "jubilo"]);
      expect(regex).not.toBeNull();

      const text = "Nas tendas dos justos há voz de júbilo.";
      const matches = text.match(regex!);
      expect(matches).not.toBeNull();
      expect(matches).toContain("há");
      expect(matches).toContain("júbilo");
    });

    it("should return null for empty tokens", () => {
      expect(buildHighlightRegex([])).toBeNull();
    });
  });

  describe("searchBibleWorker", () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
      globalThis.fetch = vi.fn();
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it("should call Worker URL with formatted query params", async () => {
      const mockResponse = {
        verses: [
          {
            id: "ps.118.15",
            version: "acf",
            bookId: "sl",
            bookName: "Salmos",
            testament: "VT",
            chapter: 118,
            verse: 15,
            reference: "Salmos 118:15",
            text: "Nas tendas dos justos há voz de júbilo e de salvação.",
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
        query: "há júbilo",
        version: "acf",
      };

      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await searchBibleWorker({
        query: "há júbilo",
        version: "acf",
        limit: 20,
        offset: 0,
      });

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      const calledUrl = (globalThis.fetch as any).mock.calls[0][0];
      expect(calledUrl).toContain("q=h%C3%A1+j%C3%BAbilo");
      expect(calledUrl).toContain("v=acf");
      expect(calledUrl).toContain("limit=20");
      expect(calledUrl).toContain("offset=0");

      expect(result.total).toBe(1);
      expect(result.verses[0].reference).toBe("Salmos 118:15");
    });

    it("should return empty result for blank query without fetching", async () => {
      const result = await searchBibleWorker({ query: "   " });
      expect(globalThis.fetch).not.toHaveBeenCalled();
      expect(result.verses).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should throw error if response is not ok", async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(
        searchBibleWorker({ query: "amor" })
      ).rejects.toThrow("Erro na busca (500): Internal Server Error");
    });
  });
});
