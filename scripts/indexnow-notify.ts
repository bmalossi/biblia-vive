import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file for local execution
dotenv.config();

const INDEXNOW_API = 'https://api.indexnow.org/indexnow';

async function main() {
  const jsonPathArg = process.argv[2];
  if (!jsonPathArg) {
    console.error('Error: Please provide the JSON file path as a CLI argument.');
    console.error('Usage: tsx scripts/indexnow-notify.ts <path-to-json-file>');
    process.exit(1);
  }

  const absoluteJsonPath = path.resolve(process.cwd(), jsonPathArg);
  
  let urls: string[];
  try {
    const fileContent = await fs.readFile(absoluteJsonPath, 'utf-8');
    urls = JSON.parse(fileContent);
  } catch (error: any) {
    console.error(`Error reading or parsing JSON file at ${absoluteJsonPath}:`, error.message);
    process.exit(1);
  }

  if (!Array.isArray(urls)) {
    console.error('Error: JSON file content must be an array of URLs.');
    process.exit(1);
  }

  const key = process.env.INDEXNOW_KEY;
  const host = process.env.INDEXNOW_HOST;

  if (!key) {
    console.error('Error: Environment variable INDEXNOW_KEY is not defined.');
    process.exit(1);
  }

  if (!host) {
    console.error('Error: Environment variable INDEXNOW_HOST is not defined.');
    process.exit(1);
  }

  console.log(`Submitting ${urls.length} URLs to IndexNow...`);
  console.log(`Host: ${host}`);
  console.log(`Key: ${key.substring(0, 4)}... (length: ${key.length})`);

  const requestBody = {
    host,
    key,
    keyLocation: `https://${host}/${key}.txt`,
    urlList: urls
  };

  try {
    const response = await fetch(INDEXNOW_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`HTTP Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      console.log('URLs successfully submitted to IndexNow!');
    } else {
      const responseText = await response.text();
      console.error(`IndexNow API error: ${responseText}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('Network or HTTP request error occurred:', error.message);
    process.exit(1);
  }
}

main();
