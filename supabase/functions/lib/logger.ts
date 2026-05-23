const AXIOM_TOKEN   = Deno.env.get("AXIOM_TOKEN") ?? "";
const AXIOM_DATASET = Deno.env.get("AXIOM_DATASET") ?? "bibliavive-prod";

type Level = "info" | "warn" | "error";

// Gera um hash SHA-256 de forma assíncrona usando a Web Crypto API nativa do Deno
async function hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

// Sanitização robusta para evitar o envio de PIIs e chaves sensíveis ao Axiom
async function sanitizeFields(fields: Record<string, unknown>): Promise<Record<string, unknown>> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(fields)) {
        if (value === null || value === undefined) {
            sanitized[key] = value;
            continue;
        }

        const lowerKey = key.toLowerCase();

        // 1. Remove chaves privadas, tokens, senhas, cookies e cabeçalhos sensíveis
        if (
            lowerKey.includes("token") ||
            lowerKey.includes("key") ||
            lowerKey.includes("password") ||
            lowerKey.includes("secret") ||
            lowerKey.includes("header") ||
            lowerKey.includes("authorization") ||
            lowerKey.includes("cookie") ||
            lowerKey.includes("apikey")
        ) {
            continue;
        }

        // 2. Anonimiza/Hash de identificadores de usuários
        if (lowerKey === "userid" && typeof value === "string" && value.trim()) {
            sanitized[key] = await hashString(value);
            continue;
        }

        // 3. Anonimiza textos brutos e queries inseridas por usuários
        if (
            (lowerKey === "text" || lowerKey === "query" || lowerKey === "input" || lowerKey === "usertext") &&
            typeof value === "string"
        ) {
            const hashed = await hashString(value);
            sanitized[`${key}_hash`] = hashed;
            sanitized[`${key}_len`] = value.length;
            continue;
        }

        // 4. Trunca strings longas para um teto rígido de 3000 caracteres
        if (typeof value === "string") {
            if (value.length > 3000) {
                sanitized[key] = value.slice(0, 3000) + `…[truncated:${value.length}]`;
            } else {
                sanitized[key] = value;
            }
        } else if (typeof value === "object" && !Array.isArray(value)) {
            // Processa recursivamente objetos simples
            sanitized[key] = await sanitizeFields(value as Record<string, unknown>);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

// Helper para envio HTTP com timeout curto e retry assíncrono em segundo plano
async function postToAxiom(payload: any) {
    if (!AXIOM_TOKEN) return;

    const url = `https://api.axiom.co/v1/datasets/${AXIOM_DATASET}/ingest`;
    const body = JSON.stringify([payload]);
    const headers = { 
        "Authorization": `Bearer ${AXIOM_TOKEN}`, 
        "Content-Type": "application/json" 
    };

    const tryFetch = async (timeoutMs: number) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);
        try {
            return await fetch(url, { 
                method: "POST", 
                headers, 
                body, 
                signal: controller.signal 
            });
        } finally { 
            clearTimeout(id); 
        }
    };

    const scheduleRetry = (delayMs: number, timeoutMs: number) => {
        const retryPromise = new Promise<void>((resolve) => {
            setTimeout(async () => {
                try {
                    await tryFetch(timeoutMs);
                } catch (_) {
                    // suprime erros no retry em background
                } finally {
                    resolve();
                }
            }, delayMs);
        });

        // Registra a promessa no Deno EdgeRuntime se disponível para evitar a terminação prematura do isolate
        // @ts-ignore
        if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
            // @ts-ignore
            EdgeRuntime.waitUntil(retryPromise);
        }
    };

    try {
        let res = await tryFetch(700); // 1ª tentativa rápida (700ms timeout)
        if (!res.ok) {
            scheduleRetry(500, 1500); // retry rápido com timeout maior
        }
    } catch (_) {
        scheduleRetry(1000, 1500); // retry com backoff de 1s
    }
}

export async function log(
    level: Level,
    message: string,
    fields: Record<string, unknown> = {}
): Promise<void> {
    const sanitizedFields = await sanitizeFields(fields);
    
    // Payload enviado com _time explícito para ordenação cronológica correta
    const payload = {
        _time: new Date().toISOString(),
        level,
        message,
        ...sanitizedFields,
    };

    if (!AXIOM_TOKEN) {
        const consoleMethod = level === "info" ? console.info : level === "warn" ? console.warn : console.error;
        consoleMethod(`[${level.toUpperCase()}]`, message, sanitizedFields);
        return;
    }

    // Dispara a tentativa de envio
    await postToAxiom(payload);
}
