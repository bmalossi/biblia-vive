// ─────────────────────────────────────────────────────────────────────────────
// NoteModal.tsx — Bíblia Viva · Sprint 7
// Modal para criar/editar notas em versículos
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { X, Trash2, Save } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { VerseNote } from '@/lib/notesHighlights';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    reference: string;          // ex: "João 3:16"
    verseText: string;
    existingNote: VerseNote | null;
    onSave: (content: string) => void;
    onDelete: () => void;
}

export default function NoteModal({
    isOpen,
    onClose,
    reference,
    verseText,
    existingNote,
    onSave,
    onDelete,
}: Props) {
    const { t } = useTranslation();
    const [content, setContent] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            setContent(existingNote?.content ?? '');
            setTimeout(() => textareaRef.current?.focus(), 50);
        }
    }, [isOpen, existingNote]);

    if (!isOpen) return null;

    function handleSave() {
        if (!content.trim()) return;
        onSave(content.trim());
        onClose();
    }

    function handleDelete() {
        onDelete();
        onClose();
    }

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-0"
            role="dialog"
            aria-modal="true"
            aria-labelledby="note-modal-title"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div className="relative z-10 w-full max-w-lg mx-3 sm:mx-auto rounded-2xl bg-app-surface border border-border shadow-2xl p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p id="note-modal-title" className="text-[0.8rem] font-mono text-gold uppercase tracking-wide">
                            {reference}
                        </p>
                        {verseText && (
                            <p className="text-[0.78rem] text-app-text-muted italic mt-0.5 line-clamp-2">
                                "{verseText}"
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        aria-label={t('settings.close')}
                        onClick={onClose}
                        className="shrink-0 p-1 rounded-lg hover:bg-app-raised transition-colors"
                    >
                        <X className="h-4 w-4 text-app-text-muted" />
                    </button>
                </div>

                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder={t('notes.placeholder')}
                    rows={5}
                    className="w-full resize-none rounded-lg border border-border bg-app-surface px-3 py-2.5 text-[0.85rem] text-app-text placeholder:text-app-text-muted/50 focus:outline-none focus:ring-1 focus:ring-gold/50"
                />

                {/* Actions */}
                <div className="flex items-center justify-between gap-2">
                    {existingNote ? (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[0.78rem] text-destructive hover:bg-destructive/10 transition-colors"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            {t('notes.delete')}
                        </button>
                    ) : <span />}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg px-3 py-2 text-[0.78rem] text-app-text-muted hover:bg-app-raised transition-colors"
                        >
                            {t('settings.close')}
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!content.trim()}
                            className="flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-[0.78rem] font-medium text-black hover:bg-gold/90 disabled:opacity-40 transition-colors"
                        >
                            <Save className="h-3.5 w-3.5" />
                            {t('notes.save')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
