import { useRef, useState } from "react";
import { Download, Share2, Shuffle, X, Loader2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toPng } from "html-to-image";
import {
    TemplatePergaminho,
    TemplateMinimalista,
    TemplateStory,
    TemplateBanner,
    TemplateEditorial,
    TEMPLATES,
    type TemplateId,
    type CardData,
} from "@/components/VerseCardTemplates";

interface VerseCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: CardData;
}

export default function VerseCardModal({ isOpen, onClose, data }: VerseCardModalProps) {
    const [selected, setSelected] = useState<TemplateId>("pergaminho");
    const [downloading, setDownloading] = useState(false);

    const [sharing, setSharing] = useState(false);

    // The ref lives on the INNER card div (no transform applied to it).
    // The parent div has the scale transform for visual preview.
    // html-to-image captures the ref element at its NATURAL (full) size.
    const cardRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    /**
     * Returns the selected template node (no ref — purely visual).
     * Used inside the scaled preview wrapper.
     */
    const renderTemplate = (withRef = false) => {
        const props = { data };
        if (withRef) {
            // Wrap in a div to hold the ref; the template itself stays unmodified
            return (
                <div ref={cardRef} style={{ display: "inline-block" }}>
                    {selected === "pergaminho" && <TemplatePergaminho {...props} />}
                    {selected === "minimalista" && <TemplateMinimalista {...props} />}
                    {selected === "story" && <TemplateStory {...props} />}
                    {selected === "banner" && <TemplateBanner {...props} />}
                    {selected === "editorial" && <TemplateEditorial {...props} />}
                </div>
            );
        }
        if (selected === "pergaminho") return <TemplatePergaminho {...props} />;
        if (selected === "minimalista") return <TemplateMinimalista {...props} />;
        if (selected === "story") return <TemplateStory {...props} />;
        if (selected === "banner") return <TemplateBanner {...props} />;
        return <TemplateEditorial {...props} />;
    };

    const generateImageBlob = async (): Promise<Blob | null> => {
        if (!cardRef.current) return null;
        try {
            const dataUrl = await toPng(cardRef.current, {
                quality: 1,
                pixelRatio: 2,
                skipFonts: false,
            });
            // Convert DataURI to Blob
            const response = await fetch(dataUrl);
            return await response.blob();
        } catch (err) {
            console.error("Erro ao gerar imagem:", err);
            return null;
        }
    };

    const handleShare = async () => {
        setSharing(true);
        try {
            const blob = await generateImageBlob();
            if (!blob) throw new Error("Falha ao gerar blob da imagem");

            const fileName = `biblia-viva-${data.bookName.toLowerCase()}-${data.chapter}-${data.verseNumber}.png`;
            const file = new File([blob], fileName, { type: "image/png" });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: "Bíblia Vive",
                    text: `"${data.verseText}" - ${data.bookName} ${data.chapter}:${data.verseNumber}`,
                    files: [file],
                });
            } else {
                // Fallback for browsers that don't support file sharing 
                // We'll just trigger the download instead
                handleDownload();
            }
        } catch (err) {
            console.error("Erro ao compartilhar:", err);
        } finally {
            setSharing(false);
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const blob = await generateImageBlob();
            if (!blob) return;

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `biblia-viva-${data.bookName.toLowerCase()}-${data.chapter}-${data.verseNumber}.png`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Erro ao baixar:", err);
        } finally {
            setDownloading(false);
        }
    };

    const handleCopyText = () => {
        const text = `"${data.verseText}"\n— ${data.bookName} ${data.chapter}:${data.verseNumber} (${data.version.toUpperCase()}) | Bíblia Vive`;
        navigator.clipboard.writeText(text).catch(() => { });
    };

    return (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            role="dialog"
            aria-modal="true"
            aria-label="Gerador de Card do Versículo"
        >
            <div className="relative w-full max-w-2xl max-h-[95dvh] overflow-y-auto rounded-2xl bg-app-surface border border-border shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-app-surface px-6 py-4">
                    <div>
                        <h2 className="font-serif text-lg font-medium text-app-text">Gerar Card do Versículo</h2>
                        <p className="text-xs text-app-text-muted font-mono tracking-wider">
                            {data.bookName} {data.chapter}:{data.verseNumber} · {data.version.toUpperCase()}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-app-text-muted hover:bg-app-raised hover:text-app-text transition-colors"
                        aria-label="Fechar"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Template picker */}
                    <div>
                        <p className="text-xs font-mono uppercase tracking-widest text-app-text-muted mb-3">Escolha o template</p>
                        <div className="flex gap-2 flex-wrap">
                            {TEMPLATES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelected(t.id)}
                                    className={`rounded-full border px-4 py-1.5 text-xs font-medium font-sans transition-all ${selected === t.id
                                        ? "border-gold bg-gold-bg text-gold"
                                        : "border-border text-app-text-muted hover:border-gold/40 hover:text-app-text"
                                        }`}
                                >
                                    {t.label}
                                    <span className="ml-1.5 text-[10px] opacity-60">{t.format}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/*
                        Preview area.
                        The OUTER wrapper applies scale(0.72) for visual compression.
                        The INNER div (via renderTemplate(true)) holds cardRef and has NO transform.
                        html-to-image will capture cardRef at its natural (full) pixel dimensions.
                        This is the key trick: transform on PARENT = visual only; 
                        the child element is captured at its real size.
                    */}
                    <div className="flex justify-center bg-app-raised/40 rounded-xl p-6 overflow-hidden">
                        <div
                            style={{
                                transform: "scale(0.72)",
                                transformOrigin: "top center",
                                // Collapse the space the full-size card would normally occupy
                                // (scale doesn't shrink layout box, so we do it manually)
                                marginBottom: selected === "story" ? "-180px" : "-150px",
                            }}
                        >
                            {renderTemplate(true)}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3" style={{ marginTop: "1.5rem" }}>

                        {/* Native Share / Apps */}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button
                                    disabled={sharing || downloading}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-full bg-app-text px-6 py-3 font-sans text-sm font-medium text-app-surface transition-opacity hover:opacity-90 disabled:opacity-50"
                                >
                                    {sharing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Share2 className="h-4 w-4" />
                                    )}
                                    {sharing ? "Preparando..." : "Compartilhar..."}
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-app-bg border-border text-app-text sm:max-w-md w-[95vw] rounded-2xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Compartilhar Imagem?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-app-text-muted">
                                        Deseja gerar a imagem do versículo para compartilhamento externo?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="mt-4">
                                    <AlertDialogCancel className="border-border text-app-text hover:bg-app-surface rounded-lg">Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleShare}
                                        className="bg-app-text text-app-bg hover:opacity-90 rounded-lg"
                                    >
                                        Compartilhar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button
                                    disabled={sharing || downloading}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-full border border-border bg-transparent px-6 py-3 font-sans text-sm font-medium text-app-text transition-colors hover:bg-app-raised disabled:opacity-50"
                                >
                                    {downloading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="h-4 w-4" />
                                    )}
                                    {downloading ? "Baixando..." : "Baixar PNG"}
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-app-bg border-border text-app-text sm:max-w-md w-[95vw] rounded-2xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Baixar Imagem?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-app-text-muted">
                                        Isso irá gerar e baixar este design como uma imagem PNG de alta resolução. Deseja iniciar o download?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="mt-4">
                                    <AlertDialogCancel className="border-border text-app-text hover:bg-app-surface rounded-lg">Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDownload}
                                        className="bg-gold text-app-bg hover:bg-gold/90 rounded-lg"
                                    >
                                        Baixar Imagem
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <button
                            onClick={handleCopyText}
                            className="flex-1 flex items-center justify-center gap-2 rounded-full border border-border bg-transparent px-6 py-3 font-sans text-sm font-medium text-app-text transition-colors hover:bg-app-raised disabled:opacity-50"
                        >
                            Copiar Texto
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
