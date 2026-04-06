import { cn } from "@/lib/utils";
import { Theme, getTheme, setTheme as updateTheme } from "@/lib/themes";
import { useEffect, useState } from "react";
import { Sun, Moon, BookOpen, type LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ThemeOption {
  id: Theme;
  icon: LucideIcon;
  label: string;
}

const themeOptions: ThemeOption[] = [
  { id: "light", icon: Sun, label: "Claro" },
  { id: "sepia", icon: BookOpen, label: "Sépia" },
  { id: "dark", icon: Moon, label: "Escuro" },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getTheme());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleThemeChange = () => setTheme(getTheme());
    window.addEventListener("bv-theme-change", handleThemeChange);
    return () => window.removeEventListener("bv-theme-change", handleThemeChange);
  }, []);

  if (!mounted) return null;

  const handleSelect = (selectedTheme: Theme) => {
    updateTheme(selectedTheme);
  };

  return (
    <div
      className={cn(
        "relative flex items-center gap-1 p-1 rounded-full border shadow-sm transition-all duration-300",
        "bg-secondary/50 backdrop-blur-md border-border/40",
        "h-10 w-fit"
      )}
    >
      {themeOptions.map((option) => {
        const isActive = theme === option.id;
        const Icon = option.icon;

        return (
          <button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            className={cn(
              "relative flex items-center justify-center h-8 w-8 rounded-full transition-colors duration-200 z-10",
              isActive
                ? "text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={`Mudar para tema ${option.label}`}
          >
            {isActive && (
              <motion.div
                layoutId="active-theme-pill"
                className={cn(
                  "absolute inset-0 rounded-full shadow-sm z-[-1]",
                  // Use brand color #242254 for light/sepia, and a distinct highlight for dark
                  theme === "dark"
                    ? "bg-blue-600/30 ring-1 ring-blue-400/50"
                    : "bg-[#242254]"
                )}
                transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
              />
            )}
            <Icon size={16} strokeWidth={2.5} />
          </button>
        );
      })}
    </div>
  );
}