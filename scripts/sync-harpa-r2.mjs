// ─────────────────────────────────────────────────────────────────────────────
// scripts/sync-harpa-r2.mjs — Bíblia Vive
//
// Varre automaticamente todos os arquivos da pasta /harpas/ no bucket R2
// (audio-biblia-cache), identifica o número do hino no início de cada nome de
// arquivo e atualiza o harpa-hymns.json e Supabase app_config automaticamente.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Carrega .env.local e .env
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const HYMNS_FILE = path.join(PROJECT_ROOT, 'src', 'data', 'harpa-hymns.json');

const accessKeyId = (
  process.env.AUDIO_R2_ACCESS_KEY_ID ||
  process.env.R2_ACCESS_KEY_ID ||
  ''
).trim().replace(/^["']|["']$/g, '');

const secretAccessKey = (
  process.env.AUDIO_R2_SECRET_ACCESS_KEY ||
  process.env.R2_SECRET_ACCESS_KEY ||
  ''
).trim().replace(/^["']|["']$/g, '');

const endpoint = (
  process.env.AUDIO_R2_ENDPOINT ||
  process.env.R2_ENDPOINT ||
  'https://a63dc175e27a1425b6ead0b1c1ccd53c.r2.cloudflarestorage.com'
).trim().replace(/^["']|["']$/g, '');

const bucket = (
  process.env.AUDIO_R2_BUCKET_NAME ||
  'audio-biblia-cache'
).trim().replace(/^["']|["']$/g, '');

if (!accessKeyId || !secretAccessKey) {
  console.error('❌ Credenciais do R2 não encontradas no ambiente.');
  console.error('Configure AUDIO_R2_ACCESS_KEY_ID e AUDIO_R2_SECRET_ACCESS_KEY no .env.local.');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function listAllHarpasFiles() {
  const files = [];
  let continuationToken = undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: 'harpas/',
      ContinuationToken: continuationToken,
    });

    const response = await s3.send(command);
    if (response.Contents) {
      for (const obj of response.Contents) {
        if (!obj.Key || obj.Key.endsWith('/')) continue;
        const filename = obj.Key.replace(/^harpas\//, '');
        if (filename.toLowerCase().endsWith('.mp3') || filename.toLowerCase().endsWith('.m4a') || filename.toLowerCase().endsWith('.ogg')) {
          files.push({
            key: obj.Key,
            filename,
            size: obj.Size,
          });
        }
      }
    }
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return files;
}

async function run() {
  console.log(`📡 Conectando ao Cloudflare R2:`);
  console.log(`   Bucket: ${bucket}`);
  console.log(`   Pasta:  harpas/`);
  console.log(`   Key ID: ${accessKeyId.slice(0, 8)}...`);

  let r2Files = [];
  try {
    r2Files = await listAllHarpasFiles();
    console.log(`✅ Sucesso! Encontrados ${r2Files.length} arquivos de áudio no R2.`);
  } catch (err) {
    if (err.Code === 'AccessDenied' || err.name === 'AccessDenied') {
      console.error(`\n❌ Erro de Permissão (AccessDenied):`);
      console.error(`A chave de API do R2 configurada não tem permissão para ler o bucket "${bucket}".`);
      console.error(`Para corrigir no Cloudflare:`);
      console.error(`1. Acesse o Cloudflare Dashboard → R2 → Manage R2 API Tokens`);
      console.error(`2. Crie ou edite um Token com permissão "Object Read" ou "Admin Read & Write" no bucket "${bucket}"`);
      console.error(`3. Cole o Access Key ID e Secret no .env.local como:`);
      console.error(`   AUDIO_R2_ACCESS_KEY_ID=...`);
      console.error(`   AUDIO_R2_SECRET_ACCESS_KEY=...`);
    } else {
      console.error('❌ Erro ao listar arquivos do R2:', err);
    }
    process.exit(1);
  }

  // Carrega harpa-hymns.json
  const hymnsRaw = await fs.readFile(HYMNS_FILE, 'utf8');
  const hymns = JSON.parse(hymnsRaw);

  // Agrupa arquivos por número do hino
  const filesByHymn = new Map();
  for (const file of r2Files) {
    const match = file.filename.match(/^0*(\d+)/);
    if (!match) continue;
    const num = parseInt(match[1], 10);
    if (!filesByHymn.has(num)) filesByHymn.set(num, []);
    filesByHymn.get(num).push(file);
  }

  function scoreCandidate(filename, title) {
    let score = 0;
    const lower = filename.toLowerCase();
    const lowerTitle = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cleanFile = lower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Se contém o título do hino
    if (cleanFile.includes(lowerTitle)) score += 25;

    // Se tem formato NUM - ARTISTA - TITULO.mp3
    const parts = filename.replace(/\.[^/.]+$/, '').split(/\s*-\s*/);
    if (parts.length >= 3) score += 20;

    // Penaliza versões secundárias como "120 2", "(2)" se houver outra versão principal
    if (/\b\d+\s+\d+\b/.test(filename) || lower.includes(' 2 ') || lower.includes('(2)') || lower.includes('natal 2')) {
      score -= 30;
    }

    return score;
  }

  let updatedCount = 0;
  const linkedDetails = [];

  for (const [hymnNumber, candidates] of filesByHymn.entries()) {
    const hymn = hymns.find((h) => h.numero === hymnNumber);
    if (!hymn) {
      console.warn(`⚠️ Hino nº ${hymnNumber} não encontrado na base de dados (arquivos: ${candidates.map(c => c.filename).join(', ')})`);
      continue;
    }

    // Ordena pelo maior score e pega o melhor arquivo
    candidates.sort((a, b) => scoreCandidate(b.filename, hymn.tituloFormatado) - scoreCandidate(a.filename, hymn.tituloFormatado));
    const bestFile = candidates[0];

    const parts = bestFile.filename.replace(/\.[^/.]+$/, '').split(/\s*-\s*/);
    let extractedVoice = undefined;
    if (parts.length >= 3) {
      extractedVoice = parts[1].trim();
    }

    const wasAudioAvailable = hymn.hasAudio && hymn.audioFile === bestFile.filename;

    hymn.hasAudio = true;
    hymn.audioFile = bestFile.filename;

    if (extractedVoice && (!hymn.credits || !hymn.credits.voice)) {
      hymn.credits = {
        ...(hymn.credits || {}),
        voice: extractedVoice,
      };
    }

    if (!wasAudioAvailable) {
      updatedCount++;
      linkedDetails.push({
        numero: hymnNumber,
        titulo: hymn.tituloFormatado,
        audioFile: bestFile.filename,
        voice: hymn.credits?.voice || '—',
      });
    }
  }

  // Salva harpa-hymns.json atualizado
  await fs.writeFile(HYMNS_FILE, JSON.stringify(hymns, null, 2), 'utf8');

  console.log(`\n🎉 Sincronização concluída!`);
  console.log(`   Total de áudios no R2: ${r2Files.length}`);
  console.log(`   Hinos novos/atualizados: ${updatedCount}`);

  if (linkedDetails.length > 0) {
    console.log(`\n📋 Amostra dos hinos vinculados:`);
    console.table(linkedDetails.slice(0, 20));
    if (linkedDetails.length > 20) {
      console.log(`... e mais ${linkedDetails.length - 20} hinos atualizados.`);
    }
  }
}

run();
