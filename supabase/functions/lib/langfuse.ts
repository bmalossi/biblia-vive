/**
 * langfuse.ts — Bíblia Vive & Memorial
 *
 * Módulo de Observabilidade de IA (Traces, Spans, Generations, Tokens e Custos).
 * Integração canônica com a plataforma Langfuse (v3 SDK).
 *
 * Boas Práticas implementadas:
 * 1. Inicialização segura via variáveis de ambiente (LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_BASE_URL).
 * 2. Suporte a no-op quando as chaves não estão configuradas (não quebra a aplicação).
 * 3. Categorização estrita de observações: 'generation' para chamadas LLM e 'span' para etapas lógicas/classificadores.
 * 4. Captura precisa de tokens de entrada e saída (promptTokens, completionTokens, totalTokens).
 * 5. Tags descritivas e agrupamento por usuário (userId) e sessão (sessionId).
 * 6. Chamada explícita de flushAsync() antes da conclusão de funções serverless / edge runtime.
 */

// @ts-nocheck
import { Langfuse } from "npm:langfuse@3.39.2";

interface TraceOptions {
  name: string;
  userId?: string;
  sessionId?: string;
  tags?: string[];
  input?: unknown;
  metadata?: Record<string, unknown>;
}

let langfuseInstance: Langfuse | null = null;
let initialized = false;

export function getLangfuse(): Langfuse | null {
  if (initialized) {
    return langfuseInstance;
  }

  initialized = true;

  const publicKey = Deno.env.get("LANGFUSE_PUBLIC_KEY")?.trim();
  const secretKey = Deno.env.get("LANGFUSE_SECRET_KEY")?.trim();
  const baseUrl =
    Deno.env.get("LANGFUSE_BASE_URL")?.trim() ||
    Deno.env.get("LANGFUSE_HOST")?.trim() ||
    "https://us.cloud.langfuse.com";

  if (!publicKey || !secretKey) {
    console.info("[Langfuse] Chaves não configuradas no ambiente. Rastreamento desativado de forma graciosa.");
    return null;
  }

  try {
    langfuseInstance = new Langfuse({
      publicKey,
      secretKey,
      baseUrl,
      flushInterval: 0, // Serverless: desativa buffer contínuo para controle explícito via flushAsync()
    });
    console.info("[Langfuse] Cliente inicializado com sucesso para host:", baseUrl);
    return langfuseInstance;
  } catch (err) {
    console.warn("[Langfuse] Erro ao inicializar cliente:", err);
    return null;
  }
}

/**
 * Inicia um Trace padrão no Langfuse.
 * Se o Langfuse não estiver configurado, retorna um objeto proxy com métodos no-op
 * para não poluir o código com checagens 'if (trace)'.
 */
export function startLangfuseTrace(options: TraceOptions) {
  const lf = getLangfuse();
  if (!lf) {
    // Retorna interface no-op para evitar múltiplos condicionais na Edge Function
    return {
      trace: null,
      span: () => ({ end: () => {}, update: () => {} }),
      generation: () => ({ end: () => {}, update: () => {} }),
      update: () => {},
      score: () => {},
      flush: async () => {},
    };
  }

  const rawTrace = lf.trace({
    name: options.name,
    userId: options.userId,
    sessionId: options.sessionId,
    tags: options.tags,
    input: options.input,
    metadata: options.metadata,
  });

  return {
    trace: rawTrace,
    span: (spanOpts: {
      name: string;
      input?: unknown;
      metadata?: Record<string, unknown>;
      level?: "DEFAULT" | "DEBUG" | "WARNING" | "ERROR";
      statusMessage?: string;
    }) => {
      const s = rawTrace.span({
        name: spanOpts.name,
        input: spanOpts.input,
        metadata: spanOpts.metadata,
        level: spanOpts.level,
        statusMessage: spanOpts.statusMessage,
      });
      return {
        end: (endOpts?: {
          output?: unknown;
          level?: "DEFAULT" | "DEBUG" | "WARNING" | "ERROR";
          statusMessage?: string;
          metadata?: Record<string, unknown>;
        }) => {
          s.end(endOpts);
        },
        update: (updateOpts: Record<string, unknown>) => {
          s.update(updateOpts);
        },
      };
    },
    generation: (genOpts: {
      name: string;
      model: string;
      modelParameters?: Record<string, unknown>;
      input?: unknown;
      metadata?: Record<string, unknown>;
    }) => {
      const g = rawTrace.generation({
        name: genOpts.name,
        model: genOpts.model,
        modelParameters: genOpts.modelParameters,
        input: genOpts.input,
        metadata: genOpts.metadata,
      });
      return {
        end: (endOpts?: {
          output?: unknown;
          usage?: {
            promptTokens?: number;
            completionTokens?: number;
            totalTokens?: number;
          };
          level?: "DEFAULT" | "DEBUG" | "WARNING" | "ERROR";
          statusMessage?: string;
          metadata?: Record<string, unknown>;
        }) => {
          g.end(endOpts);
        },
        update: (updateOpts: Record<string, unknown>) => {
          g.update(updateOpts);
        },
      };
    },
    update: (updateOpts: {
      output?: unknown;
      tags?: string[];
      metadata?: Record<string, unknown>;
      level?: "DEFAULT" | "DEBUG" | "WARNING" | "ERROR";
      statusMessage?: string;
    }) => {
      rawTrace.update(updateOpts);
    },
    score: (scoreOpts: {
      name: string;
      value: number;
      comment?: string;
    }) => {
      rawTrace.score(scoreOpts);
    },
    flush: async () => {
      try {
        const res = await lf.flushAsync();
        console.info("[Langfuse] flush concluído com sucesso:", Array.isArray(res) ? `${res.length} eventos enviados` : "ok");
      } catch (err) {
        console.warn("[Langfuse] Erro no flush:", err);
      }
    },
  };
}
