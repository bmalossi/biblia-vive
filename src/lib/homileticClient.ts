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
    console.warn("[homileticClient] Falha ao contatar Worker D1, gerando local:", err);
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
    console.warn("[homileticClient] Falha ao buscar no Worker D1, lendo cache local:", err);
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
  const headers = await getAuthHeaders();
  const updatedPayload = {
    ...sermon,
    updatedAt: new Date().toISOString(),
  };

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
    console.warn("[homileticClient] Falha ao salvar no Worker D1, salvando local:", err);
  }

  const existing = await getSermon(sermon.id);
  const merged: Sermon = {
    ...(existing || ({} as Sermon)),
    ...updatedPayload,
    updatedAt: updatedPayload.updatedAt,
  } as Sermon;

  localStorage.setItem(`bv_sermon_${sermon.id}`, JSON.stringify(merged));
  return merged;
}
