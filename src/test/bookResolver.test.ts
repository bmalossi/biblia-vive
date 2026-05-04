import { describe, it, expect } from "vitest";
import { resolveBook, getLocalId, ResolvedBook } from "@/lib/bookResolver";

describe("bookResolver", () => {
  describe("resolveBook", () => {
    it("should resolve slug to ResolvedBook", () => {
      const result = resolveBook("sl");
      expect(result).not.toBeNull();
      expect(result?.routeSlug).toBe("sl");
      expect(result?.localId).toBe("ps");
      expect(result?.name).toBe("Salmos");
      expect(result?.isOldTestament).toBe(true);
    });

    it("should resolve lowercase slug", () => {
      const result = resolveBook("joa");
      expect(result).not.toBeNull();
      expect(result?.routeSlug).toBe("joa");
      expect(result?.localId).toBe("jo");
    });

    it("should resolve book id alias to routeSlug", () => {
      const result = resolveBook("jm");
      expect(result).not.toBeNull();
      expect(result?.routeSlug).toBe("tg");
    });

    it("should resolve unknown identifier to null", () => {
      const result = resolveBook("xyz nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("getLocalId", () => {
    it("should return localId for route slug", () => {
      expect(getLocalId("sl")).toBe("ps");
    });

    it("should return slug itself when no mapping exists", () => {
      expect(getLocalId("gn")).toBe("gn");
    });

    it("should return slug itself for unmapped book", () => {
      expect(getLocalId("mt")).toBe("mt");
    });
  });
});