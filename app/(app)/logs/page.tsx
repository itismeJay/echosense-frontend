"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAlerts } from "@/lib/AlertsProvider";
import LogsTable from "@/components/LogsTable";
import type { Severity } from "@/lib/types";
import { Download, Search, ChevronDown } from "lucide-react";
import { csvEscape, categoryLabel, languageLabel } from "@/lib/format";

type Filter = "all" | Severity;
type EmotionFilter = "all" | "angry" | "aggressive" | "distressed" | "upset" | "neutral";
type CategoryFilter = "all" | "academic_shaming" | "appearance_shaming" | "body_shaming" | "emotional_taunting" | "threat";
type LanguageFilter = "all" | "tl" | "ceb" | "en";
type TriggerFilter = "all" | "threat" | "hard" | "repeated" | "medium" | "soft";

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All",    value: "all"    },
  { label: "High",   value: "high"   },
  { label: "Medium", value: "medium" },
  { label: "Low",    value: "low"    },
];

const ACTIVE_PILL: Record<Filter, string> = {
  all:    "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400",
  high:   "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400",
  medium: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
  low:    "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
};

const EMOTION_FILTERS: { label: string; value: EmotionFilter }[] = [
  { label: "All",        value: "all"        },
  { label: "Angry",      value: "angry"      },
  { label: "Aggressive", value: "aggressive" },
  { label: "Distressed", value: "distressed" },
  { label: "Upset",      value: "upset"      },
  { label: "Neutral",    value: "neutral"    },
];

const ACTIVE_EMOTION_PILL: Record<EmotionFilter, string> = {
  all:        "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400",
  angry:      "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400",
  aggressive: "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400",
  distressed: "bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  upset:      "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
  neutral:    "bg-gray-500/10 border-gray-500/20 text-gray-600 dark:text-gray-300",
};

const CATEGORY_OPTIONS: { label: string; value: CategoryFilter }[] = [
  { label: "All Categories",  value: "all"                },
  { label: "Academic",        value: "academic_shaming"   },
  { label: "Appearance",      value: "appearance_shaming" },
  { label: "Body",            value: "body_shaming"       },
  { label: "Emotional",       value: "emotional_taunting" },
  { label: "Threat",          value: "threat"             },
];

const TRIGGER_OPTIONS: { label: string; value: TriggerFilter }[] = [
  { label: "All Triggers",    value: "all"      },
  { label: "Immediate",       value: "threat"   },
  { label: "Severe Word",     value: "hard"     },
  { label: "Repeated",        value: "repeated" },
  { label: "Multiple Words",  value: "medium"   },
  { label: "Pattern",         value: "soft"     },
];

const LANGUAGE_OPTIONS: { label: string; value: LanguageFilter }[] = [
  { label: "All Languages", value: "all" },
  { label: "Filipino",      value: "tl"  },
  { label: "Bisaya",        value: "ceb" },
  { label: "English",       value: "en"  },
];

const SELECT_BASE = "appearance-none pl-3 pr-8 py-2 text-xs bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer";

export default function LogsPage() {
  const { alerts } = useAlerts();
  const [filter, setFilter] = useState<Filter>("all");
  const [emotionFilter, setEmotionFilter] = useState<EmotionFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>("all");
  const [triggerFilter, setTriggerFilter] = useState<TriggerFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (filter !== "all" && a.severity !== filter) return false;
      if (emotionFilter !== "all" && (a.emotion ?? "").toLowerCase() !== emotionFilter) return false;
      if (categoryFilter !== "all" && !(a.categories ?? []).includes(categoryFilter)) return false;
      if (languageFilter !== "all" && a.language !== languageFilter) return false;
      if (triggerFilter !== "all" && a.duration_gate !== triggerFilter) return false;
      if (search && !a.location.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [alerts, filter, emotionFilter, categoryFilter, languageFilter, triggerFilter, search]);

  const handleExport = () => {
    const headers = [
      "ID", "Severity", "Confidence", "Duration", "Location", "Language",
      "Categories", "Emotion", "Hard Hits", "Soft Hits", "Transcribed Text",
      "Detected Words", "YAMNet Class", "Created At",
    ];
    const rows = filtered.map((a) => [
      a.id,
      a.severity,
      Math.round(a.confidence * 100) + "%",
      a.duration.toFixed(1) + "s",
      csvEscape(a.location),
      languageLabel(a.language),
      csvEscape((a.categories ?? []).map((c) => categoryLabel(c)).join("; ")),
      csvEscape(a.emotion ?? ""),
      csvEscape((a.hard_hits ?? []).join("; ")),
      csvEscape((a.soft_hits ?? []).join("; ")),
      csvEscape(a.transcribed_text ?? ""),
      csvEscape((a.detected_words ?? []).join("; ")),
      csvEscape(a.yamnet_class ?? ""),
      a.created_at,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `echosense-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-6 max-w-screen-xl"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Detection Logs</h1>
        <p className="text-gray-400 dark:text-gray-500 text-sm">
          Full history of acoustic aggression detections
        </p>
      </div>

      {/* Severity + Search + Export row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                filter === f.value
                  ? ACTIVE_PILL[f.value]
                  : "bg-white/60 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by location..."
            className="w-full pl-9 pr-4 py-2 bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Category + Language + Trigger dropdowns */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-medium">
          Filters
        </span>
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
            className={SELECT_BASE}
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value as LanguageFilter)}
            className={SELECT_BASE}
          >
            {LANGUAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={triggerFilter}
            onChange={(e) => setTriggerFilter(e.target.value as TriggerFilter)}
            className={SELECT_BASE}
          >
            {TRIGGER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Emotion filter pills */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        <span className="text-[11px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-medium mr-1">
          Emotion
        </span>
        {EMOTION_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setEmotionFilter(f.value)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full border transition-all ${
              emotionFilter === f.value
                ? ACTIVE_EMOTION_PILL[f.value]
                : "bg-white/60 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {filtered.length} entr{filtered.length !== 1 ? "ies" : "y"}
          </p>
        </div>
        <LogsTable rows={filtered} pageSize={10} paginated sortable expandable />
      </div>
    </motion.div>
  );
}
