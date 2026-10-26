"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="flex min-h-11 min-w-11 items-center justify-center rounded-control border border-line bg-bg text-muted transition-colors hover:bg-surface hover:text-ink"
      aria-label="Toggle color theme"
    >
      <Sun className="hidden h-4 w-4 [html.dark_&]:block" aria-hidden="true" />
      <Moon className="block h-4 w-4 [html.dark_&]:hidden" aria-hidden="true" />
    </button>
  );
}
