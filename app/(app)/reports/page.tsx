"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FileText } from "lucide-react";
import {
  AlertsPerDayBar,
  CommonTimes,
  CommonWords,
  ConcernTypes,
  LanguageBreakdown,
  SeverityBreakdown,
} from "@/components/Charts";
import { Button, EmptyState, ErrorState, LoadingRows, Page, PageHeader, Panel, inputClass, labelClass } from "@/components/ui";
import { useAlerts } from "@/lib/AlertsProvider";
import { generateReport, getCategoryStats, getReports } from "@/lib/api";
import { formatDate, formatTimestamp } from "@/lib/format";
import type { CategoryStats, Report } from "@/lib/types";

function isoDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfWeek(now: Date): number {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start.getTime();
}

export default function ReportsPage() {
  const { alerts, loading, error, refresh } = useAlerts();
  const [now] = useState(() => new Date());
  const [dateFrom, setDateFrom] = useState(() => {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return isoDay(start);
  });
  const [dateTo, setDateTo] = useState(() => isoDay(now));
  const [generating, setGenerating] = useState(false);
  const [reports, setReports] = useState<Report[] | null>(null);
  const [reportsError, setReportsError] = useState(false);
  const [categoryStats, setCategoryStats] = useState<CategoryStats | null>(null);

  const load = useCallback(async () => {
    setReportsError(false);
    const [reportsResult, categoryResult] = await Promise.allSettled([getReports(), getCategoryStats()]);
    if (reportsResult.status === "fulfilled") setReports(reportsResult.value);
    else setReportsError(true);
    if (categoryResult.status === "fulfilled") setCategoryStats(categoryResult.value);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const week = useMemo(() => {
    const since = startOfWeek(now);
    const inWeek = alerts.filter((alert) => new Date(alert.created_at).getTime() >= since);
    return {
      total: inWeek.length,
      high: inWeek.filter((alert) => alert.severity === "high").length,
      reviewed: inWeek.filter((alert) => alert.status === "reviewed" || alert.status === "resolved").length,
    };
  }, [alerts, now]);

  const handleGenerate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dateFrom || !dateTo || dateFrom > dateTo) {
      toast.error("The start date must be on or before the end date.");
      return;
    }
    setGenerating(true);
    try {
      const report = await generateReport({ date_from: dateFrom, date_to: dateTo });
      setReports((current) => [report, ...(current ?? [])]);
      toast.success("Report generated");
    } catch (caught) {
      toast.error(caught instanceof Error ? `${caught.message} The report was not generated.` : "The report was not generated. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Page>
      <PageHeader
        title="Reports"
        description="Patterns in recorded alerts. These count possible concerns flagged by devices, not confirmed incidents."
      />

      {error && alerts.length === 0 && (
        <div className="mb-6">
          <ErrorState title="EchoSense can't load alert trends right now" onRetry={() => void refresh()}>
            Check the internet connection, then try again.
          </ErrorState>
        </div>
      )}

      <section aria-labelledby="week-title" className="mb-8">
        <h2 id="week-title" className="text-title font-semibold text-ink">
          This week
        </h2>
        <dl className="mt-3 grid grid-cols-3 gap-4 sm:max-w-xl">
          {[
            ["Alerts", week.total],
            ["High", week.high],
            ["Reviewed or resolved", week.reviewed],
          ].map(([label, value]) => (
            <div key={label} className="border-l-2 border-line pl-3">
              <dt className="text-small text-muted">{label}</dt>
              <dd className="num text-figure font-medium text-ink">{loading ? "…" : value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <AlertsPerDayBar alerts={alerts} />
        <SeverityBreakdown alerts={alerts} />
        <CommonTimes alerts={alerts} />
        <ConcernTypes stats={categoryStats} alerts={alerts} />
        <LanguageBreakdown alerts={alerts} />
        <CommonWords alerts={alerts} />
      </div>

      <section aria-labelledby="generate-title" className="mt-10">
        <h2 id="generate-title" className="text-title font-semibold text-ink">
          Saved reports
        </h2>
        <p className="mt-1 text-body text-muted">Generate a report to keep a count of alerts for a date range.</p>
        <form onSubmit={handleGenerate} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="report-from" className={labelClass}>
              From
            </label>
            <input
              id="report-from"
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(event) => setDateFrom(event.target.value)}
              className={`${inputClass} w-44`}
            />
          </div>
          <div>
            <label htmlFor="report-to" className={labelClass}>
              To
            </label>
            <input
              id="report-to"
              type="date"
              value={dateTo}
              min={dateFrom}
              max={isoDay(now)}
              onChange={(event) => setDateTo(event.target.value)}
              className={`${inputClass} w-44`}
            />
          </div>
          <Button type="submit" variant="primary" icon={FileText} pending={generating}>
            Generate report
          </Button>
        </form>

        <Panel className="mt-4" bodyClassName="">
          {reportsError ? (
            <div className="p-4">
              <ErrorState title="Saved reports couldn't be loaded" onRetry={() => void load()}>
                Check the internet connection, then try again.
              </ErrorState>
            </div>
          ) : reports === null ? (
            <LoadingRows rows={2} label="Loading reports" />
          ) : reports.length === 0 ? (
            <EmptyState title="No reports yet" icon={FileText}>
              Choose a date range above and select Generate report.
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-body">
                <thead className="border-b border-line text-small text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-normal">Date range</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-normal">Alerts</th>
                    <th scope="col" className="hidden px-4 py-2.5 font-normal sm:table-cell">Created by</th>
                    <th scope="col" className="px-4 py-2.5 font-normal">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {reports.map((report) => (
                    <tr key={report.report_id}>
                      <td className="num px-4 py-3 text-ink">
                        {report.date_from && report.date_to
                          ? `${formatDate(`${report.date_from}T00:00:00`)} to ${formatDate(`${report.date_to}T00:00:00`)}`
                          : "Date range not recorded"}
                      </td>
                      <td className="num px-4 py-3 text-right text-ink">{report.total_incidents}</td>
                      <td className="hidden px-4 py-3 text-muted sm:table-cell">{report.generated_by_email ?? "—"}</td>
                      <td className="num px-4 py-3 text-muted">{formatTimestamp(report.generated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </section>
    </Page>
  );
}
