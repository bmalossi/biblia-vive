import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateArticleHtml,
  generateArticlesIndexHtml,
  type ArticleData,
} from "../../api/publish/_html-generator";
import { resetS3ClientForTesting, uploadHtmlToR2 } from "../../api/publish/_r2-uploader";
import { processArticlePublication } from "../../api/publish/_pipeline";

// Mock @aws-sdk/client-s3
const mockSend = vi.fn();
vi.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: vi.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    PutObjectCommand: vi.fn().mockImplementation((args) => args),
  };
});

describe("Ticket 2: Geração de HTML Semântico e Upload para R2", () => {
  const sampleArticle: ArticleData = {
    id: "art-123",
    slug: "o-caminho-da-oracao",
    title: "O Caminho da Oração",
    status: "publicado",
    body: "## Introdução\n\nA oração é diálogo vivo com Deus.\n\n> Clama a mim, e responder-te-ei.\n\n### Prática\n\nReserve momentos diários.",
    cover_image_url: "https://midia.bibliavive.com.br/artigos/oracao.jpg",
    published_at: "2026-09-01T10:00:00Z",
    updated_at: "2026-09-12T14:30:00Z",
    meta_title: "O Caminho da Oração | Bíblia Vive",
    meta_description: "Aprenda a orar de forma constante e profunda.",
    author: {
      name: "Pr. João Silva",
      slug: "joao-silva",
      role: "Pastor e Escritor",
      bio: "Teólogo com 20 anos de ministério pastoral.",
    },
  };

  beforeEach(() => {
    mockSend.mockReset();
    resetS3ClientForTesting();
    process.env.R2_ACCOUNT_ID = "test-account-id";
    process.env.R2_ACCESS_KEY_ID = "test-key-id";
    process.env.R2_SECRET_ACCESS_KEY = "test-secret-key";
    process.env.R2_BUCKET_NAME = "biblia-vive-html-cache";
  });

  describe("generateArticleHtml", () => {
    it("deve gerar HTML com <title>, meta description e canonical correto com www", () => {
      const html = generateArticleHtml(sampleArticle);

      expect(html).toContain("<title>O Caminho da Oração | Bíblia Vive</title>");
      expect(html).toContain('<meta name="description" content="Aprenda a orar de forma constante e profunda."');
      expect(html).toContain('<link rel="canonical" href="https://www.bibliavive.com.br/artigos/o-caminho-da-oracao"');
    });

    it("deve incluir OpenGraph e Twitter Card completos", () => {
      const html = generateArticleHtml(sampleArticle);

      expect(html).toContain('<meta property="og:type" content="article"');
      expect(html).toContain('<meta property="og:url" content="https://www.bibliavive.com.br/artigos/o-caminho-da-oracao"');
      expect(html).toContain('<meta property="og:title" content="O Caminho da Oração | Bíblia Vive"');
      expect(html).toContain('<meta property="og:image" content="https://midia.bibliavive.com.br/artigos/oracao.jpg"');
      expect(html).toContain('<meta name="twitter:card" content="summary_large_image"');
    });

    it("deve gerar Schema.org Article JSON-LD válido", () => {
      const html = generateArticleHtml(sampleArticle);

      expect(html).toContain('<script type="application/ld+json">');
      const jsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      expect(jsonMatch).toBeTruthy();

      const schema = JSON.parse(jsonMatch![1]);
      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("Article");
      expect(schema.headline).toBe("O Caminho da Oração");
      expect(schema.mainEntityOfPage["@id"]).toBe("https://www.bibliavive.com.br/artigos/o-caminho-da-oracao");
      expect(schema.author["@type"]).toBe("Person");
      expect(schema.author.name).toBe("Pr. João Silva");
      expect(schema.datePublished).toBe("2026-09-01T10:00:00Z");
      expect(schema.dateModified).toBe("2026-09-12T14:30:00Z");
    });

    it("deve renderizar corpo semântico com h1, h2, h3, blockquote e section geo-summary", () => {
      const html = generateArticleHtml(sampleArticle);

      expect(html).toContain("<h1>O Caminho da Oração</h1>");
      expect(html).toContain("<h2>Introdução</h2>");
      expect(html).toContain("<h3>Prática</h3>");
      expect(html).toContain("<blockquote>\n<p>Clama a mim, e responder-te-ei.</p>\n</blockquote>");
      expect(html).toContain('<section class="geo-summary"');
      expect(html).toContain('<time datetime="2026-09-01T10:00:00Z"');
      expect(html).toContain("Pr. João Silva");
    });

    it("deve converter citações bíblicas no corpo do artigo em links para o leitor bíblico", () => {
      const articleWithScripture: ArticleData = {
        ...sampleArticle,
        body: "Veja o que diz Romanos 11:36 e também Lucas 24:27 no contexto.",
      };
      const html = generateArticleHtml(articleWithScripture);
      expect(html).toContain('<a href="/acf/rm/11#v36">Romanos 11:36</a>');
      expect(html).toContain('<a href="/acf/lc/24#v27">Lucas 24:27</a>');
    });

    it("deve escapar tags perigosas em dados não confiáveis para prevenir XSS", () => {
      const untrusted: ArticleData = {
        ...sampleArticle,
        title: "Título com <script>alert('xss')</script>",
        meta_description: 'Descrição com <img src=x onerror="alert(1)">',
      };

      const html = generateArticleHtml(untrusted);
      expect(html).not.toContain("<script>alert('xss')</script>");
      expect(html).toContain("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;");
    });

    it("deve incluir palavras-chave primárias e secundárias no JSON-LD, meta tag e tags visuais", () => {
      const articleWithKeywords: ArticleData = {
        ...sampleArticle,
        primary_keyword: "oração matinal",
        secondary_keywords: ["intimidade com Deus", "intercessão", "Mateus 6"],
      };

      const html = generateArticleHtml(articleWithKeywords);

      // 1. Meta tag
      expect(html).toContain('<meta name="keywords" content="oração matinal, intimidade com Deus, intercessão, Mateus 6" />');

      // 2. JSON-LD
      const jsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      expect(jsonMatch).toBeTruthy();
      const schema = JSON.parse(jsonMatch![1]);
      expect(schema.keywords).toBe("oração matinal, intimidade com Deus, intercessão, Mateus 6");

      // 3. Tags no corpo do artigo
      expect(html).toContain('class="article-keywords"');
      expect(html).toContain("#oração matinal");
      expect(html).toContain("#intimidade com Deus");
      expect(html).toContain("#intercessão");
      expect(html).toContain("#Mateus 6");
    });
  });

  describe("generateArticlesIndexHtml", () => {
    it("deve gerar listagem com links internos vivos <a href='/artigos/:slug'>", () => {
      const articles: ArticleData[] = [
        sampleArticle,
        {
          id: "art-456",
          slug: "a-graca-transformadora",
          title: "A Graça Transformadora",
          status: "publicado",
          meta_description: "Entenda a graça sob uma nova perspectiva bíblica.",
          body: "Conteúdo sobre a graça.",
          published_at: "2026-09-02T10:00:00Z",
        },
      ];

      const html = generateArticlesIndexHtml(articles);

      expect(html).toContain('<link rel="canonical" href="https://www.bibliavive.com.br/artigos"');
      expect(html).toContain('<a href="/artigos/o-caminho-da-oracao"');
      expect(html).toContain("O Caminho da Oração");
      expect(html).toContain('<a href="/artigos/a-graca-transformadora"');
      expect(html).toContain("A Graça Transformadora");
    });
  });

  describe("uploadHtmlToR2", () => {
    beforeEach(() => {
      mockSend.mockReset();
      resetS3ClientForTesting();
    });

    it("deve enviar o HTML para o bucket R2 com headers e cache-control corretos", async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await uploadHtmlToR2("artigos/o-caminho-da-oracao.html", "<html>Test</html>");

      expect(result.success).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(1);

      const putCommandCall = mockSend.mock.calls[0][0];
      expect(putCommandCall.Bucket).toBe("biblia-vive-html-cache");
      expect(putCommandCall.Key).toBe("artigos/o-caminho-da-oracao.html");
      expect(putCommandCall.ContentType).toBe("text/html; charset=utf-8");
      expect(putCommandCall.CacheControl).toBe("public, s-maxage=3600, stale-while-revalidate=86400");
    });
  });

  describe("processArticlePublication", () => {
    beforeEach(() => {
      mockSend.mockReset();
      resetS3ClientForTesting();
    });

    it("deve ignorar com skipped=true se a revisão já foi processada com sucesso (Idempotência)", async () => {
      const mockSupabase: any = {
        from: vi.fn((table: string) => {
          if (table === "articles") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  ...sampleArticle,
                  status: "publicado",
                },
                error: null,
              }),
            };
          }
          if (table === "publication_events") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue({
                data: [{ id: "existing-event-1" }],
                error: null,
              }),
            };
          }
          return {};
        }),
      };

      const result = await processArticlePublication("art-123", mockSupabase);

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
      expect(result.reason).toContain("already processed successfully");
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("deve executar o pipeline completo e registrar o evento em caso de nova publicação", async () => {
      mockSend.mockResolvedValue({});

      const mockSupabase: any = {
        from: vi.fn((table: string) => {
          if (table === "articles") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockResolvedValue({
                data: [sampleArticle],
                error: null,
              }),
              single: vi.fn().mockResolvedValue({
                data: {
                  ...sampleArticle,
                  status: "publicado",
                },
                error: null,
              }),
            };
          }
          if (table === "publication_events") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue({
                data: [], // No previous successful event
                error: null,
              }),
              insert: vi.fn().mockReturnThis(),
              update: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: { id: "new-event-999" },
                error: null,
              }),
            };
          }
          return {};
        }),
      };

      const result = await processArticlePublication("art-123", mockSupabase);

      expect(result.success).toBe(true);
      expect(result.articleId).toBe("art-123");
      expect(result.slug).toBe("o-caminho-da-oracao");
      // Article HTML + Index HTML uploaded
      expect(mockSend).toHaveBeenCalledTimes(2);
    });
  });
});
