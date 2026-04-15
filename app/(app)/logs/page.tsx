"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAlerts } from "@/lib/AlertsProvider";
import LogsTable from "@/components/LogsTable";
import type { Severity } from "@/lib/types";
import { Download, Search } from "lucide-react";
import { csvEscape } from "@/lib/format";

type Filter = "all" | Severity;

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

export default function LogsPage() {
  const { alerts } = useAlerts();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (filter !== "all" && a.severity !== filter) return false;
      if (search && !a.location.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [alerts, filter, search]);

  const handleExport = () => {
    const headers = [
      "ID",
      "Severity",
      "Confidence",
      "Duration",
      "Location",
      "Status",
      "Created At",
    ];
    const rows = filtered.map((a) => [
      a.id,
      a.severity,
      Math.round(a.confidence * 100) + "%",
      a.duration.toFixed(1) + "s",
      csvEscape(a.location),
      a.status,
      a.created_at,
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
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

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Severity pills */}
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

        {/* Search */}
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

        {/* Export */}
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {filtered.length} entr{filtered.length !== 1 ? "ies" : "y"}
          </p>
        </div>
        <LogsTable rows={filtered} pageSize={10} paginated sortable />
      </div>
    </motion.div>
  );
}
