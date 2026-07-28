"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import toast from "react-hot-toast";
import type { Alert, LogsStats } from "./types";
import {
  checkBackendHealth,
  getAlerts,
  getLogs,
  getLogsStats,
} from "./api";

const EMPTY_STATS: LogsStats = {
  total_alerts: 0,
  high_severity: 0,
  medium_severity: 0,
  low_severity: 0,
};

interface AlertsContextValue {
  alerts: Alert[];
  logs: Alert[];
  stats: LogsStats;
  online: boolean;
  uptimeMs: number;
  flashKey: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const AlertsContext = createContext<AlertsContextValue>({
  alerts: [],
  logs: [],
  stats: EMPTY_STATS,
  online: false,
  uptimeMs: 0,
  flashKey: 0,
  loading: true,
  error: null,
  refresh: async () => {},
});

export function useAlerts(): AlertsContextValue {
  return useContext(AlertsContext);
}

export default function AlertsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [alerts, setAlerts]     = useState<Alert[]>([]);
  const [logs, setLogs]         = useState<Alert[]>([]);
  const [stats, setStats]       = useState<LogsStats>(EMPTY_STATS);
  const [loading, setLoading]   = useState(true);
  const [online, setOnline]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [flashKey, setFlashKey] = useState(0);
  const [uptimeMs, setUptimeMs] = useState(0);

  const uptimeStartRef   = useRef<number>(0);
  const seenLatestHighId = useRef<number | null>(null);
  const pollInFlightRef = useRef(false);

  const poll = useCallback(async () => {
    if (pollInFlightRef.current) return;
    pollInFlightRef.current = true;
    try {
      const [alertsResult, logsResult, statsResult, healthResult] =
        await Promise.allSettled([
          getAlerts(),
          getLogs(),
          getLogsStats(),
          checkBackendHealth(),
        ]);

      if (alertsResult.status === "rejected") {
        const backendReachable = healthResult.status === "fulfilled";
        setOnline(backendReachable);
        setError(
          backendReachable
            ? "Backend connected, but alert data is temporarily unavailable."
            : alertsResult.reason instanceof Error
              ? alertsResult.reason.message
              : "Classroom alerts are unavailable"
        );
        setLoading(false);
        return;
      }

      const newAlerts = alertsResult.value;
      setOnline(true);
      setError(null);
      setAlerts(newAlerts);
      if (logsResult.status === "fulfilled") setLogs(logsResult.value);
      if (statsResult.status === "fulfilled") setStats(statsResult.value);
      setLoading(false);

      const latest = newAlerts[0];
      if (latest) {
        if (seenLatestHighId.current === null) {
          seenLatestHighId.current = latest.id;
        } else if (latest.id !== seenLatestHighId.current) {
          seenLatestHighId.current = latest.id;
          if (latest.severity === "high") {
            toast.error(`High priority possible alert — ${latest.location}`, {
              duration: 6000,
              style: {
                background: "#fff7ed",
                color: "#9a3412",
                border: "1px solid #fdba74",
                fontWeight: "600",
                borderRadius: "12px",
              },
            });
            setFlashKey((k) => k + 1);
          }
        }
      }
    } catch (err) {
      setOnline(false);
      setError(err instanceof Error ? err.message : "Classroom alerts are unavailable");
      setLoading(false);
    } finally {
      pollInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    uptimeStartRef.current = Date.now();
    const initialTimer = setTimeout(() => { void poll(); }, 0);
    const intervalId = setInterval(() => { void poll(); }, 3000);

    // Re-poll immediately when the tab becomes visible so background-tab
    // throttling never causes a stale / offline view.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void poll();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [poll]);

  useEffect(() => {
    const id = setInterval(() => {
      setUptimeMs(Date.now() - uptimeStartRef.current);
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <AlertsContext.Provider
      value={{ alerts, logs, stats, online, uptimeMs, flashKey, loading, error, refresh: poll }}
    >
      {children}
    </AlertsContext.Provider>
  );
}
