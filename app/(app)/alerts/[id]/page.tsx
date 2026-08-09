"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Fingerprint,
  Hash,
  MapPin,
  RefreshCw,
} from "lucide-react";
import AlertEvidence from "@/components/AlertEvidence";
import AlertListSkeleton from "@/components/AlertListSkeleton";
import SeverityBadge from "@/components/SeverityBadge";
import {
  REQUIRED_REVIEW_NOTICE,
  classroomLabel,
  deliveryStatusLabel,
  isTestAlert,
  pushStatusLabel,
  reviewStatusLabel,
  schoolLabel,
  severitySummary,
  triggerTypeLabel,
} from "@/lib/alert-presentation";
import { ApiError, getAlert } from "@/lib/api";
import { useAlerts } from "@/lib/AlertsProvider";
import { formatTimestamp } from "@/lib/format";
import type { Alert } from "@/lib/types";

export default function AlertDetailPage() {
  const params = useParams<{ id: string }>();
  const { alerts } = useAlerts();
  const alertId = Number(params.id);
  const providerAlert = Number.isInteger(alertId)
    ? alerts.find((item) => item.id === alertId)
    : undefined;
  const [alert, setAlert] = useState<Alert | undefined>(providerAlert);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const requestInFlightRef = useRef(false);
  const alertRef = useRef<Alert | undefined>(providerAlert);

  const loadAlert = useCallback(async () => {
    if (requestInFlightRef.current) return;
    if (!Number.isInteger(alertId) || alertId < 1) {
      setAlert(undefined);
      setErrorStatus(404);
      setLoading(false);
      return;
    }
    requestInFlightRef.current = true;
    if (alertRef.current) setRefreshing(true);
    else setLoading(true);
    setErrorStatus(null);
    try {
      const nextAlert = await getAlert(alertId);
      alertRef.current = nextAlert;
      setAlert(nextAlert);
      setLastUpdated(new Date());
    } catch (error) {
      setErrorStatus(error instanceof ApiError ? error.status : 500);
    } finally {
      setLoading(false);
      setRefreshing(false);
      requestInFlightRef.current = false;
    }
  }, [alertId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadAlert();
    }, 0);
    const interval = setInterval(() => {
      void loadAlert();
    }, 10_000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [loadAlert]);

  if (loading && !alert) {
    return (
      <div className="mx-auto max-w-4xl p-4 md:p-6 lg:p-8">
        <div className="mb-6 h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <AlertListSkeleton count={1} />
      </div>
    );
  }

  if (
    errorStatus !== null &&
    errorStatus !== 404 &&
    (!alert || errorStatus === 401 || errorStatus === 403)
  ) {
    const forbidden = errorStatus === 403;
    const unauthorized = errorStatus === 401;
    return (
      <main className="mx-auto max-w-4xl p-4 md:p-6 lg:p-8">
        <Link
          href="/alerts"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-indigo-300"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Alerts
        </Link>
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/60 dark:bg-red-950/30"
        >
          <h1 className="text-xl font-bold text-red-950 dark:text-red-100">
            {unauthorized
              ? "Your session is no longer authorized."
              : forbidden
              ? "You do not have permission to view this alert."
              : "We couldn’t load this classroom alert."}
          </h1>
          <p className="mt-2 text-sm text-red-800 dark:text-red-200">
            {unauthorized
              ? "Sign in again to continue."
              : forbidden
              ? "Contact an administrator if you believe you should have access."
              : "The service may be temporarily unavailable. Please try again."}
          </p>
          {!forbidden && !unauthorized && (
            <button
              type="button"
              onClick={() => void loadAlert()}
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
          )}
        </div>
      </main>
    );
  }

  if (errorStatus === 404 || !alert) {
    return (
      <main className="mx-auto max-w-4xl p-4 md:p-6 lg:p-8">
        <Link
          href="/alerts"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-indigo-300"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Alerts
        </Link>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-xl font-bold text-slate-950 dark:text-white">
            Alert not found
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            This alert is not available in the current alert history.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-4 md:p-6 lg:p-8">
      <Link
        href="/alerts"
        className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-indigo-300"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Alerts
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span>{lastUpdated ? `Last refreshed ${lastUpdated.toLocaleTimeString()}` : "Refreshing current status…"}</span>
        <button
          type="button"
          onClick={() => void loadAlert()}
          disabled={refreshing}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
          Refresh status
        </button>
      </div>

      {errorStatus !== null && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100"
        >
          The latest alert details could not be refreshed. The validated
          evidence shown below came from the alert list.
        </div>
      )}

      {isTestAlert(alert) && (
        <div className="mt-4 rounded-2xl border-4 border-blue-600 bg-blue-50 p-5 text-blue-950 dark:bg-blue-950/50 dark:text-blue-100">
          <p className="text-lg font-black tracking-wide">TEST ALERT — NOT A REAL INCIDENT</p>
          <p className="mt-1 text-sm">Synthetic test data for end-to-end delivery verification.</p>
        </div>
      )}

      <header className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
              Classroom Monitoring System
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl dark:text-white">
              Possible aggression alert
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {severitySummary(alert.severity)}
            </p>
          </div>
          <SeverityBadge severity={alert.severity} dot />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-950/60">
            <Hash className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Alert ID
              </p>
              <p className="mt-1 break-all font-semibold text-slate-950 dark:text-white">
                {alert.id}
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-950/60">
            <Fingerprint className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Event ID
              </p>
              <p className="mt-1 break-all font-mono text-sm font-semibold text-slate-950 dark:text-white">
                {alert.event_id ?? "Not recorded for this alert"}
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-950/60">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Classroom
              </p>
              <p className="mt-1 font-semibold text-slate-950 dark:text-white">
                {classroomLabel(alert)}
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-950/60">
            <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Detection Time
              </p>
              <p className="mt-1 font-semibold text-slate-950 dark:text-white">
                {formatTimestamp(alert.trigger_timestamp ?? alert.event_start_timestamp ?? alert.created_at)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-950 dark:text-white">
            {alert.review_message || REQUIRED_REVIEW_NOTICE}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
            Review status: {reviewStatusLabel(alert)}
          </p>
        </div>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <dt className="font-semibold text-slate-950 dark:text-white">Trigger information</dt>
            <dd className="mt-1 text-slate-700 dark:text-slate-200">{triggerTypeLabel(alert)} · Schema version {alert.schema_version ?? "legacy"}</dd>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <dt className="font-semibold text-slate-950 dark:text-white">Trusted school</dt>
            <dd className="mt-1 text-slate-700 dark:text-slate-200">{schoolLabel(alert)}</dd>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <dt className="font-semibold text-slate-950 dark:text-white">Trusted device</dt>
            <dd className="mt-1 text-slate-700 dark:text-slate-200">
              {alert.device_display_name || alert.device_code || alert.device_id || "Device identity unavailable"}
              {alert.device_code && alert.device_display_name ? ` · ${alert.device_code}` : ""}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <dt className="font-semibold text-slate-950 dark:text-white">Delivery and push state</dt>
            <dd className="mt-1 text-slate-700 dark:text-slate-200">Delivery: {deliveryStatusLabel(alert)} · Push: {pushStatusLabel(alert)}</dd>
          </div>
        </dl>

        <section className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700" aria-labelledby="event-timeline-title">
          <h2 id="event-timeline-title" className="text-sm font-semibold text-slate-950 dark:text-white">Event timeline</h2>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
            <div><dt className="font-medium">Event start</dt><dd className="mt-1 text-slate-600 dark:text-slate-300">{alert.event_start_timestamp ? formatTimestamp(alert.event_start_timestamp) : "Not recorded"}</dd></div>
            <div><dt className="font-medium">Trigger time</dt><dd className="mt-1 text-slate-600 dark:text-slate-300">{alert.trigger_timestamp ? formatTimestamp(alert.trigger_timestamp) : "Not recorded"}</dd></div>
            <div><dt className="font-medium">Event end</dt><dd className="mt-1 text-slate-600 dark:text-slate-300">{alert.event_end_timestamp ? formatTimestamp(alert.event_end_timestamp) : "Not recorded"}</dd></div>
          </dl>
        </section>
      </header>

      <section className="mt-6" aria-label="Alert information">
        <AlertEvidence alert={alert} defaultExpanded hideToggle />
      </section>
    </main>
  );
}
