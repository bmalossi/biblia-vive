// ─────────────────────────────────────────────────────────────────────────────
// MyStudyPage.tsx — Bíblia Viva · Sprint 14
// Painel de Estudo: Anotações + Destaques com filtros, ordenação e export
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Download,
    FileText,
    Filter,
    Highlighter,
    LogIn,
    LogOut,
    Pen,
    SortDesc,
    Trash2,
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useAllStudyData } from '@/hooks/useAllStudyData';
import {
    deleteNote,
    removeHighlight,
    saveNote,
    exportNotesToTXT,
    exportNotesToPDF,
    type VerseNote,
    type VerseHighlightFull,
    type HighlightColor,
} from '@/lib/notesHighlights';
import { findBookGlobally } from '@/lib/books';
import NoteModal from '@/components/NoteModal';
import AuthModal from '@/components/AuthModal';
import { usePageMeta } from '@/hooks/usePageMeta';

// ─── Constants ────────────────────────────────────────────────────────────────

type TabType = 'notes' | 'highlights';
type SortOrder = 'newest' | 'oldest';

const COLOR_HEX: Record<HighlightColor, string> = {
    yellow: '#FACC15',
    blue: '#60A5FA',
    green: '#4ADE80',
    pink: '#F472B6',
    purple: '#A78BFA',
};

const COLOR_LABEL: Record<HighlightColor, string> = {
    yellow: 'Amarelo',
    blue: 'Azul',
    green: 'Verde',
    pink: 'Rosa',
    purple: 'Roxo',
};

const ALL_COLORS: HighlightColor[] = ['yellow', 'blue', 'green', 'pink', 'purple'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

// ─── MyStudyPage ──────────────────────────────────────────────────────────────

export default function MyStudyPage() {
    usePageMeta({
        title: "Meu Estudo — Bíblia Vive",
        robots: "noindex, nofollow",
    });

    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, isAuthenticated, signOut } = useAuth();
    const { isPro } = useSubscription();
    const { notes, highlights, loading, sessionExpired, setNotes, setHighlights } = useAllStudyData();

    // ── UI State ──
    const [activeTab, setActiveTab] = useState<TabType>('notes');
    const [filterBook, setFilterBook] = useState<string>('all');
    const [sort, setSort] = useState<SortOrder>('newest');
    const [filterColor, setFilterColor] = useState<HighlightColor | null>(null);
    const [editNote, setEditNote] = useState<VerseNote | null>(null);
    const [authOpen, setAuthOpen] = useState(false);

    // ── Book options per tab ──
    const noteBookOptions = useMemo(
        () => [...new Set(notes.map(n => n.bookName))].sort(),
        [notes]
    );

    const highlightBookOptions = useMemo(
        () => [...new Set(highlights.map(h => h.bookName))].sort(),
        [highlights]
    );

    const bookOptions = activeTab === 'notes' ? noteBookOptions : highlightBookOptions;

    // ── Filtered + sorted notes ──
    const filteredNotes = useMemo(() => {
        const base = filterBook === 'all' ? notes : notes.filter(n => n.bookName === filterBook);
        return [...base].sort((a, b) => {
            const da = new Date(a.updatedAt).getTime();
            const db = new Date(b.updatedAt).getTime();
            return sort === 'newest' ? db - da : da - db;
        });
    }, [notes, filterBook, sort]);

    // ── Filtered + sorted highlights ──
    const filteredHighlights = useMemo(() => {
        let base = filterBook === 'all' ? highlights : highlights.filter(h => h.bookName === filterBook);
        if (filterColor) base = base.filter(h => h.color === filterColor);
        return [...base].sort((a, b) => {
            const da = new Date(a.createdAt).getTime();
            const db = new Date(b.createdAt).getTime();
            return sort === 'newest' ? db - da : da - db;
        });
    }, [highlights, filterBook, filterColor, sort]);

    // ── Handlers ──
    async function handleDeleteNote(note: VerseNote) {
        await deleteNote(user?.id ?? null, note.bookId, note.chapter, note.verse);
        setNotes(prev => prev.filter(n => n.id !== note.id));
    }

    async function handleRemoveHighlight(highlight: VerseHighlightFull) {
        await removeHighlight(user?.id ?? null, highlight.bookId, highlight.chapter, highlight.verse);
        setHighlights(prev => prev.filter(h => h.id !== highlight.id));
    }

    function navigateToVerse(version: string, bookId: string, chapter: number, verse: number) {
        const bookObj = findBookGlobally(bookId);
        const slug = bookObj?.slug || bookId.toLowerCase();
        navigate(`/${version || 'acf'}/${slug}/${chapter}#v${verse}`);
    }

    // ── Tab change resets book filter ──
    function handleTabChange(tab: TabType) {
        setActiveTab(tab);
        setFilterBook('all');
        setFilterColor(null);
    }

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <main className="min-h-screen bg-app-base px-4 py-8 max-w-2xl mx-auto">

            {/* ── Page Header ── */}
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
                    <h1 className="text-xl font-semibold text-app-text">
                        {t('myStudy.title')}
                    </h1>
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

            {/* ── Tabs ── */}
            <div className="flex border-b border-border mb-5">
                <button
                    type="button"
                    onClick={() => handleTabChange('notes')}
                    className={`px-4 py-2 text-[0.82rem] font-medium transition-colors border-b-2 -mb-px ${activeTab === 'notes'
                        ? 'border-gold text-gold'
                        : 'border-transparent text-app-text-muted hover:text-app-text'
                        }`}
                >
                    {t('myStudy.tabNotes')}
                </button>
                <button
                    type="button"
                    onClick={() => handleTabChange('highlights')}
                    className={`px-4 py-2 text-[0.82rem] font-medium transition-colors border-b-2 -mb-px ${activeTab === 'highlights'
                        ? 'border-gold text-gold'
                        : 'border-transparent text-app-text-muted hover:text-app-text'
                        }`}
                >
                    {t('myStudy.tabHighlights')}
                </button>
            </div>

            {/* ── Shared Controls ── */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
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
                        {bookOptions.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
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

                {/* Export buttons — notes tab only */}
                {activeTab === 'notes' && (
                    <div className="flex gap-1.5 ml-auto">
                        <button
                            type="button"
                            onClick={() => exportNotesToTXT(filteredNotes)}
                            disabled={filteredNotes.length === 0}
                            className="flex items-center gap-1.5 text-[0.78rem] text-app-text-muted bg-app-surface border border-border rounded-lg px-2.5 py-1.5 hover:border-gold/40 disabled:opacity-30 transition-colors"
                        >
                            <FileText className="h-3.5 w-3.5" />
                            TXT
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (isPro) {
                                    exportNotesToPDF(filteredNotes);
                                } else {
                                    navigate('/pro');
                                }
                            }}
                            disabled={filteredNotes.length === 0}
                            className="flex items-center gap-1.5 text-[0.78rem] text-gold-foreground bg-gold-bg/20 border border-gold/40 rounded-lg px-2.5 py-1.5 hover:bg-gold-bg/40 disabled:opacity-30 transition-colors relative"
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
                )}
            </div>

            {/* ── Color filter — highlights tab only ── */}
            {activeTab === 'highlights' && (
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-[0.75rem] text-app-text-muted">Cor:</span>
                    {ALL_COLORS.map(color => (
                        <button
                            key={color}
                            type="button"
                            title={COLOR_LABEL[color]}
                            aria-label={`Filtrar por ${COLOR_LABEL[color]}`}
                            aria-pressed={filterColor === color}
                            onClick={() => setFilterColor(prev => prev === color ? null : color)}
                            className={`w-5 h-5 rounded-full border-2 transition-all hover:scale-110 ${filterColor === color
                                ? 'border-app-text scale-110 shadow'
                                : 'border-transparent'
                                }`}
                            style={{ backgroundColor: COLOR_HEX[color] }}
                        />
                    ))}
                    {filterColor && (
                        <button
                            type="button"
                            onClick={() => setFilterColor(null)}
                            className="text-[0.7rem] text-app-text-muted hover:text-app-text transition-colors ml-1"
                        >
                            Limpar
                        </button>
                    )}
                </div>
            )}

            {/* ── Content ── */}
            {sessionExpired ? (
                /* ── Sessão expirada ── */
                <div className="text-center py-16 space-y-4">
                    <p className="text-[0.95rem] font-medium text-app-text">
                        Sua sessão expirou.
                    </p>
                    <p className="text-[0.82rem] text-app-text-muted">
                        Faça login novamente para ver suas anotações e destaques.
                    </p>
                    <button
                        type="button"
                        onClick={() => setAuthOpen(true)}
                        className="mt-2 flex items-center gap-1.5 mx-auto text-[0.82rem] text-gold hover:text-gold/80 px-4 py-2 rounded-lg border border-gold/40 hover:bg-gold/10 transition-colors"
                    >
                        <LogIn className="h-3.5 w-3.5" />
                        Entrar novamente
                    </button>
                </div>
            ) : loading ? (
                <div className="text-center py-12 text-app-text-muted text-sm">Carregando...</div>
            ) : activeTab === 'notes' ? (
                /* ── Notes list ── */
                filteredNotes.length === 0 ? (
                    <div className="text-center py-16 space-y-2">
                        <Pen className="h-8 w-8 text-app-text-muted/40 mx-auto" />
                        <p className="text-[0.9rem] text-app-text-muted">{t('notes.empty')}</p>
                        <p className="text-[0.78rem] text-app-text-muted/60">
                            Selecione um versículo e clique em "Anotar" para começar.
                        </p>
                    </div>
                ) : (
                    <ol className="space-y-3">
                        {filteredNotes.map(note => (
                            <li
                                key={note.id}
                                className="rounded-xl border border-border bg-app-surface p-4 space-y-2 hover:border-gold/30 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-[0.72rem] font-mono text-gold uppercase tracking-wide">
                                            {note.bookName} {note.chapter}:{note.verse}
                                            {note.version && (
                                                <span className="ml-1.5 opacity-60">· {note.version.toUpperCase()}</span>
                                            )}
                                        </p>
                                        {note.verseText && (
                                            <p className="text-[0.76rem] italic text-app-text-muted mt-0.5 line-clamp-1">
                                                "{note.verseText}"
                                            </p>
                                        )}
                                    </div>
                                    <p className="shrink-0 text-[0.65rem] text-app-text-muted/50">
                                        {formatDate(note.updatedAt)}
                                    </p>
                                </div>

                                <p className="text-[0.82rem] text-app-text leading-relaxed whitespace-pre-wrap">
                                    {note.content}
                                </p>

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
                                        onClick={() => handleDeleteNote(note)}
                                        className="flex items-center gap-1 text-[0.7rem] text-destructive/70 hover:text-destructive transition-colors"
                                    >
                                        <Trash2 className="h-3 w-3" /> {t('notes.delete')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigateToVerse(note.version, note.bookId, note.chapter, note.verse)}
                                        className="flex items-center gap-1 text-[0.7rem] text-app-text-muted hover:text-gold transition-colors ml-auto"
                                    >
                                        {t('myStudy.goToVerse')} →
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ol>
                )
            ) : (
                /* ── Highlights list ── */
                filteredHighlights.length === 0 ? (
                    <div className="text-center py-16 space-y-2">
                        <Highlighter className="h-8 w-8 text-app-text-muted/40 mx-auto" />
                        <p className="text-[0.9rem] text-app-text-muted">{t('myStudy.emptyHighlights')}</p>
                        <p className="text-[0.78rem] text-app-text-muted/60">
                            Selecione um versículo e escolha uma cor para destacar.
                        </p>
                    </div>
                ) : (
                    <ol className="space-y-3">
                        {filteredHighlights.map(highlight => (
                            <li
                                key={highlight.id}
                                className="rounded-xl border border-border bg-app-surface p-4 space-y-2 hover:border-gold/30 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    {/* Color dot */}
                                    <div
                                        className="mt-0.5 w-3.5 h-3.5 rounded-full shrink-0"
                                        style={{ backgroundColor: COLOR_HEX[highlight.color] }}
                                        title={COLOR_LABEL[highlight.color]}
                                    />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-[0.72rem] font-mono text-gold uppercase tracking-wide">
                                                {highlight.bookName} {highlight.chapter}:{highlight.verse}
                                                {highlight.version && (
                                                    <span className="ml-1.5 opacity-60">
                                                        · {highlight.version.toUpperCase()}
                                                    </span>
                                                )}
                                            </p>
                                            <p className="shrink-0 text-[0.65rem] text-app-text-muted/50">
                                                {formatDate(highlight.createdAt)}
                                            </p>
                                        </div>
                                        {highlight.verseText && (
                                            <p className="text-[0.76rem] italic text-app-text-muted mt-0.5 line-clamp-2">
                                                "{highlight.verseText}"
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => navigateToVerse(highlight.version, highlight.bookId, highlight.chapter, highlight.verse)}
                                        className="flex items-center gap-1 text-[0.7rem] text-app-text-muted hover:text-gold transition-colors"
                                    >
                                        {t('myStudy.goToVerse')} →
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveHighlight(highlight)}
                                        className="flex items-center gap-1 text-[0.7rem] text-destructive/70 hover:text-destructive transition-colors ml-auto"
                                    >
                                        <Trash2 className="h-3 w-3" /> {t('myStudy.removeHighlight')}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ol>
                )
            )}

            {/* ── Edit Note Modal ── */}
            <NoteModal
                isOpen={!!editNote}
                onClose={() => setEditNote(null)}
                reference={editNote ? `${editNote.bookName} ${editNote.chapter}:${editNote.verse}` : ''}
                verseText={editNote?.verseText ?? ''}
                existingNote={editNote}
                onSave={(content) => {
                    if (!editNote) return;
                    // Persist to DB/localStorage
                    void saveNote(user?.id ?? null, { ...editNote, content });
                    // Optimistic UI update
                    setNotes(prev =>
                        prev.map(n =>
                            n.id === editNote.id
                                ? { ...n, content, updatedAt: new Date().toISOString() }
                                : n
                        )
                    );
                }}
                onDelete={() => {
                    if (!editNote) return;
                    handleDeleteNote(editNote);
                    setEditNote(null);
                }}
            />

            {/* ── Auth Modal ── */}
            <AuthModal
                isOpen={authOpen}
                onClose={() => setAuthOpen(false)}
                hint={t('auth.syncHint')}
            />
        </main>
    );
}
