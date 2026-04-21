// ─────────────────────────────────────────────────────────────────────────────
// CommentaryQuota.tsx — Bíblia Vive
// Reutilizável: exibe a cota de comentários de IA do usuário PRO.
// Lê de localStorage (chave bv_commentary_quota) — atualizada após cada request.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

const QUOTA_KEY = 'bv_commentary_quota';
const LIMIT = 10;

export interface CommentaryQuotaData {
    limit: number;
    remaining: number;
    resetAt: number; // unix ms
    updatedAt: number;
}

function readQuota(): CommentaryQuotaData | null {
    try {
        const raw = localStorage.getItem(QUOTA_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as CommentaryQuotaData;
    } catch {
        return null;
    }
}

function formatCountdown(resetAt: number): string {
    const diff = Math.max(0, resetAt - Date.now());
    const totalSecs = Math.ceil(diff / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) return `${h}h ${m}min`;
    if (m > 0) return `${m}min ${s}s`;
    return `${s}s`;
}

interface Props {
    /** compact = só exibe barra + texto curto (para sidebar). default = painel completo */
    compact?: boolean;
    className?: string;
}

export default function CommentaryQuota({ compact = false, className = '' }: Props) {
    const [quota, setQuota] = useState<CommentaryQuotaData | null>(readQuota);
    const [countdown, setCountdown] = useState('');

    // Poll localStorage every 2 s to pick up updates from requestCommentary
    useEffect(() => {
        const poll = setInterval(() => setQuota(readQuota()), 2000);
        return () => clearInterval(poll);
    }, []);

    // Countdown ticker when exhausted
    useEffect(() => {
        if (!quota || quota.remaining > 0) return;
        const tick = () => setCountdown(formatCountdown(quota.resetAt));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [quota]);

    if (!quota) return null;

    const used = (quota.limit ?? LIMIT) - quota.remaining;
    const limit = quota.limit ?? LIMIT;
    const pct = Math.min(100, Math.round((used / limit) * 100));

    const isExhausted = quota.remaining === 0;
    const isWarning = !isExhausted && quota.remaining <= 2;

    const barColor = isExhausted
        ? 'bg-red-500'
        : isWarning
            ? 'bg-yellow-500'
            : 'bg-gold';

    const textColor = isExhausted
        ? 'text-red-400'
        : isWarning
            ? 'text-yellow-400'
            : 'text-app-text-muted';

    if (compact) {
        return (
            <div className={`space-y-1.5 ${className}`}>
                <div className="flex items-center justify-between">
                    <span className={`text-[0.7rem] font-medium ${textColor}`}>
                        Comentários: {used} / {limit} esta hora
                    </span>
                    {isExhausted && countdown && (
                        <span className="flex items-center gap-1 text-[0.65rem] text-red-400">
                            <Clock className="h-3 w-3" />
                            {countdown}
                        </span>
                    )}
                </div>
                <div className="h-1 w-full rounded-full bg-border overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
                {isExhausted && countdown && (
                    <p className="text-[0.65rem] text-red-400">
                        Disponível novamente em {countdown}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className={`rounded-xl border border-border bg-app-surface p-4 space-y-3 ${className}`}>
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-app-text">Comentários de IA</p>
                <span className={`text-xs font-semibold tabular-nums ${textColor}`}>
                    {used} / {limit}
                </span>
            </div>

            <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${pct}%` }}
                />
            </div>

            {isExhausted ? (
                <p className="flex items-center gap-1.5 text-[0.75rem] text-red-400">
                    <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                    {countdown
                        ? `Disponível novamente em ${countdown}`
                        : 'Limite atingido para esta hora.'}
                </p>
            ) : (
                <p className={`text-[0.75rem] ${textColor}`}>
                    {isWarning
                        ? `Atenção: restam apenas ${quota.remaining} comentário${quota.remaining !== 1 ? 's' : ''} esta hora.`
                        : `${quota.remaining} comentário${quota.remaining !== 1 ? 's' : ''} disponível${quota.remaining !== 1 ? 'is' : ''} esta hora.`}
                </p>
            )}
        </div>
    );
}
