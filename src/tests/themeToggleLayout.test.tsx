import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ThemeToggle from "@/components/ThemeToggle";
import { getTheme, setTheme } from "@/lib/themes";

describe("Seletor de Tema (White, Sépia e Dark)", () => {
  beforeEach(() => {
    localStorage.clear();
    setTheme("light");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renderiza as 3 opções de tema (White, Sépia, Dark) visíveis e acessíveis simultaneamente", () => {
    render(<ThemeToggle fullWidth />);

    const whiteBtn = screen.getByTestId("theme-option-light");
    const sepiaBtn = screen.getByTestId("theme-option-sepia");
    const darkBtn = screen.getByTestId("theme-option-dark");

    expect(whiteBtn).toBeInTheDocument();
    expect(sepiaBtn).toBeInTheDocument();
    expect(darkBtn).toBeInTheDocument();

    expect(screen.getByText("White")).toBeInTheDocument();
    expect(screen.getByText("Sépia")).toBeInTheDocument();
    expect(screen.getByText("Dark")).toBeInTheDocument();
  });

  it("garante que o container utiliza grid de 3 colunas (grid-cols-3) para nunca estourar ou requerer scroll lateral", () => {
    const { container } = render(<ThemeToggle fullWidth />);
    const group = container.querySelector('[role="group"]');

    expect(group).toHaveClass("grid");
    expect(group).toHaveClass("grid-cols-3");
  });

  it("permite selecionar o tema Dark diretamente sem corte visual e atualiza o estado global", () => {
    render(<ThemeToggle fullWidth />);

    const darkBtn = screen.getByTestId("theme-option-dark");
    fireEvent.click(darkBtn);

    expect(getTheme()).toBe("dark");
    expect(darkBtn).toHaveAttribute("aria-checked", "true");
    expect(darkBtn.className).toContain("text-gold");
  });

  it("permite alternar para Sépia e White com os respectivos estilos temáticos", () => {
    render(<ThemeToggle fullWidth />);

    const sepiaBtn = screen.getByTestId("theme-option-sepia");
    fireEvent.click(sepiaBtn);

    expect(getTheme()).toBe("sepia");
    expect(sepiaBtn).toHaveAttribute("aria-checked", "true");

    const whiteBtn = screen.getByTestId("theme-option-light");
    fireEvent.click(whiteBtn);

    expect(getTheme()).toBe("light");
    expect(whiteBtn).toHaveAttribute("aria-checked", "true");
  });
});
