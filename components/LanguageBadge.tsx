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
    <span className={`inline-flex items-center font-medium rounded-tag border ${sizeClass} bg-surface text-muted border-line-strong   `}>
      {languageLabel(language)}
    </span>
  );
}
