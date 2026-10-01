import { ALL_LOCALES, Locale, LOCALE_LABELS, useTranslation } from "@/i18n";
import { getDefaultVersionForLocale, getVersion, getVersionsForLocale, isBibleVersion, setVersion } from "@/lib/themes";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface LanguageSelectorProps {
    className?: string;
}

export default function LanguageSelector({ className }: LanguageSelectorProps = {}) {
    const { locale, changeLocale } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLanguageChange = (newLocale: Locale) => {
        changeLocale(newLocale);

        const currentVersion = getVersion();
        const validVersions = getVersionsForLocale(newLocale);

        if (!validVersions.some(v => v.id === currentVersion)) {
            const newVersion = getDefaultVersionForLocale(newLocale);
            setVersion(newVersion);

            const pathSegments = location.pathname.split("/").filter(Boolean);
            if (pathSegments.length > 0 && isBibleVersion(pathSegments[0])) {
                const nextPath = [newVersion, ...pathSegments.slice(1)].join("/");
                navigate(`/${nextPath}${location.search}`);
            }
        }
    };

    return (
        <select
            aria-label="Selecionar idioma"
            className={cn(
                "h-8 rounded-full border border-border bg-app-raised px-3 font-sans text-[0.68rem] tracking-[0.08em] text-app-text outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring transition-colors",
                className
            )}
            onChange={(event) => handleLanguageChange(event.target.value as Locale)}
            value={locale}
        >
            {ALL_LOCALES.map((loc) => (
                <option key={loc} value={loc}>
                    {LOCALE_LABELS[loc]}
                </option>
            ))}
        </select>
    );
}
