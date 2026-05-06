import { describe, it, expect } from "vitest";
import { generateSlug } from "../lib/slug";

describe("generateSlug", () => {
  it("converts spaces to hyphens", () => {
    expect(generateSlug("Como orar todos os dias")).toBe("como-orar-todos-os-dias");
  });

  it("removes accents", () => {
    expect(generateSlug("Comunicação é钥匙")).toBe("comunicacao-e");
  });

  it("removes special characters", () => {
    expect(generateSlug("Test @#$% Article!")).toBe("test-article");
  });

  it("removes leading/trailing hyphens", () => {
    expect(generateSlug("  leading and trailing  ")).toBe("leading-and-trailing");
  });

  it("collapses multiple hyphens", () => {
    expect(generateSlug("multiple   spaces")).toBe("multiple-spaces");
  });

  it("handles empty string", () => {
    expect(generateSlug("")).toBe("");
  });
});