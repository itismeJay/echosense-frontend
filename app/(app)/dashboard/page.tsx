"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CheckCircle2,
  CircleHelp,
  Clock3,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import AlertCard from "@/components/AlertCard";
import AlertListSkeleton from "@/components/AlertListSkeleton";
import { localDateKey } from "@/lib/alert-presentation";
import { getHeartbeat } from "@/lib/api";
import { useAlerts } from "@/lib/AlertsProvider";
import { formatTimestamp } from "@/lib/format";
import type { HeartbeatStatus } from "@/lib/types";

interface DashboardMetricProps {
  label: string;
  value: string;
  helpText: string;
  icon: typeof BellRing;
  tone: "indigo" | "red" | "emerald" | "slate";
  loading?: boolean;
}

const METRIC_TONES = {
  indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200",
  red: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
};

function DashboardMetric({
  label,
  value,
  helpText,
  icon: Icon,
  tone,
  loading = false,
}: DashboardMetricProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-4">
        <span className={`rounded-xl p-3 ${METRIC_TONES[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {label}
          </p>
          {loading ? (
            <div
              className="mt-2 h-8 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800"
              aria-label={`Loading ${label}`}
            />
          ) : (
            <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
              {value}
            </p>
          )}
          <p className="mt-2 text-sm leading-5 text-slate-500 dark:text-slate-400">
            {helpText}
          </p>
        </div>
      </div>
    </article>
  );
}

function isDeviceConnected(heartbeat: HeartbeatStatus): boolean | null {
  if (heartbeat.device_status === "online") return true;
  if (heartbeat.device_status === "offline") return false;
  if (heartbeat.last_heartbeat) {
    const heartbeatTime = new Date(heartbeat.last_heartbeat).getTime();
    if (Number.isFinite(heartbeatTime)) {
      return Date.now() - heartbeatTime < 3 * 60 * 1000;
    }
  }
  return null;
}

export default function DashboardPage() {
  const { alerts, loading, error, refresh } = useAlerts();
  const [todayKey] = useState(() => localDateKey(new Date()));
  const [heartbeat, setHeartbeat] = useState<HeartbeatStatus | null>(null);
  const [deviceConnected, setDeviceConnected] = useState<boolean | null>(null);
  const [deviceLoading, setDeviceLoading] = useState(true);
  const [deviceError, setDeviceError] = useState(false);

  const loadDeviceStatus = useCallback(async () => {
    try {
      const nextHeartbeat = await getHeartbeat();
      setHeartbeat(nextHeartbeat);
      setDeviceConnected(isDeviceConnected(nextHeartbeat));
      setDeviceError(false);
    } catch {
      setHeartbeat(null);
      setDeviceConnected(null);
      setDeviceError(true);
    } finally {
      setDeviceLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      void loadDeviceStatus();
    }, 0);
    const intervalId = setInterval(() => {
      void loadDeviceStatus();
    }, 30_000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
    };
  }, [loadDeviceStatus]);

  const todayAlerts = useMemo(
    () =>
      alerts.filter(
        (alert) => localDateKey(new Date(alert.created_at)) === todayKey
      ),
    [alerts, todayKey]
  );
  const highPriorityToday = useMemo(
    () => todayAlerts.filter((alert) => alert.severity === "high").length,
    [todayAlerts]
  );
  const recentAlerts = useMemo(
    () =>
      [...alerts]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 4),
    [alerts]
  );

  const handleRetry = () => {
    setDeviceLoading(true);
    void refresh();
    void loadDeviceStatus();
  };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
          Classroom Monitoring System
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl dark:text-white">
          What needs your attention today?
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          See recent possible classroom concerns and check whether the classroom
          device is connected.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-6 flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/60 dark:bg-red-950/30"
        >
          <div>
            <p className="font-semibold text-red-950 dark:text-red-100">
              We couldn&apos;t load classroom alerts.
            </p>
            <p className="mt-1 text-sm text-red-800 dark:text-red-200">
              Please try again.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-800 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {!deviceLoading && deviceConnected === false && (
        <section
          aria-labelledby="device-offline-title"
          className="mb-6 flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900/70 dark:bg-amber-950/30"
        >
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-800 dark:text-amber-200" aria-hidden="true" />
          <div>
            <h2
              id="device-offline-title"
              className="font-semibold text-amber-950 dark:text-amber-100"
            >
              Classroom Device Offline
            </h2>
            <p className="mt-1 text-sm leading-6 text-amber-900 dark:text-amber-200">
              New classroom alerts may not appear until the device reconnects.
              Contact an administrator if this continues.
            </p>
          </div>
        </section>
      )}

      {!deviceLoading && deviceError && (
        <section
          aria-labelledby="device-unavailable-title"
          className="mb-6 flex gap-3 rounded-2xl border border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900"
        >
          <CircleHelp
            className="mt-0.5 h-5 w-5 shrink-0 text-slate-700 dark:text-slate-200"
            aria-hidden="true"
          />
          <div>
            <h2
              id="device-unavailable-title"
              className="font-semibold text-slate-950 dark:text-white"
            >
              Classroom Device Status Unavailable
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">
              EchoSense could not check the device right now. This does not
              mean the classroom device is offline.
            </p>
          </div>
        </section>
      )}

      <section aria-labelledby="today-summary-title">
        <h2 id="today-summary-title" className="sr-only">
          Today&apos;s summary
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <DashboardMetric
            label="Alerts Today"
            value={todayAlerts.length.toString()}
            helpText={
              todayAlerts.length === 0
                ? "No alerts need attention today."
                : "Possible alerts recorded since midnight."
            }
            icon={BellRing}
            tone="indigo"
            loading={loading && alerts.length === 0}
          />
          <DashboardMetric
            label="High Priority Alerts"
            value={highPriorityToday.toString()}
            helpText="High-priority possible alerts recorded today."
            icon={AlertTriangle}
            tone={highPriorityToday > 0 ? "red" : "slate"}
            loading={loading && alerts.length === 0}
          />
          <DashboardMetric
            label="Classroom Device Status"
            value={
              deviceConnected
                ? "Connected"
                : deviceConnected === false
                  ? "Offline"
                  : "Unavailable"
            }
            helpText={
              heartbeat?.last_heartbeat
                ? `Last Device Check-in: ${formatTimestamp(heartbeat.last_heartbeat)}`
                : "Last Device Check-in is unavailable."
            }
            icon={
              deviceConnected
                ? Wifi
                : deviceConnected === false
                  ? WifiOff
                  : CircleHelp
            }
            tone={
              deviceConnected
                ? "emerald"
                : deviceConnected === false
                  ? "red"
                  : "slate"
            }
            loading={deviceLoading}
          />
        </div>
      </section>

      <section className="mt-8" aria-labelledby="recent-alerts-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="recent-alerts-title"
              className="text-xl font-bold text-slate-950 dark:text-white"
            >
              Recent Alerts
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Automated alerts are possible concerns and have not been verified.
            </p>
          </div>
          <Link
            href="/alerts"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
          >
            View all alerts
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {loading && alerts.length === 0 ? (
          <AlertListSkeleton count={4} />
        ) : recentAlerts.length === 0 && !error ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
            <h3 className="mt-3 font-semibold text-slate-950 dark:text-white">
              No alerts need attention today.
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Recent classroom alerts will appear here when they are received.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {recentAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} compact />
            ))}
          </div>
        )}
      </section>

      <p className="mt-6 flex items-center gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
        <Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />
        Alert information refreshes automatically while this page is open.
      </p>
    </div>
  );
}
