import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getHeadingsForChapter,
  getHeadingsForChapterSync,
  getHeadingsBeforeVerse,
  _resetHeadingsCache,
  type SectionHeading,
} from "@/lib/sectionHeadings";

// ─── Mock do fetch ────────────────────────────────────────────────────────────

const MOCK_DATA = {
  gn: {
    "1": [{ before_verse: 1, text: "O Princípio" }],
    "2": [
      { before_verse: 1, text: "Início de Gênesis 2" },
      { before_verse: 4, text: "A Origem da Humanidade" },
    ],
  },
  mt: {
    "1": [
      { before_verse: 1, text: "A Genealogia de Jesus" },
      { before_verse: 18, text: "O Nascimento de Jesus Cristo" },
    ],
  },
  ap: {
    "22": [
      { before_verse: 1, text: "O Rio da Vida" },
      { before_verse: 7, text: "Jesus Vem em Breve" },
    ],
  },
  "1rs": {
    "1": [{ before_verse: 1, text: "Adonias Declara-se Rei" }],
  },
  "1cr": {
    "1": [{ before_verse: 1, text: "A Descendência de Adão" }],
  },
  ne: {
    "1": [{ before_verse: 1, text: "A História de Neemias" }],
  },
  os: {
    "1": [{ before_verse: 2, text: "A Mulher e os Filhos de Oseias" }],
  },
};

function mockFetchSuccess() {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(MOCK_DATA),
  } as Response);
}

function mockFetchFailure() {
  global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
}

function mockFetch404() {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status: 404,
  } as Response);
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  _resetHeadingsCache();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── getHeadingsForChapter ────────────────────────────────────────────────────

describe("getHeadingsForChapter", () => {
  it("retorna [] imediatamente para lang não-pt sem realizar fetch", async () => {
    mockFetchSuccess();
    const result = await getHeadingsForChapter("gn", 1, "en");
    expect(result).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("retorna [] imediatamente para lang es sem realizar fetch", async () => {
    mockFetchSuccess();
    const result = await getHeadingsForChapter("gn", 1, "es");
    expect(result).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("retorna os headings corretos para Gênesis 1 (pt-BR)", async () => {
    mockFetchSuccess();
    const result = await getHeadingsForChapter("gn", 1, "pt-BR");
    expect(result).toEqual([{ before_verse: 1, text: "O Princípio" }]);
  });

  it("retorna os headings corretos para Gênesis 2 com múltiplos subtítulos", async () => {
    mockFetchSuccess();
    const result = await getHeadingsForChapter("gn", 2, "pt-BR");
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({ before_verse: 4, text: "A Origem da Humanidade" });
  });

  it("retorna os headings para Mateus 1 (pt-br minúsculo)", async () => {
    mockFetchSuccess();
    const result = await getHeadingsForChapter("mt", 1, "pt-br");
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ before_verse: 1, text: "A Genealogia de Jesus" });
    expect(result[1]).toEqual({ before_verse: 18, text: "O Nascimento de Jesus Cristo" });
  });

  it("retorna [] para livro sem subtítulos no JSON", async () => {
    mockFetchSuccess();
    const result = await getHeadingsForChapter("ps", 23, "pt-BR");
    expect(result).toEqual([]);
  });

  it("retorna [] para capítulo sem subtítulos no livro", async () => {
    mockFetchSuccess();
    const result = await getHeadingsForChapter("gn", 99, "pt-BR");
    expect(result).toEqual([]);
  });

  it("usa cache singleton — realiza apenas um fetch para múltiplas chamadas", async () => {
    mockFetchSuccess();
    await getHeadingsForChapter("gn", 1, "pt-BR");
    await getHeadingsForChapter("gn", 2, "pt-BR");
    await getHeadingsForChapter("mt", 1, "pt-BR");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retorna [] silenciosamente quando o fetch falha (offline)", async () => {
    mockFetchFailure();
    const result = await getHeadingsForChapter("gn", 1, "pt-BR");
    expect(result).toEqual([]);
  });

  it("retorna [] silenciosamente quando o servidor responde 404", async () => {
    mockFetch404();
    const result = await getHeadingsForChapter("gn", 1, "pt-BR");
    expect(result).toEqual([]);
  });

  it("não lança exceção em caso de falha de fetch", async () => {
    mockFetchFailure();
    await expect(getHeadingsForChapter("gn", 1, "pt-BR")).resolves.not.toThrow();
  });
});

// ─── getHeadingsForChapterSync ────────────────────────────────────────────────

describe("getHeadingsForChapterSync", () => {
  it("retorna [] antes do carregamento assíncrono", () => {
    const result = getHeadingsForChapterSync("gn", 1, "pt-BR");
    expect(result).toEqual([]);
  });

  it("retorna os headings corretos após carregamento", async () => {
    mockFetchSuccess();
    await getHeadingsForChapter("gn", 1, "pt-BR"); // carrega o cache
    const result = getHeadingsForChapterSync("gn", 1, "pt-BR");
    expect(result).toEqual([{ before_verse: 1, text: "O Princípio" }]);
  });

  it("retorna [] para lang não-pt mesmo com cache carregado", async () => {
    mockFetchSuccess();
    await getHeadingsForChapter("gn", 1, "pt-BR");
    const result = getHeadingsForChapterSync("gn", 1, "en");
    expect(result).toEqual([]);
  });
});

// ─── getHeadingsBeforeVerse ───────────────────────────────────────────────────

describe("getHeadingsBeforeVerse", () => {
  const headings: SectionHeading[] = [
    { before_verse: 1, text: "A Genealogia de Jesus" },
    { before_verse: 18, text: "O Nascimento de Jesus Cristo" },
  ];

  it("retorna o heading correto para versículo 1", () => {
    const result = getHeadingsBeforeVerse(headings, 1);
    expect(result).toEqual([{ before_verse: 1, text: "A Genealogia de Jesus" }]);
  });

  it("retorna o heading correto para versículo 18", () => {
    const result = getHeadingsBeforeVerse(headings, 18);
    expect(result).toEqual([{ before_verse: 18, text: "O Nascimento de Jesus Cristo" }]);
  });

  it("retorna [] para versículos sem subtítulo (ex: v5)", () => {
    const result = getHeadingsBeforeVerse(headings, 5);
    expect(result).toEqual([]);
  });

  it("retorna [] para lista de headings vazia", () => {
    const result = getHeadingsBeforeVerse([], 1);
    expect(result).toEqual([]);
  });

  it("retorna múltiplos headings se houver mais de um para o mesmo before_verse", () => {
    const multiHeadings: SectionHeading[] = [
      { before_verse: 4, text: "Seção A" },
      { before_verse: 4, text: "Seção B" },
    ];
    const result = getHeadingsBeforeVerse(multiHeadings, 4);
    expect(result).toHaveLength(2);
  });
});

// ─── Verificação dos exemplos do PRD ─────────────────────────────────────────

describe("Exemplos do PRD (integração com mock JSON)", () => {
  beforeEach(() => {
    mockFetchSuccess();
  });

  it("Gn 1:1 → 'O Princípio'", async () => {
    const headings = await getHeadingsForChapter("gn", 1, "pt-BR");
    const before1 = getHeadingsBeforeVerse(headings, 1);
    expect(before1[0].text).toBe("O Princípio");
  });

  it("Gn 2:4 → 'A Origem da Humanidade'", async () => {
    const headings = await getHeadingsForChapter("gn", 2, "pt-BR");
    const before4 = getHeadingsBeforeVerse(headings, 4);
    expect(before4[0].text).toBe("A Origem da Humanidade");
  });

  it("Mt 1:1 → 'A Genealogia de Jesus'", async () => {
    const headings = await getHeadingsForChapter("mt", 1, "pt-BR");
    const before1 = getHeadingsBeforeVerse(headings, 1);
    expect(before1[0].text).toBe("A Genealogia de Jesus");
  });

  it("Mt 1:18 → 'O Nascimento de Jesus Cristo'", async () => {
    const headings = await getHeadingsForChapter("mt", 1, "pt-BR");
    const before18 = getHeadingsBeforeVerse(headings, 18);
    expect(before18[0].text).toBe("O Nascimento de Jesus Cristo");
  });

  it("Ap 22:1 → 'O Rio da Vida' (slug canônico 'ap')", async () => {
    const headings = await getHeadingsForChapter("ap", 22, "pt-BR");
    const before1 = getHeadingsBeforeVerse(headings, 1);
    expect(before1[0].text).toBe("O Rio da Vida");
  });

  it("Ap 22:7 → 'Jesus Vem em Breve' (slug canônico 'ap')", async () => {
    const headings = await getHeadingsForChapter("ap", 22, "pt-BR");
    const before7 = getHeadingsBeforeVerse(headings, 7);
    expect(before7[0].text).toBe("Jesus Vem em Breve");
  });

  it("1 Reis 1:1 → 'Adonias Declara-se Rei' (slug canônico '1rs')", async () => {
    const headings = await getHeadingsForChapter("1rs", 1, "pt-BR");
    const before1 = getHeadingsBeforeVerse(headings, 1);
    expect(before1[0].text).toBe("Adonias Declara-se Rei");
  });

  it("1 Reis 1:1 → resolve via ID 'kg1'", async () => {
    const headings = await getHeadingsForChapter("kg1", 1, "pt-BR");
    const before1 = getHeadingsBeforeVerse(headings, 1);
    expect(before1[0].text).toBe("Adonias Declara-se Rei");
  });

  it("1 Crônicas 1:1 → 'A Descendência de Adão' (slug canônico '1cr')", async () => {
    const headings = await getHeadingsForChapter("1cr", 1, "pt-BR");
    const before1 = getHeadingsBeforeVerse(headings, 1);
    expect(before1[0].text).toBe("A Descendência de Adão");
  });

  it("Neemias 1:1 → 'A História de Neemias' (slug canônico 'ne')", async () => {
    const headings = await getHeadingsForChapter("ne", 1, "pt-BR");
    const before1 = getHeadingsBeforeVerse(headings, 1);
    expect(before1[0].text).toBe("A História de Neemias");
  });

  it("Oséias 1:2 → 'A Mulher e os Filhos de Oseias' (slug canônico 'os')", async () => {
    const headings = await getHeadingsForChapter("os", 1, "pt-BR");
    const before2 = getHeadingsBeforeVerse(headings, 2);
    expect(before2[0].text).toBe("A Mulher e os Filhos de Oseias");
  });
});

