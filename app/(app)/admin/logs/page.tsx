"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Search, Terminal, X } from "lucide-react";
import { getSystemLogs } from "@/lib/api";
import { useCurrentUser } from "@/lib/auth";
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

export default function TechnicalLogsPage() {
  const currentUser = useCurrentUser();
  const router = useRouter();
  const [logs, setLogs] = useState<PiLog[]>([]);
  const [reportedTotal, setReportedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await getSystemLogs();
      setLogs(response.lines);
      setReportedTotal(response.total);
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

  if (currentUser && currentUser.role !== "admin") return null;

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
          Administrator · Technical
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl dark:text-white">
              Technical Logs
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Review backend and classroom-device diagnostic messages. These
              entries are separate from administrative audit history.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadLogs()}
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
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
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_14rem] dark:border-slate-800 dark:bg-slate-900"
      >
        <div>
          <label
            htmlFor="technical-log-search"
            className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100"
          >
            Search technical messages
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              id="technical-log-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-11 text-sm text-slate-950 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear technical log search"
                className="absolute right-0 top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        <div>
          <label
            htmlFor="technical-log-type"
            className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-100"
          >
            Message type
          </label>
          <select
            id="technical-log-type"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
            className="flex items-center gap-2 font-bold text-slate-950 dark:text-white"
          >
            <Terminal className="h-5 w-5" aria-hidden="true" />
            Diagnostic messages
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {filteredLogs.length} shown · {reportedTotal} returned
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {loading ? (
            <div role="status" className="space-y-3 p-4">
              <span className="sr-only">Loading technical logs</span>
              {[0, 1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : error ? (
            <div role="alert" className="p-8 text-center">
              <p className="font-bold text-red-950 dark:text-red-100">
                We couldn&apos;t load technical logs.
              </p>
              <button
                type="button"
                onClick={() => void loadLogs()}
                className="mt-4 min-h-11 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
              >
                Retry
              </button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-600 dark:text-slate-300">
              {logs.length === 0
                ? "No technical messages are available."
                : "No technical messages match the selected filters."}
            </p>
          ) : (
            <ol className="max-h-[38rem] divide-y divide-slate-200 overflow-y-auto dark:divide-slate-800">
              {filteredLogs.map((log, index) => (
                <li
                  key={log.id ?? `${log.timestamp}-${index}`}
                  className="p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:w-52">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {log.type}
                      </span>
                      <time
                        dateTime={log.timestamp}
                        className="text-xs text-slate-500 dark:text-slate-400"
                      >
                        {formatTimestamp(log.timestamp)}
                      </time>
                    </div>
                    <p className="min-w-0 break-words font-mono text-xs leading-6 text-slate-700 dark:text-slate-200">
                      {log.message}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}
