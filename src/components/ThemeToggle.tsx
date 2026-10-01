import { cn } from "@/lib/utils";
import { Theme, getTheme, setTheme as updateTheme } from "@/lib/themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Coffee, type LucideIcon } from "lucide-react";

export interface ThemeOption {
  id: Theme;
  icon: LucideIcon;
  label: string;
}

const themeOptions: ThemeOption[] = [
  { id: "light", icon: Sun, label: "White" },
  { id: "sepia", icon: Coffee, label: "Sépia" },
  { id: "dark", icon: Moon, label: "Dark" },
];

export interface ThemeToggleProps {
  className?: string;
  fullWidth?: boolean;
  showLabels?: boolean;
  size?: "sm" | "md";
}

export default function ThemeToggle({
  className,
  fullWidth = true,
  showLabels = true,
  size = "md",
}: ThemeToggleProps = {}) {
  const [theme, setTheme] = useState<Theme>(() => getTheme());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<Theme>;
      setTheme(customEvent.detail || getTheme());
    };
    window.addEventListener("bv-theme-change", handleThemeChange);
    return () => window.removeEventListener("bv-theme-change", handleThemeChange);
  }, []);

  if (!mounted) return null;

  const handleSelect = (selectedTheme: Theme) => {
    updateTheme(selectedTheme);
    setTheme(selectedTheme);
  };

  return (
    <div
      role="group"
      aria-label="Seletor de tema da página (White, Sépia, Dark)"
      className={cn(
        "p-1 rounded-xl border shadow-xs transition-all duration-300 select-none",
        "bg-app-raised/80 dark:bg-black/40 border-border/80 dark:border-[#221c15]",
        fullWidth ? "grid grid-cols-3 gap-1.5 w-full" : "inline-flex items-center gap-1 w-fit",
        className
      )}
    >
      {themeOptions.map((option) => {
        const isActive = theme === option.id;
        const Icon = option.icon;

        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => handleSelect(option.id)}
            data-testid={`theme-option-${option.id}`}
            aria-label={`Mudar para tema ${option.label}`}
            className={cn(
              "relative flex items-center justify-center gap-1.5 rounded-lg transition-all duration-200 cursor-pointer",
              size === "sm" ? "py-1.5 px-2 text-xs" : "py-2 px-2 text-xs",
              isActive
                ? option.id === "light"
                  ? "bg-white text-stone-900 shadow-xs border border-stone-200/90 font-bold dark:bg-stone-100 dark:text-stone-900"
                  : option.id === "sepia"
                    ? "bg-[#ebdcc7] text-[#2c1d11] shadow-xs border border-[#cfbea6] font-bold"
                    : "bg-[#1f1a14] text-gold shadow-xs border border-gold/40 font-bold"
                : "text-app-text-muted hover:text-app-text hover:bg-app-surface/60 border border-transparent"
            )}
          >
            <Icon
              className={cn(
                "shrink-0 transition-colors",
                size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5",
                isActive
                  ? option.id === "light"
                    ? "text-amber-500"
                    : option.id === "sepia"
                      ? "text-[#8c6b38]"
                      : "text-gold"
                  : "text-app-text-muted"
              )}
              strokeWidth={isActive ? 2.5 : 2}
            />
            {showLabels && (
              <span className="text-[0.68rem] tracking-tight font-medium truncate">
                {option.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}