// ─────────────────────────────────────────────────────────────────────────────
// EchoBanner.tsx — Bíblia Vive · Eco do Memorial
//
// Banner contextual discreto e sóbrio no topo da página de leitura bíblica.
// Exibe selos de contexto diferenciados conforme a origem do Eco:
//   - 'direct'      → "Nascido neste capítulo"
//   - 'anniversary' → aniversário histórico (6m/1a)
//   - 'orphan'      → "Uma lembrança da sua caminhada"
// ─────────────────────────────────────────────────────────────────────────────

import { type MemorialEntry, type EchoContext } from "@/lib/noteStore";
import { ArrowRight } from "lucide-react";
import StoneIcon from "@/components/StoneIcon";

interface EchoBannerProps {
    entry: MemorialEntry;
    echoContext: EchoContext;
    onOpenModal: () => void;
}

export default function EchoBanner({ entry, echoContext, onOpenModal }: EchoBannerProps) {
    function getAgeText(isoDate: string): string {
        try {
            const created = new Date(isoDate).getTime();
            const now = Date.now();
            const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));

            if (diffDays <= 1) return "recentemente";
            if (diffDays < 7) return `há ${diffDays} dias`;
            if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semanas`;
            if (diffDays < 365) return `há ${Math.floor(diffDays / 30)} meses`;
            return `há ${Math.floor(diffDays / 365)} ano${Math.floor(diffDays / 365) > 1 ? "s" : ""}`;
        } catch {
            return "no passado";
        }
    }

    const categoryLabels: Record<string, string> = {
        reflection: "uma reflexão",
        prayer: "uma oração",
        testimony: "um testemunho",
        fasting: "um propósito",
    };

    const categoryText = categoryLabels[entry.type] || "uma pedra";
    const ageText = getAgeText(entry.createdAt);

    // Linha principal varia conforme o contexto do Eco
    const contextLine: Record<EchoContext, string> = {
        direct:      `Neste capítulo ${ageText}, você colocou ${categoryText}.`,
        anniversary: `Há exatamente ${ageText}, você deixou ${categoryText}.`,
        orphan:      `Uma lembrança da sua caminhada.`,
    };

    // Selo visual discreto para contexto não-direto
    const contextBadge: Partial<Record<EchoContext, string>> = {
        orphan:      "Caminhada",
        anniversary: "Marco histórico",
    };

    const badge = contextBadge[echoContext];

    return (
        <div className="relative overflow-hidden mb-6 rounded-2xl bg-gradient-to-r from-app-surface via-app-surface to-gold/5 border border-gold/40 hover:border-gold/60 p-4 shadow-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.08)] transition-all duration-500 animate-in fade-in zoom-in-95 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
            {/* Brilho dourado pulsante e sutil de fundo */}
            <div className="absolute -top-12 -left-12 w-28 h-28 bg-gold/10 rounded-full blur-2xl pointer-events-none group-hover:bg-gold/15 transition-all duration-700" />

            <div className="relative flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0 text-gold p-2 rounded-xl bg-gold/10 border border-gold/20">
                    <StoneIcon className="h-4 w-4 text-gold" />
                </div>
                <div className="space-y-0.5">
                    {badge && (
                        <span className="inline-block mb-1 text-[0.6rem] uppercase tracking-widest font-sans font-semibold text-gold border border-gold/30 bg-gold/5 px-2 py-0.5 rounded-full">
                            {badge}
                        </span>
                    )}
                    <p className="text-xs font-serif font-medium text-app-text">
                        {contextLine[echoContext]}
                    </p>
                    <p className="text-xs font-serif text-app-text-muted italic line-clamp-1">
                        "{entry.title || entry.content}"
                    </p>
                </div>
            </div>

            <button
                type="button"
                onClick={onOpenModal}
                className="relative flex-shrink-0 self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gold text-black font-medium text-xs hover:bg-gold/90 transition-all duration-200 shadow-xs active:scale-95"
            >
                <span>Reencontrar</span>
                <ArrowRight className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
