import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSectionHeadings } from "@/hooks/useSectionHeadings";
import * as sectionHeadingsModule from "@/lib/sectionHeadings";

describe("useSectionHeadings Hook", () => {
  beforeEach(() => {
    sectionHeadingsModule._resetHeadingsCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retorna lista vazia e função getHeadingsBeforeVerse inicial", async () => {
    vi.spyOn(sectionHeadingsModule, "getHeadingsForChapter").mockResolvedValue([]);

    const { result } = renderHook(() =>
      useSectionHeadings("gn", 1, "pt-BR")
    );

    expect(typeof result.current.getHeadingsBeforeVerse).toBe("function");

    await waitFor(() => {
      expect(result.current.headings).toEqual([]);
    });
  });

  it("carrega subtítulos para pt-BR e disponibiliza getHeadingsBeforeVerse", async () => {
    vi.spyOn(sectionHeadingsModule, "getHeadingsForChapter").mockResolvedValue([
      { before_verse: 1, text: "O Princípio" },
      { before_verse: 4, text: "A Criação Continua" },
    ]);

    const { result } = renderHook(() =>
      useSectionHeadings("gn", 1, "pt-BR")
    );

    await waitFor(() => {
      expect(result.current.headings.length).toBe(2);
    });

    expect(result.current.getHeadingsBeforeVerse(1)).toEqual([
      { before_verse: 1, text: "O Princípio" },
    ]);
    expect(result.current.getHeadingsBeforeVerse(4)).toEqual([
      { before_verse: 4, text: "A Criação Continua" },
    ]);
    expect(result.current.getHeadingsBeforeVerse(2)).toEqual([]);
  });

  it("não carrega subtítulos se bookSlug for indefinido", async () => {
    const spy = vi.spyOn(sectionHeadingsModule, "getHeadingsForChapter");

    const { result } = renderHook(() =>
      useSectionHeadings(undefined, 1, "pt-BR")
    );

    expect(result.current.headings).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("retorna lista vazia para idiomas não pt (ex: en)", async () => {
    vi.spyOn(sectionHeadingsModule, "getHeadingsForChapter").mockResolvedValue([]);

    const { result } = renderHook(() =>
      useSectionHeadings("gn", 1, "en")
    );

    await waitFor(() => {
      expect(result.current.headings).toEqual([]);
    });

    expect(result.current.getHeadingsBeforeVerse(1)).toEqual([]);
  });
});
