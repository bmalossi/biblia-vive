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

import sitemapIndexHandler from "../../api/sitemap-index";
import sitemapArticlesHandler from "../../api/sitemap-articles";

describe("Ticket 6: Sitemaps Granulares (Sitemap Index & Artigos Dinâmicos)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = "https://mock.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-key";
  });

  describe("Sitemap Index (/sitemap.xml)", () => {
    it("deve retornar um <sitemapindex> válido com links para sitemap-artigos e sitemap-outros", async () => {
      const request = new Request("https://www.bibliavive.com.br/sitemap.xml");
      const response = await sitemapIndexHandler(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/xml; charset=utf-8");

      const xml = await response.text();
      expect(xml).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(xml).toContain("<loc>https://www.bibliavive.com.br/sitemap-artigos.xml</loc>");
      expect(xml).toContain("<loc>https://www.bibliavive.com.br/sitemap-outros.xml</loc>");
      expect(xml).toContain("</sitemapindex>");
    });
  });

  describe("Sitemap de Artigos (/sitemap-artigos.xml)", () => {
    it("deve listar exclusivamente artigos com status publicado e incluir data real de lastmod", async () => {
      const mockArticles = [
        {
          slug: "o-caminho-da-oracao",
          published_at: "2026-08-01T12:00:00Z",
          updated_at: "2026-09-10T15:30:00Z",
        },
        {
          slug: "a-graca-transformadora",
          published_at: "2026-09-02T10:00:00Z",
          updated_at: null,
        },
      ];

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockArticles,
            error: null,
          }),
        }),
      });

      const request = new Request("https://www.bibliavive.com.br/sitemap-artigos.xml");
      const response = await sitemapArticlesHandler(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/xml; charset=utf-8");

      const xml = await response.text();
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

      // Primeiro artigo: usa updated_at se presente
      expect(xml).toContain("<loc>https://www.bibliavive.com.br/artigos/o-caminho-da-oracao</loc>");
      expect(xml).toContain("<lastmod>2026-09-10T15:30:00.000Z</lastmod>");

      // Segundo artigo: usa published_at se updated_at for nulo
      expect(xml).toContain("<loc>https://www.bibliavive.com.br/artigos/a-graca-transformadora</loc>");
      expect(xml).toContain("<lastmod>2026-09-02T10:00:00.000Z</lastmod>");

      expect(xml).toContain("</urlset>");
    });
  });
});
