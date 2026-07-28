import type { AlertLanguage, Severity } from "./types";

export function formatConfidence(n: number): string {
  return `${Math.round(n * 100)}%`;
}

type DateInput = string | number | Date | null | undefined;

type ParsedDate =
  | { date: Date; fallback: null }
  | { date: null; fallback: "Time unavailable" | "Invalid timestamp" };

export interface DateFormatContext {
  recordId?: string | number;
  field?: string;
}

const reportedDateErrors = new Set<string>();

function reportDateError(
  formatter: string,
  value: DateInput,
  reason: "missing" | "invalid",
  context?: DateFormatContext
) {
  if (process.env.NODE_ENV === "production") return;

  const printableValue =
    value instanceof Date ? value.toString() : String(value);
  const key = `${formatter}:${reason}:${context?.recordId ?? ""}:${printableValue}`;
  if (reportedDateErrors.has(key)) return;
  reportedDateErrors.add(key);

  console.warn(
    `[EchoSense] ${formatter} received ${
      reason === "invalid" ? "an invalid" : "a missing"
    } date value. Check the API timestamp field and backend data.`,
    {
      value,
      recordId: context?.recordId,
      field: context?.field,
    }
  );
}

function parseDateInput(
  value: DateInput,
  formatter: string,
  context?: DateFormatContext
): ParsedDate {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  ) {
    reportDateError(formatter, value, "missing", context);
    return { date: null, fallback: "Time unavailable" };
  }

  const date =
    value instanceof Date
      ? new Date(value.getTime())
      : typeof value === "number"
        ? new Date(value)
        : new Date(value);

  if (Number.isNaN(date.getTime())) {
    reportDateError(formatter, value, "invalid", context);
    return { date: null, fallback: "Invalid timestamp" };
  }

  return { date, fallback: null };
}

export function formatTimestamp(
  value: DateInput,
  context?: DateFormatContext
): string {
  const parsed = parseDateInput(value, "formatTimestamp", context);
  if (!parsed.date) return parsed.fallback;

  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(parsed.date);
  const dateStr = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed.date);
  return `${time} — ${dateStr}`;
}

export function formatTime(value: DateInput): string {
  const parsed = parseDateInput(value, "formatTime");
  if (!parsed.date) return parsed.fallback;

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(parsed.date);
}

export function formatDate(value: DateInput): string {
  const parsed = parseDateInput(value, "formatDate");
  if (!parsed.date) return parsed.fallback;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed.date);
}

export function formatRelative(value: DateInput): string {
  const parsed = parseDateInput(value, "formatRelative");
  if (!parsed.date) return parsed.fallback;

  const diff = Date.now() - parsed.date.getTime();
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
    case "threat":   return "Immediate concern";
    case "hard":     return "High-priority term";
    case "repeated": return "Repeated phrase";
    case "medium":   return "Multiple terms";
    case "soft":     return "Possible pattern";
    default:         return gate ?? "—";
  }
}

export function categoryBadgeColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? "bg-gray-500/10 text-gray-600 border-gray-500/20 dark:bg-gray-400/15 dark:text-gray-300 dark:border-gray-400/25";
}

export function categoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] ?? cat.replace(/_/g, " ");
}

export function languageLabel(lang?: AlertLanguage | null): string {
  switch (lang) {
    case "fil": return "Filipino";
    case "ceb": return "Bisaya/Cebuano";
    case "en": return "English";
    case "mixed": return "Mixed language";
    case "unknown":
    case null:
    case undefined:
      return "Language unavailable";
  }
}

export function formatLanguageConfidence(
  confidence?: number | null
): string | null {
  if (
    typeof confidence !== "number" ||
    !Number.isFinite(confidence) ||
    confidence < 0 ||
    confidence > 1
  ) {
    return null;
  }
  return formatConfidence(confidence);
}

export function csvEscape(field: string): string {
  const raw = String(field);
  const str = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
