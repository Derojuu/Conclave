"use client";

import { useTheme as useNextTheme } from "next-themes";
import { useCallback } from "react";

type Theme = "dark" | "light";

export function useTheme() {
  const { resolvedTheme, setTheme } = useNextTheme();
  const theme: Theme = resolvedTheme === "light" ? "light" : "dark";

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, toggleTheme };
}
