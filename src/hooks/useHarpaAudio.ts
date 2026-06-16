import { useState, useEffect } from "react";
import hymnsData from "@/data/harpa-hymns.json";

export function useHarpaAudio(hymnNumber: number | undefined, rawTitle: string | undefined) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null); // null = checking
  const baseUrl = import.meta.env.VITE_R2_AUDIO_URL;

  useEffect(() => {
    if (!hymnNumber || !baseUrl) {
      setIsAvailable(false);
      setAudioUrl(null);
      return;
    }

    setIsAvailable(null);

    const hymn = hymnsData.find((h) => h.numero === hymnNumber);
    if (hymn && hymn.hasAudio && hymn.audioFile) {
      const testUrl = `${baseUrl}/harpas/${encodeURIComponent(hymn.audioFile)}`;
      setAudioUrl(testUrl);
      setIsAvailable(true);
    } else {
      setIsAvailable(false);
      setAudioUrl(null);
    }
  }, [hymnNumber, baseUrl]);

  return {
    audioUrl,
    isAvailable: isAvailable ?? false,
    checking: isAvailable === null
  };
}
