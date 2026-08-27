import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EchoBanner from "@/components/EchoBanner";
import type { MemorialEntry } from "@/lib/noteStore";

const mockEntry: MemorialEntry = {
  id: "entry-1",
  userId: "user-1",
  bookId: "sl",
  bookName: "Salmos",
  chapter: 23,
  verse: 1,
  type: "reflection",
  title: "O Senhor é meu pastor",
  content: "Nada me faltará.",
  tags: ["confiança"],
  version: "NVI",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("EchoBanner Component", () => {
  it("renders direct echo context correctly", () => {
    const onOpen = vi.fn();
    render(
      <EchoBanner
        entry={mockEntry}
        echoContext="direct"
        onOpenModal={onOpen}
      />
    );

    expect(screen.getByText(/você colocou uma reflexão/i)).toBeInTheDocument();
    expect(screen.getByText(/"O Senhor é meu pastor"/i)).toBeInTheDocument();
    expect(screen.getByText("Reencontrar")).toBeInTheDocument();
  });

  it("renders anniversary badge for anniversary context", () => {
    const onOpen = vi.fn();
    render(
      <EchoBanner
        entry={mockEntry}
        echoContext="anniversary"
        onOpenModal={onOpen}
      />
    );

    expect(screen.getByText("Marco histórico")).toBeInTheDocument();
  });

  it("calls onOpenModal when clicking Reencontrar", () => {
    const onOpen = vi.fn();
    render(
      <EchoBanner
        entry={mockEntry}
        echoContext="direct"
        onOpenModal={onOpen}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /reencontrar/i }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
