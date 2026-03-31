import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';
import OpenAI from 'openai';

// Usage: node scripts/translate-strongs.js

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_API_KEY) {
    console.error("ERRO: OPENAI_API_KEY não está configurada no .env");
    process.exit(1);
}

const BATCH_SIZE = 30; // Número de palavras por lote
const FILES = ['public/data/strongs_greek.json', 'public/data/strongs_hebrew.json'];

async function translateBatch(wordsBatch) {
    const systemPrompt = `You are a world-class Biblical scholar and translator.
Translate the following Strong's Concordance definitions from English to Brazilian Portuguese (pt-BR).
Preserve theological exactness, capitalization, and formatting.
Reply ONLY with a strictly valid JSON object where keys are the Original Strong IDs provided, and values are the resulting translated definition.`;

    const userContent = JSON.stringify(wordsBatch, null, 2);

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: "json_object" },
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
        ],
        temperature: 0.1,
    });

    const content = response.choices[0].message.content;
    if (!content) return {};
    return JSON.parse(content);
}

async function processFile(filePath) {
    const fullPath = path.resolve(process.cwd(), filePath);
    console.log(`\nLendo arquivo: ${filePath}...`);

    let data;
    try {
        const rawData = await fs.readFile(fullPath, 'utf-8');
        data = JSON.parse(rawData);
    } catch (err) {
        console.error(`Erro ao ler ${filePath}:`, err);
        return;
    }

    const entriesToTranslate = [];
    for (const [id, entry] of Object.entries(data)) {
        // Pula se já foi traduzido ou se a definição for inexistente/vazia
        if (entry.definition_pt || !entry.definition || entry.definition.trim() === '') {
            continue;
        }
        entriesToTranslate.push({ id, definition: entry.definition });
    }

    console.log(`Total de palavras pendentes para tradução em ${filePath}: ${entriesToTranslate.length}`);

    if (entriesToTranslate.length === 0) {
        console.log("Nada a traduzir neste arquivo.");
        return;
    }

    // Processo de tradução em lotes
    for (let i = 0; i < entriesToTranslate.length; i += BATCH_SIZE) {
        const batch = entriesToTranslate.slice(i, i + BATCH_SIZE);
        console.log(`Traduzindo lote de ${i + 1} a ${Math.min(i + BATCH_SIZE, entriesToTranslate.length)}...`);

        const batchObj = {};
        for (const item of batch) {
            batchObj[item.id] = item.definition;
        }

        try {
            const translatedMap = await translateBatch(batchObj);

            // Aplica as traduções de volta ao objeto de dados
            let newlyTranslated = 0;
            for (const id of Object.keys(batchObj)) {
                if (translatedMap[id]) {
                    data[id].definition_pt = translatedMap[id];
                    newlyTranslated++;
                }
            }

            // Salva o progresso logo após este lote
            if (newlyTranslated > 0) {
                await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf-8');
                console.log(`  -> Lote concluído. ${newlyTranslated} novas palavras salvas.`);
            }

        } catch (err) {
            console.error(`  -> Erro na API ao traduzir lote no índice ${i}. Pausando a tradução. Pode rodar o script novamente depois. Erro:`, err.message);
            break;
        }

        // Intervalo de segurança rápido
        await new Promise(r => setTimeout(r, 500));
    }

    console.log(`Arquivo ${filePath} finalizado!`);
}

async function main() {
    console.log("Iniciando Tradutor do Dicionário Strong para Português (OpenAI)\n");
    for (const file of FILES) {
        await processFile(file);
    }
    console.log("\nProcesso de tradução totalmente concluído!");
}

main().catch(console.error);
