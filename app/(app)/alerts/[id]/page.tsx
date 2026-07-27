"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Info,
  MapPin,
  RefreshCw,
} from "lucide-react";
import AlertEvidence from "@/components/AlertEvidence";
import AlertListSkeleton from "@/components/AlertListSkeleton";
import SeverityBadge from "@/components/SeverityBadge";
import { alertStatusLabel, alertSummary } from "@/lib/alert-presentation";
import { useAlerts } from "@/lib/AlertsProvider";
import { formatTimestamp } from "@/lib/format";

export default function AlertDetailPage() {
  const params = useParams<{ id: string }>();
  const { alerts, loading, error, refresh } = useAlerts();
  const alertId = Number(params.id);
  const alert = Number.isFinite(alertId)
    ? alerts.find((item) => item.id === alertId)
    : undefined;

  if (loading && alerts.length === 0) {
    return (
      <div className="mx-auto max-w-4xl p-4 md:p-6 lg:p-8">
        <div className="mb-6 h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <AlertListSkeleton count={1} />
      </div>
    );
  }

  if (error && !alert) {
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
            We couldn&apos;t load this classroom alert.
          </h1>
          <p className="mt-2 text-sm text-red-800 dark:text-red-200">
            Please try again.
          </p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      </main>
    );
  }

  if (!alert) {
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

      <header className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
              Classroom Monitoring System
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl dark:text-white">
              Possible Aggression Alert
            </h1>
          </div>
          <SeverityBadge severity={alert.severity} dot />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-950/60">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Classroom
              </p>
              <p className="mt-1 font-semibold text-slate-950 dark:text-white">
                {alert.location}
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
                {formatTimestamp(alert.created_at)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-950 dark:text-white">
            {alertStatusLabel(alert)}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
            {alertSummary(alert)}
          </p>
        </div>

        <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100">
          <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            This is an automated, unverified alert. Use the available classroom
            context and follow your school&apos;s procedures before drawing a conclusion.
          </p>
        </div>
      </header>

      <section className="mt-6" aria-label="Alert information">
        <AlertEvidence alert={alert} defaultExpanded hideToggle />
      </section>
    </main>
  );
}
