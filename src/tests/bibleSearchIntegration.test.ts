import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildFtsSearchSql } from "../../cloudflare/search-worker/src/querySanitizer";
import {
  extractSearchTokens,
  buildHighlightRegex,
  searchBibleWorker,
} from "../lib/bibleSearchClient";
import { searchLocalBible } from "../lib/bibleApi";

describe("Bible Search Engine Integration & End-to-End Suite", () => {
  describe("FTS5 Query Generation & Sanitization (Worker Borda)", () => {
    it("1. Intercalated Words: sanitizes multi-token query to match words in between", () => {
      const result = buildFtsSearchSql({
        rawQuery: "há júbilo",
        version: "acf",
        limit: 20,
        offset: 0,
      });

      expect(result.sanitizedQuery).toBe('"ha"* AND "jubilo"*');
      expect(result.sql).toContain("WHERE bible_search_fts MATCH ?");
      expect(result.sql).toContain("AND version = ?");
      expect(result.params).toEqual(['"ha"* AND "jubilo"*', "acf", 20, 0]);
    });

    it("2. Typographic / Accent Tolerance: removes diacritics for unicode61 matching", () => {
      const result = buildFtsSearchSql({
        rawQuery: "exortacao e consolacao",
        version: "all",
      });

      expect(result.sanitizedQuery).toBe(
        '"exortacao"* AND "e"* AND "consolacao"*'
      );
      // Version 'all' should not filter by version column
      expect(result.sql).not.toContain("AND version = ?");
      expect(result.params).toEqual([
        '"exortacao"* AND "e"* AND "consolacao"*',
        20,
        0,
      ]);
    });

    it("3. Exact Phrase: preserves exact order when user quotes phrase", () => {
      const result = buildFtsSearchSql({
        rawQuery: '"no princípio criou Deus"',
        version: "nvi",
      });

      expect(result.sanitizedQuery).toBe('"no principio criou Deus"');
      expect(result.params[0]).toBe('"no principio criou Deus"');
      expect(result.params[1]).toBe("nvi");
    });

    it("4. Version Filters: supports specific versions and version agnostic mode", () => {
      const nviResult = buildFtsSearchSql({
        rawQuery: "graça",
        version: "nvi",
      });
      expect(nviResult.sql).toContain("AND version = ?");
      expect(nviResult.params).toContain("nvi");

      const allResult = buildFtsSearchSql({
        rawQuery: "graça",
        version: "all",
      });
      expect(allResult.sql).not.toContain("AND version = ?");
      expect(allResult.params).not.toContain("all");
    });

    it("5. Special Characters Sanitization: prevents FTS5 syntax errors with malicious or unusual input", () => {
      const nastyInputs = [
        '***(((;;; SELECT * FROM users)))"""',
        'NOT AND OR NEAR "unclosed string',
        "paz!@#$%^&*()_+=-`~[]{}|;:',.<>?/",
      ];

      for (const input of nastyInputs) {
        const result = buildFtsSearchSql({ rawQuery: input });
        // Must never throw an exception or produce invalid unescaped FTS5 syntax
        expect(result.sql).toBeDefined();
        expect(result.countSql).toBeDefined();
      }
    });

    it("6. Pagination: sets correct LIMIT and OFFSET clauses", () => {
      const result = buildFtsSearchSql({
        rawQuery: "amor",
        limit: 50,
        offset: 150,
      });

      expect(result.params).toEqual(['"amor"*', 50, 150]);
      expect(result.sql).toContain("LIMIT ? OFFSET ?");
    });
  });

  describe("Client Highlighting & Token Extraction", () => {
    it("extracts tokens and matches both accented and unaccented variations in verse text", () => {
      const tokens = extractSearchTokens("ha jubilo");
      const regex = buildHighlightRegex(tokens);

      expect(regex).not.toBeNull();
      const verse =
        "Nas tendas dos justos há voz de júbilo e de salvação; a destra do Senhor faz proezas.";
      const matches = verse.match(regex!);

      expect(matches).not.toBeNull();
      expect(matches).toContain("há");
      expect(matches).toContain("júbilo");
    });

    it("matches words with inflected endings via prefix expansion", () => {
      const tokens = extractSearchTokens("jubil");
      const regex = buildHighlightRegex(tokens);

      const verse = "Então jubilou todo o povo, e disse: Viva o rei!";
      const matches = verse.match(regex!);

      expect(matches).not.toBeNull();
      expect(matches![0]).toBe("jubilou");
    });
  });

  describe("Offline Fallback & Deprecation of 66-Fetch Loop", () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
      globalThis.fetch = vi.fn();
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it("does NOT perform 66 sequential network fetches when broad search fails", async () => {
      // Simulate network offline/failure on worker
      (globalThis.fetch as any).mockRejectedValue(new Error("Failed to fetch"));

      const result = await searchLocalBible("acf", "termo inexistente");

      expect(result.verses).toEqual([]);
      expect(result.total).toBe(0);
      // Must NOT have made 66 requests to load all books
      expect((globalThis.fetch as any).mock.calls.length).toBeLessThan(5);
    });
  });
});
