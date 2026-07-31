// ─────────────────────────────────────────────────────────────────────────────
// MemorialEntryPage.tsx — Bíblia Vive · Sprint 27
//
// Página de leitura dedicada para um registro individual do Memorial.
// Transmite a sensação de reler uma página de diário / livro, sem parecer formulário.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Copy, Check, Edit3, Trash2, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePageMeta } from "@/hooks/usePageMeta";
import { createNoteStore, type MemorialCategory, type MemorialEntry } from "@/lib/noteStore";
import { findBookGlobally } from "@/lib/books";
import AuthModal from "@/components/AuthModal";
import MemorialEntryModal from "@/components/MemorialEntryModal";
import { cn } from "@/lib/utils";

export default function MemorialEntryPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const [entry, setEntry] = useState<MemorialEntry | null>(null);
    const [otherEntries, setOtherEntries] = useState<MemorialEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const [authOpen, setAuthOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const store = useMemo(() => createNoteStore(user?.id ?? null), [user]);

    usePageMeta({
        title: entry ? `${entry.title || entry.bookName + ' ' + entry.chapter} — Meu Memorial` : "Meu Memorial — Bíblia Vive",
        robots: "noindex, nofollow",
    });

    const categoryConfig: Record<MemorialCategory, { label: string; classes: string }> = {
        reflection: { label: "Reflexão", classes: "bg-gold/10 text-gold border-gold/30 font-medium" },
        prayer: { label: "Oração", classes: "bg-app-raised text-app-text-muted border-border font-medium" },
        testimony: { label: "Testemunho", classes: "bg-app-raised text-app-text-muted border-border font-medium" },
        fasting: { label: "Jejum / Propósito", classes: "bg-app-raised text-app-text-muted border-border font-medium" },
    };

    const fetchEntry = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const all = await store.getAll();
            const found = all.find((item) => item.id === id) || null;
            setEntry(found);

            if (found) {
                const chapterItems = await store.getByChapter(found.bookId, found.chapter);
                const filtered = chapterItems
                    .filter((item) => item.id !== found.id)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setOtherEntries(filtered);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchEntry();
        } else {
            setLoading(false);
        }
    }, [id, store, isAuthenticated]);

    function formatDateLong(iso: string) {
        try {
            return new Date(iso).toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "long",
                year: "numeric",
            });
        } catch {
            return iso;
        }
    }

    function getBibleLink(item: MemorialEntry) {
        const bk = findBookGlobally(item.bookId);
        const slug = bk ? bk.slug : item.bookId.toLowerCase();
        const ver = item.version || "acf";
        return `/${ver}/${slug}/${item.chapter}${item.verse ? `#v${item.verse}` : ""}`;
    }

    const handleCopy = async () => {
        if (!entry) return;
        const config = categoryConfig[entry.type] || categoryConfig.reflection;
        const formattedDate = formatDateLong(entry.createdAt);
        const refText = `${entry.bookName} ${entry.chapter}${entry.verse ? `:${entry.verse}` : ""}`;
        
        let text = `${config.label} • ${refText}\n${formattedDate}\n\n`;
        if (entry.title) text += `${entry.title}\n\n`;
        text += entry.content;

        if (entry.answeredAt && entry.answeredNote) {
            text += `\n\nOração Respondida (${formatDateLong(entry.answeredAt)}):\n${entry.answeredNote}`;
        }

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Erro ao copiar registro:", err);
        }
    };

    const handleDelete = async () => {
        if (!entry) return;
        if (window.confirm("Deseja remover esta marca da sua caminhada?")) {
            await store.delete(entry.id);
            navigate("/memorial", { replace: true });
        }
    };

    // ── Tela Institucional para Visitante ──
    if (!isAuthenticated) {
        return (
            <main className="min-h-screen bg-app-base px-4 py-16 max-w-xl mx-auto font-sans flex flex-col items-center justify-center text-center">
                <h1 className="text-3xl md:text-4xl font-serif font-semibold text-app-text tracking-tight mb-4">
                    Memorial
                </h1>
                <p className="text-lg font-serif text-app-text-muted italic mb-6">
                    "Sua caminhada com a Palavra merece ser lembrada."
                </p>
                <div className="space-y-4 text-app-text-muted text-sm md:text-base leading-relaxed mb-8 max-w-lg">
                    <p>
                        Enquanto você lê, pode registrar orações, reflexões, testemunhos e propósitos.
                    </p>
                    <p>
                        Com uma conta gratuita, esses momentos permanecem guardados para que você possa revisitá-los sempre que desejar.
                    </p>
                </div>
                <div className="space-y-4 w-full max-w-xs">
                    <button
                        type="button"
                        onClick={() => setAuthOpen(true)}
                        className="w-full py-3 px-6 rounded-2xl bg-gold text-black font-semibold text-sm hover:bg-gold/90 transition-colors shadow-sm"
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
        );
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-app-base px-4 py-16 max-w-2xl mx-auto font-sans text-center text-app-text-muted animate-pulse">
                Carregando a página do seu Memorial...
            </main>
        );
    }

    if (!entry) {
        return (
            <main className="min-h-screen bg-app-base px-4 py-16 max-w-2xl mx-auto font-sans text-center space-y-4">
                <p className="text-app-text-muted font-serif text-lg">Registro não encontrado</p>
                <Link
                    to="/memorial"
                    replace
                    className="inline-flex items-center gap-1.5 text-sm text-gold hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Memorial
                </Link>
            </main>
        );
    }

    const conf = categoryConfig[entry.type] || categoryConfig.reflection;
    const soap = entry.metadata?.soap;

    return (
        <main className="min-h-screen bg-app-base px-4 py-10 max-w-2xl mx-auto font-sans space-y-10">
            {/* Navegação superior */}
            <div>
                <Link
                    to="/memorial"
                    replace
                    className="inline-flex items-center gap-1.5 text-xs text-app-text-muted hover:text-app-text transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Memorial
                </Link>
            </div>

            {/* Cabeçalho do Registro */}
            <article className="space-y-8">
                <div className="space-y-3 pb-6 border-b border-border/50">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <span className={cn("inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold", conf.classes)}>
                            {conf.label}
                        </span>
                        <span className="text-xs text-app-text-muted font-serif">
                            {formatDateLong(entry.createdAt)}
                        </span>
                    </div>

                    <Link
                        to={getBibleLink(entry)}
                        className="inline-block text-lg font-serif font-semibold text-gold hover:underline"
                    >
                        {entry.bookName} {entry.chapter}{entry.verse ? `:${entry.verse}` : ""}
                    </Link>

                    {entry.title && (
                        <h1 className="text-2xl font-serif font-bold text-app-text tracking-tight pt-2">
                            {entry.title}
                        </h1>
                    )}
                </div>

                {/* Versículo citado se houver */}
                {entry.verseText && (
                    <blockquote className="pl-4 border-l-2 border-gold/40 text-app-text-muted italic text-sm leading-relaxed font-serif">
                        "{entry.verseText}"
                    </blockquote>
                )}

                {/* Conteúdo Principal */}
                <div className="text-base text-app-text font-serif leading-relaxed whitespace-pre-wrap space-y-4">
                    {entry.content}
                </div>

                {/* Detalhes do SOAP se for Reflexão */}
                {entry.type === "reflection" && soap && (soap.scripture || soap.observation || soap.application || soap.prayer) && (
                    <div className="rounded-2xl border border-border bg-app-surface p-6 space-y-4 text-sm font-sans">
                        {soap.scripture && (
                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-gold mb-1">Escritura (S)</h4>
                                <p className="text-app-text leading-relaxed">{soap.scripture}</p>
                            </div>
                        )}
                        {soap.observation && (
                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-gold mb-1">Observação (O)</h4>
                                <p className="text-app-text leading-relaxed">{soap.observation}</p>
                            </div>
                        )}
                        {soap.application && (
                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-gold mb-1">Aplicação (A)</h4>
                                <p className="text-app-text leading-relaxed">{soap.application}</p>
                            </div>
                        )}
                        {soap.prayer && (
                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-gold mb-1">Oração (P)</h4>
                                <p className="text-app-text leading-relaxed">{soap.prayer}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Oração Respondida */}
                {entry.type === "prayer" && entry.answeredAt && (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Oração Respondida • {formatDateLong(entry.answeredAt)}</span>
                        </div>
                        {entry.answeredNote && (
                            <p className="text-sm text-app-text font-serif italic pl-6 leading-relaxed">
                                "{entry.answeredNote}"
                            </p>
                        )}
                    </div>
                )}
            </article>

            {/* Outros momentos desta leitura */}
            {otherEntries.length > 0 && (
                <section className="pt-8 border-t border-border/50 space-y-4">
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-app-text font-serif">
                            Outros momentos desta leitura
                        </h3>
                        <p className="text-xs text-app-text-muted">
                            {entry.bookName} {entry.chapter} continuou fazendo parte da sua caminhada.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {otherEntries.slice(0, 3).map((item) => {
                            const itemConf = categoryConfig[item.type] || categoryConfig.reflection;
                            return (
                                <Link
                                    key={item.id}
                                    to={`/memorial/${item.id}`}
                                    className="block p-4 rounded-xl border border-border bg-app-surface hover:border-gold/30 transition-colors space-y-1"
                                >
                                    <div className="flex items-center justify-between text-xs">
                                        <span className={cn("px-2 py-0.5 rounded-full border text-[0.68rem]", itemConf.classes)}>
                                            {itemConf.label}
                                        </span>
                                        <span className="text-app-text-muted">{formatDateLong(item.createdAt)}</span>
                                    </div>
                                    <p className="text-xs text-app-text line-clamp-2 font-serif pt-1">
                                        {item.title || item.content}
                                    </p>
                                </Link>
                            );
                        })}
                    </div>

                    {otherEntries.length > 3 && (
                        <div className="pt-1">
                            <Link
                                to={`/memorial?book=${entry.bookId}&chapter=${entry.chapter}`}
                                className="text-xs font-medium text-gold hover:underline inline-flex items-center gap-1"
                            >
                                Ver todos os registros de {entry.bookName} {entry.chapter} →
                            </Link>
                        </div>
                    )}
                </section>
            )}

            {/* Ações inferiores discretas */}
            <div className="pt-6 border-t border-border/40 flex items-center justify-between gap-4 text-xs text-app-text-muted">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-1.5 hover:text-app-text transition-colors"
                    >
                        <Edit3 className="h-3.5 w-3.5" />
                        Editar
                    </button>

                    <button
                        type="button"
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 hover:text-app-text transition-colors"
                    >
                        {copied ? (
                            <>
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-medium">Copiado ✓</span>
                            </>
                        ) : (
                            <>
                                <Copy className="h-3.5 w-3.5" />
                                Copiar
                            </>
                        )}
                    </button>
                </div>

                <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 text-red-400/80 hover:text-red-400 transition-colors"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir
                </button>
            </div>

            {/* Modal de Edição */}
            {isEditModalOpen && entry && (
                <MemorialEntryModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    category={entry.type}
                    bookId={entry.bookId}
                    bookName={entry.bookName}
                    chapter={entry.chapter}
                    verse={entry.verse}
                    version={entry.version}
                    verseText={entry.verseText}
                    existingEntry={entry}
                    onSave={async (updated) => {
                        await store.save(updated);
                        await fetchEntry();
                        setIsEditModalOpen(false);
                    }}
                    onDelete={handleDelete}
                />
            )}
        </main>
    );
}
