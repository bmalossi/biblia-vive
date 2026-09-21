import { describe, it, expect, beforeEach, vi } from "vitest";
import type { MemorialEntry } from "@/lib/noteStore";
import {
  buildHybridNotePool,
  getNotesVersion,
  bumpNotesVersion,
  getCachedThreadResult,
  setCachedThreadResult,
  rankCandidateNote,
  type ScriptureThreadResult,
} from "@/lib/scriptureThread";

describe("Fio da Escritura — Seleção Híbrida Tripla (buildHybridNotePool)", () => {
  const makeEntry = (id: string, overrides: Partial<MemorialEntry> = {}): MemorialEntry => ({
    id,
    type: "reflection",
    title: `Nota ${id}`,
    content: `Conteúdo da nota ${id}`,
    bookId: "gn",
    bookName: "Gênesis",
    chapter: 1,
    verse: 1,
    favorite: false,
    createdAt: new Date("2025-01-01T00:00:00Z").toISOString(),
    updatedAt: new Date("2025-01-01T00:00:00Z").toISOString(),
    ...overrides,
  });

  it("retorna array vazio quando a lista de notas é vazia", () => {
    const pool = buildHybridNotePool([], "rm", 30);
    expect(pool).toEqual([]);
  });

  it("retorna todas as notas sem repetição quando o total de notas é menor que o limite", () => {
    const notes = [
      makeEntry("1", { title: "Nota 1" }),
      makeEntry("2", { title: "Nota 2", favorite: true }),
    ];
    const pool = buildHybridNotePool(notes, "rm", 30);
    expect(pool).toHaveLength(2);
    expect(pool.map((n) => n.id)).toEqual(["1", "2"]);
  });

  it("deduplica notas que pertencem a mais de uma categoria (recente + favorita + afinidade)", () => {
    // Nota 1 é recente, favorita e do mesmo livro (Romanos)
    const notes = [
      makeEntry("1", {
        bookId: "rm",
        favorite: true,
        updatedAt: new Date("2026-03-01T12:00:00Z").toISOString(),
      }),
      makeEntry("2", {
        bookId: "sl",
        favorite: false,
        updatedAt: new Date("2025-01-01T00:00:00Z").toISOString(),
      }),
    ];

    const pool = buildHybridNotePool(notes, "rm", 30);
    const ids = pool.map((n) => n.id);
    expect(ids.filter((id) => id === "1")).toHaveLength(1);
    expect(pool).toHaveLength(2);
  });

  it("respeita rigorosamente o teto máximo de notas configurado", () => {
    const notes: MemorialEntry[] = [];
    for (let i = 1; i <= 50; i++) {
      notes.push(
        makeEntry(`note-${i}`, {
          updatedAt: new Date(Date.now() - i * 1000).toISOString(),
          favorite: i % 2 === 0,
          bookId: i % 3 === 0 ? "rm" : "mt",
        })
      );
    }

    const pool = buildHybridNotePool(notes, "rm", 10);
    expect(pool).toHaveLength(10);
  });

  it("inclui notas favoritas e com afinidade canônica mesmo que mais antigas", () => {
    const notes: MemorialEntry[] = [];
    // 20 notas recentes não-favoritas de outro livro/testamento
    for (let i = 1; i <= 20; i++) {
      notes.push(
        makeEntry(`recent-${i}`, {
          updatedAt: new Date(2026, 2, 20 - i).toISOString(),
          bookId: "ex",
          favorite: false,
        })
      );
    }

    // 1 nota antiga favoritada de outro livro
    const oldFavorite = makeEntry("old-fav", {
      updatedAt: new Date(2020, 0, 1).toISOString(),
      favorite: true,
      bookId: "sl",
    });
    notes.push(oldFavorite);

    // 1 nota antiga com afinidade temática direta (mesmo livro: Romanos)
    const affinityNote = makeEntry("same-book-note", {
      updatedAt: new Date(2021, 0, 1).toISOString(),
      favorite: false,
      bookId: "rm",
    });
    notes.push(affinityNote);

    const pool = buildHybridNotePool(notes, "rm", 30);
    const poolIds = pool.map((n) => n.id);

    expect(poolIds).toContain("old-fav");
    expect(poolIds).toContain("same-book-note");
  });
});

describe("Fio da Escritura — Cache Reativo por Versão (localStorage)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const dummyResult: ScriptureThreadResult = {
    category: "Cumprimento_Profetico",
    confidence: 0.95,
    relevanceScore: 9.0,
    matchedNoteId: "note-1",
    matchedNoteExcerpt: "Texto da nota de exemplo",
    evaluatedAt: new Date().toISOString(),
    notesVersion: "1",
  };

  it("retorna null se não houver resultado em cache para o capítulo", () => {
    const cached = getCachedThreadResult("rm", 8, "user-123");
    expect(cached).toBeNull();
  });

  it("salva e recupera o resultado quando a versão das notas permanece idêntica", () => {
    setCachedThreadResult("rm", 8, "user-123", dummyResult);
    const cached = getCachedThreadResult("rm", 8, "user-123");

    expect(cached).not.toBeNull();
    expect(cached?.category).toBe("Cumprimento_Profetico");
    expect(cached?.confidence).toBe(0.95);
  });

  it("invalida o cache automaticamente quando a versão das notas é incrementada (bumpNotesVersion)", () => {
    setCachedThreadResult("rm", 8, "user-123", dummyResult);

    // Confirma que o cache está ativo
    expect(getCachedThreadResult("rm", 8, "user-123")).not.toBeNull();

    // Simula a adição ou edição de uma nota
    bumpNotesVersion();

    // Cache deve ser invalidado imediatamente
    const afterBump = getCachedThreadResult("rm", 8, "user-123");
    expect(afterBump).toBeNull();
  });
});

describe("Fio da Escritura — Heurística da Nota Candidata (rankCandidateNote)", () => {
  const makeEntry = (id: string, bookId: string, updatedAt: string): MemorialEntry => ({
    id,
    type: "reflection",
    title: `Nota ${id}`,
    content: `Conteúdo da nota ${id}`,
    bookId,
    bookName: bookId,
    chapter: 1,
    verse: 1,
    favorite: false,
    createdAt: updatedAt,
    updatedAt,
  });

  it("prioriza a nota do mesmo livro bíblico do capítulo lido", () => {
    const notes = [
      makeEntry("nt-note", "mt", "2026-03-01T00:00:00Z"),
      makeEntry("same-book", "rm", "2025-01-01T00:00:00Z"), // mais antiga, mas mesmo livro
      makeEntry("ot-note", "gn", "2026-03-10T00:00:00Z"),
    ];

    const candidate = rankCandidateNote(notes, "rm");
    expect(candidate?.id).toBe("same-book");
  });

  it("prioriza notas do mesmo testamento quando não há nota do mesmo livro", () => {
    // Capítulo sendo lido é Hebreus (hb - Novo Testamento)
    const notes = [
      makeEntry("ot-1", "gn", "2026-03-01T00:00:00Z"), // Antigo Testamento
      makeEntry("nt-1", "joao", "2025-01-01T00:00:00Z"), // Novo Testamento
    ];

    const candidate = rankCandidateNote(notes, "hb");
    expect(candidate?.id).toBe("nt-1");
  });

  it("prioriza notas tipológicas do Antigo Testamento quando a categoria é Cumprimento Profético no Novo Testamento", () => {
    // Capítulo lido: Romanos (Novo Testamento)
    // Nota 1: Marcos 6 (Novo Testamento, antiga)
    // Nota 2: Gênesis 22 (Antigo Testamento, favorita / tipológica)
    const notes: MemorialEntry[] = [
      makeEntry("nt-marcos", "mr", "2026-08-16T00:00:00Z"),
      {
        ...makeEntry("ot-genesis", "gn", "2026-09-21T00:00:00Z"),
        favorite: true,
        title: "Gênesis 22:8 - O Cordeiro que tira o pecado",
      },
    ];

    const candidate = rankCandidateNote(notes, "rm", "Cumprimento_Profetico");
    expect(candidate?.id).toBe("ot-genesis");
  });

  it("retorna null se a lista de notas fornecida for vazia", () => {
    const candidate = rankCandidateNote([], "rm");
    expect(candidate).toBeNull();
  });
});

describe("Fio da Escritura — Integração de Invalidação com NoteStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("salvar uma nova nota via LocalNoteStore invalida o cache reativo do Fio da Escritura", async () => {
    const { createNoteStore } = await import("@/lib/noteStore");
    const store = createNoteStore(null);

    const dummy: ScriptureThreadResult = {
      category: "Cumprimento_Profetico",
      confidence: 0.95,
      relevanceScore: 9.0,
      evaluatedAt: new Date().toISOString(),
      notesVersion: "1",
    };

    setCachedThreadResult("rm", 8, null, dummy);
    expect(getCachedThreadResult("rm", 8, null)).not.toBeNull();

    await store.save({
      bookId: "rm",
      chapter: 8,
      verse: 1,
      type: "reflection",
      title: "Nova reflexão",
      content: "Portanto agora nenhuma condenação há...",
    });

    expect(getCachedThreadResult("rm", 8, null)).toBeNull();
  });
});

describe("Fio da Escritura — Evaluator e Confidence-Gated Routing (evaluateScriptureThread)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const notesSample: MemorialEntry[] = [
    {
      id: "n-1",
      type: "reflection",
      title: "Promessa em Isaías",
      content: "Certamente ele tomou sobre si as nossas enfermidades...",
      bookId: "is",
      bookName: "Isaías",
      chapter: 53,
      verse: 4,
      favorite: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it("retorna null de forma reverente quando o endpoint responde com thread null", async () => {
    const { evaluateScriptureThread } = await import("@/lib/scriptureThread");
    const originalFetch = global.fetch;

    global.fetch = vi.fn().mockImplementation((input: any, init?: any) => {
      const url = typeof input === "string" ? input : input?.url || "";
      if (url.includes("/api/scripture-thread")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ thread: null }),
        });
      }
      return originalFetch ? originalFetch(input, init) : Promise.resolve({ ok: true, json: async () => ({}) });
    });

    const { result, candidateNote } = await evaluateScriptureThread({
      chapterText: "Portanto, agora nenhuma condenação há...",
      chapterRef: "Romanos 8",
      bookId: "rm",
      chapter: 8,
      allNotes: notesSample,
      userId: "user-1",
    });

    expect(result).toBeNull();
    expect(candidateNote).toBeNull();
  });

  it("retorna ScriptureThreadResult e salva em cache quando a conexão de alta confiança é confirmada", async () => {
    const { evaluateScriptureThread } = await import("@/lib/scriptureThread");
    const originalFetch = global.fetch;
    let threadApiCallCount = 0;

    global.fetch = vi.fn().mockImplementation((input: any, init?: any) => {
      const url = typeof input === "string" ? input : input?.url || "";
      if (url.includes("/api/scripture-thread")) {
        threadApiCallCount++;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            thread: {
              category: "Cumprimento_Profetico",
              confidence: 0.92,
              relevanceScore: 9.5,
              evaluatedAt: "2026-03-20T12:00:00Z",
            },
          }),
        });
      }
      return originalFetch ? originalFetch(input, init) : Promise.resolve({ ok: true, json: async () => ({}) });
    });

    const { result, candidateNote } = await evaluateScriptureThread({
      chapterText: "Portanto, agora nenhuma condenação há...",
      chapterRef: "Romanos 8",
      bookId: "rm",
      chapter: 8,
      allNotes: notesSample,
      userId: "user-1",
    });

    expect(result).not.toBeNull();
    expect(result?.category).toBe("Cumprimento_Profetico");
    expect(result?.confidence).toBe(0.92);
    expect(candidateNote?.id).toBe("n-1");
    expect(threadApiCallCount).toBe(1);

    // Próxima chamada deve bater no cache reativo sem chamar a rota /api/scripture-thread
    const secondCall = await evaluateScriptureThread({
      chapterText: "Portanto, agora nenhuma condenação há...",
      chapterRef: "Romanos 8",
      bookId: "rm",
      chapter: 8,
      allNotes: notesSample,
      userId: "user-1",
    });

    expect(secondCall.result).not.toBeNull();
    expect(threadApiCallCount).toBe(1); // Continua 1!
  });

  it("elege diretamente a nota apontada pelo servidor via matchedNoteId quando presente", async () => {
    const { evaluateScriptureThread } = await import("@/lib/scriptureThread");
    const originalFetch = global.fetch;

    global.fetch = vi.fn().mockImplementation((input: any, init?: any) => {
      const url = typeof input === "string" ? input : input?.url || "";
      if (url.includes("/api/scripture-thread")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            thread: {
              category: "Cumprimento_Profetico",
              confidence: 0.96,
              relevanceScore: 10,
              matchedNoteId: "note-specific",
              evaluatedAt: "2026-03-20T12:00:00Z",
            },
          }),
        });
      }
      return originalFetch ? originalFetch(input, init) : Promise.resolve({ ok: true, json: async () => ({}) });
    });

    const poolWithSpecific: MemorialEntry[] = [
      {
        id: "note-other",
        type: "reflection",
        title: "Outra nota",
        content: "Outro conteúdo",
        bookId: "rm",
        bookName: "Romanos",
        chapter: 8,
        favorite: false,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "note-specific",
        type: "reflection",
        title: "Cordeiro de Deus",
        content: "Deus proverá para si o Cordeiro...",
        bookId: "gn",
        bookName: "Gênesis",
        chapter: 22,
        favorite: true,
        createdAt: "2026-03-20T00:00:00Z",
        updatedAt: "2026-03-20T00:00:00Z",
      },
    ];

    const { result, candidateNote } = await evaluateScriptureThread({
      chapterText: "Texto de Romanos...",
      chapterRef: "Romanos 8",
      bookId: "rm",
      chapter: 8,
      allNotes: poolWithSpecific,
      userId: "user-test-matched",
    });

    expect(result).not.toBeNull();
    expect(result?.matchedNoteId).toBe("note-specific");
    expect(candidateNote?.id).toBe("note-specific");
  });

  it("retorna null em silêncio quando a rede ou a API falha", async () => {
    const { evaluateScriptureThread } = await import("@/lib/scriptureThread");
    const originalFetch = global.fetch;

    global.fetch = vi.fn().mockImplementation((input: any, init?: any) => {
      const url = typeof input === "string" ? input : input?.url || "";
      if (url.includes("/api/scripture-thread")) {
        return Promise.reject(new Error("Network timeout"));
      }
      return originalFetch ? originalFetch(input, init) : Promise.resolve({ ok: true, json: async () => ({}) });
    });

    const { result, candidateNote } = await evaluateScriptureThread({
      chapterText: "Texto...",
      chapterRef: "Salmos 23",
      bookId: "sl",
      chapter: 23,
      allNotes: notesSample,
      userId: "user-1",
    });

    expect(result).toBeNull();
    expect(candidateNote).toBeNull();
  });
});
