// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// eco-memorial/index.ts — Bíblia Vive · Motor de Push do Eco do Memorial
//
// Edge Function acionada por pg_cron diariamente às 08:00 BRT (11:00 UTC).
// Para cada usuário com token FCM válido:
//   1. Seleciona a melhor memória espiritual elegível (capítulo recente > janelas
//      temporais > prioridade por tipo, respeitando a trava de 7 dias).
//   2. Envia uma notificação push silenciosa e reverente via FCM HTTP v1 API.
//   3. Atualiza `last_echo_at` na memória escolhida.
//
// Autenticação: header `x-cron-secret` deve corresponder à env CRON_SECRET.
//
// Variáveis de ambiente necessárias (Supabase Secrets):
//   SUPABASE_URL                — URL do projeto Supabase
//   SUPABASE_SERVICE_ROLE_KEY   — Chave de serviço
//   CRON_SECRET                 — Segredo compartilhado com pg_cron
//   FCM_PROJECT_ID              — ID do projeto Firebase
//   FCM_SERVICE_ACCOUNT_JSON    — JSON completo da Service Account Firebase Admin
// ─────────────────────────────────────────────────────────────────────────────

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const CRON_SECRET    = Deno.env.get("CRON_SECRET") ?? "";
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const FCM_PROJECT_ID = Deno.env.get("FCM_PROJECT_ID") ?? "";
const FCM_SA_JSON    = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON") ?? "{}";

const TIME_WINDOWS = [7, 30, 90, 180, 365];
const TYPE_PRIORITY = { prayer: 1, testimony: 2, reflection: 3, fasting: 4 };

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface UserNote {
  id: string;
  user_id: string;
  book_id: string;
  chapter: number;
  title: string | null;
  content: string;
  type: string;
  created_at: string;
  last_echo_at: string | null;
}

interface PushToken {
  token: string;
  user_id: string | null;
}

interface Profile {
  id: string;
  last_read_book_id: string | null;
  last_read_chapter: number | null;
  last_read_at: string | null;
}

// ─── selectBestEcho ───────────────────────────────────────────────────────────
// Espelha a lógica do lado cliente em noteStore.ts para consistência.

function selectBestEcho(
  notes: UserNote[],
  lastReadBookId: string | null,
  lastReadChapter: number | null,
  lastReadAt: string | null,
): UserNote | null {
  if (!notes.length) return null;

  const now         = Date.now();
  const sevenDaysMs = 7  * 24 * 60 * 60 * 1000;
  const twoDaysMs   = 2  * 24 * 60 * 60 * 1000;

  // Trava anti-repetição de 7 dias
  const eligible = notes.filter((n) =>
    !n.last_echo_at || now - new Date(n.last_echo_at).getTime() >= sevenDaysMs,
  );
  if (!eligible.length) return null;

  const candidates = eligible.map((n) => ({
    ...n,
    priority: TYPE_PRIORITY[n.type as keyof typeof TYPE_PRIORITY] ?? 99,
    ageMs:    now - new Date(n.created_at).getTime(),
  }));

  // 1. Capítulo lido recentemente (< 48 h)
  const isRecentRead = lastReadAt && now - new Date(lastReadAt).getTime() < twoDaysMs;
  if (isRecentRead && lastReadBookId && lastReadChapter != null) {
    const contextual = candidates.filter(
      (c) => c.book_id === lastReadBookId && c.chapter === lastReadChapter,
    );
    if (contextual.length) return contextual.sort((a, b) => a.priority - b.priority)[0];
  }

  // 2. Fallback: janelas temporais (±30 %)
  for (const days of TIME_WINDOWS) {
    const windowMs  = days * 24 * 60 * 60 * 1000;
    const tolerance = windowMs * 0.3;
    const windowed  = candidates.filter((c) => Math.abs(c.ageMs - windowMs) <= tolerance);
    if (windowed.length) return windowed.sort((a, b) => a.priority - b.priority)[0];
  }

  // 3. Qualquer elegível por prioridade de tipo
  return candidates.sort((a, b) => a.priority - b.priority)[0];
}

// ─── FCM HTTP v1 via Service Account JWT ─────────────────────────────────────

async function getFcmAccessToken(saJson: string): Promise<string> {
  const sa = JSON.parse(saJson);

  const enc = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const now = Math.floor(Date.now() / 1000);
  const header  = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss:   sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud:   "https://oauth2.googleapis.com/token",
    iat:   now,
    exp:   now + 3600,
  };

  const signingInput = `${enc(header)}.${enc(payload)}`;

  const pem = sa.private_key.replace(/\\n/g, "\n");
  const keyData = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0)),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );

  const jwt =
    `${signingInput}.` +
    btoa(String.fromCharCode(...new Uint8Array(sig)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion:  jwt,
    }),
  });

  if (!res.ok) throw new Error(`Falha ao obter token FCM: ${await res.text()}`);
  return (await res.json()).access_token as string;
}

async function sendFcmPush(
  accessToken: string,
  projectId: string,
  fcmToken: string,
  note: UserNote,
): Promise<{ success: boolean; error?: string }> {
  const labels: Record<string, string> = {
    reflection: "reflexão", prayer: "oração", testimony: "testemunho", fasting: "propósito",
  };
  const category = labels[note.type] ?? "memória";
  const body     = (note.title || note.content).slice(0, 100);

  const message = {
    message: {
      token: fcmToken,
      notification: {
        title: "✦ Eco do Memorial",
        body:  `Uma ${category} do seu passado ressoa hoje: "${body}"`,
      },
      data: {
        type:    "eco_memorial",
        noteId:  note.id,
        bookId:  note.book_id,
        chapter: String(note.chapter),
        url:     `/memorial/${note.id}`,
      },
      android: {
        priority: "normal",
        notification: { channel_id: "eco_memorial", icon: "ic_notification", color: "#C9A84C" },
      },
      apns: {
        payload: { aps: { "content-available": 1, sound: "", badge: 0 } },
      },
      webpush: {
        headers: { Urgency: "normal" },
        notification: {
          icon:     "/icons/icon-192x192.png",
          badge:    "/icons/badge-72x72.png",
          tag:      "eco_memorial",
          renotify: false,
        },
        fcm_options: { link: `/memorial/${note.id}` },
      },
    },
  };

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method:  "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body:    JSON.stringify(message),
    },
  );

  if (!res.ok) return { success: false, error: await res.text() };
  return { success: true };
}

// ─── Handler Principal ────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Autenticação via segredo compartilhado
  if ((req.headers.get("x-cron-secret") ?? "") !== CRON_SECRET || !CRON_SECRET) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405, headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const stats = { processed: 0, sent: 0, skipped: 0, errors: 0 };

  try {
    // 1. Busca tokens FCM com user_id
    const { data: tokens, error: tokensErr } = await supabase
      .from("push_tokens")
      .select("token, user_id")
      .not("user_id", "is", null);

    if (tokensErr) throw tokensErr;
    if (!tokens?.length) {
      return new Response(
        JSON.stringify({ message: "Nenhum token FCM com user_id.", stats }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const tokensByUser = new Map<string, string[]>();
    for (const t of tokens as PushToken[]) {
      if (!t.user_id) continue;
      const arr = tokensByUser.get(t.user_id) ?? [];
      arr.push(t.token);
      tokensByUser.set(t.user_id, arr);
    }
    const userIds = [...tokensByUser.keys()];

    // 2. Perfis de leitura recente
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, last_read_book_id, last_read_chapter, last_read_at")
      .in("id", userIds);

    const profileMap = new Map<string, Profile>();
    for (const p of (profiles ?? []) as Profile[]) profileMap.set(p.id, p);

    // 3. Memórias de todos os usuários
    const { data: allNotes, error: notesErr } = await supabase
      .from("user_notes")
      .select("id, user_id, book_id, chapter, title, content, type, created_at, last_echo_at")
      .in("user_id", userIds);

    if (notesErr) throw notesErr;

    const notesByUser = new Map<string, UserNote[]>();
    for (const n of (allNotes ?? []) as UserNote[]) {
      const arr = notesByUser.get(n.user_id) ?? [];
      arr.push(n);
      notesByUser.set(n.user_id, arr);
    }

    // 4. Access Token FCM (uma única vez)
    const accessToken = await getFcmAccessToken(FCM_SA_JSON);

    // 5. Processa cada usuário
    for (const [userId, userTokens] of tokensByUser.entries()) {
      stats.processed++;
      const prof   = profileMap.get(userId);
      const chosen = selectBestEcho(
        notesByUser.get(userId) ?? [],
        prof?.last_read_book_id ?? null,
        prof?.last_read_chapter ?? null,
        prof?.last_read_at ?? null,
      );

      if (!chosen) { stats.skipped++; continue; }

      let userSent = false;
      for (const token of userTokens) {
        const r = await sendFcmPush(accessToken, FCM_PROJECT_ID, token, chosen);
        if (r.success) {
          userSent = true;
        } else {
          console.warn(`[eco-memorial] FCM error user=${userId}: ${r.error}`);
          stats.errors++;
        }
      }

      if (userSent) {
        const { error: upErr } = await supabase
          .from("user_notes")
          .update({ last_echo_at: new Date().toISOString() })
          .eq("id", chosen.id);
        if (upErr) console.error(`[eco-memorial] last_echo_at update failed:`, upErr);
        else stats.sent++;
      }
    }

    console.log("[eco-memorial] Done:", stats);
    return new Response(JSON.stringify({ success: true, stats }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[eco-memorial] Fatal:", err);
    return new Response(JSON.stringify({ error: String(err), stats }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});
