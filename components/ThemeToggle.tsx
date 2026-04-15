"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 border-gray-200/60 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/10 transition-all duration-200"
      aria-label="Toggle theme"
    >
      <Sun className="w-4 h-4 hidden dark:block" />
      <Moon className="w-4 h-4 block dark:hidden" />
    </button>
  );
}
