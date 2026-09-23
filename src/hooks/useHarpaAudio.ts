import { useMemo } from "react";
import hymnsData from "@/data/harpa-hymns.json";
import { useHymnCredits } from "@/hooks/useHymnCredits";

const DEFAULT_AUDIO_BASE_URL = "https://audio.bibliavive.com.br";

function resolveAudioUrl(baseUrl: string, fileOrUrl?: string | null): string | null {
  if (!fileOrUrl) return null;
  const trimmed = fileOrUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Remove leading slashes and optional 'harpas/' prefix to prevent duplication
  const cleanPath = trimmed.replace(/^\/?(harpas\/)?/, "");
  return `${baseUrl}/harpas/${encodeURIComponent(cleanPath)}`;
}

export function useHarpaAudio(hymnNumber: number | undefined, rawTitle?: string | undefined) {
  const baseUrl = import.meta.env.VITE_R2_AUDIO_URL || DEFAULT_AUDIO_BASE_URL;
  const validNumber = typeof hymnNumber === "number" && !isNaN(hymnNumber) && hymnNumber > 0 ? hymnNumber : 0;

  // Busca créditos dinâmicos do Supabase (com cache de 5min e fallback ao JSON)
  const { credits, isLoading } = useHymnCredits(validNumber);

  const result = useMemo(() => {
    if (!validNumber) {
      return { audioUrl: null, isAvailable: false };
    }

    // 1. Prioridade máxima: Áudio configurado dinamicamente no Supabase
    if (credits?.audioUrl) {
      const url = resolveAudioUrl(baseUrl, credits.audioUrl);
      if (url) return { audioUrl: url, isAvailable: true };
    }

    if (credits?.audioFile) {
      const url = resolveAudioUrl(baseUrl, credits.audioFile);
      if (url) return { audioUrl: url, isAvailable: true };
    }

    // 2. Fallback: Hino estático do harpa-hymns.json
    const staticHymn = hymnsData.find((h) => h.numero === validNumber);
    if (staticHymn && (staticHymn.hasAudio || staticHymn.audioFile)) {
      const candidate = staticHymn.audioFile;
      if (candidate) {
        const url = resolveAudioUrl(baseUrl, candidate);
        if (url) return { audioUrl: url, isAvailable: true };
      }
    }

    return { audioUrl: null, isAvailable: false };
  }, [validNumber, baseUrl, credits]);

  return {
    ...result,
    checking: isLoading,
  };
}

