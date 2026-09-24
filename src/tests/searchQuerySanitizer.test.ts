import { describe, it, expect } from "vitest";
import { sanitizeFtsQuery, buildFtsSearchSql } from "../../cloudflare/search-worker/src/querySanitizer";

describe("Motor de Busca Bíblica (FTS5 Query Sanitizer)", () => {
  it("deve converter múltiplos termos em conjunção AND com prefixos para localizar termos intercalados", () => {
    // Caso de uso canônico: "há júbilo" deve achar "porque há grande júbilo"
    const sanitized = sanitizeFtsQuery("há júbilo");
    expect(sanitized).toBe('"ha"* AND "jubilo"*');
  });

  it("deve preservar frases exatas quando o usuário colocar aspas", () => {
    const sanitized = sanitizeFtsQuery('"no princípio criou Deus"');
    expect(sanitized).toBe('"no principio criou Deus"');
  });

  it("deve remover caracteres especiais que quebram a sintaxe do FTS5", () => {
    const sanitized = sanitizeFtsQuery("Deus (amor) AND OR NOT * ^ : { }");
    expect(sanitized).toBe('"Deus"* AND "amor"*');
  });

  it("deve normalizar acentos para casar com o tokenizer unicode61", () => {
    const sanitized = sanitizeFtsQuery("exortação consolação");
    expect(sanitized).toBe('"exortacao"* AND "consolacao"*');
  });

  it("deve retornar string vazia para buscas vazias ou apenas espaços e caracteres inválidos", () => {
    expect(sanitizeFtsQuery("")).toBe("");
    expect(sanitizeFtsQuery("   ")).toBe("");
    expect(sanitizeFtsQuery("*** ::: ( )")).toBe("");
  });

  it("deve montar o SQL de busca FTS5 com filtro de versão e paginação correta", () => {
    const result = buildFtsSearchSql({
      rawQuery: "há júbilo",
      version: "acf",
      limit: 10,
      offset: 0,
    });

    expect(result.sql).toContain("FROM bible_search_fts");
    expect(result.sql).toContain("bible_search_fts MATCH ?");
    expect(result.sql).toContain("version = ?");
    expect(result.sql).toContain("ORDER BY rank");
    expect(result.params).toEqual(['"ha"* AND "jubilo"*', "acf", 10, 0]);
  });

  it("deve omitir a cláusula de versão quando v=all", () => {
    const result = buildFtsSearchSql({
      rawQuery: "amor",
      version: "all",
      limit: 20,
      offset: 0,
    });

    expect(result.sql).not.toContain("version = ?");
    expect(result.params).toEqual(['"amor"*', 20, 0]);
  });
});
