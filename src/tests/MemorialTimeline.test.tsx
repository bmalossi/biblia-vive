import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MemorialTimeline from "@/components/memorial/MemorialTimeline";
import type { MemorialEntry } from "@/lib/noteStore";

const mockEntries: MemorialEntry[] = [
  {
    id: "entry-1",
    userId: "user-1",
    bookId: "sl",
    bookName: "Salmos",
    chapter: 23,
    verse: 1,
    version: "acf",
    type: "testimony",
    title: "Vitória na tempestade",
    content: "O Senhor supriu todas as nossas necessidades.",
    answeredAt: "2026-03-01T10:00:00Z",
    createdAt: "2026-03-01T10:00:00Z",
    updatedAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "entry-2",
    userId: "user-1",
    bookId: "fp",
    bookName: "Filipenses",
    chapter: 4,
    verse: 6,
    version: "acf",
    type: "prayer",
    title: "Paz para a decisão",
    content: "Apresentando a oração em súplica com ação de graças.",
    createdAt: "2026-02-15T08:00:00Z",
    updatedAt: "2026-02-15T08:00:00Z",
  },
  {
    id: "entry-3",
    userId: "user-1",
    bookId: "rm",
    bookName: "Romanos",
    chapter: 8,
    verse: 28,
    version: "acf",
    type: "reflection",
    title: "Todas as coisas cooperam",
    content: "Meditação no propósito eterno de Deus.",
    createdAt: "2025-11-10T14:00:00Z",
    updatedAt: "2025-11-10T14:00:00Z",
  },
];

describe("MemorialTimeline Component", () => {
  it("renders empty state message when entries array is empty", () => {
    render(<MemorialTimeline entries={[]} />);

    expect(screen.getByText(/Nenhuma marca encontrada/i)).toBeInTheDocument();
  });

  it("renders all entries with alternating side attributes on desktop", () => {
    render(
      <MemorialTimeline
        entries={mockEntries}
        renderCard={(entry) => <div data-testid={`card-${entry.id}`}>{entry.title}</div>}
      />
    );

    expect(screen.getByTestId("card-entry-1")).toBeInTheDocument();
    expect(screen.getByTestId("card-entry-2")).toBeInTheDocument();
    expect(screen.getByTestId("card-entry-3")).toBeInTheDocument();

    const timelineItems = screen.getAllByTestId("timeline-item");
    expect(timelineItems).toHaveLength(3);
    expect(timelineItems[0]).toHaveAttribute("data-side", "left");
    expect(timelineItems[1]).toHaveAttribute("data-side", "right");
    expect(timelineItems[2]).toHaveAttribute("data-side", "left");
  });

  it("renders specific geometric nodes for each entry type", () => {
    render(
      <MemorialTimeline
        entries={mockEntries}
        renderCard={(entry) => <div>{entry.title}</div>}
      />
    );

    expect(screen.getByTestId("timeline-node-testimony")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-node-prayer")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-node-reflection")).toBeInTheDocument();
  });

  it("renders continuous axis with milestone badges", () => {
    render(
      <MemorialTimeline
        entries={mockEntries}
        renderCard={(entry) => <div>{entry.title}</div>}
      />
    );

    expect(screen.getByTestId("sacred-timeline-axis")).toBeInTheDocument();
    // Milestone badges should be rendered
    const milestones = screen.getAllByTestId("timeline-milestone");
    expect(milestones.length).toBeGreaterThanOrEqual(1);
  });
});
