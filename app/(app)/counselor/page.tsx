"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
    <article className="rounded-panel border border-line bg-bg p-5">
      <span className={`inline-flex rounded-control p-2.5 ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-semibold text-muted">
        {label}
      </p>
      <p className="mt-1 text-3xl font-semibold text-ink">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-muted">
        {helpText}
      </p>
    </article>
  );
}

export default function CounselorPage() {
  const { alerts, loading, error, refresh } = useAlerts();
  const [todayKey] = useState(() => localDateKey(new Date()));
  const [weekCutoff] = useState(
    () => Date.now() - 7 * 24 * 60 * 60 * 1000
  );


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
        <p className="text-sm font-semibold text-link">
          Guidance counselor
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink sm:text-3xl">
              Counselor Overview
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Review possible classroom concerns and recent alert patterns.
              Alerts remain unverified unless school procedures establish otherwise.
            </p>
          </div>
          <Link
            href="/analytics"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-link hover:bg-surface"
          >
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            Reports and Trends
          </Link>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-6 flex flex-col gap-3 rounded-panel border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/60 dark:bg-red-950/30"
        >
          <div>
            <p className="font-semibold text-ink">
              We couldn&apos;t load the counselor overview.
            </p>
            <p className="mt-1 text-sm text-danger">
              Please try again.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-danger px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
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
            tone="bg-surface text-link  "
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
            tone="bg-surface text-ink  "
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
          className="text-xl font-semibold text-ink"
        >
          This Week at a Glance
        </h2>
        <p className="mt-1 text-sm text-muted">
          Simple summaries based on recorded alert information.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <article className="rounded-panel border border-line bg-bg p-5">
            <h3 className="flex items-center gap-2 font-semibold text-ink">
              <Tags className="h-5 w-5 text-link" aria-hidden="true" />
              Possible Concern Categories
            </h3>
            <div className="mt-4 space-y-3">
              {categoryCounts.every((item) => item.count === 0) ? (
                <p className="text-sm text-muted">
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
                      <span className="text-sm text-ink">
                        {categoryLabel(item.key)}
                      </span>
                      <span className="rounded-full bg-surface px-3 py-1 text-sm font-semibold text-ink">
                        {item.count}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </article>

          <article className="rounded-panel border border-line bg-bg p-5">
            <h3 className="flex items-center gap-2 font-semibold text-ink">
              <Globe2 className="h-5 w-5 text-link" aria-hidden="true" />
              Alert Languages
            </h3>
            <div className="mt-4 space-y-3">
              {languageCounts.length === 0 ? (
                <p className="text-sm text-muted">
                  No language information is available this week.
                </p>
              ) : (
                languageCounts.map((item) => (
                  <div
                    key={item.language}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="text-sm text-ink">
                      {item.language}
                    </span>
                    <span className="rounded-full bg-surface px-3 py-1 text-sm font-semibold text-ink">
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
              className="text-xl font-semibold text-ink"
            >
              Recent Alerts
            </h2>
            <p className="mt-1 text-sm text-muted">
              Select an alert to view its available classroom context.
            </p>
          </div>
          <Link
            href="/alerts"
            className="inline-flex min-h-11 items-center rounded-control px-3 py-2 text-sm font-semibold text-link hover:bg-surface"
          >
            View all alerts
          </Link>
        </div>

        {loading && alerts.length === 0 ? (
          <AlertListSkeleton count={4} />
        ) : recentAlerts.length === 0 && !error ? (
          <div className="rounded-panel border border-line bg-bg p-8 text-center">
            <p className="font-semibold text-ink">
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
