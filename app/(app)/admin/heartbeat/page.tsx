"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  Clock3,
  Cpu,
  RefreshCw,
  Thermometer,
  TimerReset,
  Wifi,
  WifiOff,
} from "lucide-react";
import { getSystemSettings } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import type { SystemSettings } from "@/lib/types";

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function HeartbeatPage() {
  const [data, setData] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);


  const loadStatus = useCallback(async () => {
    setError(false);
    try {
      setData(await getSystemSettings());
      setLastRefreshed(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialTimer = setTimeout(() => {
      void loadStatus();
    }, 0);
    const interval = setInterval(() => {
      void loadStatus();
    }, 60_000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [loadStatus]);


  const connected = data?.device_status === "online";

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm font-semibold text-link">
          Administrator
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink sm:text-3xl">
              Classroom Device Status
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              View the connection and technical health information reported by the
              classroom monitoring system.
            </p>
          </div>
          {lastRefreshed && (
            <p className="text-xs text-muted">
              Page refreshed {formatTimestamp(lastRefreshed.toISOString())}
            </p>
          )}
        </div>
      </header>

      {loading ? (
        <div
          role="status"
          className="h-44 animate-pulse rounded-panel border border-line bg-bg"
        >
          <span className="sr-only">Loading classroom device status</span>
        </div>
      ) : error || !data ? (
        <div
          role="alert"
          className="rounded-panel border border-red-200 bg-red-50 p-6 dark:border-red-900/60 dark:bg-red-950/30"
        >
          <WifiOff className="h-6 w-6 text-danger" aria-hidden="true" />
          <h2 className="mt-3 font-semibold text-ink">
            We couldn&apos;t load the classroom device status.
          </h2>
          <p className="mt-2 text-sm text-danger">
            The page will retry automatically every 60 seconds.
          </p>
          <button
            type="button"
            onClick={() => void loadStatus()}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-control bg-danger px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry Now
          </button>
        </div>
      ) : (
        <>
          <section
            aria-labelledby="device-connection-title"
            className={`rounded-panel border p-5  sm:p-6 ${
              connected
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30"
                : "border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30"
            }`}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <span
                  className={`rounded-panel p-3 ${
                    connected
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                      : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
                  }`}
                >
                  {connected ? (
                    <Wifi className="h-6 w-6" aria-hidden="true" />
                  ) : (
                    <WifiOff className="h-6 w-6" aria-hidden="true" />
                  )}
                </span>
                <div>
                  <h2
                    id="device-connection-title"
                    className={`text-xl font-semibold ${
                      connected
                        ? "text-emerald-950 dark:text-emerald-100"
                        : "text-ink"
                    }`}
                  >
                    {connected
                      ? "Classroom Device Connected"
                      : "Classroom Device Offline"}
                  </h2>
                  <p
                    className={`mt-1 text-sm ${
                      connected
                        ? "text-emerald-800 dark:text-emerald-200"
                        : "text-danger"
                    }`}
                  >
                    {connected
                      ? "The monitoring system currently reports the device as online."
                      : "New classroom alerts may be delayed until the device reconnects."}
                  </p>
                </div>
              </div>

              <div className="rounded-control bg-bg p-4">
                <p className="flex items-center gap-2 text-xs font-semibold text-muted">
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                  Last Device Check-in
                </p>
                <p className="mt-2 font-semibold text-ink">
                  {data.last_heartbeat
                    ? formatTimestamp(data.last_heartbeat)
                    : "Not available"}
                </p>
              </div>
            </div>
          </section>

          <details className="mt-5 rounded-panel border border-line bg-bg p-5">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold text-ink">
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
              Technical Details
            </summary>
            <p className="mt-2 text-sm leading-6 text-muted">
              Device measurements and model versions for administrators and
              technical support.
            </p>

            <dl className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-control bg-surface p-4">
                <dt className="flex items-center gap-2 text-sm text-muted">
                  <Cpu className="h-4 w-4" aria-hidden="true" />
                  CPU usage
                </dt>
                <dd className="mt-2 text-xl font-semibold text-ink">
                  {data.cpu_usage != null
                    ? `${Math.round(data.cpu_usage)}%`
                    : "Not available"}
                </dd>
              </div>
              <div className="rounded-control bg-surface p-4">
                <dt className="flex items-center gap-2 text-sm text-muted">
                  <Thermometer className="h-4 w-4" aria-hidden="true" />
                  Temperature
                </dt>
                <dd className="mt-2 text-xl font-semibold text-ink">
                  {data.temperature != null
                    ? `${Math.round(data.temperature)}°C`
                    : "Not available"}
                </dd>
              </div>
              <div className="rounded-control bg-surface p-4">
                <dt className="flex items-center gap-2 text-sm text-muted">
                  <TimerReset className="h-4 w-4" aria-hidden="true" />
                  Device uptime
                </dt>
                <dd className="mt-2 text-xl font-semibold text-ink">
                  {data.uptime_seconds != null
                    ? formatUptime(data.uptime_seconds)
                    : "Not available"}
                </dd>
              </div>
            </dl>

            {(data.stt_model_version || data.yamnet_version) && (
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                {data.stt_model_version && (
                  <div className="rounded-control border border-line p-4">
                    <dt className="text-xs font-semibold text-muted">
                      Speech recognition model
                    </dt>
                    <dd className="mt-2 break-all font-mono text-sm text-ink">
                      {data.stt_model_version}
                    </dd>
                  </div>
                )}
                {data.yamnet_version && (
                  <div className="rounded-control border border-line p-4">
                    <dt className="text-xs font-semibold text-muted">
                      Sound Detection Model version
                    </dt>
                    <dd className="mt-2 break-all font-mono text-sm text-ink">
                      {data.yamnet_version}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </details>
        </>
      )}
    </div>
  );
}
