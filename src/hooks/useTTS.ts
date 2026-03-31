import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface TTSVerseItem {
  text: string;
  verseNumber: number;
}

export function useTTS(rate: 0.75 | 1 | 1.25 | 1.5) {
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState<number | null>(null);

  const queueRef = useRef<TTSVerseItem[]>([]);
  const cancelledRef = useRef(false);
  const currentIndexRef = useRef(0);
  const rateRef = useRef(rate);

  useEffect(() => {
    if (!isSupported) return;

    const syncVoices = () => setVoices(window.speechSynthesis.getVoices());
    syncVoices();
    window.speechSynthesis.addEventListener("voiceschanged", syncVoices);

    return () => window.speechSynthesis.removeEventListener("voiceschanged", syncVoices);
  }, [isSupported]);

  const preferredVoice = useMemo(() => voices.find((voice) => voice.lang.toLowerCase().startsWith("pt-br")) ?? null, [voices]);
  const hasPortugueseVoice = !!preferredVoice;

  const stop = useCallback(() => {
    if (!isSupported) return;
    cancelledRef.current = true;
    window.speechSynthesis.cancel();
    queueRef.current = [];
    currentIndexRef.current = 0;
    setCurrentVerseIndex(null);
    setIsPlaying(false);
    setIsPaused(false);
  }, [isSupported]);

  const speakQueueItem = useCallback(
    (index: number) => {
      if (!isSupported) return;
      const queue = queueRef.current;
      if (index >= queue.length) {
        stop();
        return;
      }

      const item = queue[index];
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.lang = "pt-BR";
      utterance.rate = rateRef.current;
      utterance.pitch = 1;
      if (preferredVoice) utterance.voice = preferredVoice;

      setCurrentVerseIndex(index);
      currentIndexRef.current = index;

      utterance.onend = () => {
        if (cancelledRef.current) return;
        speakQueueItem(index + 1);
      };

      utterance.onerror = () => {
        stop();
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, preferredVoice, stop],
  );

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text.trim()) return;

      cancelledRef.current = false;
      window.speechSynthesis.cancel();
      queueRef.current = [{ text, verseNumber: 1 }];
      setIsPaused(false);
      setIsPlaying(true);
      speakQueueItem(0);
    },
    [isSupported, speakQueueItem],
  );

  const speakVerses = useCallback(
    (verses: TTSVerseItem[], startIndex = 0) => {
      if (!isSupported || !verses.length) return;

      cancelledRef.current = false;
      window.speechSynthesis.cancel();
      queueRef.current = verses;
      setIsPaused(false);
      setIsPlaying(true);
      speakQueueItem(Math.min(Math.max(startIndex, 0), verses.length - 1));
    },
    [isSupported, speakQueueItem],
  );

  const pause = useCallback(() => {
    if (!isSupported || !window.speechSynthesis.speaking) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    if (queueRef.current.length) {
      setIsPaused(false);
      setIsPlaying(true);
      speakQueueItem(currentIndexRef.current);
    }
  }, [isSupported, speakQueueItem]);

  useEffect(() => {
    if (!isSupported) return;
    rateRef.current = rate;

    const hasQueue = queueRef.current.length > 0;
    if (!hasQueue || (!isPlaying && !isPaused) || currentVerseIndex === null) return;

    const resumeIndex = currentVerseIndex;
    const queue = [...queueRef.current];
    window.speechSynthesis.cancel();
    if (isPaused) {
      setIsPaused(false);
      setIsPlaying(true);
    }
    speakVerses(queue, resumeIndex);
  }, [currentVerseIndex, isPaused, isPlaying, isSupported, rate, speakVerses]);

  useEffect(() => () => stop(), [stop]);

  return {
    isSupported,
    hasPortugueseVoice,
    isPlaying,
    isPaused,
    currentVerseIndex,
    speak,
    speakVerses,
    pause,
    resume,
    stop,
  };
}