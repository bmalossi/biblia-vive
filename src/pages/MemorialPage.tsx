// ─────────────────────────────────────────────────────────────────────────────
// MemorialPage.tsx — Bíblia Vive · Sprint 26
//
// Página "Meu Memorial" com Linha do Tempo da Caminhada, busca em tempo real,
// filtros por categoria, registro de respostas em oração e favoritos.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    BookOpen,
    Heart,
    Sparkles,
    Mountain,
    Search,
    Star,
    CheckCircle2,
    LogOut,
    LogIn,
    Download,
    FileText,
    Scroll,
    Calendar,
    ArrowLeft,
    Tag,
    Trash2,
    ExternalLink
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { usePageMeta } from '@/hooks/usePageMeta';
import {
    createNoteStore,
    exportNotesToTXT,
    exportNotesToPDF,
    type MemorialCategory,
    type MemorialEntry
} from '@/lib/noteStore';
import { findBookGlobally } from '@/lib/books';
import AuthModal from '@/components/AuthModal';
import MemorialEntryModal from '@/components/MemorialEntryModal';
import { cn } from '@/lib/utils';

export default function MemorialPage() {
    usePageMeta({
        title: "Meu Memorial — Bíblia Vive",
        robots: "noindex, nofollow",
    });

    const navigate = useNavigate();
    const { user, isAuthenticated, signOut } = useAuth();
    const { isPro } = useSubscription();

    const [entries, setEntries] = useState<MemorialEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<MemorialCategory | 'all' | 'answered' | 'favorite'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [authOpen, setAuthOpen] = useState(false);

    // Modal de Detalhes / Edição
    const [selectedEntry, setSelectedEntry] = useState<MemorialEntry | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Modal de Resposta de Oração
    const [answerModalEntry, setAnswerModalEntry] = useState<MemorialEntry | null>(null);
    const [answerText, setAnswerText] = useState('');
    const [isAnswering, setIsAnswering] = useState(false);

    const store = useMemo(() => createNoteStore(user?.id ?? null), [user]);

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const data = await store.getAll();
            setEntries(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, [store]);

    // Filtragem em memória
    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            // Filtro de Categoria / Status
            if (activeFilter === 'reflection' && entry.type !== 'reflection') return false;
            if (activeFilter === 'prayer' && entry.type !== 'prayer') return false;
            if (activeFilter === 'testimony' && entry.type !== 'testimony') return false;
            if (activeFilter === 'fasting' && entry.type !== 'fasting') return false;
            if (activeFilter === 'answered' && !entry.answeredAt) return false;
            if (activeFilter === 'favorite' && !entry.favorite) return false;

            // Busca em tempo real
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchTitle = entry.title?.toLowerCase().includes(q);
                const matchContent = entry.content?.toLowerCase().includes(q);
                const matchBook = entry.bookName?.toLowerCase().includes(q);
                const matchChapter = String(entry.chapter) === q;
                const matchTags = entry.tags?.some(t => t.toLowerCase().includes(q));
                return Boolean(matchTitle || matchContent || matchBook || matchChapter || matchTags);
            }

            return true;
        });
    }, [entries, activeFilter, searchQuery]);

    const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newFav = await store.toggleFavorite!(id);
        setEntries(prev => prev.map(item => item.id === id ? { ...item, favorite: newFav } : item));
    };

    const handleDelete = async (id: string) => {
        await store.delete(id);
        setEntries(prev => prev.filter(item => item.id !== id));
        setIsEditModalOpen(false);
    };

    const handleOpenAnswerModal = (entry: MemorialEntry, e: React.MouseEvent) => {
        e.stopPropagation();
        setAnswerModalEntry(entry);
        setAnswerText(entry.answeredNote || '');
    };

    const handleSaveAnswer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!answerModalEntry) return;
        setIsAnswering(true);
        try {
            await store.markAnswered!(answerModalEntry.id, answerText.trim());
            await fetchEntries();
            setAnswerModalEntry(null);
        } finally {
            setIsAnswering(false);
        }
    };

    const categoryBadgeConfig: Record<MemorialCategory, { label: string; icon: typeof BookOpen; classes: string }> = {
        reflection: { label: "Reflexão", icon: BookOpen, classes: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-gold/15 dark:text-gold dark:border-gold/40 font-semibold" },
        prayer: { label: "Oração", icon: Heart, classes: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/40 font-semibold" },
        testimony: { label: "Testemunho", icon: Sparkles, classes: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/40 font-semibold" },
        fasting: { label: "Jejum / Propósito", icon: Mountain, classes: "bg-stone-200 text-stone-900 border-stone-400 dark:bg-slate-700/60 dark:text-slate-100 dark:border-slate-500/50 font-semibold" },
    };

    function formatDate(iso: string) {
        try {
            return new Date(iso).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return iso;
        }
    }

    function getBibleLink(entry: MemorialEntry) {
        const bk = findBookGlobally(entry.bookId);
        const slug = bk ? bk.slug : entry.bookId.toLowerCase();
        const ver = entry.version || 'acf';
        return `/${ver}/${slug}/${entry.chapter}${entry.verse ? `#v${entry.verse}` : ''}`;
    }

    return (
        <main className="min-h-screen bg-app-base px-4 py-8 max-w-3xl mx-auto font-sans">
            {/* Header */}
            <div className="flex items-start justify-between mb-8 pb-6 border-b border-border/60">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="p-1 rounded-lg hover:bg-app-raised transition-colors text-app-text-muted hover:text-app-text"
                            aria-label="Voltar"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-2xl font-semibold text-app-text font-serif tracking-tight flex items-center gap-2">
                            <Scroll className="h-6 w-6 text-gold" />
                            Meu Memorial
                        </h1>
                    </div>
                    <p className="text-[0.85rem] text-app-text-muted italic pl-7">
                        "Aqui permanecem registradas as marcas da sua caminhada."
                    </p>
                </div>

                {isAuthenticated ? (
                    <button
                        type="button"
                        onClick={signOut}
                        className="flex items-center gap-1.5 text-[0.78rem] text-app-text-muted hover:text-app-text px-3 py-1.5 rounded-xl hover:bg-app-raised transition-colors"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        Sair
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={() => setAuthOpen(true)}
                        className="flex items-center gap-1.5 text-[0.78rem] text-gold hover:text-gold/80 px-3.5 py-1.5 rounded-xl border border-gold/30 hover:bg-gold/10 transition-colors shadow-sm"
                    >
                        <LogIn className="h-3.5 w-3.5" />
                        Entrar
                    </button>
                )}
            </div>

            {/* Hint para Visitantes */}
            {!isAuthenticated && entries.length > 0 && (
                <div className="mb-6 rounded-2xl border border-gold/20 bg-gold/5 p-4 text-[0.8rem] text-app-text-muted flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <BookOpen className="h-4 w-4 text-gold shrink-0" />
                        <span>Seus registros estão salvos neste navegador. Faça login para sincronizar na nuvem.</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setAuthOpen(true)}
                        className="shrink-0 text-gold font-medium hover:underline text-[0.78rem]"
                    >
                        Entrar agora →
                    </button>
                </div>
            )}

            {/* Barra de Busca e Filtros */}
            <div className="space-y-4 mb-8">
                {/* Campo de Busca */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-app-text-muted" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Buscar por texto, título, livro, capítulo ou tags..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border bg-app-surface text-[0.85rem] text-app-text placeholder:text-app-text-muted/50 focus:outline-none focus:ring-1 focus:ring-gold/50 shadow-sm"
                    />
                </div>

                {/* Chips de Filtro */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {[
                        { id: 'all', label: 'Todos' },
                        { id: 'reflection', label: '📖 Reflexões' },
                        { id: 'prayer', label: '🙏 Orações' },
                        { id: 'testimony', label: '✨ Testemunhos' },
                        { id: 'fasting', label: '⛰️ Jejuns' },
                        { id: 'answered', label: '✅ Respondidas' },
                        { id: 'favorite', label: '⭐ Favoritos' },
                    ].map(tab => {
                        const isActive = activeFilter === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveFilter(tab.id as any)}
                                className={cn(
                                    "shrink-0 px-3.5 py-1.5 rounded-full text-[0.78rem] font-sans transition-all duration-200 border",
                                    isActive
                                        ? "bg-gold text-black border-gold font-medium shadow-sm"
                                        : "bg-app-surface text-app-text-muted border-border hover:border-gold/30 hover:text-app-text"
                                )}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Ações de Exportação */}
                <div className="flex items-center justify-between text-[0.75rem] text-app-text-muted pt-2">
                    <span>{filteredEntries.length} {filteredEntries.length === 1 ? 'marca preservada' : 'marcas preservadas'}</span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => exportNotesToTXT(filteredEntries)}
                            disabled={filteredEntries.length === 0}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-app-surface hover:border-gold/40 disabled:opacity-40 transition-colors"
                        >
                            <FileText className="h-3.5 w-3.5" />
                            TXT
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (isPro) {
                                    exportNotesToPDF(filteredEntries);
                                } else {
                                    navigate('/pro');
                                }
                            }}
                            disabled={filteredEntries.length === 0}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 disabled:opacity-40 transition-colors"
                        >
                            <Download className="h-3.5 w-3.5" />
                            PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Linha do Tempo da Caminhada */}
            {loading ? (
                <div className="text-center py-16 text-app-text-muted text-sm animate-pulse">
                    Carregando seu Memorial...
                </div>
            ) : filteredEntries.length === 0 ? (
                <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-border space-y-3 bg-app-surface/30">
                    <Scroll className="h-10 w-10 text-app-text-muted/40 mx-auto" />
                    <p className="text-[0.95rem] font-serif text-app-text">Nenhuma marca encontrada</p>
                    <p className="text-[0.8rem] text-app-text-muted max-w-sm mx-auto">
                        Durante a leitura de qualquer capítulo da Bíblia, toque no botão flutuante para registrar orações, reflexões, testemunhos ou jejuns.
                    </p>
                </div>
            ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                    {filteredEntries.map(entry => {
                        const conf = categoryBadgeConfig[entry.type] || categoryBadgeConfig.reflection;
                        const BadgeIcon = conf.icon;
                        const isPrayer = entry.type === 'prayer';
                        const isAnswered = Boolean(entry.answeredAt);

                        return (
                            <div
                                key={entry.id}
                                onClick={() => {
                                    setSelectedEntry(entry);
                                    setIsEditModalOpen(true);
                                }}
                                className="relative rounded-2xl border border-border bg-app-surface p-5 space-y-3 shadow-sm hover:border-gold/40 transition-all duration-200 cursor-pointer group"
                            >
                                {/* Ponto na Linha do Tempo */}
                                <span className={cn(
                                    "absolute -left-[1.85rem] top-6 h-3.5 w-3.5 rounded-full border-2 border-app-base transition-transform group-hover:scale-125",
                                    entry.type === 'reflection' ? "bg-gold" :
                                    entry.type === 'prayer' ? "bg-blue-400" :
                                    entry.type === 'testimony' ? "bg-emerald-400" : "bg-slate-400"
                                )} />

                                {/* Card Header */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[0.7rem] font-medium", conf.classes)}>
                                                <BadgeIcon className="h-3 w-3" />
                                                {conf.label}
                                            </span>
                                            <Link
                                                to={getBibleLink(entry)}
                                                onClick={e => e.stopPropagation()}
                                                className="text-[0.78rem] font-mono text-gold font-medium hover:underline inline-flex items-center gap-1"
                                            >
                                                {entry.bookName} {entry.chapter}{entry.verse ? `:${entry.verse}` : ''}
                                                <ExternalLink className="h-3 w-3 opacity-60" />
                                            </Link>
                                        </div>

                                        {entry.title && (
                                            <h3 className="text-[0.95rem] font-serif font-semibold text-app-text pt-0.5">
                                                {entry.title}
                                            </h3>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {/* Botão Favoritar */}
                                        <button
                                            type="button"
                                            onClick={e => handleToggleFavorite(entry.id, e)}
                                            className="p-1.5 rounded-lg text-app-text-muted hover:text-gold transition-colors"
                                            title="Favoritar registro"
                                        >
                                            <Star className={cn("h-4 w-4", entry.favorite ? "fill-gold text-gold" : "")} />
                                        </button>

                                        <span className="text-[0.7rem] text-app-text-muted/60">
                                            {formatDate(entry.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                {/* Versículo citado se houver */}
                                {entry.verseText && (
                                    <p className="text-[0.78rem] italic text-app-text-muted/80 pl-3 border-l-2 border-gold/30 line-clamp-2">
                                        "{entry.verseText}"
                                    </p>
                                )}

                                {/* Conteúdo */}
                                <p className="text-[0.84rem] text-app-text leading-relaxed whitespace-pre-wrap line-clamp-4 font-sans">
                                    {entry.content}
                                </p>

                                {/* Seção de Oração Respondida */}
                                {isAnswered && (
                                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1 mt-2">
                                        <div className="flex items-center gap-1.5 text-[0.75rem] font-medium text-emerald-400">
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span>Oração Respondida ({formatDate(entry.answeredAt!)})</span>
                                        </div>
                                        {entry.answeredNote && (
                                            <p className="text-[0.8rem] text-app-text italic">
                                                "{entry.answeredNote}"
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Card Footer: Tags & Ações */}
                                <div className="flex items-center justify-between pt-2 text-[0.72rem] text-app-text-muted border-t border-border/40">
                                    <div className="flex items-center gap-1 flex-wrap">
                                        {entry.tags && entry.tags.length > 0 && (
                                            <>
                                                <Tag className="h-3 w-3 text-app-text-muted/60" />
                                                {entry.tags.map(t => (
                                                    <span key={t} className="px-2 py-0.5 rounded-md bg-app-raised border border-border text-[0.68rem]">
                                                        #{t}
                                                    </span>
                                                ))}
                                            </>
                                        )}
                                    </div>

                                    {/* Botão Registrar Resposta para Orações pendentes */}
                                    {isPrayer && !isAnswered && (
                                        <button
                                            type="button"
                                            onClick={e => handleOpenAnswerModal(entry, e)}
                                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium px-2.5 py-1 rounded-lg border border-blue-500/30 hover:bg-blue-500/10 transition-colors"
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Registrar Resposta
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de Detalhes / Edição */}
            {selectedEntry && (
                <MemorialEntryModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    category={selectedEntry.type}
                    bookId={selectedEntry.bookId}
                    bookName={selectedEntry.bookName}
                    chapter={selectedEntry.chapter}
                    verse={selectedEntry.verse}
                    version={selectedEntry.version}
                    verseText={selectedEntry.verseText}
                    existingEntry={selectedEntry}
                    onSave={async (updated) => {
                        await store.save(updated);
                        await fetchEntries();
                    }}
                    onDelete={handleDelete}
                />
            )}

            {/* Modal de Registro de Resposta da Oração */}
            {answerModalEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-2xl bg-app-surface border border-border p-5 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[0.95rem] font-serif font-semibold text-app-text flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                Registrar Resposta de Oração
                            </h3>
                            <button
                                type="button"
                                onClick={() => setAnswerModalEntry(null)}
                                className="p-1 rounded-lg hover:bg-app-raised text-app-text-muted"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-[0.8rem] text-app-text-muted">
                            "A fidelidade do Senhor permanece para sempre." Registre como Deus respondeu a esta oração:
                        </p>

                        <form onSubmit={handleSaveAnswer} className="space-y-4">
                            <textarea
                                value={answerText}
                                onChange={e => setAnswerText(e.target.value)}
                                placeholder="Descreva a resposta de Deus..."
                                rows={4}
                                className="w-full resize-none rounded-xl border border-border bg-app-surface p-3 text-[0.85rem] text-app-text focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                            />

                            <div className="flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setAnswerModalEntry(null)}
                                    className="px-3.5 py-1.5 text-[0.78rem] text-app-text-muted hover:text-app-text"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isAnswering}
                                    className="px-4 py-2 rounded-xl bg-emerald-500 font-sans font-medium text-[0.8rem] text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    {isAnswering ? "Salvando..." : "Marcar como Respondida"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Autenticação */}
            <AuthModal
                isOpen={authOpen}
                onClose={() => setAuthOpen(false)}
                hint="Entre com sua conta da Bíblia Vive para sincronizar suas memórias na nuvem."
            />
        </main>
    );
}
