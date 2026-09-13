import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { createClient } from "@supabase/supabase-js";
import {
  generateArticleHtml,
  generateArticlesIndexHtml,
  type ArticleData,
} from "../api/publish/_html-generator.js";
import { uploadHtmlToR2 } from "../api/publish/_r2-uploader.js";
import { purgeCloudflareUrls } from "../api/publish/_cloudflare-purge.js";

async function main() {
  console.log("=== Backfill de Artigos para o Bucket R2 ===");

  const bucketName = process.env.R2_HTML_BUCKET_NAME || process.env.R2_BUCKET_NAME;
  if (!bucketName) {
    console.error("\n❌ Erro: Configuração do bucket R2 ausente.");
    console.error("Adicione a variável R2_HTML_BUCKET_NAME com o nome do bucket criado no seu arquivo .env.local:");
    console.error("  R2_HTML_BUCKET_NAME=nome-do-seu-novo-bucket\n");
    process.exit(1);
  }

  console.log(`Bucket R2 de destino: ${bucketName}`);

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Erro: Credenciais do Supabase ausentes (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Buscando todos os artigos publicados...");
  const { data: articles, error } = await supabase
    .from("articles")
    .select("*, author:article_authors(*)")
    .eq("status", "publicado")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar artigos do Supabase:", error.message);
    process.exit(1);
  }

  if (!articles || articles.length === 0) {
    console.log("Nenhum artigo publicado encontrado.");
    return;
  }

  console.log(`Encontrados ${articles.length} artigos publicados.`);

  let successCount = 0;
  let failCount = 0;
  const purgedUrls: string[] = [];
  const cacheDomain = process.env.R2_CACHE_DOMAIN || "midia.bibliavive.com.br";

  for (let i = 0; i < articles.length; i++) {
    const art = articles[i] as ArticleData;
    console.log(`[${i + 1}/${articles.length}] Processando: /artigos/${art.slug}`);

    try {
      const html = generateArticleHtml(art);
      const key = `artigos/${art.slug}.html`;
      const result = await uploadHtmlToR2(key, html);

      if (result.success) {
        successCount++;
        purgedUrls.push(`https://${cacheDomain}/${key}`);
      } else {
        failCount++;
        console.error(`Falha no upload de ${key}:`, result.error);
      }
    } catch (err: any) {
      failCount++;
      console.error(`Erro ao gerar/enviar ${art.slug}:`, err.message);
    }
  }

  // Geração e upload de artigos/index.html
  console.log("\nGerando e enviando listagem /artigos (index.html)...");
  try {
    const indexHtml = generateArticlesIndexHtml(articles as ArticleData[]);
    const indexResult = await uploadHtmlToR2("artigos/index.html", indexHtml);
    if (indexResult.success) {
      purgedUrls.push(`https://${cacheDomain}/artigos/index.html`);
      console.log("artigos/index.html enviado com sucesso!");
    } else {
      console.error("Falha ao enviar artigos/index.html:", indexResult.error);
    }
  } catch (err: any) {
    console.error("Erro ao gerar/enviar artigos/index.html:", err.message);
  }

  // Purga granular opcional na Cloudflare
  if (purgedUrls.length > 0 && process.env.CLOUDFLARE_API_TOKEN) {
    console.log(`\nExpurgando ${purgedUrls.length} URLs do cache da CDN Cloudflare...`);
    const purgeResult = await purgeCloudflareUrls(purgedUrls);
    if (purgeResult.success) {
      console.log("Cache Cloudflare expurgado com sucesso!");
    } else {
      console.warn("Aviso na purga da Cloudflare:", purgeResult.error);
    }
  }

  console.log("\n=== Resumo do Backfill ===");
  console.log(`Total de artigos: ${articles.length}`);
  console.log(`Enviados com sucesso: ${successCount}`);
  console.log(`Falhas: ${failCount}`);

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Erro fatal no backfill:", err);
  process.exit(1);
});
