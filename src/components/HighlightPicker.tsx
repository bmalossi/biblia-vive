// ─────────────────────────────────────────────────────────────────────────────
// HighlightPicker.tsx — Bíblia Viva · Sprint 7
// Popover com 5 cores de destaque
// ─────────────────────────────────────────────────────────────────────────────

import { type HighlightColor } from '@/lib/notesHighlights';
import { cn } from '@/lib/utils';

interface Props {
    activeColor: HighlightColor | null;
    onSelect: (color: HighlightColor) => void;
    onRemove: () => void;
}

const COLORS: { id: HighlightColor; hex: string; label: string }[] = [
    { id: 'yellow', hex: '#FACC15', label: 'Amarelo' },
    { id: 'blue', hex: '#60A5FA', label: 'Azul' },
    { id: 'green', hex: '#4ADE80', label: 'Verde' },
    { id: 'pink', hex: '#F472B6', label: 'Rosa' },
    { id: 'purple', hex: '#A78BFA', label: 'Roxo' },
];

export default function HighlightPicker({ activeColor, onSelect, onRemove }: Props) {
    return (
        <div
            className="flex items-center gap-1.5 p-1.5 rounded-xl border border-border bg-app-surface shadow-lg"
            role="toolbar"
            aria-label="Escolher cor de destaque"
        >
            {COLORS.map(c => (
                <button
                    key={c.id}
                    type="button"
                    title={c.label}
                    aria-label={`Destacar em ${c.label}`}
                    aria-pressed={activeColor === c.id}
                    onClick={() => activeColor === c.id ? onRemove() : onSelect(c.id)}
                    className={cn(
                        'w-6 h-6 rounded-full transition-all border-2',
                        activeColor === c.id
                            ? 'border-app-text scale-110 shadow'
                            : 'border-transparent hover:scale-110'
                    )}
                    style={{ backgroundColor: c.hex }}
                />
            ))}
        </div>
    );
}

// ── CSS class helper ──────────────────────────────────────────────────────────
export const HIGHLIGHT_CLASSES: Record<HighlightColor, string> = {
    yellow: '!bg-[#FACC15]/30 dark:!bg-[#FACC15]/20',
    blue: '!bg-[#60A5FA]/30 dark:!bg-[#60A5FA]/20',
    green: '!bg-[#4ADE80]/30 dark:!bg-[#4ADE80]/20',
    pink: '!bg-[#F472B6]/30 dark:!bg-[#F472B6]/20',
    purple: '!bg-[#A78BFA]/30 dark:!bg-[#A78BFA]/20',
};
