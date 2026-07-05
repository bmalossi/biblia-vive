import { describe, it, expect } from "vitest";
import { translateUsageTag, getTranslatedBdb } from "../lib/lexiconTranslator";

describe("lexiconTranslator", () => {
  describe("translateUsageTag", () => {
    it("should translate common tags to Portuguese when locale is pt-BR", () => {
      expect(translateUsageTag("father", "pt-BR")).toBe("pai");
      expect(translateUsageTag("destruction", "pt-BR")).toBe("destruição");
      expect(translateUsageTag("angels", "pt")).toBe("anjos");
    });

    it("should translate common tags to Spanish when locale is es", () => {
      expect(translateUsageTag("father", "es")).toBe("padre");
      expect(translateUsageTag("destruction", "es")).toBe("destrucción");
      expect(translateUsageTag("angels", "es-ES")).toBe("ángeles");
    });

    it("should return the original tag when locale is English", () => {
      expect(translateUsageTag("father", "en")).toBe("father");
      expect(translateUsageTag("destruction", "en-US")).toBe("destruction");
    });

    it("should return the original tag when no translation is found", () => {
      expect(translateUsageTag("unknown_lexical_tag", "pt-BR")).toBe("unknown_lexical_tag");
      expect(translateUsageTag("unknown_lexical_tag", "es")).toBe("unknown_lexical_tag");
    });

    it("should handle empty or undefined input gracefully", () => {
      expect(translateUsageTag("", "pt-BR")).toBe("");
    });
  });

  describe("getTranslatedBdb", () => {
    const englishSample = "father, in a literal and immediate sense";

    it("should return curated PT translation for H1 when locale is pt-BR", () => {
      const result = getTranslatedBdb("H1", englishSample, "pt-BR");
      expect(result).toEqual({
        text: "chefe de família, clã ou casa paterna",
        isOriginal: false
      });
    });

    it("should return curated PT translation for H2142 when locale is pt-BR", () => {
      const result = getTranslatedBdb("H2142", englishSample, "pt-BR");
      expect(result).toEqual({
        text: "lembrar, recordar, trazer à mente, geralmente afetando o sentimento ou pensamento atual",
        isOriginal: false
      });
    });

    it("should return curated ES translation for H1 when locale is es", () => {
      const result = getTranslatedBdb("H1", englishSample, "es");
      expect(result).toEqual({
        text: "jefe de familia, clan o casa paterna",
        isOriginal: false
      });
    });

    it("should return original English text when locale is en", () => {
      const result = getTranslatedBdb("H1", englishSample, "en");
      expect(result).toEqual({
        text: englishSample,
        isOriginal: false
      });
    });

    it("should fallback to English with isOriginal: true when no curated translation is found for pt-BR", () => {
      const result = getTranslatedBdb("H9999", englishSample, "pt-BR");
      expect(result).toEqual({
        text: englishSample,
        isOriginal: true
      });
    });

    it("should fallback to English with isOriginal: true when no curated translation is found for es", () => {
      const result = getTranslatedBdb("H9999", englishSample, "es");
      expect(result).toEqual({
        text: englishSample,
        isOriginal: true
      });
    });
  });
});
