// ─────────────────────────────────────────────────────────────────────────────
// appConfig.ts — Bíblia Vive
//
// Gerenciador de parâmetros operacionais e feature flags do sistema persistidos
// na tabela `app_config` do Supabase. Permite leitura global e atualização
// instantânea pelo painel administrativo (/admin/configuracoes) sem redeploy.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '@/lib/supabase';

export interface ScriptureThreadConfig {
  enabled: boolean;
  granularity: 'chapter' | 'verse';
  maxNotes: number;
  requirePro: boolean;
}

export const DEFAULT_SCRIPTURE_THREAD_CONFIG: ScriptureThreadConfig = {
  enabled: true,
  granularity: 'chapter',
  maxNotes: 30,
  requirePro: false,
};

let cachedConfig: ScriptureThreadConfig | null = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 15_000; // 15 segundos para resposta ágil no cliente

/**
 * Carrega a configuração do Fio da Escritura do Supabase ou retorna o fallback padrão.
 */
export async function getScriptureThreadConfig(forceRefresh = false): Promise<ScriptureThreadConfig> {
  const now = Date.now();
  if (!forceRefresh && cachedConfig && now - lastFetchedAt < CACHE_TTL_MS) {
    return cachedConfig;
  }

  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('key, value')
      .in('key', [
        'scripture_thread_enabled',
        'scripture_thread_granularity',
        'scripture_thread_max_notes',
        'scripture_thread_require_pro',
      ]);

    if (error || !data) {
      console.warn('[appConfig] Falha ao consultar app_config, usando padrão:', error?.message);
      return cachedConfig ?? DEFAULT_SCRIPTURE_THREAD_CONFIG;
    }

    const map = new Map<string, unknown>(data.map((row) => [row.key, row.value]));

    const config: ScriptureThreadConfig = {
      enabled: map.has('scripture_thread_enabled')
        ? Boolean(map.get('scripture_thread_enabled'))
        : DEFAULT_SCRIPTURE_THREAD_CONFIG.enabled,
      granularity: map.get('scripture_thread_granularity') === 'verse' ? 'verse' : 'chapter',
      maxNotes:
        typeof map.get('scripture_thread_max_notes') === 'number'
          ? (map.get('scripture_thread_max_notes') as number)
          : DEFAULT_SCRIPTURE_THREAD_CONFIG.maxNotes,
      requirePro: map.has('scripture_thread_require_pro')
        ? Boolean(map.get('scripture_thread_require_pro'))
        : DEFAULT_SCRIPTURE_THREAD_CONFIG.requirePro,
    };

    cachedConfig = config;
    lastFetchedAt = now;
    return config;
  } catch (err) {
    console.warn('[appConfig] Erro inesperado ao carregar app_config:', err);
    return cachedConfig ?? DEFAULT_SCRIPTURE_THREAD_CONFIG;
  }
}

/**
 * Atualiza um ou mais parâmetros do Fio da Escritura na tabela `app_config`.
 * Exige que a sessão ativa pertença a um administrador ou use role autorizada.
 */
export async function updateScriptureThreadConfig(
  updates: Partial<ScriptureThreadConfig>
): Promise<{ success: boolean; error?: string }> {
  try {
    const rowsToUpsert: { key: string; value: unknown }[] = [];

    if (updates.enabled !== undefined) {
      rowsToUpsert.push({ key: 'scripture_thread_enabled', value: updates.enabled });
    }
    if (updates.granularity !== undefined) {
      rowsToUpsert.push({ key: 'scripture_thread_granularity', value: updates.granularity });
    }
    if (updates.maxNotes !== undefined) {
      rowsToUpsert.push({ key: 'scripture_thread_max_notes', value: updates.maxNotes });
    }
    if (updates.requirePro !== undefined) {
      rowsToUpsert.push({ key: 'scripture_thread_require_pro', value: updates.requirePro });
    }

    if (rowsToUpsert.length === 0) return { success: true };

    const { error } = await supabase.from('app_config').upsert(rowsToUpsert);

    if (error) {
      return { success: false, error: error.message };
    }

    // Invalida e atualiza cache local em memória
    if (cachedConfig) {
      cachedConfig = { ...cachedConfig, ...updates };
    }
    lastFetchedAt = Date.now();

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao salvar configuração';
    return { success: false, error: message };
  }
}
