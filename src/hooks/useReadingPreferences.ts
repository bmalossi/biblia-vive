import { useCallback, useEffect, useMemo, useState } from "react";

export type ReadingFont = "lora" | "dm-sans" | "open-dyslexic";
export type ReadingColumnWidth = "narrow" | "normal" | "wide";
export type ReadingTtsRate = 0.75 | 1 | 1.25 | 1.5;

export interface ReadingPreferences {
  font: ReadingFont;
  fontSize: number;
  verseSpacing: number;
  columnWidth: ReadingColumnWidth;
  focusMode: boolean;
  ttsRate: ReadingTtsRate;
  wordsOfGod: boolean;
}

const STORAGE_KEYS = {
  font: "bv_font",
  fontSize: "bv_font_size",
  verseSpacing: "bv_verse_spacing",
  columnWidth: "bv_column_width",
  focusMode: "bv_focus_mode",
  ttsRate: "bv_tts_rate",
  wordsOfGod: "bv_words_of_god",
} as const;

const DEFAULT_PREFERENCES: ReadingPreferences = {
  font: "lora",
  fontSize: 18,
  verseSpacing: 0.8,
  columnWidth: "normal",
  focusMode: false,
  ttsRate: 1,
  wordsOfGod: false,
};

const FONT_MAP: Record<ReadingFont, string> = {
  lora: '"Lora", serif',
  "dm-sans": '"DM Sans", system-ui, sans-serif',
  "open-dyslexic": '"OpenDyslexic", "Open Dyslexic", "Comic Sans MS", sans-serif',
};

const COLUMN_WIDTH_MAP: Record<ReadingColumnWidth, string> = {
  narrow: "520px",
  normal: "680px",
  wide: "860px",
};

const parseNumber = (value: string | null, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parsePreferenceState = (): ReadingPreferences => {
  const fontRaw = localStorage.getItem(STORAGE_KEYS.font);
  const columnRaw = localStorage.getItem(STORAGE_KEYS.columnWidth);
  const ttsRaw = Number(localStorage.getItem(STORAGE_KEYS.ttsRate));

  return {
    font: fontRaw === "lora" || fontRaw === "dm-sans" || fontRaw === "open-dyslexic" ? fontRaw : DEFAULT_PREFERENCES.font,
    fontSize: Math.min(28, Math.max(14, Math.round(parseNumber(localStorage.getItem(STORAGE_KEYS.fontSize), DEFAULT_PREFERENCES.fontSize)))),
    verseSpacing: Math.min(1.6, Math.max(0.4, Number(parseNumber(localStorage.getItem(STORAGE_KEYS.verseSpacing), DEFAULT_PREFERENCES.verseSpacing).toFixed(1)))),
    columnWidth: columnRaw === "narrow" || columnRaw === "normal" || columnRaw === "wide" ? columnRaw : DEFAULT_PREFERENCES.columnWidth,
    focusMode: localStorage.getItem(STORAGE_KEYS.focusMode) === "true",
    ttsRate: ttsRaw === 0.75 || ttsRaw === 1 || ttsRaw === 1.25 || ttsRaw === 1.5 ? ttsRaw : DEFAULT_PREFERENCES.ttsRate,
    wordsOfGod: localStorage.getItem(STORAGE_KEYS.wordsOfGod) === "true",
  };
};

const ensureOpenDyslexicFont = () => {
  if (document.getElementById("bv-open-dyslexic-font")) return;

  const style = document.createElement("style");
  style.id = "bv-open-dyslexic-font";
  style.textContent = `
    @font-face {
      font-family: "OpenDyslexic";
      src: url("https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic-regular.woff2") format("woff2");
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
};

interface UseReadingPreferencesOptions {
  rootId?: string;
}

export function useReadingPreferences({ rootId = "reading-root" }: UseReadingPreferencesOptions = {}) {
  const [preferences, setPreferences] = useState<ReadingPreferences>(() => parsePreferenceState());

  const applyCssVariables = useCallback(
    (next: ReadingPreferences) => {
      const root = document.getElementById(rootId) ?? document.documentElement;

      root.style.setProperty("--font-reading", FONT_MAP[next.font]);
      root.style.setProperty("--font-size-reading", `${next.fontSize}px`);
      root.style.setProperty("--verse-spacing", `${next.verseSpacing}rem`);
      root.style.setProperty("--column-width", COLUMN_WIDTH_MAP[next.columnWidth]);
    },
    [rootId],
  );

  useEffect(() => {
    if (preferences.font === "open-dyslexic") ensureOpenDyslexicFont();
    applyCssVariables(preferences);
  }, [applyCssVariables, preferences]);

  const updatePreference = useCallback(<K extends keyof ReadingPreferences>(key: K, value: ReadingPreferences[K]) => {
    setPreferences((current) => {
      const next = { ...current, [key]: value };
      localStorage.setItem(STORAGE_KEYS[key], String(value));
      return next;
    });
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.setItem(STORAGE_KEYS.font, DEFAULT_PREFERENCES.font);
    localStorage.setItem(STORAGE_KEYS.fontSize, String(DEFAULT_PREFERENCES.fontSize));
    localStorage.setItem(STORAGE_KEYS.verseSpacing, String(DEFAULT_PREFERENCES.verseSpacing));
    localStorage.setItem(STORAGE_KEYS.columnWidth, DEFAULT_PREFERENCES.columnWidth);
    localStorage.setItem(STORAGE_KEYS.focusMode, String(DEFAULT_PREFERENCES.focusMode));
    localStorage.setItem(STORAGE_KEYS.ttsRate, String(DEFAULT_PREFERENCES.ttsRate));
    localStorage.setItem(STORAGE_KEYS.wordsOfGod, String(DEFAULT_PREFERENCES.wordsOfGod));
  }, []);

  return useMemo(
    () => ({ preferences, updatePreference, resetPreferences, defaults: DEFAULT_PREFERENCES }),
    [preferences, resetPreferences, updatePreference],
  );
}

export { DEFAULT_PREFERENCES as readingPreferencesDefaults };