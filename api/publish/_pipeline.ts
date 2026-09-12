import type { SupabaseClient } from "@supabase/supabase-js";
import { generateArticleHtml, generateArticlesIndexHtml, type ArticleData } from "./_html-generator.js";
import { uploadHtmlToR2, type UploadResult } from "./_r2-uploader.js";
import { purgeArticleCache } from "./_cloudflare-purge.js";
import { notifyIndexNowSingle } from "./_indexnow-single.js";

export interface PublishPipelineResult {
  success: boolean;
  skipped?: boolean;
  reason?: string;
  articleId: string;
  slug?: string;
  r2Result?: UploadResult;
}

/**
 * Core publication pipeline:
 * 1. Fetches fresh article record by primary key
 * 2. Checks idempotency against publication_events
 * 3. Generates semantic HTML with Article schema
 * 4. Uploads to R2 (artigos/:slug.html and artigos/index.html)
 * 5. Persists status to publication_events
 */
export async function processArticlePublication(
  articleId: string,
  supabase: SupabaseClient
): Promise<PublishPipelineResult> {
  // 1. Fetch fresh record from DB by primary key [MUST]
  const { data: article, error: fetchErr } = await supabase
    .from("articles")
    .select("*, author:article_authors(*)")
    .eq("id", articleId)
    .single();

  if (fetchErr || !article) {
    throw new Error(`Article ${articleId} not found: ${fetchErr?.message}`);
  }

  if (article.status !== "publicado") {
    return {
      success: true,
      skipped: true,
      reason: `Article ${articleId} status is '${article.status}', expected 'publicado'`,
      articleId,
    };
  }

  // 2. Idempotency check: article_id + updated_at/published_at
  const idempotencyKey = `${article.id}:${article.updated_at || article.published_at || "v1"}`;

  const { data: existingEvents } = await supabase
    .from("publication_events")
    .select("id")
    .eq("article_id", article.id)
    .eq("idempotency_key", idempotencyKey)
    .eq("status", "success")
    .limit(1);

  if (existingEvents && existingEvents.length > 0) {
    return {
      success: true,
      skipped: true,
      reason: `Revision ${idempotencyKey} already processed successfully`,
      articleId,
      slug: article.slug,
    };
  }

  // 3. Log pending event
  let eventId: string | null = null;
  const { data: insertedEvent } = await supabase
    .from("publication_events")
    .insert({
      article_id: article.id,
      event_type: "article_published",
      status: "pending",
      idempotency_key: idempotencyKey,
    })
    .select("id")
    .single();

  if (insertedEvent) eventId = insertedEvent.id;

  try {
    // 4. Generate HTML for the article
    const articleHtml = generateArticleHtml(article as ArticleData);

    // 5. Upload to R2: artigos/:slug.html
    const r2Article = await uploadHtmlToR2(`artigos/${article.slug}.html`, articleHtml);
    if (!r2Article.success) {
      throw new Error(`R2 upload failed for article HTML: ${r2Article.error}`);
    }

    // 6. Regenerate and upload artigos/index.html (all published articles)
    const { data: allArticles } = await supabase
      .from("articles")
      .select("*, author:article_authors(*)")
      .eq("status", "publicado")
      .order("published_at", { ascending: false });

    if (allArticles && allArticles.length > 0) {
      const indexHtml = generateArticlesIndexHtml(allArticles as ArticleData[]);
      await uploadHtmlToR2("artigos/index.html", indexHtml);
    }

    // 7. Granular Cloudflare CDN Purge (cache.bibliavive.com.br/artigos/:slug.html)
    const purgeResult = await purgeArticleCache(article.slug);
    if (!purgeResult.success) {
      console.warn(`[pipeline] CDN purge warning for ${article.slug}:`, purgeResult.error);
      await supabase.from("publication_events").insert({
        article_id: article.id,
        event_type: "cdn_purge_failed",
        status: "failed",
        error_message: purgeResult.error,
        idempotency_key: `${idempotencyKey}:purge_failed`,
      });
    }

    // 8. Instant IndexNow notification (Bing / ChatGPT Search)
    const indexNowResult = await notifyIndexNowSingle(article.slug);
    if (indexNowResult.success) {
      await supabase.from("publication_events").insert({
        article_id: article.id,
        event_type: "indexnow_sent",
        status: "success",
        idempotency_key: `${idempotencyKey}:indexnow`,
      });
    } else {
      console.warn(`[pipeline] IndexNow warning for ${article.slug}:`, indexNowResult.error);
      await supabase.from("publication_events").insert({
        article_id: article.id,
        event_type: "indexnow_failed",
        status: "failed",
        error_message: indexNowResult.error,
        idempotency_key: `${idempotencyKey}:indexnow`,
      });
    }

    // 9. Mark event as success
    if (eventId) {
      await supabase
        .from("publication_events")
        .update({
          status: "success",
          completed_at: new Date().toISOString(),
        })
        .eq("id", eventId);
    }

    return {
      success: true,
      articleId,
      slug: article.slug,
      r2Result: r2Article,
    };
  } catch (err: any) {
    if (eventId) {
      await supabase
        .from("publication_events")
        .update({
          status: "failed",
          error_message: err.message || String(err),
          completed_at: new Date().toISOString(),
        })
        .eq("id", eventId);
    }
    throw err;
  }
}
