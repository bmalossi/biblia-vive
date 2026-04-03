import type { Locale } from "@/i18n";

export type Theme = "sepia" | "light" | "dark";

export const THEME_KEY = "bv-theme";
export const VERSION_KEY = "bv-version";

export const VERSION_OPTIONS = [
  "aa", "acf", "arc", "nvi", "kja",
  "bbe", "kjv",
  "rvr",
  "org",
] as const;

export type BibleVersion = (typeof VERSION_OPTIONS)[number];

export interface VersionInfo {
  id: BibleVersion;
  name: string;
  language: Locale | "he-gr";
  languageLabel: string;
  langPath: string;
  isPro?: boolean;
}

export const VERSION_CATALOG: VersionInfo[] = [
  { id: "acf", name: "Almeida Corrigida Fiel", language: "pt-BR", languageLabel: "Português", langPath: "pt-br" },
  { id: "arc", name: "Almeida Revista e Corrigida", language: "pt-BR", languageLabel: "Português", langPath: "pt-br" },
  { id: "nvi", name: "Nova Versão Internacional", language: "pt-BR", languageLabel: "Português", langPath: "pt-br" },
  { id: "aa", name: "Almeida Revisada Imprensa Bíblica", language: "pt-BR", languageLabel: "Português", langPath: "pt-br" },
  { id: "kja", name: "King James Atualizada", language: "pt-BR", languageLabel: "Português", langPath: "pt-br" },
  { id: "kjv", name: "King James Version", language: "en", languageLabel: "English", langPath: "en" },
  { id: "bbe", name: "Bible in Basic English", language: "en", languageLabel: "English", langPath: "en" },
  { id: "rvr", name: "Reina Valera", language: "es", languageLabel: "Español", langPath: "es" },
  { id: "org", name: "Idioma Original (He/Gr)", language: "he-gr", languageLabel: "Originais", langPath: "org", isPro: true },
];

export function getVersionInfo(version: BibleVersion): VersionInfo | undefined {
  return VERSION_CATALOG.find((v) => v.id === version);
}

export function getVersionLanguage(version: BibleVersion): Locale | "he-gr" {
  return getVersionInfo(version)?.language ?? "pt-BR";
}

export function getVersionLangPath(version: BibleVersion): string {
  return getVersionInfo(version)?.langPath ?? "pt-br";
}

export function getVersionsForLocale(locale: Locale): VersionInfo[] {
  return VERSION_CATALOG.filter((v) => v.language === (locale as string) || v.language === "he-gr");
}

export function getDefaultVersionForLocale(locale: Locale): BibleVersion {
  if (locale === "en") return "kjv";
  if (locale === "es") return "rvr";
  return "acf";
}

export function getVersionsByLanguage(): Record<string, VersionInfo[]> {
  const groups: Record<string, VersionInfo[]> = {};
  for (const info of VERSION_CATALOG) {
    if (!groups[info.languageLabel]) groups[info.languageLabel] = [];
    groups[info.languageLabel].push(info);
  }
  return groups;
}

const THEME_ORDER: Theme[] = ["sepia", "light", "dark"];

export function isBibleVersion(value?: string | null): value is BibleVersion {
  return !!value && VERSION_OPTIONS.includes(value as BibleVersion);
}

export function getTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === "light" || stored === "dark" || stored === "sepia" ? stored : "sepia";
}

export function setTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.setAttribute("data-theme", theme);
  window.dispatchEvent(new CustomEvent("bv-theme-change", { detail: theme }));
}

export function cycleTheme() {
  const current = getTheme();
  const index = THEME_ORDER.indexOf(current);
  const next = THEME_ORDER[(index + 1) % THEME_ORDER.length];
  setTheme(next);
  return next;
}

export function initTheme() {
  setTheme(getTheme());
}

export function getVersion(): BibleVersion {
  const stored = localStorage.getItem(VERSION_KEY);
  return isBibleVersion(stored) ? stored : "acf";
}

export function setVersion(version: BibleVersion) {
  localStorage.setItem(VERSION_KEY, version);
  window.dispatchEvent(new CustomEvent("bv-version-change", { detail: version }));
}