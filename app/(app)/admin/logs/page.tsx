"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Terminal,
  X,
} from "lucide-react";
import { getSystemLogs } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import type { PiLog } from "@/lib/types";

const LOG_TYPES = [
  { value: "", label: "All types" },
  { value: "alert", label: "Alert" },
  { value: "stt", label: "Speech processing" },
  { value: "audio", label: "Audio" },
  { value: "heartbeat", label: "Device check-in" },
  { value: "network", label: "Network" },
  { value: "error", label: "Error" },
];

const LOGS_PER_PAGE = 20;

export default function TechnicalLogsPage() {
  const [logs, setLogs] = useState<PiLog[]>([]);
  const [reportedTotal, setReportedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);


  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await getSystemLogs();
      setLogs(response.lines);
      setReportedTotal(response.total);
      setPage(1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadLogs();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadLogs]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (typeFilter && log.type.toLowerCase() !== typeFilter) return false;
      if (!query) return true;
      return (
        log.message.toLowerCase().includes(query) ||
        log.type.toLowerCase().includes(query)
      );
    });
  }, [logs, search, typeFilter]);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredLogs.length / LOGS_PER_PAGE)
  );
  const currentPage = Math.min(page, totalPages);
  const firstVisibleIndex = (currentPage - 1) * LOGS_PER_PAGE;
  const pageLogs = filteredLogs.slice(
    firstVisibleIndex,
    firstVisibleIndex + LOGS_PER_PAGE
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    setPage(1);
  };


  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm font-semibold text-link">
          Administrator · Technical
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink sm:text-3xl">
              Technical Logs
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Review backend and classroom-device diagnostic messages. These
              entries are separate from administrative audit history.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadLogs()}
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-control border border-line-strong bg-bg px-4 py-2 text-sm font-semibold text-ink hover:bg-surface focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Refresh
          </button>
        </div>
      </header>

      <section
        aria-label="Technical log filters"
        className="grid gap-4 rounded-panel border border-line bg-bg p-4 sm:grid-cols-[1fr_14rem]"
      >
        <div>
          <label
            htmlFor="technical-log-search"
            className="mb-1.5 block text-sm font-semibold text-ink"
          >
            Search technical messages
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              id="technical-log-search"
              type="search"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="min-h-11 w-full rounded-control border border-line-strong bg-bg py-2 pl-10 pr-11 text-sm text-ink"
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                aria-label="Clear technical log search"
                className="absolute right-0 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-control text-muted hover:text-ink focus-visible:outline-none"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        <div>
          <label
            htmlFor="technical-log-type"
            className="mb-1.5 block text-sm font-semibold text-ink"
          >
            Message type
          </label>
          <select
            id="technical-log-type"
            value={typeFilter}
            onChange={(event) => handleTypeChange(event.target.value)}
            className="min-h-11 w-full rounded-control border border-line-strong bg-bg px-3 py-2 text-sm text-ink"
          >
            {LOG_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="mt-5" aria-labelledby="technical-log-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2
            id="technical-log-heading"
            className="flex items-center gap-2 font-semibold text-ink"
          >
            <Terminal className="h-5 w-5" aria-hidden="true" />
            Diagnostic messages
          </h2>
          <p
            className="text-sm text-muted"
            aria-live="polite"
          >
            {filteredLogs.length === 0
              ? "No messages shown"
              : `${firstVisibleIndex + 1}–${Math.min(
                  firstVisibleIndex + LOGS_PER_PAGE,
                  filteredLogs.length
                )} of ${filteredLogs.length} shown`}
            {reportedTotal !== logs.length
              ? ` · ${reportedTotal} reported by backend`
              : ""}
          </p>
        </div>

        <div className="overflow-hidden rounded-panel border border-line bg-bg">
          {loading ? (
            <div role="status" className="space-y-3 p-4">
              <span className="sr-only">Loading technical logs</span>
              {[0, 1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-14 animate-pulse rounded-control bg-surface"
                />
              ))}
            </div>
          ) : error ? (
            <div role="alert" className="p-8 text-center">
              <p className="font-semibold text-ink">
                We couldn&apos;t load technical logs.
              </p>
              <button
                type="button"
                onClick={() => void loadLogs()}
                className="mt-4 min-h-11 rounded-control bg-danger px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-offset-2"
              >
                Retry
              </button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">
              {logs.length === 0
                ? "No technical messages are available."
                : "No technical messages match the selected filters."}
            </p>
          ) : (
            <ol className="divide-y divide-line">
              {pageLogs.map((log, index) => (
                <li
                  key={
                    log.id ??
                    `${log.timestamp}-${firstVisibleIndex + index}`
                  }
                  className="p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:w-52">
                      <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-ink">
                        {log.type}
                      </span>
                      <time
                        dateTime={log.timestamp}
                        className="text-xs text-muted"
                      >
                        {formatTimestamp(log.timestamp)}
                      </time>
                    </div>
                    <p className="min-w-0 break-words font-mono text-xs leading-6 text-ink">
                      {log.message}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {!loading && !error && filteredLogs.length > 0 && (
          <nav
            aria-label="Technical logs pagination"
            className="mt-4 flex flex-col gap-3 rounded-panel border border-line bg-bg p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm text-muted">
              Page <strong>{currentPage}</strong> of{" "}
              <strong>{totalPages}</strong> · {LOGS_PER_PAGE} messages per page
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage === 1}
                aria-label="Go to previous technical logs page"
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-control border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:bg-surface focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Previous
              </button>
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={currentPage === totalPages}
                aria-label="Go to next technical logs page"
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-control border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:bg-surface focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </nav>
        )}
      </section>
    </div>
  );
}
