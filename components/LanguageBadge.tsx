import { languageLabel } from "@/lib/format";
import type { AlertLanguage } from "@/lib/types";

interface LanguageBadgeProps {
  language?: AlertLanguage | null;
  size?: "sm" | "md";
}

export default function LanguageBadge({ language, size = "sm" }: LanguageBadgeProps) {
  const sizeClass = size === "md"
    ? "px-2.5 py-1 text-xs"
    : "px-2 py-0.5 text-[11px]";
  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${sizeClass} bg-gray-500/10 text-gray-600 border-gray-300/40 dark:bg-gray-500/15 dark:text-gray-300 dark:border-gray-400/25`}>
      {languageLabel(language)}
    </span>
  );
}
