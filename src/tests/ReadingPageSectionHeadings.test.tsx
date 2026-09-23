import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ReadingPage from "@/pages/ReadingPage";
import * as bibleApi from "@/lib/bibleApi";
import * as sectionHeadingsModule from "@/lib/sectionHeadings";

// Mock Layout
vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-layout">{children}</div>
  ),
}));

// Mock hooks
vi.mock("@/hooks/usePageMeta", () => ({
  usePageMeta: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, isAuthenticated: false, loading: false }),
}));

vi.mock("@/hooks/useSubscription", () => ({
  useSubscription: () => ({ isPro: false, isTemplo: false }),
}));

vi.mock("@/hooks/useInactivity", () => ({
  useInactivity: () => false,
}));

vi.mock("@/components/ScriptureThreadBanner", () => ({
  default: () => null,
}));

vi.mock("@/components/WorshipCard", () => ({
  default: () => null,
}));

vi.mock("@/components/EchoBanner", () => ({
  default: () => null,
}));

vi.mock("@/contexts/NotebookContext", () => ({
  useNotebookContext: () => ({
    isOpen: false,
    setIsOpen: vi.fn(),
    setNotebookContext: vi.fn(),
  }),
}));

describe("ReadingPage — Subtítulos de Seção Bíblica", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sectionHeadingsModule._resetHeadingsCache();

    // Mock fetchChapter
    vi.spyOn(bibleApi, "fetchChapter").mockResolvedValue({
      id: "gn-1",
      bookId: "gn",
      number: "1",
      reference: "Gênesis 1",
      verses: [
        {
          id: "gn-1-1",
          orgId: "gn-1-1",
          bookId: "gn",
          chapterId: "gn-1",
          content: "No princípio criou Deus os céus e a terra.",
          text: "No princípio criou Deus os céus e a terra.",
          reference: "Gênesis 1:1",
          number: 1,
        },
        {
          id: "gn-1-2",
          orgId: "gn-1-2",
          bookId: "gn",
          chapterId: "gn-1",
          content: "E a terra era sem forma e vazia.",
          text: "E a terra era sem forma e vazia.",
          reference: "Gênesis 1:2",
          number: 2,
        },
        {
          id: "gn-1-3",
          orgId: "gn-1-3",
          bookId: "gn",
          chapterId: "gn-1",
          content: "E disse Deus: Haja luz; e houve luz.",
          text: "E disse Deus: Haja luz; e houve luz.",
          reference: "Gênesis 1:3",
          number: 3,
        },
        {
          id: "gn-1-4",
          orgId: "gn-1-4",
          bookId: "gn",
          chapterId: "gn-1",
          content: "E viu Deus que era boa a luz.",
          text: "E viu Deus que era boa a luz.",
          reference: "Gênesis 1:4",
          number: 4,
        },
      ],
    });
  });

  it("renderiza o subtítulo 'O Princípio' antes do versículo 1 em versão pt-br (NVI)", async () => {
    vi.spyOn(sectionHeadingsModule, "getHeadingsForChapter").mockImplementation(
      async (slug, ch, lang) => {
        if (lang.toLowerCase().startsWith("pt")) {
          return [{ before_verse: 1, text: "O Princípio" }];
        }
        return [];
      }
    );

    render(
      <MemoryRouter initialEntries={["/nvi/gn/1"]}>
        <Routes>
          <Route path="/:version/:book/:chapter" element={<ReadingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("O Princípio")).toBeInTheDocument();
    });

    const headingEl = screen.getByText("O Princípio");
    expect(headingEl.tagName).toBe("P");
    expect(headingEl.className).toContain("uppercase");
    expect(headingEl.className).toContain("font-serif");
  });

  it("renderiza subtítulo intermediário 'A Origem da Humanidade' antes do versículo 4", async () => {
    vi.spyOn(sectionHeadingsModule, "getHeadingsForChapter").mockImplementation(
      async (slug, ch, lang) => {
        if (lang.toLowerCase().startsWith("pt")) {
          return [{ before_verse: 4, text: "A Origem da Humanidade" }];
        }
        return [];
      }
    );

    render(
      <MemoryRouter initialEntries={["/nvi/gn/1"]}>
        <Routes>
          <Route path="/:version/:book/:chapter" element={<ReadingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("A Origem da Humanidade")).toBeInTheDocument();
    });
  });

  it("não renderiza subtítulos em versões em inglês (KJV)", async () => {
    vi.spyOn(sectionHeadingsModule, "getHeadingsForChapter").mockImplementation(
      async (slug, ch, lang) => {
        if (lang.toLowerCase().startsWith("pt")) {
          return [{ before_verse: 1, text: "O Princípio" }];
        }
        return [];
      }
    );

    render(
      <MemoryRouter initialEntries={["/kjv/gn/1"]}>
        <Routes>
          <Route path="/:version/:book/:chapter" element={<ReadingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("No princípio criou Deus os céus e a terra.")).toBeInTheDocument();
    });

    expect(screen.queryByText("O Princípio")).not.toBeInTheDocument();
  });

  it("renderiza subtítulos na coluna de comparação quando a versão comparada é pt-br", async () => {
    vi.spyOn(sectionHeadingsModule, "getHeadingsForChapter").mockImplementation(
      async (slug, ch, lang) => {
        if (lang.toLowerCase().startsWith("pt")) {
          return [{ before_verse: 1, text: "O Princípio" }];
        }
        return [];
      }
    );

    render(
      <MemoryRouter initialEntries={["/nvi/gn/1"]}>
        <Routes>
          <Route path="/:version/:book/:chapter" element={<ReadingPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("O Princípio")).toBeInTheDocument();
    });

    const compareToggle = screen.getByLabelText(/comparar/i);
    fireEvent.click(compareToggle);

    await waitFor(() => {
      const headings = screen.getAllByText("O Princípio");
      expect(headings.length).toBe(2);
    });
  });
});

