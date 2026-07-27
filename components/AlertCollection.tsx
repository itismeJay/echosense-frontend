"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Download, RefreshCw, Search } from "lucide-react";
import { useAlerts } from "@/lib/AlertsProvider";
import type { Severity } from "@/lib/types";
import { alertStatusLabel } from "@/lib/alert-presentation";
import { categoryLabel, csvEscape, languageLabel } from "@/lib/format";
import AlertCard from "./AlertCard";
import AlertListSkeleton from "./AlertListSkeleton";

type PriorityFilter = "all" | Severity;
type EmotionFilter = "all" | "angry" | "aggressive" | "distressed" | "upset" | "neutral";
type CategoryFilter = "all" | "academic_shaming" | "appearance_shaming" | "body_shaming" | "emotional_taunting" | "threat";
type LanguageFilter = "all" | "tl" | "ceb" | "en";
type TriggerFilter = "all" | "threat" | "hard" | "repeated" | "medium" | "soft";

const PRIORITIES: { label: string; value: PriorityFilter }[] = [
  { label: "All priorities", value: "all" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

const CATEGORY_OPTIONS: { label: string; value: CategoryFilter }[] = [
  { label: "All concern categories", value: "all" },
  { label: "Academic", value: "academic_shaming" },
  { label: "Appearance", value: "appearance_shaming" },
  { label: "Body", value: "body_shaming" },
  { label: "Emotional", value: "emotional_taunting" },
  { label: "Threat", value: "threat" },
];

const LANGUAGE_OPTIONS: { label: string; value: LanguageFilter }[] = [
  { label: "All languages", value: "all" },
  { label: "Filipino", value: "tl" },
  { label: "Bisaya", value: "ceb" },
  { label: "English", value: "en" },
];

const TRIGGER_OPTIONS: { label: string; value: TriggerFilter }[] = [
  { label: "All detection reasons", value: "all" },
  { label: "Immediate concern", value: "threat" },
  { label: "High-priority term", value: "hard" },
  { label: "Repeated phrase", value: "repeated" },
  { label: "Multiple terms", value: "medium" },
  { label: "Possible pattern", value: "soft" },
];

const EMOTION_OPTIONS: { label: string; value: EmotionFilter }[] = [
  { label: "All possible vocal tones", value: "all" },
  { label: "Angry", value: "angry" },
  { label: "Aggressive", value: "aggressive" },
  { label: "Distressed", value: "distressed" },
  { label: "Upset", value: "upset" },
  { label: "Neutral", value: "neutral" },
];

const SELECT =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

interface AlertCollectionProps {
  mode: "alerts" | "history";
}

export default function AlertCollection({ mode }: AlertCollectionProps) {
  const { alerts, loading, error, refresh } = useAlerts();
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [language, setLanguage] = useState<LanguageFilter>("all");
  const [trigger, setTrigger] = useState<TriggerFilter>("all");
  const [emotion, setEmotion] = useState<EmotionFilter>("all");
  const [page, setPage] = useState(0);

  const isHistory = mode === "history";
  const pageSize = isHistory ? 10 : 6;

  const filtered = useMemo(
    () =>
      [...alerts]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .filter((alert) => {
          if (priority !== "all" && alert.severity !== priority) return false;
          if (search && !alert.location.toLowerCase().includes(search.toLowerCase())) return false;
          if (category !== "all" && !(alert.categories ?? []).includes(category)) return false;
          if (language !== "all" && alert.language !== language) return false;
          if (trigger !== "all" && alert.duration_gate !== trigger) return false;
          if (emotion !== "all" && (alert.emotion ?? "").toLowerCase() !== emotion) return false;
          return true;
        }),
    [alerts, category, emotion, language, priority, search, trigger]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const visible = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const updateFilter = (callback: () => void) => {
    callback();
    setPage(0);
  };

  const handleExport = () => {
    const headers = [
      "ID",
      "Priority",
      "Classroom",
      "Status",
      "Language",
      "Possible Concern Categories",
      "Possible Detected Phrase",
      "Created At",
    ];
    const rows = filtered.map((alert) => [
      alert.id,
      alert.severity,
      csvEscape(alert.location),
      csvEscape(alertStatusLabel(alert)),
      languageLabel(alert.language),
      csvEscape((alert.categories ?? []).map(categoryLabel).join("; ")),
      csvEscape(alert.transcribed_text ?? ""),
      alert.created_at,
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `echosense-alert-history-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
          Classroom Monitoring System
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
          {isHistory ? "Alert History" : "Classroom Alerts"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {isHistory
            ? "Search and view previously recorded classroom alerts."
            : "View recent possible classroom concerns. These automated alerts are unverified."}
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-5 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/60 dark:bg-red-950/30"
        >
          <div>
            <p className="font-semibold text-red-900 dark:text-red-100">
              We couldn&apos;t load classroom alerts.
            </p>
            <p className="mt-1 text-sm text-red-800 dark:text-red-200">Please try again.</p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      <section aria-label="Alert filters" className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <fieldset className="flex-1">
            <legend className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              Priority
            </legend>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={priority === option.value}
                  onClick={() => updateFilter(() => setPriority(option.value))}
                  className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                    priority === option.value
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="w-full lg:max-w-sm">
            <label htmlFor={`${mode}-location-search`} className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">
              Search by classroom
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                id={`${mode}-location-search`}
                type="search"
                value={search}
                onChange={(event) => updateFilter(() => setSearch(event.target.value))}
                placeholder="e.g. Grade 6"
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>
        </div>

        {isHistory && (
          <details className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-slate-200 dark:hover:text-white">
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
              More filters and export
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="history-category" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Concern category
                </label>
                <select id="history-category" value={category} onChange={(event) => updateFilter(() => setCategory(event.target.value as CategoryFilter))} className={SELECT}>
                  {CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="history-language" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Language
                </label>
                <select id="history-language" value={language} onChange={(event) => updateFilter(() => setLanguage(event.target.value as LanguageFilter))} className={SELECT}>
                  {LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="history-trigger" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Detection reason
                </label>
                <select id="history-trigger" value={trigger} onChange={(event) => updateFilter(() => setTrigger(event.target.value as TriggerFilter))} className={SELECT}>
                  {TRIGGER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="history-emotion" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Possible vocal tone
                </label>
                <select id="history-emotion" value={emotion} onChange={(event) => updateFilter(() => setEmotion(event.target.value as EmotionFilter))} className={SELECT}>
                  {EMOTION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Export filtered history
              </button>
            </div>
          </details>
        )}
      </section>

      {loading && alerts.length === 0 ? (
        <AlertListSkeleton count={isHistory ? 6 : 4} />
      ) : visible.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {filtered.length === 0 && alerts.length > 0
              ? "No alerts match these filters."
              : "No alerts need attention today."}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            New classroom alerts will appear here automatically.
          </p>
        </section>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-300" aria-live="polite">
              {filtered.length} alert{filtered.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {visible.map((alert) => <AlertCard key={alert.id} alert={alert} />)}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-between gap-4" aria-label="Alert pages">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Page {safePage + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={safePage === 0}
              onClick={() => setPage(Math.max(0, safePage - 1))}
              className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
              className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
