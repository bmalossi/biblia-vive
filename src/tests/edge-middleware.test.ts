import { describe, it, expect, vi, beforeEach } from "vitest";
import middleware from "../../middleware";

describe("Ticket 3: Entrega no Edge e Roteamento via Vercel Middleware", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.R2_CACHE_DOMAIN;
  });

  it("deve interceptar /artigos e retornar 200 com HTML de index e Cache-Control", async () => {
    const fakeHtml = "<!doctype html><html><title>Artigos</title></html>";
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(fakeHtml),
    });

    const request = new Request("https://www.bibliavive.com.br/artigos", {
      method: "GET",
    });

    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
    expect(response.headers.get("X-Edge-Served-By")).toBe("biblia-vive-r2-cache");
    expect(response.headers.get("X-Edge-Target")).toBe("artigos/index.html");

    const body = await response.text();
    expect(body).toBe(fakeHtml);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://midia.bibliavive.com.br/artigos/index.html",
      expect.objectContaining({
        headers: { "User-Agent": "BibliaVive-Edge-Middleware/1.0" },
      })
    );
  });

  it("deve interceptar /artigos/:slug e retornar 200 com o HTML do artigo do R2", async () => {
    const fakeHtml = "<!doctype html><html><title>O Caminho da Oração</title></html>";
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(fakeHtml),
    });

    const request = new Request("https://www.bibliavive.com.br/artigos/o-caminho-da-oracao", {
      method: "GET",
    });

    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
    expect(response.headers.get("X-Edge-Target")).toBe("artigos/o-caminho-da-oracao.html");

    const body = await response.text();
    expect(body).toBe(fakeHtml);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://midia.bibliavive.com.br/artigos/o-caminho-da-oracao.html",
      expect.anything()
    );
  });

  it("deve retornar passthrough (next) com status 200 e x-middleware-next quando R2 retornar 404", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: vi.fn().mockResolvedValue("Not found"),
    });

    const request = new Request("https://www.bibliavive.com.br/artigos/artigo-inexistente", {
      method: "GET",
    });

    const response = await middleware(request);

    // Vercel edge next() retorna Response com header x-middleware-next: '1'
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.status).not.toBe(500);
  });

  it("deve fazer passthrough transparente se fetch para R2 falhar com erro de rede ou timeout", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network timeout / Connection refused"));

    const request = new Request("https://www.bibliavive.com.br/artigos/artigo-com-falha", {
      method: "GET",
    });

    const response = await middleware(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.status).not.toBe(500);
  });

  it("deve repassar requisições não-GET (ex: POST, DELETE) diretamente para a aplicação", async () => {
    globalThis.fetch = vi.fn();

    const request = new Request("https://www.bibliavive.com.br/artigos/o-caminho-da-oracao", {
      method: "POST",
    });

    const response = await middleware(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("deve fazer passthrough (next) para navegadores reais (Chrome/Safari/Firefox) em /artigos/:slug para evitar tela branca", async () => {
    globalThis.fetch = vi.fn();

    const chromeUserAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const request = new Request(
      "https://www.bibliavive.com.br/artigos/pregacao-sobre-nos-ou-sobre-cristo",
      {
        method: "GET",
        headers: {
          "User-Agent": chromeUserAgent,
        },
      }
    );

    const response = await middleware(request);

    // Deve passar direto para a aplicação React SPA via next()
    expect(response.headers.get("x-middleware-next")).toBe("1");
    // Não deve buscar HTML estático desestilizado do R2 para navegadores humanos
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("deve fazer passthrough (next) em hard reload (CTRL+F5 com cache-control no-cache) vindo de navegador", async () => {
    globalThis.fetch = vi.fn();

    const request = new Request(
      "https://www.bibliavive.com.br/artigos/o-caminho-da-oracao",
      {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      }
    );

    const response = await middleware(request);

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("deve interceptar robôs e scrapers sociais (Googlebot, WhatsApp, Facebook, Bingbot) e servir o HTML do R2", async () => {
    const bots = [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
      "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      "WhatsApp/2.21.12.21 A",
      "Twitterbot/1.0",
      "LinkedInBot/1.0",
    ];

    for (const botUa of bots) {
      const fakeHtml = `<!doctype html><html><title>Bot Preview</title></html>`;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(fakeHtml),
      });

      const request = new Request(
        "https://www.bibliavive.com.br/artigos/o-caminho-da-oracao",
        {
          method: "GET",
          headers: {
            "User-Agent": botUa,
          },
        }
      );

      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Edge-Served-By")).toBe("biblia-vive-r2-cache");
      expect(await response.text()).toBe(fakeHtml);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://midia.bibliavive.com.br/artigos/o-caminho-da-oracao.html",
        expect.anything()
      );
    }
  });
});
