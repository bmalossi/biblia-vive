import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSelect } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: mockSelect,
    }),
  }),
}));

import seoHandler from "../../api/seo";
const feedHandler = seoHandler;
import { notifyIndexNowSingle } from "../../api/publish/_indexnow-single";

describe("Ticket 7: Feed RSS Dinâmico e Disparo Pontual de IndexNow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = "https://mock.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-key";
    delete process.env.INDEXNOW_KEY;
    delete process.env.INDEXNOW_HOST;
  });

  describe("Feed RSS 2.0 (/feed.xml)", () => {
    it("deve retornar um feed RSS 2.0 válido com artigos publicados e metadados completos", async () => {
      const mockArticles = [
        {
          title: "O Poder da Graça",
          slug: "o-poder-da-graca",
          body: "A graça transforma vidas completamente.",
          meta_description: "Estudo sobre a maravilhosa graça de Deus.",
          category: "Teologia Prática",
          cover_image_url: "https://midia.bibliavive.com.br/artigos/graca.jpg",
          published_at: "2026-09-05T14:00:00Z",
          author: {
            name: "Rev. Carlos Mendes",
          },
        },
      ];

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockArticles,
              error: null,
            }),
          }),
        }),
      });

      const request = new Request("https://www.bibliavive.com.br/feed.xml");
      const response = await feedHandler(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/rss+xml; charset=utf-8");

      const xml = await response.text();
      expect(xml).toContain('<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">');
      expect(xml).toContain("<title>Bíblia Vive — Artigos e Estudos Bíblicos</title>");
      expect(xml).toContain('<atom:link href="https://www.bibliavive.com.br/feed.xml" rel="self" type="application/rss+xml" />');

      // Item assertions
      expect(xml).toContain("<title>O Poder da Graça</title>");
      expect(xml).toContain("<link>https://www.bibliavive.com.br/artigos/o-poder-da-graca</link>");
      expect(xml).toContain('<guid isPermaLink="true">https://www.bibliavive.com.br/artigos/o-poder-da-graca</guid>');
      expect(xml).toContain("<description>Estudo sobre a maravilhosa graça de Deus.</description>");
      expect(xml).toContain("<dc:creator>Rev. Carlos Mendes</dc:creator>");
      expect(xml).toContain("<category>Teologia Prática</category>");
      expect(xml).toContain('<enclosure url="https://midia.bibliavive.com.br/artigos/graca.jpg" type="image/jpeg" length="0" />');
    });
  });

  describe("IndexNow Pontual (notifyIndexNowSingle)", () => {
    it("deve enviar a URL individual do artigo para a API do IndexNow", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue("OK"),
      });

      const result = await notifyIndexNowSingle("novo-artigo-biblico");

      expect(result.success).toBe(true);
      expect(result.url).toBe("https://www.bibliavive.com.br/artigos/novo-artigo-biblico");

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://api.indexnow.org/indexnow",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
          body: JSON.stringify({
            host: "www.bibliavive.com.br",
            key: "4f9b8c2e7a1d3f5b8e9a0c1d2e3f4a5b",
            keyLocation: "https://www.bibliavive.com.br/4f9b8c2e7a1d3f5b8e9a0c1d2e3f4a5b.txt",
            urlList: ["https://www.bibliavive.com.br/artigos/novo-artigo-biblico"],
          }),
        })
      );
    });

    it("deve ser tolerante a falhas e capturar erros de rede sem lançar exceção", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("IndexNow endpoint timeout"));

      const result = await notifyIndexNowSingle("artigo-com-falha-indexnow");

      expect(result.success).toBe(false);
      expect(result.error).toContain("IndexNow endpoint timeout");
    });

    it("deve registrar falha quando a API retornar código de erro HTTP", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: vi.fn().mockResolvedValue("Too Many Requests"),
      });

      const result = await notifyIndexNowSingle("artigo-rate-limited");

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(429);
      expect(result.error).toContain("429");
    });
  });
});
