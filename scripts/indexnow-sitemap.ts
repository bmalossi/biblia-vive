import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const INDEXNOW_API = 'https://api.indexnow.org/indexnow';
const SITEMAP_PATH = path.resolve(process.cwd(), 'dist/sitemap.xml');

async function main() {
  const key = process.env.INDEXNOW_KEY;
  const host = process.env.INDEXNOW_HOST;

  if (!key || !host) {
    console.error('Error: INDEXNOW_KEY and INDEXNOW_HOST environment variables must be defined.');
    process.exit(1);
  }

  let sitemapXml: string;
  try {
    sitemapXml = await fs.readFile(SITEMAP_PATH, 'utf-8');
  } catch (error: any) {
    console.error(`Error reading sitemap.xml at ${SITEMAP_PATH}. Please run "npm run build" first to generate it.`, error.message);
    process.exit(1);
  }

  // Extract all URLs inside <loc>...</loc>
  const urlRegex = /<loc>(https?:\/\/[^<]+)<\/loc>/g;
  const urls: string[] = [];
  let match;
  while ((match = urlRegex.exec(sitemapXml)) !== null) {
    urls.push(match[1]);
  }

  if (urls.length === 0) {
    console.error('Error: No URLs found in sitemap.xml.');
    process.exit(1);
  }

  console.log(`Extracted ${urls.length} URLs from sitemap.xml.`);

  // IndexNow allows a maximum of 10,000 URLs per request.
  // Since we have around 5,027, we can send them in one batch.
  const batchLimit = 10000;
  const urlBatches: string[][] = [];
  for (let i = 0; i < urls.length; i += batchLimit) {
    urlBatches.push(urls.slice(i, i + batchLimit));
  }

  for (let b = 0; b < urlBatches.length; b++) {
    const currentBatch = urlBatches[b];
    console.log(`Submitting batch ${b + 1}/${urlBatches.length} (${currentBatch.length} URLs)...`);

    const requestBody = {
      host,
      key,
      keyLocation: `https://${host}/${key}.txt`,
      urlList: currentBatch
    };

    try {
      const response = await fetch(INDEXNOW_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`Batch ${b + 1} Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        console.log(`Batch ${b + 1} successfully submitted!`);
      } else {
        const text = await response.text();
        console.error(`Error on batch ${b + 1}: ${text}`);
      }
    } catch (error: any) {
      console.error(`Network error on batch ${b + 1}:`, error.message);
    }
  }

  console.log('Sitemap submission completed.');
}

main();
