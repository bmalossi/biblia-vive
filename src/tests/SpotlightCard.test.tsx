import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SpotlightCard from "@/components/memorial/SpotlightCard";

describe("SpotlightCard Component", () => {
  it("renders children correctly", () => {
    render(
      <SpotlightCard>
        <div>Conteúdo do Marco Sagrado</div>
      </SpotlightCard>
    );

    expect(screen.getByText("Conteúdo do Marco Sagrado")).toBeInTheDocument();
  });

  it("applies design system classes with theme compatibility", () => {
    const { container } = render(
      <SpotlightCard className="custom-card-class">
        <span>Teste</span>
      </SpotlightCard>
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("custom-card-class");
    expect(card).toHaveClass("relative");
    expect(card).toHaveClass("overflow-hidden");
    expect(card).toHaveClass("bg-app-surface");
    expect(card).toHaveClass("border-border");
  });

  it("updates CSS variables on mouse move", () => {
    const { container } = render(
      <SpotlightCard spotlightColor="rgba(217, 119, 6, 0.2)">
        <div>Hover test</div>
      </SpotlightCard>
    );

    const card = container.firstChild as HTMLElement;
    card.getBoundingClientRect = () => ({
      left: 100,
      top: 50,
      right: 300,
      bottom: 250,
      width: 200,
      height: 200,
      x: 100,
      y: 50,
      toJSON: () => {},
    });

    fireEvent.mouseMove(card, { clientX: 150, clientY: 120 });

    expect(card.style.getPropertyValue("--mouse-x")).toBe("50px");
    expect(card.style.getPropertyValue("--mouse-y")).toBe("70px");
    expect(card.style.getPropertyValue("--spotlight-color")).toBe("rgba(217, 119, 6, 0.2)");
  });
});
