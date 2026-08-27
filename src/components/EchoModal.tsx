// ─────────────────────────────────────────────────────────────────────────────
// EchoModal.tsx — Bíblia Vive · Eco do Memorial
//
// Modal sobreposto à página de leitura para reencontro com uma memória antiga.
// Exibe o conteúdo completo, linha do tempo de atualizações e formulário de resposta.
// Permite fechar devolvendo o Leitor exatamente ao texto bíblico sem recarregar a página.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { Link } from "react-router-dom";
import { X, CheckCircle2, ExternalLink } from "lucide-react";
import { type MemorialEntry, type NoteStore } from "@/lib/noteStore";
import { cn } from "@/lib/utils";
import StoneIcon from "@/components/StoneIcon";
import { SaveMemorialButton } from "@/components/SaveMemorialButton";

interface EchoModalProps {
    isOpen: boolean;
    onClose: () => void;
    entry: MemorialEntry;
    store: NoteStore;
    onRefresh: () => void;
}

export default function EchoModal({ isOpen, onClose, entry, store, onRefresh }: EchoModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [updateInput, setUpdateInput] = useState("");

    if (!isOpen) return null;

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

    const categoryLabels: Record<string, string> = {
        reflection: "Reflexão",
        prayer: "Oração",
        testimony: "Testemunho",
        fasting: "Propósito",
    };

    const handleAddUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = updateInput.trim();
        if (!text || submitting) return;

        setSubmitting(true);
        try {
            if (store.addEcoUpdate) {
                await store.addEcoUpdate(entry.id, text);
                setUpdateInput("");
                onRefresh();
            }
        } catch (err) {
            console.error("Erro ao adicionar atualização no modal:", err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            {/* Overlay click catcher */}
            <div className="absolute inset-0" onClick={onClose} />

            <div
                className="relative z-10 w-full max-w-xl max-h-[90vh] bg-app-surface rounded-3xl border border-gold/30 shadow-2xl overflow-hidden flex flex-col font-sans"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header fixo do Modal */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-app-raised/80">
                    <div className="flex items-center gap-2 text-xs font-serif text-app-text-muted">
                        <StoneIcon className="h-4 w-4 text-gold" />
                        <span className="font-medium text-app-text">Reencontro Espiritual</span>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full text-app-text-muted hover:text-app-text hover:bg-app-raised transition-colors"
                        aria-label="Fechar"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Conteúdo rolável */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-app-surface">
                    {/* Meta da Memória */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-app-text-muted font-serif">
                            <span className="px-2.5 py-0.5 rounded-full bg-gold/15 text-gold font-medium border border-gold/30">
                                {categoryLabels[entry.type] || "Memória"}
                            </span>
                            <span>{formatDateLong(entry.createdAt)}</span>
                        </div>

                        <h2 className="text-xl font-serif font-bold text-app-text tracking-tight pt-1">
                            {entry.title || `${entry.bookName} ${entry.chapter}`}
                        </h2>
                    </div>

                    {/* Versículo citado se houver */}
                    {entry.verseText && (
                        <blockquote className="pl-4 border-l-2 border-gold/50 text-app-text-muted italic text-sm font-serif bg-gold/5 py-2 pr-2 rounded-r-lg">
                            "{entry.verseText}"
                        </blockquote>
                    )}

                    {/* Conteúdo principal */}
                    <div className="text-sm font-serif text-app-text leading-relaxed whitespace-pre-wrap bg-app-raised/50 p-4 rounded-2xl border border-border/60">
                        {entry.content}
                    </div>

                    {/* Oração Respondida */}
                    {entry.type === "prayer" && entry.answeredAt && (
                        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1.5 text-xs">
                            <div className="flex items-center gap-2 text-emerald-400 font-medium">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Oração Respondida • {formatDateLong(entry.answeredAt)}</span>
                            </div>
                            {entry.answeredNote && (
                                <p className="text-app-text font-serif italic pl-6 leading-relaxed">
                                    "{entry.answeredNote}"
                                </p>
                            )}
                        </div>
                    )}

                    {/* Selo do Reencontro */}
                    <div className="p-4 rounded-2xl bg-gold-bg/60 border border-gold/30 text-xs text-app-text-muted font-serif italic">
                        <p className="text-app-text font-medium not-italic mb-1">
                            Esta pedra foi colocada em {formatDateLong(entry.createdAt)}.
                        </p>
                        <p>Como Deus tem falado com você sobre isso hoje?</p>
                    </div>

                    {/* Histórico Vertical de Atualizações (eco_updates) */}
                    {Array.isArray(entry.metadata?.eco_updates) && entry.metadata.eco_updates.length > 0 && (
                        <div className="space-y-3 pt-2">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-app-text-muted font-sans">
                                Atualizações da Caminhada ({entry.metadata.eco_updates.length})
                            </h4>
                            <div className="space-y-3 relative pl-4 border-l border-gold/40">
                                {entry.metadata.eco_updates.map((update: { text: string; date: string }, idx: number) => (
                                    <div key={idx} className="relative space-y-1">
                                        <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-gold ring-4 ring-app-surface" />
                                        <span className="text-[0.68rem] text-app-text-muted font-sans">
                                            {formatDateLong(update.date)}
                                        </span>
                                        <p className="text-xs text-app-text font-serif leading-relaxed bg-app-raised p-3 rounded-xl border border-border/80">
                                            {update.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Formulário para Adicionar Nova Atualização */}
                    <div className="space-y-3 pt-2">
                        <textarea
                            value={updateInput}
                            onChange={(e) => setUpdateInput(e.target.value)}
                            rows={3}
                            placeholder="Escreva uma breve resposta ou atualização sobre esta memória..."
                            className="w-full rounded-2xl border border-border bg-app-raised p-3.5 text-xs font-serif text-app-text placeholder:text-app-text-muted focus:outline-none focus:ring-1 focus:ring-gold/50"
                        />
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                            <div className="w-full sm:max-w-[240px]">
                                <SaveMemorialButton
                                    disabled={!updateInput.trim()}
                                    idleText="Registrar Atualização"
                                    savingText="Gravando no Memorial..."
                                    successText="Atualização Gravada"
                                    onSave={async () => {
                                        const text = updateInput.trim();
                                        if (!text) return false;
                                        if (store.addEcoUpdate) {
                                            await store.addEcoUpdate(entry.id, text);
                                            setUpdateInput("");
                                            onRefresh();
                                            return true;
                                        }
                                        return false;
                                    }}
                                />
                            </div>

                            <Link
                                to={`/memorial/${entry.id}`}
                                onClick={onClose}
                                className="text-xs text-app-text-muted hover:text-gold transition-colors inline-flex items-center justify-center sm:justify-start gap-1 font-sans py-2"
                            >
                                <span>Abrir no Memorial</span>
                                <ExternalLink className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
