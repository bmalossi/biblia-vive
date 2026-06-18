import { useMemo } from "react";
import hymnsData from "@/data/harpa-hymns.json";

export function useHarpaAudio(hymnNumber: number | undefined, rawTitle: string | undefined) {
  const baseUrl = import.meta.env.VITE_R2_AUDIO_URL;

  const result = useMemo(() => {
    if (!hymnNumber || !baseUrl) {
      return { audioUrl: null, isAvailable: false };
    }
    const hymn = hymnsData.find((h) => h.numero === hymnNumber);
    if (hymn && hymn.hasAudio && hymn.audioFile) {
      return {
        audioUrl: `${baseUrl}/harpas/${encodeURIComponent(hymn.audioFile)}`,
        isAvailable: true,
      };
    }
    return { audioUrl: null, isAvailable: false };
  }, [hymnNumber, baseUrl]);

  return {
    ...result,
    checking: false,
  };
}
