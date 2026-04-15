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
import { getAlerts, getLogs, getLogsStats, getIsMockMode } from "./api";
import { MOCK_STATS } from "./mockData";

interface AlertsContextValue {
  alerts: Alert[];
  logs: Alert[];
  stats: LogsStats;
  online: boolean;
  uptimeMs: number;
  flashKey: number;
  loading: boolean;
}

const AlertsContext = createContext<AlertsContextValue>({
  alerts: [],
  logs: [],
  stats: { total_alerts: 0, high_severity: 0, medium_severity: 0, low_severity: 0 },
  online: false,
  uptimeMs: 0,
  flashKey: 0,
  loading: true,
});

export function useAlerts(): AlertsContextValue {
  return useContext(AlertsContext);
}

export default function AlertsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [alerts, setAlerts]   = useState<Alert[]>([]);
  const [logs, setLogs]       = useState<Alert[]>([]);
  const [stats, setStats]     = useState<LogsStats>(MOCK_STATS);
  const [loading, setLoading] = useState(true);
  const [online, setOnline]   = useState(true); // true by default — mock mode always shows green
  const [flashKey, setFlashKey] = useState(0);
  const [uptimeMs, setUptimeMs] = useState(0);

  // Initialized in useEffect to avoid "impure function in render" lint rule
  const uptimeStartRef       = useRef<number>(0);
  const seenLatestHighId     = useRef<number | null>(null);
  const offlineTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const poll = useCallback(async () => {
    const [newAlerts, newLogs, newStats] = await Promise.all([
      getAlerts(),
      getLogs(),
      getLogsStats(),
    ]);

    const mock = getIsMockMode();
    if (!mock) {
      // Real backend responded — mark online, reset offline countdown
      setOnline(true);
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
      offlineTimerRef.current = setTimeout(() => setOnline(false), 10_000);
    } else {
      // Mock mode — always show as online for demo
      setOnline(true);
    }

    setAlerts(newAlerts);
    setLogs(newLogs);
    setStats(newStats);
    setLoading(false);

    // High-alert watcher — fires exactly once per new HIGH alert, never on initial load
    const latest = newAlerts[0];
    if (latest) {
      if (seenLatestHighId.current === null) {
        seenLatestHighId.current = latest.id;
      } else if (latest.id !== seenLatestHighId.current) {
        seenLatestHighId.current = latest.id;
        if (latest.severity === "high") {
          toast.error(`🚨 HIGH ALERT — ${latest.location}`, {
            duration: 6000,
            style: {
              background: "#1a1a2e",
              color: "#f87171",
              border: "1px solid rgba(239,68,68,0.35)",
              fontWeight: "600",
              borderRadius: "12px",
            },
          });
          setFlashKey((k) => k + 1);
        }
      }
    }
  }, []);

  // Main polling loop — initial call deferred via setTimeout to avoid setState-in-effect lint
  useEffect(() => {
    uptimeStartRef.current = Date.now();
    const initialTimer = setTimeout(() => { void poll(); }, 0);
    const intervalId = setInterval(() => { void poll(); }, 3000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
    };
  }, [poll]);

  // Uptime counter — ticks every 60s
  useEffect(() => {
    const id = setInterval(() => {
      setUptimeMs(Date.now() - uptimeStartRef.current);
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <AlertsContext.Provider
      value={{ alerts, logs, stats, online, uptimeMs, flashKey, loading }}
    >
      {children}
    </AlertsContext.Provider>
  );
}
