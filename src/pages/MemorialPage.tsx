// ─────────────────────────────────────────────────────────────────────────────
// MemorialPage.tsx — Bíblia Vive · Sprint 28
//
// Página "Meu Memorial" com a Linha Sagrada Central (Altar de Ebenézer),
// efeito SpotlightCard, busca em tempo real, filtros sóbrios e criação autônoma.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    CheckCircle2,
    Scroll,
    ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { usePageMeta } from '@/hooks/usePageMeta';
import {
    createNoteStore,
    type MemorialCategory,
    type MemorialEntry
} from '@/lib/noteStore';
import { exportNotesToTXT, exportNotesToPDF } from '@/lib/notesExport';
import { findBookGlobally } from '@/lib/books';
import AuthModal from '@/components/AuthModal';
import MemorialEntryModal from '@/components/MemorialEntryModal';
import MemorialHeader, { type MemorialFilterType } from '@/components/memorial/MemorialHeader';
import MemorialTimeline from '@/components/memorial/MemorialTimeline';
import MemorialCard from '@/components/memorial/MemorialCard';
import AnswerPrayerDialog from '@/components/memorial/AnswerPrayerDialog';
import Layout from '@/components/Layout';

export default function MemorialPage() {
    usePageMeta({
        title: "Meu Memorial — Bíblia Vive",
        robots: "noindex, nofollow",
    });

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, isAuthenticated } = useAuth();
    const { isPro } = useSubscription();

    const urlBook = searchParams.get('book');
    const urlChapter = searchParams.get('chapter');

    const [entries, setEntries] = useState<MemorialEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<MemorialFilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [authOpen, setAuthOpen] = useState(false);

    // Modal de Criação / Edição de Marco
    const [selectedEntry, setSelectedEntry] = useState<MemorialEntry | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Diálogo Contextual de Resposta de Oração
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

    // Filtragem em memória dos marcos
    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            // Filtro de Categoria / Status
            if (activeFilter === 'reflection' && entry.type !== 'reflection') return false;
            if (activeFilter === 'prayer' && entry.type !== 'prayer') return false;
            if (activeFilter === 'testimony' && entry.type !== 'testimony') return false;
            if (activeFilter === 'fasting' && entry.type !== 'fasting') return false;
            if (activeFilter === 'answered' && !entry.answeredAt) return false;
            if (activeFilter === 'favorite' && !entry.favorite) return false;

            // Filtro por parâmetros de URL (book e chapter)
            if (urlBook && urlChapter) {
                const bk = findBookGlobally(urlBook);
                const targetBookId = bk ? bk.id.toLowerCase() : urlBook.toLowerCase();
                const entryBookId = entry.bookId.toLowerCase();
                const entryBookName = entry.bookName.toLowerCase();

                const matchesBook = entryBookId === targetBookId || entryBookName === urlBook.toLowerCase();
                const matchesChapter = String(entry.chapter) === String(urlChapter);
                if (!matchesBook || !matchesChapter) return false;
            }

            // Busca universal em tempo real
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
    }, [entries, activeFilter, searchQuery, urlBook, urlChapter]);

    const handleToggleFavorite = async (id: string) => {
        const newFav = await store.toggleFavorite!(id);
        setEntries(prev => prev.map(item => item.id === id ? { ...item, favorite: newFav } : item));
    };

    const handleDelete = async (id: string) => {
        await store.delete(id);
        setEntries(prev => prev.filter(item => item.id !== id));
        setIsEditModalOpen(false);
        setSelectedEntry(null);
    };

    const handleOpenAnswerModal = (entry: MemorialEntry) => {
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

    if (!isAuthenticated) {
        return (
            <Layout>
                <main className="min-h-screen bg-app-base px-4 py-16 max-w-xl mx-auto font-sans flex flex-col items-center justify-center text-center">
                    <h1 className="text-3xl md:text-4xl font-serif font-semibold text-app-text tracking-tight mb-4">
                        Meu Memorial
                    </h1>
                    <p className="text-lg font-serif text-app-text-muted italic mb-6">
                        "Sua caminhada com a Palavra merece ser lembrada."
                    </p>
                    <div className="space-y-4 text-app-text-muted text-sm md:text-base leading-relaxed mb-8 max-w-lg">
                        <p>
                            Enquanto você lê, pode registrar orações, reflexões, testemunhos e propósitos.
                        </p>
                        <p>
                            Com uma conta gratuita, essas memórias espirituais permanecem guardadas diante do Senhor para que você possa revisitá-las sempre que desejar.
                        </p>
                    </div>
                    <div className="space-y-4 w-full max-w-xs">
                        <button
                            type="button"
                            onClick={() => setAuthOpen(true)}
                            className="w-full py-3 px-6 rounded-2xl bg-gold text-black font-semibold text-sm hover:bg-gold/90 transition-colors shadow-xs"
                        >
                            Criar conta gratuitamente
                        </button>
                        <div>
                            <button
                                type="button"
                                onClick={() => setAuthOpen(true)}
                                className="text-xs text-app-text-muted hover:text-gold transition-colors"
                            >
                                Já possui uma conta? <span className="underline font-medium">Entrar</span>
                            </button>
                        </div>
                    </div>

                    <AuthModal
                        isOpen={authOpen}
                        onClose={() => setAuthOpen(false)}
                        hint="Sua caminhada com a Palavra merece ser lembrada."
                    />
                </main>
            </Layout>
        );
    }

    return (
        <Layout>
            <main className="min-h-screen bg-app-base px-4 py-8 max-w-4xl mx-auto font-sans">
                {/* Header Superior com Navegação e Título Sóbrio */}
                <div className="flex items-start justify-between mb-6 pb-6 border-b border-border/60">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="p-1 rounded-lg hover:bg-app-raised transition-colors text-app-text-muted hover:text-app-text cursor-pointer"
                                aria-label="Voltar"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <h1 className="text-2xl font-semibold text-app-text font-serif tracking-tight flex items-center gap-2">
                                <Scroll className="h-6 w-6 text-gold" />
                                <span>Meu Memorial</span>
                            </h1>
                        </div>
                        <p className="text-[0.85rem] text-app-text-muted italic pl-7">
                            "Aqui permanecem registradas as marcas da sua caminhada."
                        </p>
                    </div>
                </div>

                {/* Cabeçalho de Ebenézer, Busca, Filtros e Ações */}
                <MemorialHeader
                    totalEntries={entries.length}
                    filteredCount={filteredEntries.length}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    onNewEntry={() => {
                        setSelectedEntry(null);
                        setIsEditModalOpen(true);
                    }}
                    onExportTXT={() => exportNotesToTXT(filteredEntries)}
                    onExportPDF={() => {
                        if (isPro) {
                            exportNotesToPDF(filteredEntries);
                        } else {
                            navigate('/pro');
                        }
                    }}
                    isPro={isPro}
                />

                {/* Linha Sagrada Contínua da Caminhada (Timeline) */}
                {loading ? (
                    <div className="text-center py-20 text-app-text-muted text-sm animate-pulse space-y-3">
                        <div className="h-8 w-8 rounded-full border-2 border-gold/40 border-t-gold animate-spin mx-auto" />
                        <p className="font-serif">Carregando seu Altar de Memórias...</p>
                    </div>
                ) : (
                    <MemorialTimeline
                        entries={filteredEntries}
                        emptyState={(function () {
                            const emptyMessages: Record<string, { title: string; desc: string }> = {
                                prayer: {
                                    title: "Nenhuma oração em espera",
                                    desc: "Apresente suas súplicas e pedidos ao Senhor. Quando Ele responder, você poderá registrar este marco.",
                                },
                                testimony: {
                                    title: "Nenhum testemunho registrado ainda",
                                    desc: "Quando Deus operar prodígios ou livramentos em sua jornada, grave sua pedra de memória aqui.",
                                },
                                answered: {
                                    title: "Nenhuma oração respondida arquivada ainda",
                                    desc: "Suas orações atendidas se transformarão em monumentos de gratidão neste Altar.",
                                },
                                reflection: {
                                    title: "Nenhuma reflexão registrada",
                                    desc: "Medite na Palavra durante sua leitura diária e registre aqui os aprendizados que o Espírito Santo lhe revelar.",
                                },
                                fasting: {
                                    title: "Nenhum propósito ou jejum registrado",
                                    desc: "Consagre seus propósitos diante de Deus para acompanhar seu progresso e fidelidade.",
                                },
                                favorite: {
                                    title: "Nenhum marco favorito",
                                    desc: "Você pode favoritar seus marcos mais marcantes tocando no menu de opções de cada card.",
                                },
                            };

                            const info = emptyMessages[activeFilter];
                            if (!info) return undefined;

                            return (
                                <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-border space-y-3 bg-app-surface/30 max-w-xl mx-auto">
                                    <Scroll className="h-10 w-10 text-app-text-muted/40 mx-auto" />
                                    <p className="text-[0.95rem] font-serif text-app-text">{info.title}</p>
                                    <p className="text-[0.8rem] text-app-text-muted max-w-sm mx-auto leading-relaxed">
                                        {info.desc}
                                    </p>
                                </div>
                            );
                        })()}
                        renderCard={(entry) => (
                            <MemorialCard
                                entry={entry}
                                onCardClick={(e) => navigate(`/memorial/${e.id}`)}
                                onMarkAnswered={handleOpenAnswerModal}
                                onToggleFavorite={(e) => handleToggleFavorite(e.id)}
                                onEdit={(e) => {
                                    setSelectedEntry(e);
                                    setIsEditModalOpen(true);
                                }}
                                onDelete={(e) => handleDelete(e.id)}
                            />
                        )}
                    />
                )}

                {/* Modal de Criação ou Edição de Registro */}
                <MemorialEntryModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedEntry(null);
                    }}
                    category={
                        selectedEntry?.type ??
                        (activeFilter !== 'all' && activeFilter !== 'answered' && activeFilter !== 'favorite'
                            ? (activeFilter as MemorialCategory)
                            : 'reflection')
                    }
                    bookId={selectedEntry?.bookId ?? 'sl'}
                    bookName={selectedEntry?.bookName ?? 'Salmos'}
                    chapter={selectedEntry?.chapter ?? 23}
                    verse={selectedEntry?.verse ?? null}
                    version={selectedEntry?.version ?? 'acf'}
                    existingEntry={selectedEntry}
                    onSave={async (entryData) => {
                        if (selectedEntry) {
                            await store.update(selectedEntry.id, entryData);
                        } else {
                            await store.create(entryData);
                        }
                        await fetchEntries();
                        setIsEditModalOpen(false);
                        setSelectedEntry(null);
                    }}
                    onDelete={selectedEntry ? () => handleDelete(selectedEntry.id) : undefined}
                />

                {/* Diálogo Contextual de Registro de Resposta de Oração */}
                <AnswerPrayerDialog
                    isOpen={Boolean(answerModalEntry)}
                    onClose={() => setAnswerModalEntry(null)}
                    answerText={answerText}
                    onAnswerTextChange={setAnswerText}
                    onSubmit={handleSaveAnswer}
                    isSubmitting={isAnswering}
                />

                {/* Modal de Autenticação */}
                <AuthModal
                    isOpen={authOpen}
                    onClose={() => setAuthOpen(false)}
                    hint="Entre com sua conta da Bíblia Vive para sincronizar suas memórias na nuvem."
                />
            </main>
        </Layout>
    );
}
