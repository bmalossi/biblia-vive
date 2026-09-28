/**
 * homileticClient.ts — Bíblia Vive · Projeto Logos
 *
 * Cliente de persistência do Estúdio Homilético e Modo Púlpito conectado
 * nativamente à conta do usuário no Supabase com suporte a Cloudflare D1
 * opcional e sincronização multi-dispositivo offline-first (ADR-0015, ADR-0017).
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

// URL do Worker Cloudflare (se configurada e ativa na Cloudflare)
const CONFIGURED_WORKER_URL = import.meta.env.VITE_HOMILETIC_WORKER_URL || "";

// Circuit breaker simples para não spammar erros se o Worker opcional estiver offline
let workerOfflineUntil = 0;

function markWorkerOffline() {
  workerOfflineUntil = Date.now() + 45000;
}

function isWorkerCircuitOpen(): boolean {
  return Date.now() < workerOfflineUntil;
}

// Indicador se a tabela no Supabase ainda não foi criada via SQL Editor
let cloudTableMissing = false;

export function isCloudTablePending(): boolean {
  return cloudTableMissing;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Conversores de Dados (Supabase Snake_case <-> TypeScript CamelCase) ──────

function mapSermonRow(row: any): Sermon {
  let parsedTopicos: HomileticTopic[] = [];
  if (Array.isArray(row.bloco_2_topicos)) {
    parsedTopicos = row.bloco_2_topicos;
  } else if (typeof row.bloco_2_topicos === "string") {
    try {
      parsedTopicos = JSON.parse(row.bloco_2_topicos);
    } catch {
      parsedTopicos = [];
    }
  }

  return {
    id: row.id,
    userId: row.user_id,
    inspirationNoteId: row.inspiration_note_id || undefined,
    title: row.title || "Sem título",
    bookId: row.book_id || undefined,
    bookName: row.book_name || undefined,
    chapter: row.chapter !== null && row.chapter !== undefined ? Number(row.chapter) : undefined,
    verse: row.verse !== null && row.verse !== undefined ? Number(row.verse) : undefined,
    version: row.version || "acf",
    sparkText: row.spark_text || undefined,
    status: (row.status as "draft" | "completed") || "draft",
    desfechoTipo: (row.desfecho_tipo as DesfechoTipo) || null,
    desfechoTexto: row.desfecho_texto || undefined,
    bloco1Exegese: row.bloco_1_exegese || undefined,
    bloco1IntencaoOriginal: row.bloco_1_intencao_original || undefined,
    bloco2Topicos: parsedTopicos,
    bloco3Aplicacao: row.bloco_3_aplicacao || undefined,
    introducao: row.introducao || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function mapSermonToRow(sermon: Partial<Sermon> & { id: string }, userId: string): any {
  const row: any = {
    id: sermon.id,
    user_id: userId,
    updated_at: sermon.updatedAt || new Date().toISOString(),
  };

  if (sermon.title !== undefined) row.title = sermon.title;
  if (sermon.inspirationNoteId !== undefined) row.inspiration_note_id = sermon.inspirationNoteId;
  if (sermon.bookId !== undefined) row.book_id = sermon.bookId;
  if (sermon.bookName !== undefined) row.book_name = sermon.bookName;
  if (sermon.chapter !== undefined) row.chapter = sermon.chapter;
  if (sermon.verse !== undefined) row.verse = sermon.verse;
  if (sermon.version !== undefined) row.version = sermon.version;
  if (sermon.sparkText !== undefined) row.spark_text = sermon.sparkText;
  if (sermon.status !== undefined) row.status = sermon.status;
  if (sermon.desfechoTipo !== undefined) row.desfecho_tipo = sermon.desfechoTipo;
  if (sermon.desfechoTexto !== undefined) row.desfecho_texto = sermon.desfechoTexto;
  if (sermon.bloco1Exegese !== undefined) row.bloco_1_exegese = sermon.bloco1Exegese;
  if (sermon.bloco1IntencaoOriginal !== undefined) row.bloco_1_intencao_original = sermon.bloco1IntencaoOriginal;
  if (sermon.bloco2Topicos !== undefined) row.bloco_2_topicos = sermon.bloco2Topicos;
  if (sermon.bloco3Aplicacao !== undefined) row.bloco_3_aplicacao = sermon.bloco3Aplicacao;
  if (sermon.introducao !== undefined) row.introducao = sermon.introducao;
  if (sermon.createdAt !== undefined) row.created_at = sermon.createdAt;

  return row;
}

function mapLogRow(row: any): PreachingLog {
  return {
    id: row.id,
    sermonId: row.sermon_id,
    userId: row.user_id,
    churchName: row.church_name,
    city: row.city,
    preachedAt: row.preached_at,
    notes: row.notes || undefined,
    createdAt: row.created_at,
  };
}

function mapLogToRow(log: any, userId: string): any {
  return {
    id: log.id,
    sermon_id: log.sermonId,
    user_id: userId,
    church_name: log.churchName,
    city: log.city,
    preached_at: log.preachedAt,
    notes: log.notes || null,
    created_at: log.createdAt || new Date().toISOString(),
  };
}

// ─── API do Estúdio Homilético ────────────────────────────────────────────────

/**
 * Cria um novo esboço de Sermão a partir de uma nota de Inspiração do Memorial.
 */
export async function createSermonFromInspiration(
  inspirationEntry: MemorialEntry
): Promise<Sermon> {
  const session = (await supabase.auth.getSession()).data.session;
  const currentUserId = session?.user?.id || "guest";

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

  // 1. Tentar Worker se configurado
  if (CONFIGURED_WORKER_URL && !isWorkerCircuitOpen()) {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${CONFIGURED_WORKER_URL}/api/sermons`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.sermon) {
          localStorage.setItem(`bv_sermon_${data.sermon.id}`, JSON.stringify(data.sermon));
          return data.sermon;
        }
      }
    } catch {
      markWorkerOffline();
    }
  }

  // 2. Modelo padrão local
  const localSermon: Sermon = {
    id: `sermon_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: currentUserId,
    inspirationNoteId: payload.inspirationNoteId,
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

  // 3. Persistir na conta do Supabase
  if (session?.user?.id) {
    try {
      const row = mapSermonToRow(localSermon, session.user.id);
      const { data, error } = await supabase
        .from("sermons")
        .insert(row)
        .select()
        .maybeSingle();

      if (!error && data) {
        cloudTableMissing = false;
        const synced = mapSermonRow(data);
        localStorage.setItem(`bv_sermon_${synced.id}`, JSON.stringify(synced));
        return synced;
      } else if (error?.code === "PGRST205") {
        cloudTableMissing = true;
      }
    } catch (err) {
      console.info("[homileticClient] Supabase indisponível, salvo no cache local.", err);
    }
  }

  return localSermon;
}

/**
 * Recupera um Sermão por ID.
 */
export async function getSermon(sermonId: string): Promise<Sermon | null> {
  // 1. Tentar Worker se configurado
  if (CONFIGURED_WORKER_URL && !isWorkerCircuitOpen()) {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${CONFIGURED_WORKER_URL}/api/sermons/${sermonId}`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sermon) {
          localStorage.setItem(`bv_sermon_${sermonId}`, JSON.stringify(data.sermon));
          return data.sermon;
        }
      }
    } catch {
      markWorkerOffline();
    }
  }

  // 2. Tentar buscar da conta do Supabase
  const session = (await supabase.auth.getSession()).data.session;
  if (session?.user?.id) {
    try {
      const { data, error } = await supabase
        .from("sermons")
        .select("*")
        .eq("id", sermonId)
        .maybeSingle();

      if (!error && data) {
        cloudTableMissing = false;
        const mapped = mapSermonRow(data);
        localStorage.setItem(`bv_sermon_${sermonId}`, JSON.stringify(mapped));
        return mapped;
      } else if (error?.code === "PGRST205") {
        cloudTableMissing = true;
      }
    } catch (err) {
      console.info("[homileticClient] Supabase indisponível, lendo do cache local.", err);
    }
  }

  // 3. Fallback do cache local
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
 * Atualiza os blocos e campos de um Sermão na conta (Supabase) e no cache local.
 */
export async function saveSermon(sermon: Partial<Sermon> & { id: string }): Promise<Sermon> {
  const updatedPayload = {
    ...sermon,
    updatedAt: new Date().toISOString(),
  };

  // 1. Tentar Worker se configurado
  if (CONFIGURED_WORKER_URL && !isWorkerCircuitOpen()) {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${CONFIGURED_WORKER_URL}/api/sermons/${sermon.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updatedPayload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sermon) {
          localStorage.setItem(`bv_sermon_${sermon.id}`, JSON.stringify(data.sermon));
          return data.sermon;
        }
      }
    } catch {
      markWorkerOffline();
    }
  }

  // 2. Merge local não-destrutivo
  let existing: Sermon | null = null;
  const cached = localStorage.getItem(`bv_sermon_${sermon.id}`);
  if (cached) {
    try {
      existing = JSON.parse(cached) as Sermon;
    } catch {}
  }

  const session = (await supabase.auth.getSession()).data.session;
  const currentUserId = session?.user?.id || existing?.userId || sermon.userId || "guest";

  const cleanedPayload: any = {};
  for (const [k, v] of Object.entries(updatedPayload)) {
    if (v !== undefined) {
      cleanedPayload[k] = v;
    }
  }

  const merged: Sermon = {
    ...(existing || ({} as Sermon)),
    ...cleanedPayload,
    id: sermon.id,
    userId: currentUserId,
    createdAt: existing?.createdAt || sermon.createdAt || new Date().toISOString(),
    updatedAt: updatedPayload.updatedAt,
  } as Sermon;

  // Salva no cache local imediatamente
  localStorage.setItem(`bv_sermon_${sermon.id}`, JSON.stringify(merged));

  // 3. Persistir na conta do Supabase
  if (session?.user?.id) {
    try {
      const row = mapSermonToRow(merged, session.user.id);
      const { data, error } = await supabase
        .from("sermons")
        .upsert(row)
        .select()
        .maybeSingle();

      if (!error && data) {
        cloudTableMissing = false;
        const synced = mapSermonRow(data);
        localStorage.setItem(`bv_sermon_${sermon.id}`, JSON.stringify(synced));
        return synced;
      } else if (error?.code === "PGRST205") {
        cloudTableMissing = true;
      } else if (error) {
        console.warn("[homileticClient] Aviso ao persistir no Supabase:", error.message);
      }
    } catch (err) {
      console.info("[homileticClient] Falha ao persistir no Supabase, preservado no cache local.", err);
    }
  }

  return merged;
}

/**
 * Lista todos os sermões da conta do usuário no Supabase, com sincronização automática
 * de sermões previamente criados no navegador.
 */
export async function listSermons(): Promise<Sermon[]> {
  // 1. Tentar Worker se configurado
  if (CONFIGURED_WORKER_URL && !isWorkerCircuitOpen()) {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${CONFIGURED_WORKER_URL}/api/sermons`, { headers });
      if (res.ok) {
        const data = await res.json();
        return data.sermons || [];
      }
    } catch {
      markWorkerOffline();
    }
  }

  // 2. Consulta à conta Supabase
  const session = (await supabase.auth.getSession()).data.session;
  const remoteSermons: Sermon[] = [];
  let supabaseLoaded = false;

  if (session?.user?.id) {
    try {
      const { data, error } = await supabase
        .from("sermons")
        .select("*")
        .order("updated_at", { ascending: false });

      if (!error && data) {
        supabaseLoaded = true;
        cloudTableMissing = false;
        for (const row of data) {
          const s = mapSermonRow(row);
          remoteSermons.push(s);
          localStorage.setItem(`bv_sermon_${s.id}`, JSON.stringify(s));
        }
      } else if (error?.code === "PGRST205") {
        cloudTableMissing = true;
      } else if (error) {
        console.warn("[homileticClient] Erro ao listar do Supabase:", error.message);
      }
    } catch (err) {
      console.info("[homileticClient] Supabase indisponível no momento, listando cache local.", err);
    }
  }

  // 3. Varredura do LocalStorage (Sincronização de sermões locais do navegador)
  const localSermons: Sermon[] = [];
  const remoteIds = new Set(remoteSermons.map((s) => s.id));
  const unSyncedLocal: Sermon[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("bv_sermon_")) {
      try {
        const item = JSON.parse(localStorage.getItem(key) || "");
        if (item && item.id) {
          localSermons.push(item);
          if (!remoteIds.has(item.id)) {
            unSyncedLocal.push(item);
          }
        }
      } catch {
        // ignore parse error
      }
    }
  }

  // 4. Auto-migrar sermões locais pendentes para a conta do usuário no Supabase
  if (supabaseLoaded && session?.user?.id && unSyncedLocal.length > 0) {
    for (const localSermon of unSyncedLocal) {
      try {
        const row = mapSermonToRow(
          { ...localSermon, userId: session.user.id },
          session.user.id
        );
        const { error } = await supabase.from("sermons").upsert(row);
        if (!error) {
          remoteSermons.push({ ...localSermon, userId: session.user.id });
        }
      } catch (err) {
        console.warn("[homileticClient] Falha ao auto-sincronizar sermão local para o Supabase:", localSermon.id, err);
      }
    }
  }

  if (supabaseLoaded && session?.user?.id) {
    return remoteSermons.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  return localSermons.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

/**
 * Salva um registro pós-pregação na conta do usuário no Supabase e no cache local.
 */
export async function savePreachingLog(log: {
  sermonId: string;
  churchName: string;
  city: string;
  preachedAt: string;
  notes?: string;
}): Promise<PreachingLog> {
  const payload = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  // 1. Worker se configurado
  if (CONFIGURED_WORKER_URL && !isWorkerCircuitOpen()) {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${CONFIGURED_WORKER_URL}/api/sermons/${log.sermonId}/preaching-logs`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.preachingLog) {
          return data.preachingLog;
        }
      }
    } catch {
      markWorkerOffline();
    }
  }

  const session = (await supabase.auth.getSession()).data.session;
  const currentUserId = session?.user?.id || "guest";

  const localLog: PreachingLog = {
    id: payload.id,
    sermonId: log.sermonId,
    userId: currentUserId,
    churchName: log.churchName,
    city: log.city,
    preachedAt: log.preachedAt,
    notes: log.notes,
    createdAt: payload.createdAt,
  };

  // Salvar no cache local
  const key = `bv_preaching_logs_${log.sermonId}`;
  try {
    const existing: PreachingLog[] = JSON.parse(localStorage.getItem(key) || "[]");
    existing.unshift(localLog);
    localStorage.setItem(key, JSON.stringify(existing));
  } catch {}

  // Salvar no Supabase se logado
  if (session?.user?.id) {
    try {
      const row = mapLogToRow(localLog, session.user.id);
      const { data, error } = await supabase
        .from("preaching_logs")
        .upsert(row)
        .select()
        .maybeSingle();

      if (!error && data) {
        return mapLogRow(data);
      }
    } catch (err) {
      console.info("[homileticClient] Falha ao persistir preaching_log no Supabase, mantido em cache local.", err);
    }
  }

  return localLog;
}

/**
 * Lista o histórico de pregação de um sermão específico ou de todos do usuário.
 */
export async function listPreachingLogs(sermonId?: string): Promise<PreachingLog[]> {
  // 1. Worker se configurado
  if (CONFIGURED_WORKER_URL && !isWorkerCircuitOpen()) {
    try {
      const headers = await getAuthHeaders();
      const url = sermonId
        ? `${CONFIGURED_WORKER_URL}/api/sermons/${sermonId}/preaching-logs`
        : `${CONFIGURED_WORKER_URL}/api/preaching-logs`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        return data.preachingLogs || [];
      }
    } catch {
      markWorkerOffline();
    }
  }

  // 2. Consulta no Supabase
  const session = (await supabase.auth.getSession()).data.session;
  if (session?.user?.id) {
    try {
      let query = supabase
        .from("preaching_logs")
        .select("*")
        .order("preached_at", { ascending: false });

      if (sermonId) {
        query = query.eq("sermon_id", sermonId);
      }

      const { data, error } = await query;
      if (!error && data) {
        const logs = data.map(mapLogRow);
        if (sermonId) {
          localStorage.setItem(`bv_preaching_logs_${sermonId}`, JSON.stringify(logs));
        }
        return logs;
      }
    } catch (err) {
      console.info("[homileticClient] Supabase indisponível para preaching logs, lendo cache local.", err);
    }
  }

  // 3. Fallback do cache local
  if (sermonId) {
    const key = `bv_preaching_logs_${sermonId}`;
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  }

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
