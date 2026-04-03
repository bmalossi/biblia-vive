import { useState, useRef } from "react";
import Layout from "@/components/Layout";
import { toast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { X, Facebook, Linkedin, Twitter, MessageCircle, Copy, Flame, BookOpen, Download, Loader2, Image, BarChart3, Map, Share2 } from "lucide-react";
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
import { useReadingPlan } from "@/hooks/useReadingPlan";
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
import { toPng } from "html-to-image";
import { Link } from "react-router-dom";
import { getVersion } from "@/lib/themes";

type Tab = "cards" | "stats" | "progresso";

export default function SharePage() {
    const [activeTab, setActiveTab] = useState<Tab>("cards");
    const { activePlan, progress, streak, progressPct } = useReadingPlan();
    const version = getVersion();

    const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("pergaminho");
    const [cardData, setCardData] = useState<CardData>({
        verseNumber: 1,
        verseText: "A tua palavra é lâmpada que ilumina o meu caminho e luz que clareia o meu andar.",
        bookName: "Salmos",
        chapter: 119,
        version,
    });
    const [downloading, setDownloading] = useState(false);
    const [sharing, setSharing] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    // Returns the correct template at full size
    const renderTemplate = (withRef = false) => {
        const props = { data: cardData };
        if (withRef) {
            return (
                <div ref={cardRef} style={{ display: "inline-block" }}>
                    {selectedTemplate === "pergaminho" && <TemplatePergaminho {...props} />}
                    {selectedTemplate === "minimalista" && <TemplateMinimalista {...props} />}
                    {selectedTemplate === "story" && <TemplateStory {...props} />}
                    {selectedTemplate === "banner" && <TemplateBanner {...props} />}
                    {selectedTemplate === "editorial" && <TemplateEditorial {...props} />}
                </div>
            );
        }
        if (selectedTemplate === "pergaminho") return <TemplatePergaminho {...props} />;
        if (selectedTemplate === "minimalista") return <TemplateMinimalista {...props} />;
        if (selectedTemplate === "story") return <TemplateStory {...props} />;
        if (selectedTemplate === "banner") return <TemplateBanner {...props} />;
        return <TemplateEditorial {...props} />;
    };

    const generateImageBlob = async (): Promise<Blob | null> => {
        if (!cardRef.current) return null;
        try {
            const dataUrl = await toPng(cardRef.current, {
                quality: 1,
                pixelRatio: 2,
                skipFonts: false
            });
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

            const fileName = `biblia-viva-${cardData.bookName.toLowerCase()}-${cardData.chapter}-${cardData.verseNumber}.png`;
            const file = new File([blob], fileName, { type: "image/png" });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: "Bíblia Vive",
                    text: `"${cardData.verseText}" - ${cardData.bookName} ${cardData.chapter}:${cardData.verseNumber}`,
                    files: [file],
                });
            } else {
                handleDownload(); // fallback
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
            a.download = `biblia-viva-${cardData.bookName.toLowerCase()}-${cardData.chapter}-${cardData.verseNumber}.png`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Erro ao baixar:", err);
        } finally {
            setDownloading(false);
        }
    };

    const handleCopyLink = () => {
        const url = window.location.origin;
        navigator.clipboard.writeText(url).then(() => {
            toast({ message: "Link copiado com sucesso!", type: "success" });
        }).catch(() => {
            toast({ message: "Erro ao copiar link", type: "error" });
        });
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

    const shareOnSocial = (platform: 'whatsapp' | 'facebook' | 'twitter' | 'linkedin') => {
        const text = `"${cardData.verseText}" - ${cardData.bookName} ${cardData.chapter}:${cardData.verseNumber}`;
        const url = window.location.origin;

        const urls = {
            whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        };

        window.open(urls[platform], '_blank', 'width=600,height=400');
    };

    return (
        <Layout>
            <div className="mx-auto max-w-3xl pt-4 pb-16">

                {/* OFF-SCREEN full-size render for html-to-image capture */}
                <div
                    style={{
                        position: "fixed",
                        left: "-9999px",
                        top: 0,
                        pointerEvents: "none",
                        zIndex: -1,
                    }}
                    aria-hidden="true"
                >
                    {renderTemplate(true)}
                </div>

                <div className="mb-8">
                    <h1 className="font-serif text-3xl font-bold text-app-text mb-2">Compartilhar</h1>
                    <p className="text-app-text-muted text-sm">Gere cards de versículos, acompanhe seu progresso e estatísticas de leitura.</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b border-border mb-8">
                    {(["cards", "stats", "progresso"] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === tab
                                ? "border-gold text-gold"
                                : "border-transparent text-app-text-muted hover:text-app-text"
                                }`}
                        >
                            {tab === "cards" && <Image className="h-4 w-4" />}
                            {tab === "stats" && <BarChart3 className="h-4 w-4" />}
                            {tab === "progresso" && <Map className="h-4 w-4" />}
                            {tab === "cards" ? "Cards" : tab === "stats" ? "Estatísticas" : "Progresso"}
                        </button>
                    ))}
                </div>

                {/* Tab content wrapper */}
                <div className="space-y-8">
                    {/* ── TAB 1: CARDS ── */}
                    {activeTab === "cards" && (
                        <div className="space-y-6">
                            {/* Text input */}
                            <div className="rounded-2xl border border-border bg-app-surface p-6 space-y-4">
                                <h3 className="font-serif text-lg font-medium text-app-text">Versículo</h3>
                                <textarea
                                    value={cardData.verseText}
                                    onChange={(e) => setCardData(d => ({ ...d, verseText: e.target.value }))}
                                    className="w-full rounded-xl border border-border bg-app-raised p-4 text-sm font-serif italic text-app-text resize-none focus:outline-none focus:border-gold transition-colors"
                                    rows={3}
                                    placeholder="Cole ou digite o texto do versículo..."
                                />
                                <div className="grid grid-cols-4 gap-2 sm:flex sm:gap-3">
                                    <input
                                        value={cardData.bookName}
                                        onChange={(e) => setCardData(d => ({ ...d, bookName: e.target.value }))}
                                        className="col-span-2 sm:flex-1 rounded-xl border border-border bg-app-raised px-4 py-2 text-sm text-app-text focus:outline-none focus:border-gold transition-colors"
                                        placeholder="Livro"
                                    />
                                    <input
                                        type="number"
                                        value={cardData.chapter}
                                        onChange={(e) => setCardData(d => ({ ...d, chapter: +e.target.value }))}
                                        className="col-span-1 sm:w-24 rounded-xl border border-border bg-app-raised px-4 py-2 text-sm text-app-text focus:outline-none focus:border-gold transition-colors"
                                        placeholder="Cap."
                                    />
                                    <input
                                        type="number"
                                        value={cardData.verseNumber}
                                        onChange={(e) => setCardData(d => ({ ...d, verseNumber: +e.target.value }))}
                                        className="col-span-1 sm:w-24 rounded-xl border border-border bg-app-raised px-4 py-2 text-sm text-app-text focus:outline-none focus:border-gold transition-colors"
                                        placeholder="Vers."
                                    />
                                </div>
                            </div>

                            {/* Template picker */}
                            <div>
                                <p className="text-xs font-mono uppercase tracking-widest text-app-text-muted mb-3">Template</p>
                                <div className="flex gap-2 flex-wrap">
                                    {TEMPLATES.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setSelectedTemplate(t.id)}
                                            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${selectedTemplate === t.id
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
                            <div className="flex justify-center bg-app-raised/30 rounded-2xl p-8 overflow-hidden">
                                <div
                                    style={{
                                        transform: "scale(0.7)",
                                        transformOrigin: "top center",
                                        marginBottom: selectedTemplate === "story" ? "-190px" : "-160px"
                                    }}
                                >
                                    {renderTemplate(false)}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <button
                                                disabled={sharing || downloading}
                                                className="flex-1 flex items-center justify-center gap-2 rounded-full bg-app-text px-6 py-3.5 font-sans text-sm font-medium text-app-surface transition-opacity hover:opacity-90 disabled:opacity-50"
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
                                                <button onClick={async () => { await copyImageToClipboard(); shareOnSocial('whatsapp'); }}
                                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors border border-[#25D366]/20 text-xs font-medium">
                                                    <MessageCircle className="h-4 w-4" /> WhatsApp
                                                </button>
                                                <button onClick={async () => { await copyImageToClipboard(); shareOnSocial('facebook'); }}
                                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 transition-colors border border-[#1877F2]/20 text-xs font-medium">
                                                    <Facebook className="h-4 w-4" /> Facebook
                                                </button>
                                                <button onClick={async () => { await copyImageToClipboard(); shareOnSocial('twitter'); }}
                                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-black/5 text-app-text hover:bg-black/10 transition-colors border border-border text-xs font-medium">
                                                    <Twitter className="h-4 w-4" /> Twitter/X
                                                </button>
                                                <button onClick={async () => { await copyImageToClipboard(); shareOnSocial('linkedin'); }}
                                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0077B5]/10 text-[#0077B5] hover:bg-[#0077B5]/20 transition-colors border border-[#0077B5]/20 text-xs font-medium">
                                                    <Linkedin className="h-4 w-4" /> LinkedIn
                                                </button>
                                            </div>

                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="border-border text-app-text hover:bg-app-surface rounded-lg w-full">Voltar</AlertDialogCancel>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <button
                                                disabled={sharing || downloading}
                                                className="flex-1 flex items-center justify-center gap-2 rounded-full border border-border bg-transparent px-6 py-3.5 font-sans text-sm font-medium text-app-text transition-colors hover:bg-app-raised disabled:opacity-50"
                                            >
                                                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                                {downloading ? "Gerando PNG..." : "Baixar PNG HD"}
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
                                </div>

                                {/* Desktop Social Share Icons - HIDDEN ON DESKTOP (Moved to sub-modal) */}
                                <div className="pt-2 border-t border-border/50 block sm:hidden">
                                    <p className="text-xs font-mono uppercase tracking-widest text-app-text-muted mb-4">Compartilhar texto nas redes</p>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => shareOnSocial('whatsapp')}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors border border-[#25D366]/20 text-xs font-medium"
                                        >
                                            <MessageCircle className="h-4 w-4" /> WhatsApp
                                        </button>
                                        <button
                                            onClick={() => shareOnSocial('facebook')}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 transition-colors border border-[#1877F2]/20 text-xs font-medium"
                                        >
                                            <Facebook className="h-4 w-4" /> Facebook
                                        </button>
                                        <button
                                            onClick={() => shareOnSocial('twitter')}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/5 text-app-text hover:bg-black/10 transition-colors border border-border text-xs font-medium"
                                        >
                                            <Twitter className="h-4 w-4" /> Twitter / X
                                        </button>
                                        <button
                                            onClick={() => shareOnSocial('linkedin')}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0077B5]/10 text-[#0077B5] hover:bg-[#0077B5]/20 transition-colors border border-[#0077B5]/20 text-xs font-medium"
                                        >
                                            <Linkedin className="h-4 w-4" /> LinkedIn
                                        </button>
                                        <button
                                            onClick={handleCopyLink}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-app-raised text-app-text hover:bg-border transition-colors border border-border text-xs font-medium"
                                        >
                                            <Copy className="h-4 w-4" /> Link
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── TAB 2: STATS ── */}
                    {activeTab === "stats" && (
                        <div className="space-y-4">
                            {activePlan ? (
                                <>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        <div className="rounded-2xl border border-border bg-app-surface p-6 text-center">
                                            <Flame className="mx-auto mb-2 h-6 w-6 text-orange-500" />
                                            <p className="text-3xl font-bold text-app-text">{streak}</p>
                                            <p className="text-xs text-app-text-muted mt-1">Dias de leitura</p>
                                        </div>
                                        <div className="rounded-2xl border border-border bg-app-surface p-6 text-center">
                                            <BookOpen className="mx-auto mb-2 h-6 w-6 text-gold" />
                                            <p className="text-3xl font-bold text-app-text">{progressPct}%</p>
                                            <p className="text-xs text-app-text-muted mt-1">Plano concluído</p>
                                        </div>
                                        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-border bg-app-surface p-6 text-center">
                                            <p className="text-2xl font-bold text-app-text font-serif">{activePlan?.totalDays}</p>
                                            <p className="text-xs text-app-text-muted mt-1">Total de dias no plano</p>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-border bg-app-surface p-6">
                                        <h3 className="font-serif text-lg font-medium text-app-text mb-2">{activePlan.name}</h3>
                                        <p className="text-sm text-app-text-muted mb-4">{activePlan.description}</p>
                                        <div className="w-full bg-app-raised rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full bg-gold transition-all duration-700"
                                                style={{ width: `${progressPct}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-app-text-muted mt-2 text-right">{progress?.completedDays.length || 0} de {activePlan.totalDays} dias</p>
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                                    <BookOpen className="mx-auto mb-4 h-10 w-10 text-app-text-muted/30" />
                                    <h3 className="font-serif text-xl text-app-text mb-2">Nenhum plano ativo</h3>
                                    <p className="text-sm text-app-text-muted mb-6">Inicie um plano de leitura para ver suas estatísticas aqui.</p>
                                    <Link to="/planos" className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-white hover:opacity-90">
                                        Ver Planos
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── TAB 3: PROGRESSO ── */}
                    {activeTab === "progresso" && (
                        <div className="space-y-4">
                            {activePlan ? (
                                <div className="space-y-3">
                                    <div className="rounded-2xl border border-gold/30 bg-gold-bg/20 p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <p className="text-xs font-mono uppercase tracking-wider text-gold/80">Plano em andamento</p>
                                                <h3 className="font-serif text-xl font-medium text-app-text">{activePlan.name}</h3>
                                            </div>
                                            <span className="text-3xl font-bold text-app-text">{progressPct}%</span>
                                        </div>
                                        <div className="w-full bg-app-raised rounded-full h-3">
                                            <div className="h-3 rounded-full bg-gold transition-all duration-700" style={{ width: `${progressPct}%` }} />
                                        </div>
                                        <div className="flex justify-between text-xs text-app-text-muted mt-2">
                                            <span>{progress?.completedDays.length || 0} dias concluídos</span>
                                            <span>{activePlan.totalDays - (progress?.completedDays.length || 0)} restantes</span>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-border bg-app-surface p-5">
                                        <p className="text-xs font-mono uppercase tracking-wider text-app-text-muted mb-3">Dias concluídos</p>
                                        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                                            {Array.from({ length: activePlan.totalDays }).map((_, i) => {
                                                const day = i + 1;
                                                const done = progress?.completedDays.includes(day);
                                                return (
                                                    <div
                                                        key={day}
                                                        title={`Dia ${day}`}
                                                        className={`h-6 w-6 rounded text-[10px] flex items-center justify-center font-mono transition-colors ${done ? "bg-gold text-white" : "bg-app-raised text-app-text-muted"
                                                            }`}
                                                    >
                                                        {day}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-border p-12 text-center">
                                    <Map className="mx-auto mb-4 h-10 w-10 text-app-text-muted/30" />
                                    <h3 className="font-serif text-xl text-app-text mb-2">Nenhum plano ativo</h3>
                                    <p className="text-sm text-app-text-muted mb-6">Inicie um plano para ver o mapa de progresso.</p>
                                    <Link to="/planos" className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-white hover:opacity-90">
                                        Ver Planos
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

