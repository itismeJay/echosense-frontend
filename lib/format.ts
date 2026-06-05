import type { Severity } from "./types";

export function formatConfidence(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  const dateStr = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
  return `${time} — ${dateStr}`;
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatUptime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function severityColor(s: Severity): string {
  if (s === "high")   return "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25";
  if (s === "medium") return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25";
  return                     "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25";
}

export function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Tailwind badge classes per emotion.
// angry=red, aggressive=orange, distressed=yellow, upset=amber, neutral/unknown=gray.
export function emotionBadgeColor(emotion?: string): string {
  switch ((emotion ?? "").toLowerCase()) {
    case "angry":
      return "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25";
    case "aggressive":
      return "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/25";
    case "distressed":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:bg-yellow-500/15 dark:text-yellow-400 dark:border-yellow-500/25";
    case "upset":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25";
    case "neutral":
      return "bg-gray-500/10 text-gray-600 border-gray-500/20 dark:bg-gray-400/15 dark:text-gray-300 dark:border-gray-400/25";
    default: // unknown / silent / missing
      return "bg-gray-500/10 text-gray-500 border-gray-500/20 dark:bg-gray-500/15 dark:text-gray-400 dark:border-gray-500/25";
  }
}

export type BullyingCategory = "academic_shaming" | "appearance_shaming" | "body_shaming" | "emotional_taunting" | "threat";

export const CATEGORY_LABELS: Record<string, string> = {
  academic_shaming:   "Academic",
  appearance_shaming: "Appearance",
  body_shaming:       "Body",
  emotional_taunting: "Emotional",
  threat:             "Threat",
};

export const CATEGORY_COLORS: Record<string, string> = {
  academic_shaming:   "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/25",
  appearance_shaming: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/25",
  body_shaming:       "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/25",
  emotional_taunting: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:bg-yellow-500/15 dark:text-yellow-400 dark:border-yellow-500/25",
  threat:             "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25",
};

export function durationGateLabel(gate?: string | null): string {
  switch (gate) {
    case "threat":   return "⚡ Immediate";
    case "hard":     return "🔴 Severe Word";
    case "repeated": return "🔁 Repeated";
    case "medium":   return "⚠️ Multiple Words";
    case "soft":     return "📋 Pattern";
    default:         return gate ?? "—";
  }
}

export function categoryBadgeColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? "bg-gray-500/10 text-gray-600 border-gray-500/20 dark:bg-gray-400/15 dark:text-gray-300 dark:border-gray-400/25";
}

export function categoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] ?? cat.replace(/_/g, " ");
}

export function languageLabel(lang?: string | null): string {
  switch (lang) {
    case "tl":  return "Filipino";
    case "ceb": return "Bisaya";
    case "en":  return "English";
    default:    return "Mixed";
  }
}

export function csvEscape(field: string): string {
  const str = String(field);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
