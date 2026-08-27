import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemorialStoneStack } from "@/components/memorial/MemorialStoneStack";

describe("MemorialStoneStack Component", () => {
  it("renders empty altar state when totalEntries is 0", () => {
    render(<MemorialStoneStack totalEntries={0} />);

    expect(
      screen.getByText("Seu altar de memórias está pronto para começar")
    ).toBeInTheDocument();
    expect(screen.getByText("0 registros")).toBeInTheDocument();
    expect(screen.getByText(/Até aqui nos ajudou o Senhor/i)).toBeInTheDocument();
  });

  it("renders single entry state correctly", () => {
    render(<MemorialStoneStack totalEntries={1} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("marco de fé preservado")).toBeInTheDocument();
    expect(screen.getByText("1 registro")).toBeInTheDocument();
  });

  it("renders multiple entries state correctly with plural formatting", () => {
    render(<MemorialStoneStack totalEntries={12} />);

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("marcos de fé preservados")).toBeInTheDocument();
    expect(screen.getByText("12 registros")).toBeInTheDocument();
  });
});
