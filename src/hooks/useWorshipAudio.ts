import { useState, useEffect } from "react";

/**
 * Hook to manage worship audio playback for Psalms (and future books) from Cloudflare R2.
 * It constructs the URL using the naming convention `salmos-{chapter}.mp3`
 * and silently verifies file availability via a HEAD request.
 *
 * Returns `isAvailable: false` immediately (no request) for books other than Psalms.
 *
 * @param bookId - The book ID from books.json (e.g. "psa" for Psalms)
 * @param chapter - The chapter number
 */

const WORSHIP_AUDIO_BOOKS: Record<string, (chapter: number) => string> = {
    psa: (chapter) => `salmos-${chapter}.mp3`,
};

export function useWorshipAudio(bookId: string | undefined, chapter: number) {
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const baseUrl = import.meta.env.VITE_R2_AUDIO_URL;

    const filename = bookId ? WORSHIP_AUDIO_BOOKS[bookId]?.(chapter) : undefined;
    const audioUrl = filename && baseUrl ? `${baseUrl}/${filename}` : null;

    useEffect(() => {
        // Not a supported worship book or missing env var — skip request entirely
        if (!audioUrl) {
            setIsAvailable(false);
            return;
        }

        let cancelled = false;
        setIsAvailable(null); // reset to "checking"

        const checkAvailability = async () => {
            try {
                const response = await fetch(audioUrl, { method: "HEAD" });
                if (!cancelled) setIsAvailable(response.ok);
            } catch {
                if (!cancelled) setIsAvailable(false);
            }
        };

        checkAvailability();
        return () => { cancelled = true; };
    }, [audioUrl]);

    return {
        audioUrl,
        isAvailable: isAvailable ?? false,
        checking: isAvailable === null && !!audioUrl,
    };
}
