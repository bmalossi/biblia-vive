import { useRef, useState } from "react";
import { Download, Share2, Shuffle, X, Loader2, Facebook, Linkedin, Twitter, MessageCircle, Copy, Send, Pin, Instagram, Music } from "lucide-react";
import { toast } from "@/hooks/useToast";
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
    const [downloadingForShare, setDownloadingForShare] = useState<string | null>(null);

    const cardRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const renderTemplate = (withRef = false) => {
        const props = { data };
        if (withRef) {
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
            const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 2, skipFonts: false });
            const response = await fetch(dataUrl);
            return await response.blob();
        } catch (err) {
            console.error("Erro ao gerar imagem:", err);
            return null;
        }
    };

    const downloadImageForPlatform = async (platform: string) => {
        setDownloadingForShare(platform);
        try {
            const blob = await generateImageBlob();
            if (!blob) throw new Error("Falha ao gerar imagem");
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `biblia-vive-${data.bookName.toLowerCase()}-${data.chapter}-${data.verseNumber}.png`;
            a.click();
            URL.revokeObjectURL(url);
            toast({ message: `Imagem baixada! Agora poste no ${platform}.`, type: "success" });
        } catch {
            toast({ message: "Erro ao gerar imagem.", type: "error" });
        } finally {
            setDownloadingForShare(null);
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
        navigator.clipboard.writeText(text)
            .then(() => toast({ message: "Texto copiado com sucesso!", type: "success" }))
            .catch(() => toast({ message: "Erro ao copiar texto", type: "error" }));
    };

    const copyImageToClipboard = async () => {
        try {
            const blob = await generateImageBlob();
            if (!blob) throw new Error("Falha ao gerar imagem");
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            toast({ message: "Imagem copiada para a área de transferência!", type: "success" });
            return true;
        } catch (err) {
            console.error("Erro ao copiar imagem:", err);
            toast({ message: "Não foi possível copiar a imagem automaticamente. Tente baixar o arquivo.", type: "error" });
            return false;
        }
    };

    const shareImageOnSocial = async (platform: 'whatsapp' | 'facebook' | 'twitter' | 'linkedin' | 'telegram' | 'instagram') => {
        setSharing(true);
        try {
            const blob = await generateImageBlob();
            if (!blob) throw new Error("Falha ao gerar imagem");

            // No Instagram Mobile, tentamos navigator.share se disponível
            if (platform === 'instagram') {
                const fileName = `biblia-vive-${data.bookName.toLowerCase()}-${data.chapter}-${data.verseNumber}.png`;
                const file = new File([blob], fileName, { type: 'image/png' });
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

                if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'Bíblia Vive',
                        text: `"${data.verseText}" - ${data.bookName} ${data.chapter}:${data.verseNumber}`
                    });
                    return;
                }
            }

            // Para os outros ou Fallback do Instagram: Copia e abre link
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                toast({ message: "Imagem copiada! Agora use Ctrl+V para colar.", type: "success" });
            } catch (copyErr) {
                console.error("Erro ao copiar imagem:", copyErr);
                toast({ message: "Não foi possível copiar a imagem automaticamente. O link será aberto.", type: "error" });
            }

            const text = `"${data.verseText}" - ${data.bookName} ${data.chapter}:${data.verseNumber} | Bíblia Vive`;
            const url = window.location.origin;
            const urls = {
                whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
                facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
                twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
                linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
                telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
                instagram: `https://www.instagram.com/`,
            };

            window.open(urls[platform], '_blank', 'width=600,height=400');
        } catch (err) {
            console.error("Erro ao compartilhar:", err);
            toast({ message: "Erro ao preparar compartilhamento.", type: "error" });
        } finally {
            setSharing(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            role="dialog"
            aria-modal="true"
            aria-label="Gerador de Card do Versículo"
        >
            <div className="relative w-full max-w-2xl max-h-[95dvh] overflow-y-auto custom-scrollbar rounded-2xl bg-app-surface border border-border shadow-2xl">
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

                    {/* Preview */}
                    <div className="flex justify-center bg-app-raised/40 rounded-xl p-6 overflow-hidden">
                        <div
                            style={{
                                transform: "scale(0.72)",
                                transformOrigin: "top center",
                                marginBottom: selected === "story" ? "-180px" : "-150px",
                            }}
                        >
                            {renderTemplate(true)}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-4" style={{ marginTop: "1.5rem" }}>
                        {/* Primary: Share image + Download */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button
                                        disabled={sharing || downloading}
                                        className="flex-1 flex items-center justify-center gap-2 rounded-full bg-app-text px-6 py-3 font-sans text-sm font-medium text-app-surface transition-opacity hover:opacity-90 disabled:opacity-50"
                                    >
                                        {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                                        {sharing ? "Preparando..." : "Compartilhar Imagem"}
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-app-bg border-border text-app-text sm:max-w-md w-[95vw] rounded-2xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Compartilhar nas Redes?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-app-text-muted">
                                            A imagem foi gerada e copiada para sua área de transferência. Selecione a rede social abaixo e use <strong>Ctrl+V</strong> para colá-la.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>

                                    <div className="flex flex-wrap gap-2 py-4 justify-center">
                                        <button onClick={() => shareImageOnSocial('whatsapp')}
                                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors border border-[#25D366]/20 text-xs font-medium">
                                            <MessageCircle className="h-4 w-4" /> WhatsApp
                                        </button>
                                        <button onClick={() => shareImageOnSocial('facebook')}
                                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 transition-colors border border-[#1877F2]/20 text-xs font-medium">
                                            <Facebook className="h-4 w-4" /> Facebook
                                        </button>
                                        <button onClick={() => shareImageOnSocial('twitter')}
                                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-black/5 text-app-text hover:bg-black/10 transition-colors border border-border text-xs font-medium">
                                            <Twitter className="h-4 w-4" /> Twitter/X
                                        </button>
                                        <button onClick={() => shareImageOnSocial('telegram')}
                                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#26A5E4]/10 text-[#26A5E4] hover:bg-[#26A5E4]/20 transition-colors border border-[#26A5E4]/20 text-xs font-medium">
                                            <Send className="h-4 w-4" /> Telegram
                                        </button>
                                        <button onClick={() => shareImageOnSocial('instagram')}
                                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#f9ce34]/10 via-[#ee2a7b]/10 to-[#6228d7]/10 text-[#ee2a7b] hover:opacity-80 transition-all border border-[#ee2a7b]/20 text-xs font-medium">
                                            <Instagram className="h-4 w-4" /> Instagram
                                        </button>
                                    </div>

                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="border-border text-app-text hover:bg-app-surface rounded-lg w-full">Voltar</AlertDialogCancel>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <button
                                disabled={sharing || downloading}
                                onClick={handleDownload}
                                className="flex-1 flex items-center justify-center gap-2 rounded-full border border-border bg-transparent px-6 py-3 font-sans text-sm font-medium text-app-text transition-colors hover:bg-app-raised disabled:opacity-50"
                            >
                                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                {downloading ? "Baixando..." : "Baixar PNG"}
                            </button>
                        </div>

                        {/* Copy Text */}
                        <button
                            onClick={handleCopyText}
                            className="w-full flex items-center justify-center gap-2 rounded-full border border-border bg-transparent px-6 py-2.5 font-sans text-sm font-medium text-app-text transition-colors hover:bg-app-raised"
                        >
                            <Copy className="h-4 w-4" />
                            Copiar Texto
                        </button>

                        {/* Social share: text-based - HIDDEN ON DESKTOP */}
                        <div className="border-t border-border/50 pt-4 block sm:hidden">
                            <p className="text-[0.65rem] font-mono uppercase tracking-widest text-app-text-muted mb-3">Compartilhar texto nas redes</p>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => shareImageOnSocial('whatsapp')}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors border border-[#25D366]/20 text-[0.72rem] font-medium">
                                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                                </button>
                                <button onClick={() => shareImageOnSocial('facebook')}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 transition-colors border border-[#1877F2]/20 text-[0.72rem] font-medium">
                                    <Facebook className="h-3.5 w-3.5" /> Facebook
                                </button>
                                <button onClick={() => shareImageOnSocial('twitter')}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/5 text-app-text hover:bg-black/10 transition-colors border border-border text-[0.72rem] font-medium">
                                    <Twitter className="h-3.5 w-3.5" /> Twitter/X
                                </button>
                                <button onClick={() => shareImageOnSocial('telegram')}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#26A5E4]/10 text-[#26A5E4] hover:bg-[#26A5E4]/20 transition-colors border border-[#26A5E4]/20 text-[0.72rem] font-medium">
                                    <Send className="h-3.5 w-3.5" /> Telegram
                                </button>
                                <button onClick={() => shareImageOnSocial('linkedin')}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0077B5]/10 text-[#0077B5] hover:bg-[#0077B5]/20 transition-colors border border-[#0077B5]/20 text-[0.72rem] font-medium">
                                    <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                                </button>
                            </div>
                        </div>

                        {/* Image-based platforms: download then post - HIDDEN ON DESKTOP (Moved to sub-modal or instructions) */}
                        <div className="border-t border-border/50 pt-4 block sm:hidden">
                            <p className="text-[0.65rem] font-mono uppercase tracking-widest text-app-text-muted mb-1">Baixar imagem e postar em</p>
                            <p className="text-[0.62rem] text-app-text-muted/60 mb-3">Estas redes não permitem envio automático — baixe a imagem e anexe na postagem.</p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => downloadImageForPlatform('Instagram')}
                                    disabled={downloadingForShare === 'Instagram'}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-[#f9ce34]/10 via-[#ee2a7b]/10 to-[#6228d7]/10 text-[#ee2a7b] hover:opacity-80 transition-all border border-[#ee2a7b]/20 text-[0.72rem] font-medium disabled:opacity-50"
                                >
                                    {downloadingForShare === 'Instagram' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Instagram className="h-3.5 w-3.5" />}
                                    Instagram
                                </button>
                                <button
                                    onClick={() => downloadImageForPlatform('TikTok')}
                                    disabled={downloadingForShare === 'TikTok'}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/5 text-app-text hover:bg-black/10 transition-colors border border-border text-[0.72rem] font-medium disabled:opacity-50"
                                >
                                    {downloadingForShare === 'TikTok' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Music className="h-3.5 w-3.5" />}
                                    TikTok
                                </button>
                                <button
                                    onClick={() => downloadImageForPlatform('Pinterest')}
                                    disabled={downloadingForShare === 'Pinterest'}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#e60023]/10 text-[#e60023] hover:bg-[#e60023]/20 transition-colors border border-[#e60023]/20 text-[0.72rem] font-medium disabled:opacity-50"
                                >
                                    {downloadingForShare === 'Pinterest' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pin className="h-3.5 w-3.5" />}
                                    Pinterest
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
