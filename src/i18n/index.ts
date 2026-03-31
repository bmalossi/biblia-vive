import ptBR from "./locales/pt-BR";
import en from "./locales/en";
import es from "./locales/es";
import { useCallback, useEffect, useState } from "react";

export type Locale = "pt-BR" | "en" | "es";
export type TranslationDict = Record<string, string>;
export type TranslationKey = keyof typeof ptBR & string;

const LOCALE_KEY = "bv-locale";

const locales: Record<Locale, TranslationDict> = {
    "pt-BR": ptBR,
    en,
    es,
};

export const LOCALE_LABELS: Record<Locale, string> = {
    "pt-BR": "Português",
    en: "English",
    es: "Español",
};

export const ALL_LOCALES: Locale[] = ["pt-BR", "en", "es"];

export function getLocale(): Locale {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored === "pt-BR" || stored === "en" || stored === "es") return stored;
    return "pt-BR";
}

export function setLocale(locale: Locale) {
    localStorage.setItem(LOCALE_KEY, locale);
    document.documentElement.lang = locale === "pt-BR" ? "pt-BR" : locale;
    window.dispatchEvent(new CustomEvent("bv-locale-change", { detail: locale }));
}

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
    const locale = getLocale();
    let value = locales[locale]?.[key] ?? locales["pt-BR"][key] ?? key;
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            value = (value as string).replace(`{${k}}`, String(v));
        });
    }
    return value as string;
}

export function useTranslation() {
    const [locale, setLocaleState] = useState<Locale>(getLocale);

    useEffect(() => {
        const handler = ((event: CustomEvent<Locale>) => {
            setLocaleState(event.detail);
        }) as EventListener;
        window.addEventListener("bv-locale-change", handler);
        return () => window.removeEventListener("bv-locale-change", handler);
    }, []);

    const changeLocale = useCallback((next: Locale) => {
        setLocale(next);
    }, []);

    const translate = useCallback(
        (key: TranslationKey, params?: Record<string, string | number>): string => {
            let value = locales[locale]?.[key] ?? locales["pt-BR"][key] ?? key;
            if (params) {
                Object.entries(params).forEach(([k, v]) => {
                    value = (value as string).replace(`{${k}}`, String(v));
                });
            }
            return value as string;
        },
        [locale],
    );

    return { locale, changeLocale, t: translate };
}
