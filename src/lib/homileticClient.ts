/**
 * homileticClient.ts — Bíblia Vive · Projeto Logos
 *
 * Cliente de persistência do Estúdio Homilético e Modo Púlpito conectado
 * ao Cloudflare Worker + Cloudflare D1 (ADR-0015).
 */

import { supabase } from "@/lib/supabase";
import type { MemorialEntry } from "@/lib/noteStore";

export type DesfechoTipo = "consolacao" | "confronto" | "conversao" | "oracao";

export interface HomileticTopicStep {
  stepA_fato: string;
  stepB_porque: string;
  stepC_contraste: string;
  stepD_tensao: string;
}

export interface HomileticTopic {
  id: string;
  title: string;
  steps: HomileticTopicStep;
}

export interface Sermon {
  id: string;
  userId: string;
  inspirationNoteId?: string;
  title: string;
  bookId?: string;
  bookName?: string;
  chapter?: number;
  verse?: number | null;
  version?: string;
  sparkText?: string;
  status: "draft" | "completed";
  desfechoTipo?: DesfechoTipo | null;
  desfechoTexto?: string;
  bloco1Exegese?: string;
  bloco1IntencaoOriginal?: string;
  bloco2Topicos?: HomileticTopic[];
  bloco3Aplicacao?: string;
  introducao?: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_WORKER_URL =
  import.meta.env.VITE_HOMILETIC_WORKER_URL ||
  (import.meta.env.DEV ? "http://localhost:8788" : "https://estudio.bibliavive.com.br");

// Circuit breaker simples para não spammar erros de rede quando o Worker local não estiver rodando
let workerOfflineUntil = 0;

function markWorkerOffline() {
  workerOfflineUntil = Date.now() + 45000; // pausa tentativas de rede por 45s se offline
}

function isWorkerCircuitOpen(): boolean {
  return Date.now() < workerOfflineUntil;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Cria um novo esboço de Sermão a partir de uma nota de Inspiração do Memorial.
 */
export async function createSermonFromInspiration(
  inspirationEntry: MemorialEntry
): Promise<Sermon> {
  const headers = await getAuthHeaders();
  const payload = {
    inspirationNoteId: inspirationEntry.id,
    title: inspirationEntry.title || `Estudo em ${inspirationEntry.bookName || "Passagem"}`,
    bookId: inspirationEntry.bookId,
    bookName: inspirationEntry.bookName,
    chapter: inspirationEntry.chapter,
    verse: inspirationEntry.verse,
    version: inspirationEntry.version || "acf",
    sparkText: inspirationEntry.content,
  };

  if (!isWorkerCircuitOpen()) {
    try {
      const res = await fetch(`${DEFAULT_WORKER_URL}/api/sermons`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        return data.sermon;
      }
    } catch (err) {
      markWorkerOffline();
      console.info("[homileticClient] Worker D1 local offline (localhost:8788). Operando em modo cache local resiliente.");
    }
  }

  // Fallback local se worker ainda não estiver conectado em desenvolvimento
  const localSermon: Sermon = {
    id: `sermon_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: (await supabase.auth.getSession()).data.session?.user.id || "guest",
    inspirationNoteId: inspirationEntry.id,
    title: payload.title,
    bookId: payload.bookId,
    bookName: payload.bookName,
    chapter: payload.chapter,
    verse: payload.verse,
    version: payload.version,
    sparkText: payload.sparkText,
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(`bv_sermon_${localSermon.id}`, JSON.stringify(localSermon));
  return localSermon;
}

/**
 * Recupera um Sermão por ID.
 */
export async function getSermon(sermonId: string): Promise<Sermon | null> {
  if (!isWorkerCircuitOpen()) {
    const headers = await getAuthHeaders();
    try {
      const res = await fetch(`${DEFAULT_WORKER_URL}/api/sermons/${sermonId}`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        return data.sermon;
      }
    } catch (err) {
      markWorkerOffline();
      console.info("[homileticClient] Worker D1 local offline, lendo cache local.");
    }
  }

  const cached = localStorage.getItem(`bv_sermon_${sermonId}`);
  if (cached) {
    try {
      return JSON.parse(cached) as Sermon;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Atualiza os blocos e campos de um Sermão no D1.
 */
export async function saveSermon(sermon: Partial<Sermon> & { id: string }): Promise<Sermon> {
  const updatedPayload = {
    ...sermon,
    updatedAt: new Date().toISOString(),
  };

  if (!isWorkerCircuitOpen()) {
    const headers = await getAuthHeaders();
    try {
      const res = await fetch(`${DEFAULT_WORKER_URL}/api/sermons/${sermon.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updatedPayload),
      });
      if (res.ok) {
        const data = await res.json();
        return data.sermon;
      }
    } catch (err) {
      markWorkerOffline();
      console.info("[homileticClient] Worker D1 local offline, persistindo no cache local.");
    }
  }

  // Leitura direta do localStorage no fallback sem nova tentativa de rede redundante
  let existing: Sermon | null = null;
  const cached = localStorage.getItem(`bv_sermon_${sermon.id}`);
  if (cached) {
    try {
      existing = JSON.parse(cached) as Sermon;
    } catch {}
  }

  const merged: Sermon = {
    ...(existing || ({} as Sermon)),
    ...updatedPayload,
    updatedAt: updatedPayload.updatedAt,
  } as Sermon;

  localStorage.setItem(`bv_sermon_${sermon.id}`, JSON.stringify(merged));
  return merged;
}

/**
 * Lista todos os sermões do usuário autenticado no D1.
 */
export async function listSermons(): Promise<Sermon[]> {
  if (!isWorkerCircuitOpen()) {
    const headers = await getAuthHeaders();
    try {
      const res = await fetch(`${DEFAULT_WORKER_URL}/api/sermons`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        return data.sermons || [];
      }
    } catch (err) {
      markWorkerOffline();
      console.info("[homileticClient] Worker D1 local offline, listando do cache local.");
    }
  }

  // Fallback local: recuperar todas as chaves bv_sermon_* do localStorage
  const localSermons: Sermon[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("bv_sermon_")) {
      try {
        const item = JSON.parse(localStorage.getItem(key) || "");
        if (item && item.id) localSermons.push(item);
      } catch {
        // ignore
      }
    }
  }
  return localSermons.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export interface PreachingLog {
  id: string;
  sermonId: string;
  userId: string;
  churchName: string;
  city: string;
  preachedAt: string;
  notes?: string;
  createdAt: string;
  sermonTitle?: string;
}

/**
 * Salva um registro pós-pregação na tabela preaching_logs do Cloudflare D1.
 */
export async function savePreachingLog(log: {
  sermonId: string;
  churchName: string;
  city: string;
  preachedAt: string;
  notes?: string;
}): Promise<PreachingLog> {
  const headers = await getAuthHeaders();
  const payload = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  if (!isWorkerCircuitOpen()) {
    try {
      const res = await fetch(`${DEFAULT_WORKER_URL}/api/sermons/${log.sermonId}/preaching-logs`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        return data.preachingLog;
      }
    } catch (err) {
      markWorkerOffline();
      console.info("[homileticClient] Worker D1 local offline, registrando pregação no cache local.");
    }
  }

  // Fallback local
  const session = (await supabase.auth.getSession()).data.session;
  const localLog: PreachingLog = {
    id: payload.id,
    sermonId: log.sermonId,
    userId: session?.user.id || "guest",
    churchName: log.churchName,
    city: log.city,
    preachedAt: log.preachedAt,
    notes: log.notes,
    createdAt: payload.createdAt,
  };

  const key = `bv_preaching_logs_${log.sermonId}`;
  try {
    const existing: PreachingLog[] = JSON.parse(localStorage.getItem(key) || "[]");
    existing.unshift(localLog);
    localStorage.setItem(key, JSON.stringify(existing));
  } catch {}

  return localLog;
}

/**
 * Lista o histórico de pregação de um sermão específico ou de todos do usuário.
 */
export async function listPreachingLogs(sermonId?: string): Promise<PreachingLog[]> {
  const headers = await getAuthHeaders();
  if (!isWorkerCircuitOpen()) {
    try {
      const url = sermonId
        ? `${DEFAULT_WORKER_URL}/api/sermons/${sermonId}/preaching-logs`
        : `${DEFAULT_WORKER_URL}/api/preaching-logs`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        return data.preachingLogs || [];
      }
    } catch (err) {
      markWorkerOffline();
      console.info("[homileticClient] Worker D1 local offline, listando pregações do cache local.");
    }
  }

  if (sermonId) {
    const key = `bv_preaching_logs_${sermonId}`;
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  }

  // Se sem sermonId, agrega todos os bv_preaching_logs_*
  const allLogs: PreachingLog[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("bv_preaching_logs_")) {
        try {
          const items = JSON.parse(localStorage.getItem(key) || "[]");
          if (Array.isArray(items)) allLogs.push(...items);
        } catch {}
      }
    }
  } catch {}

  return allLogs.sort(
    (a, b) => new Date(b.preachedAt).getTime() - new Date(a.preachedAt).getTime()
  );
}

