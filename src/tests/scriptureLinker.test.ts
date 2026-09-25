import { describe, it, expect } from "vitest";
import { linkifyScriptureReferences, getScriptureUrl } from "@/lib/scriptureLinker";

describe("scriptureLinker", () => {
  describe("getScriptureUrl", () => {
    it("deve gerar URL correta com versículo", () => {
      expect(getScriptureUrl("Romanos", 11, 36)).toBe("/acf/rm/11#v36");
      expect(getScriptureUrl("Lucas", 24, 27)).toBe("/acf/lc/24#v27");
      expect(getScriptureUrl("João", 5, 39)).toBe("/acf/joa/5#v39");
      expect(getScriptureUrl("Salmo", 28, 7)).toBe("/acf/sl/28#v7");
    });

    it("deve gerar URL sem versículo para capítulos inteiros", () => {
      expect(getScriptureUrl("Salmo", 23)).toBe("/acf/sl/23");
      expect(getScriptureUrl("Romanos", 8)).toBe("/acf/rm/8");
    });

    it("deve retornar null para livro inexistente ou capítulo inválido", () => {
      expect(getScriptureUrl("Inexistente", 1)).toBeNull();
      expect(getScriptureUrl("Romanos", 999)).toBeNull();
      expect(getScriptureUrl("Romanos", 0)).toBeNull();
    });
  });

  describe("linkifyScriptureReferences", () => {
    it("deve transformar citações bíblicas em links Markdown interativos", () => {
      const input = '“Todas as coisas vêm dele...” — Romanos 11:36 e Lucas 24:27.';
      const output = linkifyScriptureReferences(input);
      expect(output).toContain("[Romanos 11:36](/acf/rm/11#v36)");
      expect(output).toContain("[Lucas 24:27](/acf/lc/24#v27)");
    });

    it("deve reconhecer citações em parênteses", () => {
      const input = "Jesus disse que a Bíblia fala sobre Ele (João 5:39).";
      const output = linkifyScriptureReferences(input);
      expect(output).toBe("Jesus disse que a Bíblia fala sobre Ele ([João 5:39](/acf/joa/5#v39)).");
    });

    it("deve reconhecer Salmo no singular e Salmos no plural", () => {
      expect(linkifyScriptureReferences("Salmo 23")).toBe("[Salmo 23](/acf/sl/23)");
      expect(linkifyScriptureReferences("Salmos 28:7")).toBe("[Salmos 28:7](/acf/sl/28#v7)");
    });

    it("deve reconhecer livros numerados e abreviações com ou sem espaço", () => {
      expect(linkifyScriptureReferences("1 Coríntios 13:4-8")).toBe("[1 Coríntios 13:4-8](/acf/1co/13#v4)");
      expect(linkifyScriptureReferences("2 Timóteo 3:16")).toBe("[2 Timóteo 3:16](/acf/2tm/3#v16)");
      expect(linkifyScriptureReferences("1 Jo 1:9")).toBe("[1 Jo 1:9](/acf/1jo/1#v9)");
      expect(linkifyScriptureReferences("1Jo 1:9")).toBe("[1Jo 1:9](/acf/1jo/1#v9)");
      expect(linkifyScriptureReferences("I Coríntios 13:4")).toBe("[I Coríntios 13:4](/acf/1co/13#v4)");
    });

    it("NÃO deve alterar links já existentes", () => {
      const input = "[Meu link para Romanos 11:36](https://externo.com)";
      expect(linkifyScriptureReferences(input)).toBe(input);
    });

    it("NÃO deve alterar código inline ou blocos de código", () => {
      const inlineCode = "`Romanos 11:36`";
      expect(linkifyScriptureReferences(inlineCode)).toBe(inlineCode);

      const codeBlock = "```\nLucas 24:27\n```";
      expect(linkifyScriptureReferences(codeBlock)).toBe(codeBlock);
    });

    it("NÃO deve alterar tags HTML", () => {
      const img = '<img src="/foto.jpg" alt="Lucas 24:27" />';
      expect(linkifyScriptureReferences(img)).toBe(img);
    });
  });
});
