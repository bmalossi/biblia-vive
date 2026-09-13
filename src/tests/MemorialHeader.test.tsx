import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MemorialHeader from "@/components/memorial/MemorialHeader";

describe("MemorialHeader Component", () => {
  it("renders Ebenezer stone altar and total count without category counters", () => {
    render(
      <MemorialHeader
        totalEntries={7}
        filteredCount={7}
        searchQuery=""
        onSearchChange={vi.fn()}
        activeFilter="all"
        onFilterChange={vi.fn()}
        onNewEntry={vi.fn()}
        onExportTXT={vi.fn()}
        onExportPDF={vi.fn()}
        isPro={false}
      />
    );

    // Should display total count in Ebenezer altar
    expect(screen.getByText("7 registros")).toBeInTheDocument();
    expect(screen.getByText(/Até aqui nos ajudou o Senhor/i)).toBeInTheDocument();

    // Check filter tabs have labels without counters
    expect(screen.getByRole("tab", { name: "Todos" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Reflexões" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Orações" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Testemunhos" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Propósitos" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Respondidas" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Favoritos" })).toBeInTheDocument();

    // Verify there are no anxiety counters in tabs (e.g. "Reflexões (3)" should not exist)
    expect(screen.queryByText(/Reflexões \(/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Orações \(/i)).not.toBeInTheDocument();
  });

  it("calls onSearchChange when typing in the search input", () => {
    const handleSearch = vi.fn();

    render(
      <MemorialHeader
        totalEntries={5}
        filteredCount={5}
        searchQuery=""
        onSearchChange={handleSearch}
        activeFilter="all"
        onFilterChange={vi.fn()}
        onNewEntry={vi.fn()}
        onExportTXT={vi.fn()}
        onExportPDF={vi.fn()}
        isPro={false}
      />
    );

    const input = screen.getByLabelText("Buscar marcos de fé");
    fireEvent.change(input, { target: { value: "Salmos" } });

    expect(handleSearch).toHaveBeenCalledWith("Salmos");
  });

  it("calls onNewEntry when clicking '+ Novo marco de fé'", () => {
    const handleNewEntry = vi.fn();

    render(
      <MemorialHeader
        totalEntries={5}
        filteredCount={5}
        searchQuery=""
        onSearchChange={vi.fn()}
        activeFilter="all"
        onFilterChange={vi.fn()}
        onNewEntry={handleNewEntry}
        onExportTXT={vi.fn()}
        onExportPDF={vi.fn()}
        isPro={false}
      />
    );

    const btn = screen.getByRole("button", { name: /Novo marco de fé/i });
    fireEvent.click(btn);

    expect(handleNewEntry).toHaveBeenCalled();
  });
});
