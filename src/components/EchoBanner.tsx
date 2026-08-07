// ─────────────────────────────────────────────────────────────────────────────
// EchoBanner.tsx — Bíblia Vive · Eco do Memorial
//
// Banner contextual discreto e sóbrio no topo da página de leitura bíblica.
// Aparece quando o Leitor já possui uma memória registrada naquele livro/capítulo.
// ─────────────────────────────────────────────────────────────────────────────

import { type MemorialEntry } from "@/lib/noteStore";
import { ArrowRight } from "lucide-react";
import StoneIcon from "@/components/StoneIcon";

interface EchoBannerProps {
    entry: MemorialEntry;
    onOpenModal: () => void;
}

export default function EchoBanner({ entry, onOpenModal }: EchoBannerProps) {
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

    return (
        <div className="mb-6 rounded-2xl bg-app-surface border border-gold/40 p-4 shadow-sm transition-all animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0 text-gold">
                    <StoneIcon className="h-5 w-5 text-gold" />
                </div>
                <div className="space-y-0.5">
                    <p className="text-xs font-serif font-medium text-app-text">
                        Neste capítulo {ageText}, você colocou {categoryText}.
                    </p>
                    <p className="text-xs font-serif text-app-text-muted italic line-clamp-1">
                        "{entry.title || entry.content}"
                    </p>
                </div>
            </div>

            <button
                type="button"
                onClick={onOpenModal}
                className="flex-shrink-0 self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gold text-black font-medium text-xs hover:bg-gold/90 transition-colors shadow-xs"
            >
                <span>Reencontrar</span>
                <ArrowRight className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
