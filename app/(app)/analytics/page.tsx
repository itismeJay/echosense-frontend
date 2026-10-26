"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  CalendarDays,
  ChevronDown,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  AlertsPerDayBar,
  CategoryBarChart,
  ConfidenceOverTimeLine,
  EmotionDonut,
  LanguageBreakdown,
  PeakHoursHeatmap,
  SeverityPie,
  TopKeywordsBar,
} from "@/components/Charts";
import { useAlerts } from "@/lib/AlertsProvider";
import {
  generateReport,
  getCategoryStats,
  getReports,
} from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import type { CategoryStats, Report } from "@/lib/types";

const INPUT =
  "min-h-11 w-full rounded-control border border-line-strong bg-bg px-3 py-2 text-sm text-ink       ";

export default function AnalyticsPage() {
  const {
    alerts,
    stats,
    loading,
    error: alertsError,
    refresh,
  } = useAlerts();
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [dateFrom, setDateFrom] = useState(() => {
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return start.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(today);
  const [generating, setGenerating] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState(false);
  const [categoryStats, setCategoryStats] =
    useState<CategoryStats | null>(null);

  const loadReportData = useCallback(async () => {
    setReportsLoading(true);
    setReportsError(false);
    const [reportsResult, categoryResult] = await Promise.allSettled([
      getReports(),
      getCategoryStats(),
    ]);
    if (reportsResult.status === "fulfilled") {
      setReports(reportsResult.value);
    } else {
      setReportsError(true);
    }
    if (categoryResult.status === "fulfilled") {
      setCategoryStats(categoryResult.value);
    }
    setReportsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadReportData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadReportData]);

  const handleGenerateReport = async () => {
    if (!dateFrom || !dateTo || dateFrom > dateTo) {
      toast.error("Choose a valid date range.");
      return;
    }
    setGenerating(true);
    try {
      const report = await generateReport({
        date_from: dateFrom,
        date_to: dateTo,
      });
      setReports((current) => [report, ...current]);
      toast.success("Report generated.");
    } catch {
      toast.error("We couldn’t generate the report. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8">
      <header className="mb-6">
        <p className="text-sm font-semibold text-link">
          Guidance and administration
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-ink sm:text-3xl">
          Reports and Trends
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          View patterns in recorded alerts. These summaries describe automated,
          unverified alerts rather than confirmed incidents.
        </p>
      </header>

      {alertsError && (
        <div
          role="alert"
          className="mb-6 flex flex-col gap-3 rounded-panel border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/60 dark:bg-red-950/30"
        >
          <div>
            <p className="font-semibold text-ink">
              We couldn&apos;t load alert trends.
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

      <section
        aria-labelledby="generate-report-title"
        className="rounded-panel border border-line bg-bg p-5"
      >
        <div className="flex gap-3">
          <span className="rounded-control bg-surface p-2.5 text-link">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="generate-report-title"
              className="font-semibold text-ink"
            >
              Generate Report
            </h2>
            <p className="mt-1 text-sm text-muted">
              Create and save a report for a selected date range.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <label
              htmlFor="report-date-from"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              From
            </label>
            <input
              id="report-date-from"
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(event) => setDateFrom(event.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label
              htmlFor="report-date-to"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              To
            </label>
            <input
              id="report-date-to"
              type="date"
              value={dateTo}
              min={dateFrom}
              max={today}
              onChange={(event) => setDateTo(event.target.value)}
              className={INPUT}
            />
          </div>
          <button
            type="button"
            onClick={() => void handleGenerateReport()}
            disabled={generating}
            aria-busy={generating}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileText className="h-4 w-4" aria-hidden="true" />
            )}
            {generating ? "Generating…" : "Generate Report"}
          </button>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="alert-trends-title">
        <h2
          id="alert-trends-title"
          className="text-xl font-semibold text-ink"
        >
          Alert Trends
        </h2>
        <p className="mt-1 text-sm text-muted">
          Summaries based on the alert records currently available.
        </p>

        {loading && alerts.length === 0 ? (
          <div
            role="status"
            className="mt-4 grid gap-4 lg:grid-cols-2"
          >
            <span className="sr-only">Loading alert trends</span>
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-panel border border-line bg-bg"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <AlertsPerDayBar alerts={alerts} />
              <SeverityPie alerts={alerts} />
              <CategoryBarChart stats={categoryStats} />
              <LanguageBreakdown alerts={alerts} />
              <PeakHoursHeatmap alerts={alerts} />
              <EmotionDonut stats={stats} />
            </div>

            <details className="mt-4 rounded-panel border border-line bg-bg p-5">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold text-ink">
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
                Additional Signal Analysis
              </summary>
              <p className="mt-2 text-sm leading-6 text-muted">
                These technical and potentially sensitive summaries are supporting
                information only and do not confirm an incident.
              </p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <ConfidenceOverTimeLine alerts={alerts} />
                <TopKeywordsBar alerts={alerts} stats={stats} />
              </div>
            </details>
          </>
        )}
      </section>

      <section className="mt-8" aria-labelledby="report-history-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="report-history-title"
              className="text-xl font-semibold text-ink"
            >
              Report History
            </h2>
            <p className="mt-1 text-sm text-muted">
              Previously generated alert reports.
            </p>
          </div>
          {reportsError && (
            <button
              type="button"
              onClick={() => void loadReportData()}
              className="inline-flex min-h-11 items-center gap-2 rounded-control border border-line-strong px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
          )}
        </div>

        {reportsLoading ? (
          <div role="status" className="mt-4 grid gap-3 sm:grid-cols-2">
            <span className="sr-only">Loading report history</span>
            {[0, 1].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-panel bg-surface"
              />
            ))}
          </div>
        ) : reportsError ? (
          <div
            role="alert"
            className="mt-4 rounded-panel border border-red-200 bg-red-50 p-5 text-red-950 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-100"
          >
            We couldn&apos;t load report history.
          </div>
        ) : reports.length === 0 ? (
          <div className="mt-4 rounded-panel border border-line bg-bg p-8 text-center">
            <p className="font-semibold text-ink">
              No reports have been generated yet.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {reports.map((report) => (
              <article
                key={report.report_id}
                className="rounded-panel border border-line bg-bg p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <FileText className="h-5 w-5 shrink-0 text-link" aria-hidden="true" />
                  <span className="rounded-full bg-surface px-3 py-1 text-sm font-semibold text-link">
                    {report.total_incidents} alert
                    {report.total_incidents === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mt-4 text-sm font-semibold text-ink">
                  Generated {formatTimestamp(report.generated_at)}
                </p>
                <p className="mt-2 break-all text-xs text-muted">
                  Report reference: {report.report_id}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
