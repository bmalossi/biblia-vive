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
import MemorialHeroHeader from '@/components/memorial/MemorialHeroHeader';
import MemorialActionBar from '@/components/memorial/MemorialActionBar';
import MemorialFeaturedCard from '@/components/memorial/MemorialFeaturedCard';
import MemorialSidebar from '@/components/memorial/MemorialSidebar';
import { type MemorialFilterType } from '@/components/memorial/MemorialHeader';
import MemorialTimeline from '@/components/memorial/MemorialTimeline';
import MemorialCard from '@/components/memorial/MemorialCard';
import MemorialNoteModal from '@/components/memorial/MemorialNoteModal';
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
    const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');
    const [searchQuery, setSearchQuery] = useState('');
    const [authOpen, setAuthOpen] = useState(false);

    // Modal de Visualização Expansiva (Scale In Card)
    const [expandedNote, setExpandedNote] = useState<MemorialEntry | null>(null);

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

    // Filtragem e ordenação dos marcos
    const filteredEntries = useMemo(() => {
        const filtered = entries.filter(entry => {
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

        // Ordenação cronológica
        return [...filtered].sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            return sortOrder === 'recent' ? timeB - timeA : timeA - timeB;
        });
    }, [entries, activeFilter, searchQuery, urlBook, urlChapter, sortOrder]);

    // Identificação da Memória em Destaque (preferência por favorito ou primeiro da lista quando sem busca)
    const featuredEntryId = useMemo(() => {
        if (filteredEntries.length === 0 || searchQuery || activeFilter !== 'all') return null;
        const fav = filteredEntries.find(e => e.favorite);
        return fav ? fav.id : filteredEntries[0].id;
    }, [filteredEntries, searchQuery, activeFilter]);

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
        <Layout maxWidthClassName="max-w-7xl">
            <div className="w-full pb-20 pt-2 font-sans">
                {/* 1. HERO SUPERIOR COM BÍBLIA CLÁSSICA E DEGRADÊ ESFUMAÇADO */}
                <MemorialHeroHeader />

                {/* 2. BARRA DE BUSCA UNIVERSAL, NOVA MEMÓRIA, FILTROS E ORDENAÇÃO */}
                <MemorialActionBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    sortOrder={sortOrder}
                    onToggleSortOrder={() =>
                        setSortOrder((prev) => (prev === "recent" ? "oldest" : "recent"))
                    }
                    onNewEntry={() => {
                        setSelectedEntry(null);
                        setIsEditModalOpen(true);
                    }}
                    onExportTXT={() => exportNotesToTXT(filteredEntries)}
                    onExportPDF={() => {
                        if (isPro) {
                            exportNotesToPDF(filteredEntries);
                        } else {
                            navigate("/pro");
                        }
                    }}
                    isPro={isPro}
                    totalFiltered={filteredEntries.length}
                />

                {/* 3. LAYOUT PRINCIPAL EM DUAS COLUNAS (TIMELINE + SIDEBAR) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Coluna Esquerda: Linha Sagrada Contínua e Memórias (~65-70%) */}
                    <main className="lg:col-span-8 space-y-6">
                        {loading ? (
                            <div className="text-center py-20 text-[#8f8272] text-sm animate-pulse space-y-3">
                                <div className="h-8 w-8 rounded-full border-2 border-[#e5b869]/40 border-t-[#e5b869] animate-spin mx-auto" />
                                <p className="font-serif">Carregando seu Altar de Memórias...</p>
                            </div>
                        ) : (
                            <MemorialTimeline
                                entries={filteredEntries}
                                featuredEntryId={featuredEntryId}
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
                                        <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-[#382f23] space-y-3 bg-[#161412] max-w-xl mx-auto">
                                            <Scroll className="h-10 w-10 text-[#8f8272]/40 mx-auto" />
                                            <p className="text-[0.95rem] font-serif text-[#f4efea]">{info.title}</p>
                                            <p className="text-[0.8rem] text-[#9b8e7e] max-w-sm mx-auto leading-relaxed">
                                                {info.desc}
                                            </p>
                                        </div>
                                    );
                                })()}
                                renderCard={(entry, index, isFeatured) => {
                                    if (isFeatured && entry.id === featuredEntryId) {
                                        return (
                                            <MemorialFeaturedCard
                                                key={entry.id}
                                                entry={entry}
                                                onCardClick={(e) => setExpandedNote(e)}
                                                onMarkAnswered={handleOpenAnswerModal}
                                                onToggleFavorite={(e) => handleToggleFavorite(e.id)}
                                                onEdit={(e) => {
                                                    setSelectedEntry(e);
                                                    setIsEditModalOpen(true);
                                                }}
                                                onDelete={(e) => handleDelete(e.id)}
                                            />
                                        );
                                    }

                                    return (
                                        <MemorialCard
                                            key={entry.id}
                                            entry={entry}
                                            onCardClick={(e) => setExpandedNote(e)}
                                            onMarkAnswered={handleOpenAnswerModal}
                                            onToggleFavorite={(e) => handleToggleFavorite(e.id)}
                                            onEdit={(e) => {
                                                setSelectedEntry(e);
                                                setIsEditModalOpen(true);
                                            }}
                                            onDelete={(e) => handleDelete(e.id)}
                                        />
                                    );
                                }}
                            />
                        )}
                    </main>

                    {/* Coluna Direita: Sidebar com 'X marcos preservados', 'Para recordar...', Citação Bíblica e CTA (~30-35%) */}
                    <div className="lg:col-span-4">
                        <MemorialSidebar
                            entries={entries}
                            totalEntries={entries.length}
                            onNewEntry={() => {
                                setSelectedEntry(null);
                                setIsEditModalOpen(true);
                            }}
                            onOpenEntry={(entry) => setExpandedNote(entry)}
                        />
                    </div>
                </div>

                {/* Modal Expansivo Scale In Card (Linha Sagrada) */}
                <MemorialNoteModal
                    note={expandedNote}
                    isOpen={Boolean(expandedNote)}
                    onClose={() => setExpandedNote(null)}
                    onMarkAnswered={(entry) => {
                        setExpandedNote(null);
                        handleOpenAnswerModal(entry);
                    }}
                    onToggleFavorite={async (entry) => {
                        await handleToggleFavorite(entry.id);
                        setExpandedNote((prev) =>
                            prev && prev.id === entry.id
                                ? { ...prev, favorite: !prev.favorite }
                                : prev
                        );
                    }}
                    onEdit={(entry) => {
                        setExpandedNote(null);
                        setSelectedEntry(entry);
                        setIsEditModalOpen(true);
                    }}
                    onDelete={(entry) => {
                        handleDelete(entry.id);
                        setExpandedNote(null);
                    }}
                />

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
                        await store.save({ ...entryData, id: selectedEntry?.id });
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
            </div>
        </Layout>
    );
}
