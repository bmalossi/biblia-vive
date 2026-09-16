import { useEffect, useState } from "react";
import { getTheme, setTheme as setGlobalTheme, type Theme } from "@/lib/themes";

export interface ReadingThemeState {
  theme: Theme;
  isDark: boolean;
  isSepia: boolean;
  isLight: boolean;
  setTheme: (theme: Theme) => void;
}

/**
 * useReadingTheme
 *
 * Hook reativo que escuta alterações de tema ('dark' | 'sepia' | 'light')
 * emitidas pelo aplicativo através do evento 'bv-theme-change'.
 */
export function useReadingTheme(): ReadingThemeState {
  const [theme, setTheme] = useState<Theme>(() => getTheme());

  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(getTheme());
    };

    window.addEventListener("bv-theme-change", handleThemeChange);
    return () => window.removeEventListener("bv-theme-change", handleThemeChange);
  }, []);

  return {
    theme,
    isDark: theme === "dark",
    isSepia: theme === "sepia",
    isLight: theme === "light",
    setTheme: setGlobalTheme,
  };
}

export default useReadingTheme;
