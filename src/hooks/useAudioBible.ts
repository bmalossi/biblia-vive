import { useState, useEffect } from "react";

/**
 * Hook to manage Bible audio playback from Cloudflare R2 storage.
 * It constructs the URL and verifies file availability via a HEAD request.
 */
export function useAudioBible(bookId: string | undefined, chapter: number, version: string = 'acf') {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null); // null = unknown/checking
  const [isLoading, setIsLoading] = useState(false);
  const baseUrl = import.meta.env.VITE_R2_AUDIO_URL;

  // Currently, only ACF version is available in R2
  const isCorrectVersion = version.toLowerCase() === 'acf';
  
  const audioUrl = (isCorrectVersion && bookId && baseUrl) 
    ? `${baseUrl}/free-acf-${bookId}-${chapter}.mp3` 
    : null;

  useEffect(() => {
    if (!audioUrl) {
      setIsAvailable(false);
      return;
    }

    const checkAvailability = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(audioUrl, { method: 'HEAD' });
        setIsAvailable(response.ok);
      } catch (error) {
        console.error("[useAudioBible] Availability check failed:", error);
        setIsAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAvailability();
  }, [audioUrl]);

  return { 
    audioUrl, 
    isAvailable: isAvailable ?? false, 
    isLoading,
    checking: isAvailable === null 
  };
}
