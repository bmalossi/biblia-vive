import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

if (process.env.VERCEL || process.env.VERCEL_ENV) {
    console.log('[prerender] Ambiente Vercel detectado. Ignorando o script de prerender usando Puppeteer porque o Vercel não possui as bibliotecas do sistema (como libnspr4.so) necessárias para o Chrome durante o build.');
    console.log('[prerender] O site continuará sendo gerado como um SPA normalmente (index.html).');
    process.exit(0);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

const ROUTES = [
    '/',
    '/acf/jhn/3',
    '/acf/psa/23',
    '/acf/psa/91',
    '/acf/php/4',
    '/acf/rom/8',
    '/acf/isa/41',
    '/acf/jer/29',
    '/acf/mat/6',
    '/acf/pro/3',
    '/busca'
];

async function startServer() {
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.svg': 'image/svg+xml'
    };

    const server = http.createServer(async (req, res) => {
        let reqUrl = req.url.split('?')[0]; // Remove query params
        let filePath = path.join(DIST_DIR, reqUrl === '/' ? 'index.html' : reqUrl);

        // Redirect cleanly to index.html for SPA react-router paths without extension 
        const extname = path.extname(filePath);
        if (!extname) {
            filePath = path.join(DIST_DIR, 'index.html');
        }

        try {
            const content = await fs.readFile(filePath);
            const ext = path.extname(filePath).toLowerCase();
            res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
            res.end(content, 'utf-8');
        } catch (e) {
            // Fallback for SPA routing if file not found
            try {
                const content = await fs.readFile(path.join(DIST_DIR, 'index.html'));
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content, 'utf-8');
            } catch (e2) {
                res.writeHead(404);
                res.end('Not found');
            }
        }
    });

    return new Promise((resolve) => {
        server.listen(0, () => {
            resolve({
                port: server.address().port,
                close: () => server.close()
            });
        });
    });
}

async function run() {
    let server;
    let browser;
    try {
        server = await startServer();
        const baseUrl = `http://localhost:${server.port}`;

        browser = await puppeteer.launch({
            headless: true, // Ou "new" em versoes recentes 
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
        });

        for (const route of ROUTES) {
            try {
                const page = await browser.newPage();
                const targetUrl = `${baseUrl}${route}`;

                // Aguarda evento networkidle2 OU um timeout de 3 segundos, o que vier primeiro.
                // Capturamos a excecao para continuar pegando o HTML de qualquer forma.
                try {
                    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 3000 });
                } catch (e) {
                    // Timeout esperado, ignora o erro e prossegue para capturar
                }

                const html = await page.content();

                // Cria diretorio local e salva
                let outputDir = DIST_DIR;
                if (route !== '/') {
                    outputDir = path.join(DIST_DIR, route.substring(1));
                    await fs.mkdir(outputDir, { recursive: true });
                }

                const outputPath = path.join(outputDir, 'index.html');
                await fs.writeFile(outputPath, html, 'utf-8');

                const sizeKb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
                console.log(`✓ ${route} → salvo (${sizeKb}KB)`);

                await page.close();
            } catch (err) {
                console.log(`✗ ${route} → erro: [${err.message}]`);
            }
        }

    } catch (err) {
        console.log(`✗ Erro global: [${err.message}]`);
    } finally {
        if (browser) await browser.close();
        if (server) server.close();

        // Sempre encerra com sucesso (0) para proteger o pipeline
        process.exit(0);
    }
}

run();
