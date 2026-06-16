import { useState, useEffect } from "react";

function toTitleCase(title: string): string {
  const minorWords = ["de", "da", "do", "das", "dos", "e", "o", "a", "os", "as", "em", "com", "para", "por", "p'ra"];
  return title
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (index > 0 && minorWords.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function useHarpaAudio(hymnNumber: number | undefined, rawTitle: string | undefined) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null); // null = checking
  const baseUrl = import.meta.env.VITE_R2_AUDIO_URL;

  useEffect(() => {
    if (!hymnNumber || !rawTitle || !baseUrl) {
      setIsAvailable(false);
      setAudioUrl(null);
      return;
    }

    let cancelled = false;
    setIsAvailable(null); // start checking

    const numStr = String(hymnNumber).padStart(3, "0");
    const formattedTitle = toTitleCase(rawTitle);

    // Build the candidates list
    const candidates = [
      `${numStr} - ${formattedTitle}.mp3`
    ];

    // If first word ends in "s", also try the singular form
    const words = formattedTitle.split(" ");
    if (words[0] && words[0].endsWith("s") && words[0].length > 1) {
      const singularFirst = words[0].slice(0, -1);
      const singularTitle = [singularFirst, ...words.slice(1)].join(" ");
      candidates.push(`${numStr} - ${singularTitle}.mp3`);
    }

    const checkAudioUrl = async () => {
      for (const candidate of candidates) {
        if (cancelled) return;
        const testUrl = `${baseUrl}/harpas/${encodeURIComponent(candidate)}`;
        try {
          const response = await fetch(testUrl, { method: "HEAD" });
          if (response.ok && !cancelled) {
            setAudioUrl(testUrl);
            setIsAvailable(true);
            return;
          }
        } catch (err) {
          // ignore error and try next candidate
        }
      }

      if (!cancelled) {
        setIsAvailable(false);
        setAudioUrl(null);
      }
    };

    checkAudioUrl();

    return () => {
      cancelled = true;
    };
  }, [hymnNumber, rawTitle, baseUrl]);

  return {
    audioUrl,
    isAvailable: isAvailable ?? false,
    checking: isAvailable === null
  };
}
