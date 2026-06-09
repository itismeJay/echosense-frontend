"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RefreshCw, Search, Terminal, WifiOff, X } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";
import { useAlerts } from "@/lib/AlertsProvider";
import { ApiError, getSystemLogs } from "@/lib/api";
import type { PiLog } from "@/lib/types";

const CARD =
  "bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]";

type FilterType = "all" | "alerts" | "stt" | "audio" | "network" | "errors";

const FILTERS: { id: FilterType; label: string }[] = [
  { id: "all",     label: "All"     },
  { id: "alerts",  label: "Alerts"  },
  { id: "stt",     label: "STT"     },
  { id: "audio",   label: "Audio"   },
  { id: "network", label: "Network" },
  { id: "errors",  label: "Errors"  },
];

function matchesFilter(log: PiLog, filter: FilterType): boolean {
  if (filter === "all") return true;
  const t = log.type.toLowerCase();
  if (filter === "alerts")  return ["alert", "hit", "track"].includes(t);
  if (filter === "stt")     return t === "stt";
  if (filter === "audio")   return t === "audio";
  if (filter === "network") return t === "network";
  if (filter === "errors")  return t === "error";
  return true;
}

const TYPE_STYLES: Record<string, { badge: string; text: string; border?: string; bg?: string }> = {
  alert:     { badge: "bg-red-500 text-white",     text: "text-red-400",    border: "border-l-2 border-red-500/60"    },
  hit:       { badge: "bg-orange-500 text-white",  text: "text-orange-400"                                            },
  stt:       { badge: "bg-blue-500 text-white",    text: "text-blue-400"                                              },
  track:     { badge: "bg-purple-500 text-white",  text: "text-purple-400"                                            },
  audio:     { badge: "bg-cyan-500 text-black",    text: "text-cyan-400"                                              },
  heartbeat: { badge: "bg-gray-600 text-gray-200", text: "text-gray-500"                                              },
  network:   { badge: "bg-green-500 text-black",   text: "text-green-400"                                             },
  error:     { badge: "bg-red-600 text-white",     text: "text-red-300",    bg: "bg-red-500/10"                       },
  sender:    { badge: "bg-yellow-500 text-black",  text: "text-yellow-400"                                            },
  info:      { badge: "bg-gray-500 text-white",    text: "text-gray-400"                                              },
};

const TYPE_BADGE_LABELS: Record<string, string> = {
  alert: "ALERT", hit: "HIT", stt: "STT", track: "TRACK",
  audio: "AUDIO", heartbeat: "HB", network: "NET", error: "ERR",
  sender: "SEND", info: "INFO",
};

function formatLogTime(iso: string): string {
  try {
    return new Date(iso).toTimeString().slice(0, 8);
  } catch {
    return "??:??:??";
  }
}

function secondsAgo(date: Date): string {
  const s = Math.round((Date.now() - date.getTime()) / 1000);
  if (s < 2) return "just now";
  return `${s}s ago`;
}

export default function PiLogsPage() {
  const currentUser = useCurrentUser();
  const router = useRouter();
  const { online } = useAlerts();

  const [logs, setLogs]               = useState<PiLog[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filter, setFilter]           = useState<FilterType>("all");
  const [search, setSearch]           = useState("");
  const [autoScroll, setAutoScroll]   = useState(true);

  // Setter-only — state change drives re-render, value unused
  const [, setTick] = useState(0);

  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  const fetchLogs = useCallback(async () => {
    setError(false);
    try {
      const result = await getSystemLogs();
      setLogs(result);
      setLastUpdated(new Date());
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // Endpoint not yet available — treat as empty
        setLogs([]);
        setLastUpdated(new Date());
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLogs();
    const id = setInterval(() => { void fetchLogs(); }, 3000);
    return () => clearInterval(id);
  }, [fetchLogs]);

  // Tick every second so "X seconds ago" stays live
  useEffect(() => {
    const id = setInterval(() => setTick(v => v + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (autoScroll) {
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  if (currentUser && currentUser.role !== "admin") return null;

  const filtered = logs.filter(log => {
    if (!matchesFilter(log, filter)) return false;
    if (search) {
      const q = search.toLowerCase();
      return log.message.toLowerCase().includes(q) || log.type.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-6 max-w-screen-xl space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Pi Live Logs</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Real-time Raspberry Pi system logs</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap sm:pt-1">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              online
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${online ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`}
            />
            {online ? "Online" : "Offline"}
          </span>
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{secondsAgo(lastUpdated)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls bar */}
      <div className={`${CARD} p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center`}>
        {/* Filter buttons */}
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f.id
                  ? "bg-indigo-500 text-white"
                  : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-0 sm:max-w-xs w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Auto-scroll + Clear */}
        <div className="flex items-center gap-2 sm:ml-auto shrink-0">
          <button
            onClick={() => setAutoScroll(v => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              autoScroll
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10"
            }`}
          >
            Auto-scroll {autoScroll ? "ON" : "OFF"}
          </button>
          <button
            onClick={() => setLogs([])}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500/20 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Terminal window */}
      <div
        className="rounded-2xl overflow-hidden border border-white/[0.08]"
        style={{ backgroundColor: "#0d1117" }}
      >
        {/* Fake macOS traffic lights */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.06]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-xs font-mono text-gray-600">pi@echosense — system/logs</span>
          </div>
        </div>

        {/* Log lines */}
        <div className="h-[520px] overflow-y-auto p-4 font-mono text-xs leading-relaxed">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-600">
              <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <span>Connecting to Pi...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-600">
              <WifiOff className="w-6 h-6 text-gray-700" />
              <span>Could not reach backend</span>
              <button
                onClick={() => void fetchLogs()}
                className="mt-1 px-3 py-1.5 rounded-lg font-sans text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-600">
              {logs.length === 0
                ? "No logs yet — waiting for Pi..."
                : "No logs match the current filter"}
            </div>
          ) : (
            <div className="space-y-px">
              {filtered.map((log, i) => {
                const type = log.type.toLowerCase();
                const style = TYPE_STYLES[type] ?? TYPE_STYLES["info"];
                return (
                  <div
                    key={log.id ?? i}
                    className={`flex items-start gap-2 px-1 py-0.5 rounded ${style.border ?? ""} ${style.bg ?? ""}`}
                  >
                    <span className="text-gray-600 shrink-0 select-none tabular-nums">
                      [{formatLogTime(log.timestamp)}]
                    </span>
                    <span className={`shrink-0 px-1.5 py-px rounded text-[10px] font-bold leading-[1.4] ${style.badge}`}>
                      {TYPE_BADGE_LABELS[type] ?? log.type.toUpperCase().slice(0, 5)}
                    </span>
                    <span className={`break-all ${style.text}`}>{log.message}</span>
                  </div>
                );
              })}
              <div ref={logEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 px-1">
        <span>
          Showing{" "}
          <span className="font-semibold text-gray-700 dark:text-gray-300">{filtered.length}</span>
          {" "}of{" "}
          <span className="font-semibold text-gray-700 dark:text-gray-300">{logs.length}</span>
          {" "}lines
        </span>
        <span>Auto-refreshing every 3s</span>
      </div>
    </motion.div>
  );
}
