// ─────────────────────────────────────────────────────────────────────────────
// MemorialEntryModal.tsx — Bíblia Vive · Sprint 26
//
// Modal para criação e edição rápida dos 4 tipos de registros do Memorial:
// Reflexão (SOAP), Oração, Testemunho e Jejum / Propósito.
// Preenchimento rápido em menos de 15 segundos sem interromper a leitura.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { X, Save, Trash2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemorialCategory, MemorialEntry, MemorialMetadata } from "@/lib/noteStore";

interface MemorialEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: MemorialCategory;
    bookId: string;
    bookName: string;
    chapter: number;
    verse?: number | null;
    version: string;
    verseText?: string;
    existingEntry?: MemorialEntry | null;
    onSave: (entryData: Omit<MemorialEntry, "id" | "createdAt" | "updatedAt"> & { id?: string }) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
}

export default function MemorialEntryModal({
    isOpen,
    onClose,
    category,
    bookId,
    bookName,
    chapter,
    verse: initialVerse,
    version,
    verseText,
    existingEntry,
    onSave,
    onDelete,
}: MemorialEntryModalProps) {
    const [selectedCategory, setSelectedCategory] = useState<MemorialCategory>(category);
    const [verse, setVerse] = useState<number | null>(initialVerse ?? null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState<string>("");

    // Campos de Reflexão (SOAP)
    const [soapS, setSoapS] = useState("");
    const [soapO, setSoapO] = useState("");
    const [soapA, setSoapA] = useState("");
    const [soapP, setSoapP] = useState("");

    // Campos de Oração
    const [motivo, setMotivo] = useState("");
    const [pedido, setPedido] = useState("");
    const [entrega, setEntrega] = useState("");

    // Campos de Testemunho
    const [oQueAconteceu, setOQueAconteceu] = useState("");
    const [comoDeusSustentou, setComoDeusSustentou] = useState("");
    const [dataFato, setDataFato] = useState("");

    // Campos de Jejum / Propósito
    const [objetivo, setObjetivo] = useState("");
    const [dataInicio, setDataInicio] = useState("");
    const [dataPrevista, setDataPrevista] = useState("");

    // Opção de desvincular apresentação de versículo/capítulo
    const [includeReference, setIncludeReference] = useState<boolean>(true);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            const cat = existingEntry?.type || category || 'reflection';
            setSelectedCategory(cat);
            setVerse(existingEntry ? existingEntry.verse ?? null : initialVerse ?? null);
            setTitle(existingEntry?.title || "");
            setContent(existingEntry?.content || "");
            setTags(existingEntry?.tags?.join(", ") || "");

            // Define se deve exibir/vincular a referência bíblica
            if (existingEntry) {
                setIncludeReference(Boolean(existingEntry.verse || existingEntry.verseText));
            } else {
                setIncludeReference(true);
            }

            const meta = existingEntry?.metadata || {};

            // SOAP
            setSoapS(meta.soap?.scripture || verseText || "");
            setSoapO(meta.soap?.observation || "");
            setSoapA(meta.soap?.application || "");
            setSoapP(meta.soap?.prayer || "");

            // Oração
            setMotivo(meta.motivo || "");
            setPedido(meta.pedido || "");
            setEntrega(meta.entrega || "");

            // Testemunho
            setOQueAconteceu(meta.oQueAconteceu || "");
            setComoDeusSustentou(meta.comoDeusSustentou || "");
            setDataFato(meta.dataFato || new Date().toISOString().split('T')[0]);

            // Jejum
            setObjetivo(meta.objetivo || "");
            setDataInicio(meta.dataInicio || new Date().toISOString().split('T')[0]);
            setDataPrevista(meta.dataPrevista || "");

            setTimeout(() => titleInputRef.current?.focus(), 80);
        }
    }, [isOpen, existingEntry, category, initialVerse, verseText]);

    if (!isOpen) return null;

    const categoryConfigs: Record<MemorialCategory, {
        label: string;
        colorClasses: string;
        badgeClasses: string;
        labelColor: string;
    }> = {
        reflection: {
            label: "Reflexão",
            colorClasses: "border-gold/40 text-gold",
            badgeClasses: "bg-gold/10 text-gold border-gold/30 font-medium",
            labelColor: "text-gold",
        },
        prayer: {
            label: "Oração",
            colorClasses: "border-border text-app-text",
            badgeClasses: "bg-app-raised text-app-text border-border font-medium",
            labelColor: "text-app-text",
        },
        testimony: {
            label: "Testemunho",
            colorClasses: "border-border text-app-text",
            badgeClasses: "bg-app-raised text-app-text border-border font-medium",
            labelColor: "text-app-text",
        },
        fasting: {
            label: "Jejum / Propósito",
            colorClasses: "border-border text-app-text",
            badgeClasses: "bg-app-raised text-app-text border-border font-medium",
            labelColor: "text-app-text",
        },
    };

    const currentConfig = categoryConfigs[selectedCategory];

    const referenceText = includeReference
        ? (verse ? `${bookName} ${chapter}:${verse}` : `${bookName} ${chapter}`)
        : "Registro livre (sem versículo)";

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let compiledContent = content.trim();
            const metadataPayload: MemorialMetadata = {};

            if (selectedCategory === 'reflection') {
                metadataPayload.soap = {
                    scripture: includeReference ? soapS : "",
                    observation: soapO,
                    application: soapA,
                    prayer: soapP,
                };
                if (!compiledContent) {
                    compiledContent = [soapO, soapA, soapP].filter(Boolean).join("\n\n");
                }
            } else if (selectedCategory === 'prayer') {
                metadataPayload.motivo = motivo;
                metadataPayload.pedido = pedido;
                metadataPayload.entrega = entrega;
                if (!compiledContent) {
                    compiledContent = [
                        motivo ? `Motivo: ${motivo}` : '',
                        pedido ? `Pedido: ${pedido}` : '',
                        entrega ? `Entrega: ${entrega}` : '',
                    ].filter(Boolean).join("\n");
                }
            } else if (selectedCategory === 'testimony') {
                metadataPayload.oQueAconteceu = oQueAconteceu;
                metadataPayload.comoDeusSustentou = comoDeusSustentou;
                metadataPayload.dataFato = dataFato;
                if (!compiledContent) {
                    compiledContent = [
                        oQueAconteceu,
                        comoDeusSustentou ? `Como Deus sustentou: ${comoDeusSustentou}` : '',
                    ].filter(Boolean).join("\n\n");
                }
            } else if (selectedCategory === 'fasting') {
                metadataPayload.objetivo = objetivo;
                metadataPayload.dataInicio = dataInicio;
                metadataPayload.dataPrevista = dataPrevista;
                if (!compiledContent) {
                    compiledContent = objetivo;
                }
            }

            const parsedTags = tags
                .split(",")
                .map(t => t.trim())
                .filter(Boolean);

            await onSave({
                id: existingEntry?.id,
                type: selectedCategory,
                title: title.trim() || undefined,
                content: compiledContent || title.trim() || "Registro do Memorial",
                bookId,
                bookName,
                chapter,
                verse: includeReference ? verse : null,
                version,
                verseText: includeReference ? (verseText || undefined) : undefined,
                tags: parsedTags,
                metadata: metadataPayload,
            });

            onClose();
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
            role="dialog"
            aria-modal="true"
        >
            <div className="relative w-full max-w-lg my-auto rounded-2xl bg-app-surface border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-app-raised/40 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <span className={cn("inline-flex items-center px-3 py-1 rounded-full border text-[0.75rem] font-sans font-semibold", currentConfig.badgeClasses)}>
                            {currentConfig.label}
                        </span>
                        <div className="flex flex-col">
                            <span className="text-[0.82rem] font-mono text-gold font-medium">
                                {referenceText}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-app-raised text-app-text-muted hover:text-app-text transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
                    {/* Seletor de Categoria */}
                    <div className="flex rounded-xl bg-app-raised p-1 gap-1 border border-border/50">
                        {(['reflection', 'prayer', 'testimony', 'fasting'] as MemorialCategory[]).map(cat => {
                            const conf = categoryConfigs[cat];
                            const isActive = selectedCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cn(
                                        "flex-1 flex items-center justify-center py-1.5 px-2 rounded-lg text-[0.72rem] font-semibold transition-all text-center",
                                        isActive
                                            ? "bg-app-surface text-app-text shadow-sm border border-border/80 font-bold"
                                            : "text-app-text-muted hover:text-app-text"
                                    )}
                                >
                                    <span>{conf.label.split(' ')[0]}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Opção de desvincular apresentação de versículo/capítulo */}
                    <div className="flex items-center justify-between px-1 py-1 border-b border-border/40 pb-2">
                        <label className="flex items-center gap-2 cursor-pointer text-[0.75rem] text-app-text-muted hover:text-app-text transition-colors select-none">
                            <input
                                type="checkbox"
                                checked={includeReference}
                                onChange={e => setIncludeReference(e.target.checked)}
                                className="rounded border-border bg-app-surface text-gold focus:ring-gold/50 h-3.5 w-3.5 accent-gold"
                            />
                            <span>Vincular ao versículo/capítulo ({verse ? `${bookName} ${chapter}:${verse}` : `${bookName} ${chapter}`})</span>
                        </label>
                    </div>

                    {/* Título do Registro */}
                    <div>
                        <label className="block text-[0.75rem] font-sans text-app-text-muted uppercase tracking-wider mb-1">
                            Título do Registro
                        </label>
                        <input
                            ref={titleInputRef}
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder={
                                selectedCategory === 'prayer' ? "Ex: Oração pela saúde da família" :
                                selectedCategory === 'testimony' ? "Ex: Livramento no trânsito" :
                                selectedCategory === 'fasting' ? "Ex: Jejum de 7 dias por clareza" :
                                "Ex: Meditação no Salmo 23"
                            }
                            className="w-full rounded-xl border border-border bg-app-surface px-3.5 py-2 text-[0.85rem] text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/50"
                        />
                    </div>

                    {/* Formulário Dinâmico por Categoria */}
                    {selectedCategory === 'reflection' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[0.72rem] font-sans text-gold font-medium mb-1">
                                    S — Escritura (Palavra)
                                </label>
                                <textarea
                                    value={soapS}
                                    onChange={e => setSoapS(e.target.value)}
                                    placeholder="O trecho bíblico lido..."
                                    rows={2}
                                    className="w-full resize-none rounded-xl border border-border bg-app-surface px-3 py-2 text-[0.82rem] text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/40"
                                />
                            </div>
                            <div>
                                <label className="block text-[0.72rem] font-sans text-gold font-medium mb-1">
                                    O — Observação (O que Deus diz neste texto?)
                                </label>
                                <textarea
                                    value={soapO}
                                    onChange={e => setSoapO(e.target.value)}
                                    placeholder="O que chamou sua atenção no versículo..."
                                    rows={2}
                                    className="w-full resize-none rounded-xl border border-border bg-app-surface px-3 py-2 text-[0.82rem] text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/40"
                                />
                            </div>
                            <div>
                                <label className="block text-[0.72rem] font-sans text-gold font-medium mb-1">
                                    A — Aplicação (Como aplico isso hoje?)
                                </label>
                                <textarea
                                    value={soapA}
                                    onChange={e => setSoapA(e.target.value)}
                                    placeholder="Passos práticos na sua vida..."
                                    rows={2}
                                    className="w-full resize-none rounded-xl border border-border bg-app-surface px-3 py-2 text-[0.82rem] text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/40"
                                />
                            </div>
                            <div>
                                <label className="block text-[0.72rem] font-sans text-gold font-medium mb-1">
                                    P — Oração (Sua resposta a Deus)
                                </label>
                                <textarea
                                    value={soapP}
                                    onChange={e => setSoapP(e.target.value)}
                                    placeholder="Sua oração sobre este texto..."
                                    rows={2}
                                    className="w-full resize-none rounded-xl border border-border bg-app-surface px-3 py-2 text-[0.82rem] text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/40"
                                />
                            </div>
                        </div>
                    )}

                    {selectedCategory === 'prayer' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[0.72rem] font-sans text-gold font-medium mb-1">
                                    Motivo da Oração
                                </label>
                                <input
                                    type="text"
                                    value={motivo}
                                    onChange={e => setMotivo(e.target.value)}
                                    placeholder="Ex: Busca de sabedoria em decisão profissional"
                                    className="w-full rounded-xl border border-border bg-app-surface px-3.5 py-2 text-[0.82rem] text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/40"
                                />
                            </div>
                            <div>
                                <label className="block text-[0.72rem] font-sans text-gold font-medium mb-1">
                                    Seu Pedido Diante de Deus
                                </label>
                                <textarea
                                    value={pedido}
                                    onChange={e => setPedido(e.target.value)}
                                    placeholder="O que você está pedindo a Ele..."
                                    rows={3}
                                    className="w-full resize-none rounded-xl border border-border bg-app-surface px-3 py-2 text-[0.82rem] text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/40"
                                />
                            </div>
                            <div>
                                <label className="block text-[0.72rem] font-sans text-gold font-medium mb-1">
                                    Entrega / Surrender
                                </label>
                                <textarea
                                    value={entrega}
                                    onChange={e => setEntrega(e.target.value)}
                                    placeholder="Coloco nas Tuas mãos a minha ansiedade..."
                                    rows={2}
                                    className="w-full resize-none rounded-xl border border-border bg-app-surface px-3 py-2 text-[0.82rem] text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/40"
                                />
                            </div>
                        </div>
                    )}

                    {selectedCategory === 'testimony' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[0.72rem] font-sans text-gold font-medium mb-1">
                                    O que aconteceu?
                                </label>
                                <textarea
                                    value={oQueAconteceu}
                                    onChange={e => setOQueAconteceu(e.target.value)}
                                    placeholder="Relate a bênção ou feito de Deus..."
                                    rows={3}
                                    className="w-full resize-none rounded-xl border border-border bg-app-surface px-3 py-2 text-[0.82rem] text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/40"
                                />
                            </div>
                            <div>
                                <label className="block text-[0.72rem] font-sans text-gold font-medium mb-1">
                                    Como Deus sustentou essa caminhada?
                                </label>
                                <textarea
                                    value={comoDeusSustentou}
                                    onChange={e => setComoDeusSustentou(e.target.value)}
                                    placeholder="Sua percepção da presença dEle..."
                                    rows={2}
                                    className="w-full resize-none rounded-xl border border-border bg-app-surface px-3 py-2 text-[0.82rem] text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/40"
                                />
                            </div>
                            <div>
                                <label className="block text-[0.72rem] font-sans text-gold font-medium mb-1">
                                    Data do Acontecimento
                                </label>
                                <input
                                    type="date"
                                    value={dataFato}
                                    onChange={e => setDataFato(e.target.value)}
                                    className="rounded-xl border border-border bg-app-surface px-3 py-1.5 text-[0.82rem] text-app-text focus:outline-none focus:ring-1 focus:ring-gold/40"
                                />
                            </div>
                        </div>
                    )}

                    {selectedCategory === 'fasting' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[0.72rem] font-sans text-gold font-medium mb-1">
                                    Objetivo do Jejum / Propósito
                                </label>
                                <textarea
                                    value={objetivo}
                                    onChange={e => setObjetivo(e.target.value)}
                                    placeholder="Qual a intenção e consagração deste tempo..."
                                    rows={3}
                                    className="w-full resize-none rounded-xl border border-border bg-app-surface px-3 py-2 text-[0.82rem] text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/40"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[0.72rem] font-sans text-gold font-medium mb-1">
                                        Data de Início
                                    </label>
                                    <input
                                        type="date"
                                        value={dataInicio}
                                        onChange={e => setDataInicio(e.target.value)}
                                        className="w-full rounded-xl border border-border bg-app-surface px-3 py-1.5 text-[0.82rem] text-app-text focus:outline-none focus:ring-1 focus:ring-gold/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[0.72rem] font-sans text-gold font-medium mb-1">
                                        Data Prevista
                                    </label>
                                    <input
                                        type="date"
                                        value={dataPrevista}
                                        onChange={e => setDataPrevista(e.target.value)}
                                        className="w-full rounded-xl border border-border bg-app-surface px-3 py-1.5 text-[0.82rem] text-app-text focus:outline-none focus:ring-1 focus:ring-gold/40"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tags Opcionais */}
                    <div>
                        <label className="block text-[0.72rem] font-sans text-app-text-muted uppercase tracking-wider mb-1">
                            Tags / Palavras-chave (separadas por vírgula)
                        </label>
                        <input
                            type="text"
                            value={tags}
                            onChange={e => setTags(e.target.value)}
                            placeholder="Ex: paz, direção, cura, gratidão"
                            className="w-full rounded-xl border border-border bg-app-surface px-3.5 py-1.5 text-[0.82rem] text-app-text placeholder:text-app-text-muted/40 focus:outline-none focus:ring-1 focus:ring-gold/40"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/60">
                        {existingEntry && onDelete ? (
                            <button
                                type="button"
                                onClick={() => onDelete(existingEntry.id)}
                                className="flex items-center gap-1.5 text-[0.78rem] text-destructive hover:bg-destructive/10 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Excluir
                            </button>
                        ) : (
                            <span />
                        )}

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-3 py-1.5 text-[0.78rem] text-app-text-muted hover:text-app-text transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold font-sans font-medium text-[0.8rem] text-black hover:bg-gold/90 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                <Save className="h-3.5 w-3.5" />
                                <span>{isSubmitting ? "Guardando..." : "Guardar Memória"}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
