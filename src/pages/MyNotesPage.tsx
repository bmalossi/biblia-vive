// ─────────────────────────────────────────────────────────────────────────────
// MyNotesPage.tsx — Bíblia Viva · Sprint 7
// Página "Minhas Notas" com filtro, ordenação e export PDF/TXT
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Download, FileText, Filter, LogIn, LogOut, Pen, SortDesc, Trash2 } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import {
    getAllNotes,
    deleteNote,
    exportNotesToTXT,
    exportNotesToPDF,
    type VerseNote,
} from '@/lib/notesHighlights';
import NoteModal from '@/components/NoteModal';
import AuthModal from '@/components/AuthModal';

type SortOrder = 'newest' | 'oldest';

export default function MyNotesPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, isAuthenticated, signOut } = useAuth();
    const { isPro } = useSubscription();

    const [notes, setNotes] = useState<VerseNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterBook, setFilterBook] = useState<string>('all');
    const [sort, setSort] = useState<SortOrder>('newest');
    const [editNote, setEditNote] = useState<VerseNote | null>(null);
    const [authOpen, setAuthOpen] = useState(false);

    useEffect(() => {
        setLoading(true);
        getAllNotes(user?.id ?? null).then(data => {
            setNotes(data);
            setLoading(false);
        });
    }, [user]);

    const bookOptions = useMemo(() => {
        const names = [...new Set(notes.map(n => n.bookName))].sort();
        return names;
    }, [notes]);

    const filtered = useMemo(() => {
        const base = filterBook === 'all' ? notes : notes.filter(n => n.bookName === filterBook);
        return [...base].sort((a, b) => {
            const da = new Date(a.updatedAt).getTime();
            const db = new Date(b.updatedAt).getTime();
            return sort === 'newest' ? db - da : da - db;
        });
    }, [notes, filterBook, sort]);

    async function handleDelete(note: VerseNote) {
        await deleteNote(user?.id ?? null, note.bookId, note.chapter, note.verse);
        setNotes(prev => prev.filter(n => n.id !== note.id));
    }

    function formatDate(iso: string) {
        return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    return (
        <main className="min-h-screen bg-app-base px-4 py-8 max-w-2xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="p-1.5 rounded-lg hover:bg-app-raised transition-colors text-app-text-muted hover:text-app-text"
                        aria-label="Voltar"
                    >
                        ←
                    </button>
                    <h1 className="text-xl font-semibold text-app-text">{t('notes.title')}</h1>
                </div>

                {isAuthenticated ? (
                    <button
                        type="button"
                        onClick={signOut}
                        className="flex items-center gap-1.5 text-[0.78rem] text-app-text-muted hover:text-app-text px-3 py-1.5 rounded-lg hover:bg-app-raised transition-colors"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        {t('auth.signOut')}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => setAuthOpen(true)}
                        className="flex items-center gap-1.5 text-[0.78rem] text-gold hover:text-gold/80 px-3 py-1.5 rounded-lg border border-gold/30 hover:bg-gold/10 transition-colors"
                    >
                        <LogIn className="h-3.5 w-3.5" />
                        {t('auth.signIn')}
                    </button>
                )}
            </div>

            {/* Sync hint for anonymous */}
            {!isAuthenticated && notes.length > 0 && (
                <div className="mb-4 rounded-lg border border-gold/20 bg-gold/5 px-3 py-2.5 text-[0.78rem] text-app-text-muted flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-gold shrink-0" />
                    {t('auth.syncHint')}
                </div>
            )}

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
                {/* Filter by book */}
                <div className="flex items-center gap-1.5 bg-app-surface border border-border rounded-lg px-2 py-1.5">
                    <Filter className="h-3.5 w-3.5 text-app-text-muted" />
                    <select
                        value={filterBook}
                        onChange={e => setFilterBook(e.target.value)}
                        className="text-[0.78rem] bg-transparent text-app-text focus:outline-none"
                        aria-label={t('notes.filterByBook')}
                    >
                        <option value="all">{t('notes.filterByBook')}</option>
                        {bookOptions.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>

                {/* Sort */}
                <button
                    type="button"
                    onClick={() => setSort(s => s === 'newest' ? 'oldest' : 'newest')}
                    className="flex items-center gap-1.5 text-[0.78rem] text-app-text-muted bg-app-surface border border-border rounded-lg px-2.5 py-1.5 hover:border-gold/40 transition-colors"
                    title={t('notes.sortByDate')}
                >
                    <SortDesc className="h-3.5 w-3.5" />
                    {sort === 'newest' ? 'Mais recentes' : 'Mais antigas'}
                </button>

                <div className="flex gap-1.5 ml-auto">
                    <button
                        type="button"
                        onClick={() => exportNotesToTXT(filtered)}
                        disabled={filtered.length === 0}
                        className="flex items-center gap-1.5 text-[0.78rem] text-app-text-muted bg-app-surface border border-border rounded-lg px-2.5 py-1.5 hover:border-gold/40 disabled:opacity-30 transition-colors"
                    >
                        <FileText className="h-3.5 w-3.5" />
                        TXT
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (isPro) {
                                exportNotesToPDF(filtered);
                            } else {
                                navigate('/pro');
                            }
                        }}
                        disabled={filtered.length === 0}
                        className="flex items-center gap-1.5 text-[0.78rem] text-gold-foreground bg-gold-bg/20 border border-gold/40 rounded-lg px-2.5 py-1.5 hover:bg-gold-bg/40 disabled:opacity-30 transition-colors relative group"
                    >
                        <Download className="h-3.5 w-3.5" />
                        PDF
                        {!isPro && (
                            <span className="absolute -top-2 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[0.55rem] font-bold text-app-bg border border-app-bg shadow-sm">
                                PRO
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Notes list */}
            {loading ? (
                <div className="text-center py-12 text-app-text-muted text-sm">Carregando...</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                    <Pen className="h-8 w-8 text-app-text-muted/40 mx-auto" />
                    <p className="text-[0.9rem] text-app-text-muted">{t('notes.empty')}</p>
                    <p className="text-[0.78rem] text-app-text-muted/60">Selecione um versículo e clique em "Anotar" para começar.</p>
                </div>
            ) : (
                <ol className="space-y-3">
                    {filtered.map(note => (
                        <li
                            key={note.id}
                            className="rounded-xl border border-border bg-app-surface p-4 space-y-2 hover:border-gold/30 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-[0.72rem] font-mono text-gold uppercase tracking-wide">
                                        {note.bookName} {note.chapter}:{note.verse}
                                        {note.version && <span className="ml-1.5 opacity-60">· {note.version.toUpperCase()}</span>}
                                    </p>
                                    {note.verseText && (
                                        <p className="text-[0.76rem] italic text-app-text-muted mt-0.5 line-clamp-1">"{note.verseText}"</p>
                                    )}
                                </div>
                                <p className="shrink-0 text-[0.65rem] text-app-text-muted/50">{formatDate(note.updatedAt)}</p>
                            </div>

                            <p className="text-[0.82rem] text-app-text leading-relaxed whitespace-pre-wrap">{note.content}</p>

                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setEditNote(note)}
                                    className="flex items-center gap-1 text-[0.7rem] text-app-text-muted hover:text-app-text transition-colors"
                                >
                                    <Pen className="h-3 w-3" /> {t('notes.edit')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(note)}
                                    className="flex items-center gap-1 text-[0.7rem] text-destructive/70 hover:text-destructive transition-colors"
                                >
                                    <Trash2 className="h-3 w-3" /> {t('notes.delete')}
                                </button>
                            </div>
                        </li>
                    ))}
                </ol>
            )}

            {/* Edit Modal */}
            <NoteModal
                isOpen={!!editNote}
                onClose={() => setEditNote(null)}
                reference={editNote ? `${editNote.bookName} ${editNote.chapter}:${editNote.verse}` : ''}
                verseText={editNote?.verseText ?? ''}
                existingNote={editNote}
                onSave={(content) => {
                    if (!editNote) return;
                    // Update in list optimistically
                    setNotes(prev => prev.map(n => n.id === editNote.id ? { ...n, content, updatedAt: new Date().toISOString() } : n));
                }}
                onDelete={() => {
                    if (!editNote) return;
                    handleDelete(editNote);
                }}
            />

            {/* Auth Modal */}
            <AuthModal
                isOpen={authOpen}
                onClose={() => setAuthOpen(false)}
                hint={t('auth.syncHint')}
            />
        </main>
    );
}
