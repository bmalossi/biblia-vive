// ─────────────────────────────────────────────────────────────────────────────
// useHymnCredits.ts — Bíblia Vive
//
// Busca créditos dinâmicos de hinos da Harpa Cristã no Supabase (app_config).
// Prioridade: Supabase → JSON estático (fallback).
// Escrita restrita a admins via RLS da app_config.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import hymnsData from "@/data/harpa-hymns.json";

export interface HymnCredits {
  /** Intérprete / voz da gravação */
  voice?: string;
  /** Fonte ou origem da gravação (ex: "CD Vol. 3", "YouTube") */
  source?: string;
  /** Observações livres do admin */
  notes?: string;
  // Campos legados do JSON estático (mantidos para compatibilidade)
  guitar?: string;
  sourceUrl?: string;
}

const STALE_TIME = 5 * 60 * 1000; // 5 minutos

function buildKey(hymnNumber: number) {
  return `harpa_credits_${hymnNumber}`;
}

/**
 * Retorna créditos do hino com fallback: Supabase → JSON estático.
 * `saveCredits` faz upsert no Supabase e invalida o cache imediatamente.
 */
export function useHymnCredits(hymnNumber: number) {
  const queryClient = useQueryClient();

  // ── Leitura ──────────────────────────────────────────────────────────────
  const { data: supabaseCredits, isLoading } = useQuery<HymnCredits | null>({
    queryKey: ["hymn_credits", hymnNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", buildKey(hymnNumber))
        .maybeSingle();

      if (error || !data) return null;
      return data.value as HymnCredits;
    },
    staleTime: STALE_TIME,
    enabled: !!hymnNumber && !isNaN(hymnNumber),
  });

  // ── Fallback para JSON estático ───────────────────────────────────────────
  const jsonHymn = (hymnsData as Array<{ numero: number; credits?: HymnCredits }>)
    .find((h) => h.numero === hymnNumber);
  const jsonCredits: HymnCredits | null = jsonHymn?.credits ?? null;

  // Supabase vence; se não há dados no Supabase, usa JSON
  const credits: HymnCredits | null = supabaseCredits ?? jsonCredits;

  const hasRealCredits = !!(
    credits?.voice?.trim() ||
    credits?.source?.trim() ||
    credits?.notes?.trim() ||
    credits?.guitar?.trim() ||
    credits?.sourceUrl?.trim()
  );

  // ── Escrita (admin only — RLS garante no banco) ───────────────────────────
  const { mutateAsync: saveCredits, isPending: isSaving, error: saveError } = useMutation({
    mutationFn: async (newCredits: HymnCredits) => {
      // Remove campos vazios antes de salvar
      const cleaned: HymnCredits = {};
      if (newCredits.voice?.trim())     cleaned.voice     = newCredits.voice.trim();
      if (newCredits.source?.trim())    cleaned.source    = newCredits.source.trim();
      if (newCredits.notes?.trim())     cleaned.notes     = newCredits.notes.trim();
      if (newCredits.sourceUrl?.trim()) cleaned.sourceUrl = newCredits.sourceUrl.trim();

      const { error } = await supabase.from("app_config").upsert({
        key: buildKey(hymnNumber),
        value: cleaned,
      });

      if (error) throw new Error(error.message);
      return cleaned;
    },
    onSuccess: () => {
      // Força refetch imediato para o admin ver o resultado salvo
      queryClient.invalidateQueries({ queryKey: ["hymn_credits", hymnNumber] });
    },
  });

  return {
    credits,
    hasRealCredits,
    isLoading,
    saveCredits,
    isSaving,
    saveError: saveError instanceof Error ? saveError.message : null,
  };
}
