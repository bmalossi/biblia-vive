import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do módulo de envio de notificação _send
vi.mock("../api/notifications/_send", () => ({
  sendPushNotification: vi.fn().mockResolvedValue({ sent: 5, failed: 0 }),
}));

// Mock do Supabase Client para evitar chamadas de banco reais nos testes unitários
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  }),
}));

import { POST } from "../api/notifications/on-publish";
import { sendPushNotification } from "../api/notifications/_send";

describe("POST /api/notifications/on-publish", () => {
  const SECRET = "test-webhook-secret-123";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_WEBHOOK_SECRET = SECRET;
    process.env.VITE_APP_URL = "https://www.bibliavive.com.br";
  });

  it("deve rejeitar com 401 se o header x-webhook-secret estiver ausente ou incorreto", async () => {
    const requestNoHeader = new Request("http://localhost/api/notifications/on-publish", {
      method: "POST",
      body: JSON.stringify({ type: "INSERT", table: "articles", record: { status: "publicado" } }),
    });

    const res1 = await POST(requestNoHeader);
    expect(res1.status).toBe(401);

    const requestWrongHeader = new Request("http://localhost/api/notifications/on-publish", {
      method: "POST",
      headers: { "x-webhook-secret": "errado" },
      body: JSON.stringify({ type: "INSERT", table: "articles", record: { status: "publicado" } }),
    });

    const res2 = await POST(requestWrongHeader);
    expect(res2.status).toBe(401);
  });

  it("deve ignorar com 200 (skipped) se a tabela não for articles ou editorial_chapters", async () => {
    const request = new Request("http://localhost/api/notifications/on-publish", {
      method: "POST",
      headers: { "x-webhook-secret": SECRET },
      body: JSON.stringify({ type: "INSERT", table: "users", record: { status: "publicado" } }),
    });

    const res = await POST(request);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.skipped).toBe(true);
    expect(sendPushNotification).not.toHaveBeenCalled();
  });

  it("deve ignorar com 200 se record.status for rascunho", async () => {
    const request = new Request("http://localhost/api/notifications/on-publish", {
      method: "POST",
      headers: { "x-webhook-secret": SECRET },
      body: JSON.stringify({
        type: "INSERT",
        table: "articles",
        record: { title: "Artigo rascunho", slug: "artigo-rascunho", status: "rascunho" },
      }),
    });

    const res = await POST(request);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.skipped).toBe(true);
    expect(sendPushNotification).not.toHaveBeenCalled();
  });

  it("deve ignorar com 200 se notification_sent_at já estiver preenchido", async () => {
    const request = new Request("http://localhost/api/notifications/on-publish", {
      method: "POST",
      headers: { "x-webhook-secret": SECRET },
      body: JSON.stringify({
        type: "INSERT",
        table: "articles",
        record: {
          title: "Artigo teste",
          slug: "artigo-teste",
          status: "publicado",
          notification_sent_at: "2026-07-30T10:00:00Z",
        },
      }),
    });

    const res = await POST(request);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.skipped).toBe(true);
    expect(sendPushNotification).not.toHaveBeenCalled();
  });

  it("deve ignorar UPDATE se old_record.status já era publicado", async () => {
    const request = new Request("http://localhost/api/notifications/on-publish", {
      method: "POST",
      headers: { "x-webhook-secret": SECRET },
      body: JSON.stringify({
        type: "UPDATE",
        table: "articles",
        record: { id: "1", title: "Artigo Editado", slug: "artigo-editado", status: "publicado" },
        old_record: { id: "1", title: "Artigo", slug: "artigo", status: "publicado" },
      }),
    });

    const res = await POST(request);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.skipped).toBe(true);
    expect(sendPushNotification).not.toHaveBeenCalled();
  });

  it("deve disparar notificação com sucesso ao PUBLICAR novo ARTIGO (INSERT)", async () => {
    const request = new Request("http://localhost/api/notifications/on-publish", {
      method: "POST",
      headers: { "x-webhook-secret": SECRET },
      body: JSON.stringify({
        type: "INSERT",
        table: "articles",
        record: { id: "art-1", title: "O Poder da Oração", slug: "o-poder-da-oracao", status: "publicado" },
      }),
    });

    const res = await POST(request);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.sent).toBe(5);

    expect(sendPushNotification).toHaveBeenCalledWith({
      title: "Novo artigo no Bíblia Vive",
      body: "O Poder da Oração",
      link: "https://www.bibliavive.com.br/artigos/o-poder-da-oracao",
    });
  });

  it("deve disparar notificação com sucesso ao MUDAR RASCUNHO para PUBLICADO em ARTIGO (UPDATE)", async () => {
    const request = new Request("http://localhost/api/notifications/on-publish", {
      method: "POST",
      headers: { "x-webhook-secret": SECRET },
      body: JSON.stringify({
        type: "UPDATE",
        table: "articles",
        record: { id: "art-2", title: "Vida de Fé", slug: "vida-de-fe", status: "publicado" },
        old_record: { id: "art-2", title: "Vida de Fé", slug: "vida-de-fe", status: "rascunho" },
      }),
    });

    const res = await POST(request);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    expect(sendPushNotification).toHaveBeenCalledWith({
      title: "Novo artigo no Bíblia Vive",
      body: "Vida de Fé",
      link: "https://www.bibliavive.com.br/artigos/vida-de-fe",
    });
  });

  it("deve disparar notificação com sucesso ao PUBLICAR nova JORNADA (editorial_chapters)", async () => {
    const request = new Request("http://localhost/api/notifications/on-publish", {
      method: "POST",
      headers: { "x-webhook-secret": SECRET },
      body: JSON.stringify({
        type: "INSERT",
        table: "editorial_chapters",
        record: {
          id: "jorn-1",
          series_name: "Permanecer",
          title: "O Primeiro Passo",
          book_slug: "sl",
          chapter: 23,
          status: "publicado",
        },
      }),
    });

    const res = await POST(request);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    expect(sendPushNotification).toHaveBeenCalledWith({
      title: "Nova jornada no Bíblia Vive",
      body: "Permanecer: O Primeiro Passo",
      link: "https://www.bibliavive.com.br/nvi/sl/23",
    });
  });
});
