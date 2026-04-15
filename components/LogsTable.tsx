"use client";

import { useState, useMemo } from "react";
import type { Alert } from "@/lib/types";
import { formatConfidence, formatTimestamp } from "@/lib/format";
import SeverityBadge from "./SeverityBadge";
import { ChevronUp, ChevronDown, MapPin, Clock } from "lucide-react";

type SortKey = "severity" | "confidence" | "duration" | "created_at";
type SortDir = "asc" | "desc";

const SEVERITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

interface LogsTableProps {
  rows: Alert[];
  pageSize?: number;
  paginated?: boolean;
  sortable?: boolean;
}

// Plain function — NOT a component — to avoid "component defined inside render" lint rule
function renderSortIcon(
  activeKey: SortKey,
  thisKey: SortKey,
  dir: SortDir,
  sortable: boolean
) {
  if (!sortable) return null;
  if (activeKey !== thisKey) return <ChevronDown className="w-3 h-3 opacity-20" />;
  return dir === "asc" ? (
    <ChevronUp className="w-3 h-3" />
  ) : (
    <ChevronDown className="w-3 h-3" />
  );
}

export default function LogsTable({
  rows,
  pageSize = 10,
  paginated = true,
  sortable = true,
}: LogsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sortable) return rows;
    return [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "severity")
        cmp = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      else if (sortKey === "confidence") cmp = a.confidence - b.confidence;
      else if (sortKey === "duration") cmp = a.duration - b.duration;
      else cmp = a.created_at.localeCompare(b.created_at);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir, sortable]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = paginated
    ? sorted.slice(page * pageSize, (page + 1) * pageSize)
    : sorted.slice(0, pageSize);

  const handleSort = (key: SortKey) => {
    if (!sortable) return;
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/10">
              {(
                [
                  { key: "severity" as SortKey, label: "Severity" },
                  { key: "confidence" as SortKey, label: "Confidence" },
                  { key: "duration" as SortKey, label: "Duration" },
                ] as const
              ).map(({ key, label }) => (
                <th
                  key={key}
                  className="text-left py-2 px-3 text-xs text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap"
                >
                  <button
                    className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    onClick={() => handleSort(key)}
                  >
                    {label} {renderSortIcon(sortKey, key, sortDir, sortable)}
                  </button>
                </th>
              ))}
              <th className="text-left py-2 px-3 text-xs text-gray-400 dark:text-gray-500 font-medium hidden sm:table-cell">
                Location
              </th>
              <th className="text-left py-2 px-3 text-xs text-gray-400 dark:text-gray-500 font-medium hidden md:table-cell whitespace-nowrap">
                <button
                  className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  onClick={() => handleSort("created_at")}
                >
                  Time {renderSortIcon(sortKey, "created_at", sortDir, sortable)}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center text-gray-400 dark:text-gray-500 text-sm"
                >
                  No logs found
                </td>
              </tr>
            )}
            {paged.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-50 dark:border-white/5 hover:bg-indigo-50/50 dark:hover:bg-white/5 transition-colors"
              >
                <td className="py-3 px-3">
                  <SeverityBadge severity={row.severity} dot />
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-14 bg-gray-100 dark:bg-white/5 rounded-full h-1.5 hidden sm:block shrink-0">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        style={{
                          width: `${Math.round(row.confidence * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-gray-600 dark:text-gray-300 text-xs font-mono">
                      {formatConfidence(row.confidence)}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                  {row.duration.toFixed(1)}s
                </td>
                <td className="py-3 px-3 text-gray-500 dark:text-gray-400 text-xs hidden sm:table-cell">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-300 dark:text-gray-600 shrink-0" />
                    {row.location}
                  </span>
                </td>
                <td className="py-3 px-3 text-gray-400 dark:text-gray-500 text-xs hidden md:table-cell whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-300 dark:text-gray-600 shrink-0" />
                    {formatTimestamp(row.created_at)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paginated && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Page {page + 1} of {totalPages} · {sorted.length} total
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
