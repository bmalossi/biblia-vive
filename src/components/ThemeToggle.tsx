import { Button } from "@/components/ui/button";
import { Theme, cycleTheme, getTheme } from "@/lib/themes";
import { forwardRef, useEffect, useState } from "react";

const themeIcons: Record<Theme, string> = {
  light: "☀",
  dark: "🌙",
  sepia: "📜",
};

const ThemeToggle = forwardRef<HTMLButtonElement>(function ThemeToggle(_, ref) {
  const [theme, setTheme] = useState<Theme>(() => getTheme());

  useEffect(() => {
    const updateTheme = () => setTheme(getTheme());
    const onStorage = (event: StorageEvent) => {
      if (event.key === "bv-theme") updateTheme();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("bv-theme-change", updateTheme);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("bv-theme-change", updateTheme);
    };
  }, []);

  return (
    <Button
      aria-label={`Alternar tema (atual: ${theme})`}
      className="h-8 w-8 rounded-full text-sm"
      onClick={() => setTheme(cycleTheme())}
      ref={ref}
      size="icon"
      type="button"
      variant="ghost"
    >
      <span>{themeIcons[theme]}</span>
    </Button>
  );
});

export default ThemeToggle;