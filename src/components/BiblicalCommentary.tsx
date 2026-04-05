import React, { useState } from 'react';
import { Quote, Clock, BookOpen, ExternalLink, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Commentary } from '@/lib/studyPanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useTranslation } from '@/i18n';

interface CommentaryCardProps {
    commentary: Commentary;
    onClick: (commentary: Commentary) => void;
}

const CommentaryCard: React.FC<CommentaryCardProps> = ({ commentary, onClick }) => {
    return (
        <div
            onClick={() => onClick(commentary)}
            className={cn(
                "group relative overflow-hidden rounded-xl border border-border bg-app-surface/50 p-4 transition-all hover:bg-app-surface hover:shadow-md cursor-pointer active:scale-[0.98]"
            )}
        >
            <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-gold">
                        <Quote className="h-4 w-4" />
                    </div>
                    <div>
                        <h4 className="text-[0.85rem] font-bold text-app-text">{commentary.author}</h4>
                        <p className="font-mono text-[0.6rem] uppercase tracking-wider text-app-text-muted">
                            {(commentary as any).tradition ?? commentary.era}
                        </p>
                    </div>
                </div>
            </div>

            <p className="line-clamp-3 font-serif text-[0.8rem] leading-relaxed text-app-text-muted transition-colors group-hover:text-app-text">
                {commentary.text}
            </p>

            <div className="mt-3 flex items-center gap-2 border-t border-border/50 pt-2 opacity-60">
                <BookOpen className="h-3 w-3" />
                <span className="text-[0.65rem] truncate font-medium">{commentary.work} {commentary.year && `• ${commentary.year}`}</span>
                {(commentary as any).original_language && (
                    <span className="ml-auto text-[0.6rem] text-app-text-muted/60">{(commentary as any).original_language}</span>
                )}
            </div>
        </div>
    );
};

interface BiblicalCommentaryProps {
    commentaries: Commentary[];
}

export const BiblicalCommentary: React.FC<BiblicalCommentaryProps> = ({ commentaries }) => {
    const { t } = useTranslation();
    const [selected, setSelected] = useState<Commentary | null>(null);

    const safeCommentaries = Array.isArray(commentaries) ? commentaries : [];

    if (safeCommentaries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                <Info className="mb-3 h-8 w-8 text-gold" />
                <p className="text-sm font-medium">Nenhum comentário histórico encontrado para este trecho.</p>
                <p className="mt-1 text-xs">Tente versículos clássicos como João 3:16, Salmos 23, Romanos 8.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid gap-4">
                {safeCommentaries.map((c, idx) => (
                    <CommentaryCard key={idx} commentary={c} onClick={setSelected} />
                ))}
            </div>

            <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent className="max-w-[500px] gap-0 p-0 sm:rounded-2xl overflow-hidden border-border bg-app-surface">
                    <div className="bg-gold/5 p-6 pb-4 border-b border-border/50">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
                                    <Quote className="h-5 w-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-serif font-bold text-app-text leading-tight">
                                        {selected?.author}
                                    </DialogTitle>
                                    <p className="font-mono text-[0.7rem] uppercase tracking-widest text-gold/80">
                                        {selected?.era}
                                    </p>
                                </div>
                            </div>
                            <DialogDescription className="text-sm font-medium flex items-center gap-2 text-app-text-muted italic">
                                <BookOpen className="h-3.5 w-3.5" />
                                {selected?.work} {selected?.year && `(${selected.year})`}
                                {(selected as any)?.original_language && (
                                    <span className="ml-auto text-[0.65rem] font-mono normal-case not-italic">{(selected as any).original_language}</span>
                                )}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                        <p className="font-serif text-[0.95rem] leading-relaxed text-app-text whitespace-pre-wrap">
                            {selected?.text}
                        </p>

                        {selected?.source_url && (
                            <a
                                href={selected.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-6 flex items-center gap-1.5 text-xs text-gold hover:underline font-medium"
                            >
                                <ExternalLink className="h-3 w-3" />
                                Acessar fonte original
                            </a>
                        )}
                    </div>

                    <div className="bg-app-bg px-6 py-4 border-t border-border">
                        <p className="text-[0.65rem] leading-relaxed text-app-text-muted italic text-center">
                            Estes comentários representam perspectivas históricas individuais de diferentes tradições do pensamento cristão e não refletem necessariamente a posição editorial deste site.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
