"use client";

import { useState, useMemo, Fragment } from "react";
import type { Alert } from "@/lib/types";
import { formatConfidence, formatTimestamp, emotionBadgeColor, categoryBadgeColor, categoryLabel, languageLabel } from "@/lib/format";
import SeverityBadge from "./SeverityBadge";
import AlertEvidence from "./AlertEvidence";
import DurationGateBadge from "./DurationGateBadge";
import { ChevronUp, ChevronDown, ChevronRight, MapPin, Clock } from "lucide-react";

type SortKey = "severity" | "confidence" | "duration" | "created_at";
type SortDir = "asc" | "desc";

const SEVERITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

interface LogsTableProps {
  rows: Alert[];
  pageSize?: number;
  paginated?: boolean;
  sortable?: boolean;
  expandable?: boolean;
}

function renderSortIcon(activeKey: SortKey, thisKey: SortKey, dir: SortDir, sortable: boolean) {
  if (!sortable) return null;
  if (activeKey !== thisKey) return <ChevronDown className="w-3 h-3 opacity-20" />;
  return dir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
}

export default function LogsTable({
  rows,
  pageSize = 10,
  paginated = true,
  sortable = true,
  expandable = false,
}: LogsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Severity + Confidence + Duration + Category + Language + Trigger + Words + Emotion + Location + Time + expand
  const colCount = expandable ? 11 : 10;

  const sorted = useMemo(() => {
    if (!sortable) return rows;
    return [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "severity") {
        cmp =
          (SEVERITY_ORDER[a.severity] ?? 3) -
          (SEVERITY_ORDER[b.severity] ?? 3);
      }
      else if (sortKey === "confidence") cmp = (a.confidence ?? -1) - (b.confidence ?? -1);
      else if (sortKey === "duration") cmp = (a.duration ?? -1) - (b.duration ?? -1);
      else cmp = a.created_at.localeCompare(b.created_at);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir, sortable]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = paginated ? sorted.slice(page * pageSize, (page + 1) * pageSize) : sorted.slice(0, pageSize);

  const handleSort = (key: SortKey) => {
    if (!sortable) return;
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
    setPage(0);
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[740px]">
          <thead>
            <tr className="border-b border-line">
              {(
                [
                  { key: "severity" as SortKey, label: "Severity" },
                  { key: "confidence" as SortKey, label: "Confidence" },
                  { key: "duration" as SortKey, label: "Duration" },
                ] as const
              ).map(({ key, label }) => (
                <th
                  key={key}
                  className="text-left py-2 px-3 text-xs text-muted font-medium whitespace-nowrap"
                >
                  <button
                    className="flex items-center gap-1 hover:text-ink transition-colors"
                    onClick={() => handleSort(key)}
                  >
                    {label} {renderSortIcon(sortKey, key, sortDir, sortable)}
                  </button>
                </th>
              ))}
              <th className="text-left py-2 px-3 text-xs text-muted font-medium hidden lg:table-cell">
                Category
              </th>
              <th className="text-left py-2 px-3 text-xs text-muted font-medium hidden lg:table-cell">
                Language
              </th>
              <th className="text-left py-2 px-3 text-xs text-muted font-medium hidden xl:table-cell whitespace-nowrap">
                Trigger
              </th>
              <th className="text-left py-2 px-3 text-xs text-muted font-medium hidden xl:table-cell whitespace-nowrap">
                Words
              </th>
              <th className="text-left py-2 px-3 text-xs text-muted font-medium hidden sm:table-cell">
                Emotion
              </th>
              <th className="text-left py-2 px-3 text-xs text-muted font-medium hidden sm:table-cell">
                Location
              </th>
              <th className="text-left py-2 px-3 text-xs text-muted font-medium hidden md:table-cell whitespace-nowrap">
                <button
                  className="flex items-center gap-1 hover:text-ink transition-colors"
                  onClick={() => handleSort("created_at")}
                >
                  Time {renderSortIcon(sortKey, "created_at", sortDir, sortable)}
                </button>
              </th>
              {expandable && <th className="w-8" aria-label="Expand" />}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr>
                <td colSpan={colCount} className="py-10 text-center text-muted text-sm">
                  No logs found
                </td>
              </tr>
            )}
            {paged.map((row) => {
              const isExpanded = expandable && expandedId === row.id;
              const firstCat = row.categories?.[0];
              const wordCount = (row.hard_hits?.length ?? 0) + (row.soft_hits?.length ?? 0);
              return (
                <Fragment key={row.id}>
                  <tr
                    onClick={expandable ? () => setExpandedId((id) => (id === row.id ? null : row.id)) : undefined}
                    className={`border-b border-line-strong hover:bg-surface  transition-colors ${
                      expandable ? "cursor-pointer" : ""
                    } ${isExpanded ? "bg-surface " : ""}`}
                  >
                    <td className="py-3 px-3">
                      <SeverityBadge severity={row.severity} dot />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-14 bg-surface rounded-full h-1.5 hidden sm:block shrink-0">
                          <div
                            className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                            style={{ width: `${Math.round((row.confidence ?? 0) * 100)}%` }}
                          />
                        </div>
                        <span className="text-muted text-xs font-mono">
                          {row.confidence != null ? formatConfidence(row.confidence) : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-muted text-xs whitespace-nowrap">
                      {row.duration != null ? `${row.duration.toFixed(1)}s` : "—"}
                    </td>
                    <td className="py-3 px-3 hidden lg:table-cell">
                      {firstCat ? (
                        <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${categoryBadgeColor(firstCat)}`}>
                          {categoryLabel(firstCat)}
                        </span>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 hidden lg:table-cell">
                      <span className="px-2 py-0.5 text-[11px] font-medium rounded-full border bg-gray-500/10 text-muted border-line-strong">
                        {languageLabel(row.language)}
                      </span>
                    </td>
                    <td className="py-3 px-3 hidden xl:table-cell">
                      {row.duration_gate ? (
                        <DurationGateBadge gate={row.duration_gate} />
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 hidden xl:table-cell text-muted text-xs whitespace-nowrap">
                      {wordCount > 0 ? `${wordCount} word${wordCount !== 1 ? "s" : ""}` : <span className="text-muted">—</span>}
                    </td>
                    <td className="py-3 px-3 hidden sm:table-cell">
                      {row.emotion ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold   ${emotionBadgeColor(row.emotion)}`}
                        >
                          {row.emotion}
                        </span>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-muted text-xs hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted shrink-0" />
                        {row.location}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-muted text-xs hidden md:table-cell whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted shrink-0" />
                        {formatTimestamp(row.created_at)}
                      </span>
                    </td>
                    {expandable && (
                      <td className="py-3 px-3 text-muted">
                        <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      </td>
                    )}
                  </tr>
                  {isExpanded && (
                    <tr className="border-b border-line-strong">
                      <td colSpan={colCount} className="px-3 pb-4 pt-1 bg-surface dark:bg-bg/[0.02]">
                        <AlertEvidence alert={row} defaultExpanded hideToggle />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {paginated && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
          <span className="text-xs text-muted">
            Page {page + 1} of {totalPages} · {sorted.length} total
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs bg-surface border border-line rounded-control text-muted disabled:opacity-30 hover:bg-surface transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-xs bg-surface border border-line rounded-control text-muted disabled:opacity-30 hover:bg-surface transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
