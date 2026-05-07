import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Upload, Copy, Check, Search, X, ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface R2Image {
    key: string;
    url: string;
    lastModified: string;
    size: number;
}

interface ImageLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ImageLibraryModal({ isOpen, onClose }: ImageLibraryModalProps) {
    const [images, setImages] = useState<R2Image[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (isOpen) {
            fetchImages();
        }
    }, [isOpen]);

    async function fetchImages() {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/r2-list-images", {
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setImages(data.images || []);
            }
        } catch (err) {
            console.error("Error fetching images:", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch("/api/r2-presigned-url", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ filename: file.name, contentType: file.type })
            });

            if (!response.ok) throw new Error("API failed");
            const { uploadUrl } = await response.json();

            const uploadRes = await fetch(uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file
            });

            if (uploadRes.ok) {
                fetchImages();
            }
        } catch (err) {
            console.error("Upload failed:", err);
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    }

    function copyToClipboard(url: string) {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
    }

    const filteredImages = images.filter(img =>
        img.key.toLowerCase().includes(search.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden">
            <div className="bg-app-surface border border-border w-full max-w-4xl h-[80vh] rounded-2xl flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2 text-app-text">
                        <ImageIcon className="h-5 w-5 text-gold" />
                        <h2 className="font-serif text-lg">Biblioteca de Mídia</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-app-bg rounded-lg text-app-text-muted transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-border flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-text-muted" />
                        <input
                            type="text"
                            placeholder="Buscar por nome..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-app-bg border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-app-text focus:outline-none focus:border-gold"
                        />
                    </div>
                    <div className="relative">
                        <input
                            type="file"
                            id="library-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                        <label
                            htmlFor="library-upload"
                            className={`inline-flex items-center gap-2 bg-gold text-app-bg px-4 py-2 rounded-xl text-sm font-medium hover:bg-gold/90 transition-colors cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            Novo Upload
                        </label>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-app-text-muted gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-gold" />
                            <p className="text-sm">Carregando sua biblioteca...</p>
                        </div>
                    ) : filteredImages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-app-text-muted gap-3">
                            <ImageIcon className="h-12 w-12 opacity-20" />
                            <p className="text-sm">Nenhuma imagem encontrada</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredImages.map((img) => (
                                <div key={img.key} className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-black/20">
                                    <img
                                        src={img.url}
                                        alt={img.key}
                                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => copyToClipboard(img.url)}
                                            className="p-2 bg-app-surface border border-border rounded-lg text-app-text hover:text-gold transition-colors"
                                            title="Copiar Link"
                                        >
                                            {copiedUrl === img.url ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                        <p className="text-[10px] text-white truncate opacity-70">{img.key.replace('articles/', '')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
