import { initializeApp, getApps, getApp, type App } from "firebase-admin/app";
import { cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { createClient } from "@supabase/supabase-js";

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured");
  }
  const serviceAccount = JSON.parse(serviceAccountJson);
  return initializeApp({
    credential: cert(serviceAccount),
  });
}

export async function getPushTokens(): Promise<string[]> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase env vars not configured");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data, error } = await supabase.from("push_tokens").select("token");

  if (error) throw error;
  return data.map((row: { token: string }) => row.token);
}

export async function removeInvalidTokens(invalidTokens: string[]): Promise<void> {
  if (invalidTokens.length === 0) return;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase env vars not configured");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { error } = await supabase.from("push_tokens").delete().in("token", invalidTokens);

  if (error) {
    console.error("Failed to remove invalid tokens:", error);
    return;
  }

  const { error: auditError } = await supabase.from("push_token_removals").insert({
    count: invalidTokens.length,
    reason: "invalid_token",
  });

  if (auditError) {
    console.error("Failed to log token removals:", auditError);
  }
}

export async function sendPushNotification({
  title,
  body,
  link,
}: {
  title: string;
  body: string;
  link: string;
}): Promise<{ sent: number; failed: number; successCount: number }> {
  const adminApp = getAdminApp();
  const messaging = getMessaging(adminApp);
  const tokens = await getPushTokens();

  // [LOG 1] Quantidade de tokens encontrados na tabela push_tokens
  console.log("[sendPushNotification] Tokens encontrados:", tokens.length);

  if (tokens.length === 0) {
    console.log("[sendPushNotification] Nenhum token registrado — nenhuma notificação enviada.");
    return { sent: 0, failed: 0, successCount: 0 };
  }

  const invalidTokens: string[] = [];
  let totalSuccessCount = 0;

  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);

    const message = {
      notification: {
        title,
        body,
        icon: "/icons/icon-192.png",
      },
      webpush: {
        fcmOptions: { link },
      },
      tokens: batch,
    };

    // [LOG 2] Antes de chamar o Firebase
    console.log(`[sendPushNotification] Enviando lote ${Math.floor(i / 500) + 1} — ${batch.length} tokens. title="${title}" link="${link}"`);

    let response: Awaited<ReturnType<typeof messaging.sendEachForMulticast>>;
    try {
      response = await messaging.sendEachForMulticast(message);
    } catch (firebaseErr: unknown) {
      // [LOG 3] Erro ao chamar o Firebase
      const errMsg = firebaseErr instanceof Error ? firebaseErr.message : String(firebaseErr);
      const errStack = firebaseErr instanceof Error ? firebaseErr.stack : undefined;
      console.error("[sendPushNotification] ERRO ao chamar sendEachForMulticast:", errMsg);
      if (errStack) console.error("[sendPushNotification] Stack:", errStack);
      throw firebaseErr; // propaga para o chamador poder logar e não marcar notification_sent_at
    }

    // [LOG 4] Resultado completo do Firebase após o envio
    console.log(
      `[sendPushNotification] Resultado lote ${Math.floor(i / 500) + 1}: successCount=${response.successCount} failureCount=${response.failureCount}`
    );
    console.log(
      "[sendPushNotification] Respostas individuais:",
      JSON.stringify(
        response.responses.map((r, idx) => ({
          idx,
          success: r.success,
          messageId: r.messageId,
          errorCode: r.error?.code,
          errorMessage: r.error?.message,
        }))
      )
    );

    totalSuccessCount += response.successCount;

    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errorCode = resp.error?.code;
        if (
          errorCode === "messaging/invalid-registration-token" ||
          errorCode === "messaging/registration-token-not-registered"
        ) {
          invalidTokens.push(batch[idx]);
        }
      }
    });
  }

  if (invalidTokens.length > 0) {
    await removeInvalidTokens(invalidTokens);
  }

  console.log(`[sendPushNotification] Resumo final: sent=${tokens.length - invalidTokens.length} failed=${invalidTokens.length} successCount=${totalSuccessCount}`);

  return {
    sent: tokens.length - invalidTokens.length,
    failed: invalidTokens.length,
    successCount: totalSuccessCount,
  };
}


export async function sendArticleNotification(title: string, slug: string, appUrl: string): Promise<{ sent: number; failed: number }> {
  const articleUrl = `${appUrl}/artigos/${slug}`;
  return sendPushNotification({
    title: "Novo artigo no Bíblia Vive",
    body: title,
    link: articleUrl,
  });
}