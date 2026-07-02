# IndexNow Integration

This document outlines the IndexNow implementation for Bíblia Vive (`bibliavive.com.br`) to notify search engines (such as Bing) of new or updated URLs.

## Environment Variables

The IndexNow script requires two environment variables to be configured:

- `INDEXNOW_KEY`: The IndexNow API key. A key file named `{INDEXNOW_KEY}.txt` containing this key value must be hosted at the site root (e.g. `https://www.bibliavive.com.br/{INDEXNOW_KEY}.txt`).
- `INDEXNOW_HOST`: The domain host of the website, which must match the domain of the submitted URLs (e.g., `www.bibliavive.com.br` or `bibliavive.com.br`).

### Local Development Setup

To test the integration locally, add these variables to your `.env` file at the project root:

```env
INDEXNOW_KEY=your_indexnow_key_here
INDEXNOW_HOST=www.bibliavive.com.br
```

### Production Setup (Vercel)

Ensure `INDEXNOW_KEY` and `INDEXNOW_HOST` are configured in your Vercel Environment Variables dashboard under project settings.

---

## Usage

### 1. Core URLs Submission
To notify search engines about the home page and core static/reading pages:

```bash
npm run indexnow:core
```

This runs the script using the configuration file:
- Script: [scripts/indexnow-notify.ts](file:///c:/Users/sorai/Desktop/Bruno/Projetos/Biblia/biblia-vive-leitura-main/scripts/indexnow-notify.ts)
- Config: [config/indexnow-core-urls.json](file:///c:/Users/sorai/Desktop/Bruno/Projetos/Biblia/biblia-vive-leitura-main/config/indexnow-core-urls.json)

### 2. Entire Site Sitemap Submission (Recommended after global updates)
To notify search engines about all pages generated in your sitemap (e.g. after a global title/layout change):

```bash
npm run indexnow:sitemap
```

This runs the script:
- Script: [scripts/indexnow-sitemap.ts](file:///c:/Users/sorai/Desktop/Bruno/Projetos/Biblia/biblia-vive-leitura-main/scripts/indexnow-sitemap.ts)
- Extracts all URLs directly from the built sitemap at `dist/sitemap.xml` and submits them in batches.

### 3. Custom JSON URL List Submission
To submit a custom list of URLs:

```bash
npx tsx scripts/indexnow-notify.ts <path-to-json-file>
```

Where the JSON file is an array of absolute URLs:

```json
[
  "https://www.bibliavive.com.br/artigos/novo-artigo",
  "https://www.bibliavive.com.br/nvi/sl/23"
]
```

---

## IndexNow API Response Codes

- **`200 OK`**: URLs submitted successfully.
- **`202 Accepted`**: Request received, but key verification is pending/being processed.
- **`400 Bad Request`**: Invalid request structure.
- **`403 Forbidden`**: Invalid key or key mismatch with host.
- **`422 Unprocessable Entity`**: URLs do not match the host, or invalid URL format.
