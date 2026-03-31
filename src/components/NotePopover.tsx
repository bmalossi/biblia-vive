// ─────────────────────────────────────────────────────────────────────────────
// NotePopover.tsx — Bíblia Viva · Sprint 9
// Hover = leitura da nota; clique = abre edição
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from "react";
import { PencilLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VerseNote } from "@/lib/notesHighlights";

interface NotePopoverProps {
    note: VerseNote;
    onEditClick: () => void;
    children: React.ReactNode;
}

export default function NotePopover({ note, onEditClick, children }: NotePopoverProps) {
    const [open, setOpen] = useState(false);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleMouseEnter = () => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        setOpen(true);
    };

    const handleMouseLeave = () => {
        hideTimer.current = setTimeout(() => setOpen(false), 180);
    };

    // Relative date helper
    const timeAgo = (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        const days = Math.floor(diff / 86_400_000);
        if (days === 0) return "hoje";
        if (days === 1) return "ontem";
        if (days < 30) return `há ${days} dias`;
        const months = Math.floor(days / 30);
        return months === 1 ? "há 1 mês" : `há ${months} meses`;
    };

    return (
        <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Left accent border for annotated verse */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full bg-gradient-to-b from-gold/80 to-gold/20" />

            {/* Pen icon — top right */}
            <button
                type="button"
                aria-label="Ver ou editar anotação"
                onClick={(e) => {
                    e.stopPropagation();
                    onEditClick();
                }}
                className={cn(
                    "absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full transition-all duration-200",
                    "bg-gold-bg/60 text-gold opacity-40 hover:opacity-100 hover:bg-gold-bg hover:scale-110 focus:opacity-100"
                )}
            >
                <PencilLine className="h-3 w-3" />
            </button>

            {/* Verse content with slight left indent to clear the accent border */}
            <div className="pl-3">{children}</div>

            {/* Hover popover */}
            {open && (
                <div
                    className={cn(
                        "absolute left-5 z-50 w-72 max-w-[90vw] rounded-xl border border-gold/30",
                        "bg-app-surface/95 backdrop-blur-sm px-4 py-3 shadow-xl shadow-black/20",
                        "animate-in fade-in-0 slide-in-from-top-1 duration-150",
                        "bottom-full mb-2"
                    )}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Popover caret */}
                    <div className="absolute left-6 top-full h-2 w-2 -translate-y-[1px] rotate-45 border-b border-r border-gold/30 bg-app-surface/95" />

                    <p className="mb-1.5 font-mono text-[0.58rem] uppercase tracking-widest text-gold/70">
                        Anotação
                    </p>
                    <p className="font-serif text-[0.9rem] leading-relaxed text-app-text italic line-clamp-5">
                        {note.content}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2">
                        <span className="text-[0.65rem] text-app-text-muted">
                            {timeAgo(note.updatedAt)}
                        </span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpen(false);
                                onEditClick();
                            }}
                            className="flex items-center gap-1 rounded px-2 py-0.5 text-[0.65rem] text-gold hover:bg-gold-bg/30 transition-colors"
                        >
                            <PencilLine className="h-2.5 w-2.5" />
                            Editar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
