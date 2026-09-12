import { describe, it, expect, vi, beforeEach } from "vitest";
import { purgeCloudflareUrls, purgeArticleCache } from "../../api/publish/_cloudflare-purge";

describe("Ticket 4: Invalidação Granular de Cache Cloudflare", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.CLOUDFLARE_API_TOKEN;
    delete process.env.CLOUDFLARE_ZONE_ID;
    delete process.env.CF_API_TOKEN;
    delete process.env.CF_ZONE_ID;
  });

  it("deve ignorar com aviso amigável quando credenciais da Cloudflare não estiverem configuradas", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await purgeCloudflareUrls(["https://cache.bibliavive.com.br/artigos/teste.html"]);

    expect(result.success).toBe(true);
    expect(result.error).toContain("skipped");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("deve chamar a API da Cloudflare com Authorization Bearer e lista de URLs", async () => {
    process.env.CLOUDFLARE_API_TOKEN = "test-token-123";
    process.env.CLOUDFLARE_ZONE_ID = "test-zone-456";

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ success: true, result: { id: "purge-1" } }),
    });

    const urls = [
      "https://cache.bibliavive.com.br/artigos/o-caminho-da-oracao.html",
      "https://cache.bibliavive.com.br/artigos/index.html",
    ];

    const result = await purgeCloudflareUrls(urls);

    expect(result.success).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.cloudflare.com/client/v4/zones/test-zone-456/purge_cache",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer test-token-123",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files: urls }),
      })
    );
  });

  it("deve tentar novamente com retry caso a API da Cloudflare falhe inicialmente", async () => {
    process.env.CLOUDFLARE_API_TOKEN = "test-token-123";
    process.env.CLOUDFLARE_ZONE_ID = "test-zone-456";

    // 1st attempt fails, 2nd attempt succeeds
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: vi.fn().mockResolvedValue({ success: false, errors: [{ message: "CF Error" }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ success: true }),
      });

    const result = await purgeCloudflareUrls(["https://cache.bibliavive.com.br/artigos/teste.html"], {
      maxRetries: 1,
    });

    expect(result.success).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it("não deve lançar exceção em caso de falha persistente de rede (tolerância a falhas)", async () => {
    process.env.CLOUDFLARE_API_TOKEN = "test-token-123";
    process.env.CLOUDFLARE_ZONE_ID = "test-zone-456";

    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Cloudflare unreachable"));

    const result = await purgeCloudflareUrls(["https://cache.bibliavive.com.br/artigos/teste.html"], {
      maxRetries: 1,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Cloudflare unreachable");
  });

  it("purgeArticleCache deve montar as URLs corretas do artigo e do índice", async () => {
    process.env.CLOUDFLARE_API_TOKEN = "test-token-123";
    process.env.CLOUDFLARE_ZONE_ID = "test-zone-456";
    process.env.R2_CACHE_DOMAIN = "cache.bibliavive.com.br";

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ success: true }),
    });

    const result = await purgeArticleCache("graca-de-deus");

    expect(result.success).toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("test-zone-456"),
      expect.objectContaining({
        body: JSON.stringify({
          files: [
            "https://cache.bibliavive.com.br/artigos/graca-de-deus.html",
            "https://cache.bibliavive.com.br/artigos/index.html",
          ],
        }),
      })
    );
  });
});
