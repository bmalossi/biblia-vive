import { describe, it, expect } from "vitest";
import { groupEntriesByTime, hasBibleReference, formatBibleReference, getBibleLink } from "../lib/memorialUtils";
import type { MemorialEntry } from "../lib/noteStore";

describe("groupEntriesByTime", () => {
    const fixedNow = new Date("2026-07-30T12:00:00Z");

    const makeEntry = (id: string, dateStr: string, type: any = "reflection"): MemorialEntry => ({
        id,
        type,
        title: `Entry ${id}`,
        content: `Content ${id}`,
        bookId: "mat",
        bookName: "Mateus",
        chapter: 6,
        version: "acf",
        createdAt: dateStr,
        updatedAt: dateStr,
    });

    it("should classify entries into Hoje, Ontem, Esta semana, and Month/Year", () => {
        const entries: MemorialEntry[] = [
            makeEntry("1", "2026-07-30T10:00:00Z"), // Hoje
            makeEntry("2", "2026-07-29T15:00:00Z"), // Ontem
            makeEntry("3", "2026-07-26T09:00:00Z"), // 4 dias atrás -> Esta semana
            makeEntry("4", "2026-06-15T12:00:00Z"), // Junho de 2026
            makeEntry("5", "2025-11-20T12:00:00Z"), // Novembro de 2025 (Novo ano)
        ];

        const groups = groupEntriesByTime(entries, fixedNow);

        expect(groups).toHaveLength(5);
        expect(groups[0].label).toBe("Hoje");
        expect(groups[0].entries).toHaveLength(1);

        expect(groups[1].label).toBe("Ontem");
        expect(groups[1].entries).toHaveLength(1);

        expect(groups[2].label).toBe("Esta semana");
        expect(groups[2].entries).toHaveLength(1);

        expect(groups[3].label).toBe("Junho de 2026");
        expect(groups[3].entries).toHaveLength(1);
        expect(groups[3].yearHeader).toBeUndefined();

        expect(groups[4].label).toBe("Novembro de 2025");
        expect(groups[4].entries).toHaveLength(1);
        expect(groups[4].yearHeader).toBe(2025);
    });

    it("should return empty array for empty input", () => {
        const groups = groupEntriesByTime([], fixedNow);
        expect(groups).toEqual([]);
    });
});

describe("hasBibleReference and formatBibleReference", () => {
    it("returns true and formats reference for valid book and chapter", () => {
        const entry = { bookId: "sl", bookName: "Salmos", chapter: 23, verse: 1, version: "acf" };
        expect(hasBibleReference(entry)).toBe(true);
        expect(formatBibleReference(entry)).toBe("Salmos 23:1");
        expect(getBibleLink(entry)).toBe("/acf/sl/23#v1");
    });

    it("returns true for chapter without verse", () => {
        const entry = { bookId: "sl", bookName: "Salmos", chapter: 23, verse: null, version: "acf" };
        expect(hasBibleReference(entry)).toBe(true);
        expect(formatBibleReference(entry)).toBe("Salmos 23");
        expect(getBibleLink(entry)).toBe("/acf/sl/23");
    });

    it("returns false for Geral / 0 or unlinked entries", () => {
        const entry = { bookId: "geral", bookName: "Geral", chapter: 0, verse: null, version: "acf" };
        expect(hasBibleReference(entry)).toBe(false);
        expect(formatBibleReference(entry)).toBe("");
        expect(getBibleLink(entry)).toBe("");
    });

    it("returns false for null/undefined or empty book", () => {
        expect(hasBibleReference(null)).toBe(false);
        expect(hasBibleReference(undefined)).toBe(false);
        expect(hasBibleReference({ bookId: "", bookName: "", chapter: 0 })).toBe(false);
        expect(hasBibleReference({ bookId: "none", bookName: "none", chapter: 0 })).toBe(false);
    });
});
