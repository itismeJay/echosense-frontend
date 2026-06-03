"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, Clock3, Cpu, RefreshCw, Server, Thermometer, TimerReset, WifiOff } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";
import { getSystemSettings } from "@/lib/api";
import type { SystemSettings } from "@/lib/types";
import { formatTimestamp, formatRelative } from "@/lib/format";

const CARD = "bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]";

function formatUptimeSec(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function HeartbeatPage() {
  const currentUser = useCurrentUser();
  const router = useRouter();

  const [data, setData]           = useState<SystemSettings | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  const fetchStatus = useCallback(async () => {
    setError(false);
    try {
      const result = await getSystemSettings();
      setData(result);
      setLastRefreshed(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
    const interval = setInterval(() => { void fetchStatus(); }, 60_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (currentUser && currentUser.role !== "admin") return null;

  const online = data?.device_status === "online";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-6 max-w-screen-lg space-y-5"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Pi Heartbeat</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            Raspberry Pi health and connection status
          </p>
        </div>
        {lastRefreshed && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <RefreshCw className="w-3.5 h-3.5" />
            Refreshed {formatRelative(lastRefreshed.toISOString())}
          </div>
        )}
      </div>

      {loading ? (
        <div className={`${CARD} animate-pulse`}>
          <div className="h-20 bg-gray-100 dark:bg-white/5 rounded-xl" />
        </div>
      ) : error ? (
        <div className={CARD}>
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="p-3 rounded-2xl bg-gray-500/10 border border-gray-500/20">
              <WifiOff className="w-6 h-6 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Could not reach backend</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Will retry automatically in 60 seconds</p>
            </div>
            <button
              onClick={() => void fetchStatus()}
              className="px-4 py-2 text-xs font-medium rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
            >
              Retry now
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={CARD}>
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-indigo-500/10 shrink-0">
                  <Server className="w-7 h-7 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 font-semibold">
                    Raspberry Pi 5
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-lg font-black tracking-wide ${
                        online
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${online ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`}
                      />
                      {online ? "ONLINE" : "OFFLINE"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-64">
                <div className="flex items-center gap-3 rounded-xl bg-white/70 dark:bg-white/5 border border-gray-100 dark:border-white/5 px-4 py-3">
                  <Clock3 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Last heartbeat</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {data?.last_heartbeat
                        ? formatRelative(data.last_heartbeat)
                        : "Never"}
                    </p>
                    {data?.last_heartbeat && (
                      <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">
                        {formatTimestamp(data.last_heartbeat)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white/70 dark:bg-white/5 border border-gray-100 dark:border-white/5 px-4 py-3">
                  <Activity className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Auto-refresh</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Every 60s</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: "CPU",
                icon: Cpu,
                color: "text-indigo-400 bg-indigo-500/10",
                value: data?.cpu_usage != null ? `${Math.round(data.cpu_usage)}%` : "—",
                barPct: data?.cpu_usage != null ? data.cpu_usage : null,
              },
              {
                label: "Temp",
                icon: Thermometer,
                color: "text-amber-400 bg-amber-500/10",
                value: data?.temperature != null ? `${Math.round(data.temperature)}°C` : "—",
                barPct: data?.temperature != null ? Math.min(100, (data.temperature / 85) * 100) : null,
              },
              {
                label: "Uptime",
                icon: TimerReset,
                color: "text-emerald-400 bg-emerald-500/10",
                value: data?.uptime_seconds != null ? formatUptimeSec(data.uptime_seconds) : "—",
                barPct: data?.uptime_seconds != null ? Math.min(100, (data.uptime_seconds / 86400) * 100) : null,
              },
            ].map(({ label, value, icon: Icon, color, barPct }, index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                className={CARD}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 font-semibold">
                      {label}
                    </p>
                    <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white tabular-nums">
                      {value}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-5 h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                  {barPct != null && (
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                      style={{ width: `${barPct}%` }}
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {(data?.vosk_version || data?.yamnet_version) && (
            <div className={CARD}>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Model Versions</h2>
              <div className="flex flex-wrap gap-3">
                {data.vosk_version && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-xs text-gray-400 dark:text-gray-500">Vosk</span>
                    <span className="font-mono font-semibold">{data.vosk_version}</span>
                  </div>
                )}
                {data.yamnet_version && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/5 border border-purple-500/10 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-xs text-gray-400 dark:text-gray-500">YAMNet</span>
                    <span className="font-mono font-semibold">{data.yamnet_version}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
