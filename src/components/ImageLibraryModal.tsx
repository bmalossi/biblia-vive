import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Upload, Copy, Check, Search, X, ImageIcon, AlertCircle, RefreshCw } from "lucide-react";

const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || "";
const MANIFEST_URL = `${R2_PUBLIC_URL}/r2-media-index.json`;

console.log("[ImageLibrary] R2_PUBLIC_URL:", R2_PUBLIC_URL);
console.log("[ImageLibrary] MANIFEST_URL:", MANIFEST_URL);

interface ManifestImage {
    key: string;
    url: string;
    filename: string;
    uploadedAt: string;
}

interface ImageLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ImageLibraryModal({ isOpen, onClose }: ImageLibraryModalProps) {
    const [images, setImages] = useState<ManifestImage[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) fetchImages();
    }, [isOpen]);

    async function fetchImages() {
        setLoading(true);
        setFetchError(null);

        if (!R2_PUBLIC_URL) {
            setFetchError("Variável VITE_R2_PUBLIC_URL não configurada na Vercel. Adicione https://midia.bibliavive.com.br nas env vars.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${MANIFEST_URL}?t=${Date.now()}`, {
                cache: "no-store",
            });
            if (res.status === 404) {
                setImages([]);
                return;
            }
            if (!res.ok) throw new Error(`Erro ao carregar índice de imagens: HTTP ${res.status}`);
            const data = await res.json();
            const sorted = (data.images || []).sort(
                (a: ManifestImage, b: ManifestImage) =>
                    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
            );
            setImages(sorted);
        } catch (err: any) {
            const msg = err.message || "Erro ao carregar biblioteca.";
            setFetchError(msg);
            console.error("[ImageLibrary] Fetch error:", {
                name: err.name,
                message: err.message,
                url: MANIFEST_URL,
            });
        } finally {
            setLoading(false);
        }
    }

    async function updateManifest(manifestUploadUrl: string, newImage: ManifestImage) {
        const currentImages = images;
        const updated = { images: [newImage, ...currentImages] };
        await fetch(manifestUploadUrl, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated),
        });
        setImages(updated.images);
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session?.access_token}`
            };

            // Step 1: Get presigned URL for the image
            const imgRes = await fetch("/api/r2-presigned-url", {
                method: "POST",
                headers,
                body: JSON.stringify({ filename: file.name, contentType: file.type })
            });

            if (!imgRes.ok) {
                const text = await imgRes.text();
                // If it's the Vercel 504 page or a plain error, it might start with "An error" or reach the timeout
                if (text.includes("An error") || imgRes.status === 504) {
                    throw new Error("Erro de rede (504): A conexão com o servidor expirou. Tente novamente.");
                }
                try {
                    const err = JSON.parse(text);
                    throw new Error(err.error || "Falha ao gerar URL de upload");
                } catch {
                    throw new Error(`Falha na API (${imgRes.status}): ${text.slice(0, 50)}`);
                }
            }
            const { uploadUrl, finalUrl, key } = await imgRes.json();

            // Step 2: Upload the image to R2
            const uploadRes = await fetch(uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file
            });
            if (!uploadRes.ok) throw new Error("Erro ao enviar imagem para o Cloudflare");

            // Step 3: Get presigned URL for the manifest index
            const manifestRes = await fetch("/api/r2-presigned-url", {
                method: "POST",
                headers,
                body: JSON.stringify({ filename: "r2-media-index.json", contentType: "application/json", manifestOnly: true })
            });

            if (manifestRes.ok) {
                const { uploadUrl: manifestUploadUrl } = await manifestRes.json();
                // Step 4: Update the manifest
                const newEntry: ManifestImage = {
                    key,
                    url: finalUrl,
                    filename: file.name,
                    uploadedAt: new Date().toISOString(),
                };
                await updateManifest(manifestUploadUrl, newEntry);
            }
        } catch (err: any) {
            setUploadError(err.message);
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
        img.filename.toLowerCase().includes(search.toLowerCase())
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
                            {uploading ? "Enviando..." : "Novo Upload"}
                        </label>
                    </div>
                </div>
                {uploadError && (
                    <p className="px-4 py-2 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {uploadError}
                    </p>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-app-text-muted gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-gold" />
                            <p className="text-sm">Carregando sua biblioteca...</p>
                        </div>
                    ) : fetchError ? (
                        <div className="h-full flex flex-col items-center justify-center text-app-text-muted gap-4">
                            <AlertCircle className="h-10 w-10 text-red-400/70" />
                            <div className="text-center">
                                <p className="text-sm font-medium text-red-400">Falha ao carregar biblioteca</p>
                                <p className="mt-1 text-xs max-w-sm">{fetchError}</p>
                            </div>
                            <button onClick={fetchImages} className="flex items-center gap-2 text-xs text-gold hover:underline">
                                <RefreshCw className="h-3 w-3" /> Tentar novamente
                            </button>
                        </div>
                    ) : filteredImages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-app-text-muted gap-3">
                            <ImageIcon className="h-12 w-12 opacity-20" />
                            <p className="text-sm">
                                {images.length === 0 ? "Nenhuma imagem enviada ainda." : "Nenhuma imagem encontrada para essa busca."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredImages.map((img) => (
                                <div key={img.key} className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-black/20">
                                    <img
                                        src={img.url}
                                        alt={img.filename}
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
                                        <p className="text-[10px] text-white truncate opacity-70">{img.filename}</p>
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
