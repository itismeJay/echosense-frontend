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
  ApiError,
  getAlertsWithMetadata,
  getLogs,
  getLogsStats,
} from "./api";
import { showAlertBrowserNotification } from "./notifications";
import {
  newlyObservedAlerts,
  runWithoutOverlap,
  shouldMarkRetainedAlertsStale,
} from "./alert-polling";

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
  errorStatus: number | null;
  warning: string | null;
  lastUpdated: Date | null;
  isStale: boolean;
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
  errorStatus: null,
  warning: null,
  lastUpdated: null,
  isStale: false,
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
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const [uptimeMs, setUptimeMs] = useState(0);

  const uptimeStartRef   = useRef<number>(0);
  const seenAlertIdsRef = useRef<Set<number> | null>(null);
  const alertsRef = useRef<Alert[]>([]);
  const pollInFlightRef = useRef(false);
  const optionalRefreshInFlightRef = useRef(false);

  const refreshOptionalData = useCallback(async () => {
    await runWithoutOverlap(optionalRefreshInFlightRef, async () => {
      const [logsResult, statsResult] = await Promise.allSettled([
        getLogs(),
        getLogsStats(),
      ]);
      if (logsResult.status === "fulfilled") setLogs(logsResult.value);
      if (statsResult.status === "fulfilled") setStats(statsResult.value);
    });
  }, []);

  const poll = useCallback(async () => {
    await runWithoutOverlap(pollInFlightRef, async () => {
    try {
      const result = await getAlertsWithMetadata();
      const newAlerts = result.alerts;
      setOnline(true);
      setError(null);
      setErrorStatus(null);
      setWarning(result.warning);
      setIsStale(false);
      setLastUpdated(new Date());
      alertsRef.current = newAlerts;
      setAlerts(newAlerts);
      setLoading(false);

      if (seenAlertIdsRef.current === null) {
        seenAlertIdsRef.current = new Set(newAlerts.map((alert) => alert.id));
      } else {
        const newlyObserved = newlyObservedAlerts(
          newAlerts,
          seenAlertIdsRef.current
        );
        newAlerts.forEach((alert) => seenAlertIdsRef.current?.add(alert.id));
        const latestHigh = newlyObserved.find((alert) => alert.severity === "high");
        if (latestHigh) {
          showAlertBrowserNotification(latestHigh);
          if (latestHigh.test_mode || latestHigh.trigger_type === "TEST") {
            toast(`TEST alert — high-priority synthetic test — ${latestHigh.location}`, {
              duration: 6000,
              icon: "🧪",
              style: {
                background: "#eff6ff",
                color: "#1e3a8a",
                border: "2px solid #3b82f6",
                fontWeight: "700",
                borderRadius: "12px",
              },
            });
          } else {
            toast.error(`High priority possible alert — ${latestHigh.location}`, {
              duration: 6000,
              style: {
                background: "#fff7ed",
                color: "#9a3412",
                border: "1px solid #fdba74",
                fontWeight: "600",
                borderRadius: "12px",
              },
            });
          }
          setFlashKey((k) => k + 1);
        }
      }
    } catch (err) {
      setOnline(false);
      setIsStale(
        (current) =>
          current || shouldMarkRetainedAlertsStale(alertsRef.current)
      );
      setErrorStatus(err instanceof ApiError ? err.status : 500);
      setError(err instanceof Error ? err.message : "Classroom alerts are unavailable");
      setLoading(false);
    }
    });
  }, []);

  useEffect(() => {
    uptimeStartRef.current = Date.now();
    const initialTimer = setTimeout(() => { void poll(); }, 0);
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") void poll();
    }, 3000);
    const optionalTimer = setTimeout(() => { void refreshOptionalData(); }, 0);
    const optionalIntervalId = setInterval(() => { void refreshOptionalData(); }, 30_000);

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
      clearTimeout(optionalTimer);
      clearInterval(optionalIntervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [poll, refreshOptionalData]);

  useEffect(() => {
    const id = setInterval(() => {
      setUptimeMs(Date.now() - uptimeStartRef.current);
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <AlertsContext.Provider
      value={{
        alerts,
        logs,
        stats,
        online,
        uptimeMs,
        flashKey,
        loading,
        error,
        errorStatus,
        warning,
        lastUpdated,
        isStale,
        refresh: poll,
      }}
    >
      {children}
    </AlertsContext.Provider>
  );
}
