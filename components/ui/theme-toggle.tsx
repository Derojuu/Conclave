"use client";

import { Icon } from "@/components/ui/icons";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      aria-label="Toggle theme"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-zinc-200 text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 active:translate-y-px dark:border-white/[0.08] dark:hover:border-white/20 dark:hover:text-white"
      onClick={toggleTheme}
      type="button"
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
    </button>
  );
}
