"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  BellRing,
  CheckCircle2,
  Clock3,
  Globe2,
  RefreshCw,
  Tags,
} from "lucide-react";
import AlertCard from "@/components/AlertCard";
import AlertListSkeleton from "@/components/AlertListSkeleton";
import { localDateKey } from "@/lib/alert-presentation";
import { useAlerts } from "@/lib/AlertsProvider";
import { useCurrentUser } from "@/lib/auth";
import { categoryLabel, languageLabel } from "@/lib/format";

const CATEGORY_KEYS = [
  "academic_shaming",
  "appearance_shaming",
  "body_shaming",
  "emotional_taunting",
  "threat",
];

interface SummaryCardProps {
  label: string;
  value: number;
  helpText: string;
  icon: typeof BellRing;
  tone: string;
}

function SummaryCard({
  label,
  value,
  helpText,
  icon: Icon,
  tone,
}: SummaryCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <span className={`inline-flex rounded-xl p-2.5 ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {helpText}
      </p>
    </article>
  );
}

export default function CounselorPage() {
  const currentUser = useCurrentUser();
  const router = useRouter();
  const { alerts, loading, error, refresh } = useAlerts();
  const [todayKey] = useState(() => localDateKey(new Date()));
  const [weekCutoff] = useState(
    () => Date.now() - 7 * 24 * 60 * 60 * 1000
  );

  useEffect(() => {
    if (
      currentUser &&
      currentUser.role !== "admin" &&
      currentUser.role !== "counselor"
    ) {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  const todayAlerts = useMemo(
    () =>
      alerts.filter(
        (alert) => localDateKey(new Date(alert.created_at)) === todayKey
      ),
    [alerts, todayKey]
  );
  const weekAlerts = useMemo(
    () =>
      alerts.filter(
        (alert) => new Date(alert.created_at).getTime() >= weekCutoff
      ),
    [alerts, weekCutoff]
  );
  const recentAlerts = useMemo(
    () =>
      [...alerts]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 4),
    [alerts]
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const alert of weekAlerts) {
      for (const category of alert.categories ?? []) {
        counts.set(category, (counts.get(category) ?? 0) + 1);
      }
    }
    return CATEGORY_KEYS.map((key) => ({
      key,
      count: counts.get(key) ?? 0,
    })).sort((a, b) => b.count - a.count);
  }, [weekAlerts]);

  const languageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const alert of weekAlerts) {
      const key = languageLabel(alert.language);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([language, count]) => ({
        language,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [weekAlerts]);

  if (
    currentUser &&
    currentUser.role !== "admin" &&
    currentUser.role !== "counselor"
  ) {
    return null;
  }

  const waitingToday = todayAlerts.filter(
    (alert) => alert.status === "active"
  ).length;
  const resolvedToday = todayAlerts.filter(
    (alert) => alert.status === "resolved"
  ).length;
  const highPriorityToday = todayAlerts.filter(
    (alert) => alert.severity === "high"
  ).length;

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
          Guidance counselor
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl dark:text-white">
              Counselor Overview
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Review possible classroom concerns and recent alert patterns.
              Alerts remain unverified unless school procedures establish otherwise.
            </p>
          </div>
          <Link
            href="/analytics"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-800 hover:bg-indigo-100 focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200"
          >
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            Reports and Trends
          </Link>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/60 dark:bg-red-950/30"
        >
          <div>
            <p className="font-semibold text-red-950 dark:text-red-100">
              We couldn&apos;t load the counselor overview.
            </p>
            <p className="mt-1 text-sm text-red-800 dark:text-red-200">
              Please try again.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-700"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      <section aria-labelledby="counselor-summary">
        <h2 id="counselor-summary" className="sr-only">
          Alert summary
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Waiting for Attention"
            value={waitingToday}
            helpText="Possible alerts marked active today."
            icon={BellRing}
            tone="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200"
          />
          <SummaryCard
            label="Marked Resolved Today"
            value={resolvedToday}
            helpText="Alerts already marked resolved by the existing system."
            icon={CheckCircle2}
            tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200"
          />
          <SummaryCard
            label="Alerts This Week"
            value={weekAlerts.length}
            helpText="Possible alerts recorded during the last seven days."
            icon={Clock3}
            tone="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
          <SummaryCard
            label="High Priority Today"
            value={highPriorityToday}
            helpText="High-priority possible alerts recorded today."
            icon={AlertTriangle}
            tone="bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-200"
          />
        </div>
      </section>

      <section className="mt-8" aria-labelledby="weekly-patterns">
        <h2
          id="weekly-patterns"
          className="text-xl font-bold text-slate-950 dark:text-white"
        >
          This Week at a Glance
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Simple summaries based on recorded alert information.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="flex items-center gap-2 font-bold text-slate-950 dark:text-white">
              <Tags className="h-5 w-5 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
              Possible Concern Categories
            </h3>
            <div className="mt-4 space-y-3">
              {categoryCounts.every((item) => item.count === 0) ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  No category information is available this week.
                </p>
              ) : (
                categoryCounts
                  .filter((item) => item.count > 0)
                  .map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-4"
                    >
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        {categoryLabel(item.key)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                        {item.count}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="flex items-center gap-2 font-bold text-slate-950 dark:text-white">
              <Globe2 className="h-5 w-5 text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
              Alert Languages
            </h3>
            <div className="mt-4 space-y-3">
              {languageCounts.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  No language information is available this week.
                </p>
              ) : (
                languageCounts.map((item) => (
                  <div
                    key={item.language}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-200">
                      {item.language}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                      {item.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="counselor-recent-alerts">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="counselor-recent-alerts"
              className="text-xl font-bold text-slate-950 dark:text-white"
            >
              Recent Alerts
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Select an alert to view its available classroom context.
            </p>
          </div>
          <Link
            href="/alerts"
            className="inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
          >
            View all alerts
          </Link>
        </div>

        {loading && alerts.length === 0 ? (
          <AlertListSkeleton count={4} />
        ) : recentAlerts.length === 0 && !error ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="font-semibold text-slate-950 dark:text-white">
              No classroom alerts are available.
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
    </div>
  );
}
