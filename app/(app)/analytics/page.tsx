"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAlerts } from "@/lib/AlertsProvider";
import { CalendarDays, FileText, Loader2 } from "lucide-react";
import {
  AlertsPerDayBar,
  SeverityPie,
  ConfidenceOverTimeLine,
  PeakHoursHeatmap,
  EmotionDonut,
  TopKeywordsBar,
  CategoryBarChart,
  LanguageBreakdown,
} from "@/components/Charts";
import { getReports, generateReport, getCategoryStats } from "@/lib/api";
import type { Report, CategoryStats } from "@/lib/types";
import { formatTimestamp } from "@/lib/format";

const CARD = "bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]";
const INPUT = "w-full px-4 py-2.5 bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors";
const TOAST_SUCCESS = { style: { background: "#1a1a2e", color: "#86efac", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "12px" } };
const TOAST_ERROR   = { style: { background: "#1a1a2e", color: "#f87171", border: "1px solid rgba(239,68,68,0.35)", borderRadius: "12px" } };

export default function AnalyticsPage() {
  const { alerts, stats, loading } = useAlerts();

  const todayStr = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom]     = useState("2026-06-01");
  const [dateTo, setDateTo]         = useState(todayStr);
  const [generating, setGenerating] = useState(false);
  const [reports, setReports]       = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [categoryStats, setCategoryStats] = useState<CategoryStats | null>(null);

  useEffect(() => {
    getReports()
      .then(setReports)
      .catch(() => {})
      .finally(() => setReportsLoading(false));
  }, []);

  useEffect(() => {
    getCategoryStats()
      .then(setCategoryStats)
      .catch(() => {});
  }, []);

  const handleGenerateReport = async () => {
    if (!dateFrom || !dateTo || dateFrom > dateTo) {
      toast.error("Invalid date range — From must be before To", TOAST_ERROR);
      return;
    }
    setGenerating(true);
    try {
      const report = await generateReport({ date_from: dateFrom, date_to: dateTo });
      setReports((prev) => [report, ...prev]);
      toast.success("Report generated", TOAST_SUCCESS);
    } catch {
      toast.error("Failed to generate report", TOAST_ERROR);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-6 max-w-screen-xl"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Analytics</h1>
        <p className="text-gray-400 dark:text-gray-500 text-sm">
          Detection patterns and trends across all locations
        </p>
      </div>

      {/* ── Generate Report ───────────────────────────────────── */}
      <div className={`${CARD} p-5 mb-5`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-indigo-500/10 shrink-0">
            <CalendarDays className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Generate Report</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Export a summary of incidents within a date range
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 md:items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => setDateFrom(e.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              max={todayStr}
              onChange={(e) => setDateTo(e.target.value)}
              className={INPUT}
            />
          </div>
          <button
            type="button"
            onClick={() => void handleGenerateReport()}
            disabled={generating}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {generating ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </div>

      {/* ── Charts ───────────────────────────────────────────── */}
      {loading && alerts.length === 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl p-6 h-72 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[AlertsPerDayBar, SeverityPie, ConfidenceOverTimeLine, PeakHoursHeatmap].map(
            (Chart, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <Chart alerts={alerts} />
              </motion.div>
            )
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.4 }}
          >
            <EmotionDonut stats={stats} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <TopKeywordsBar alerts={alerts} stats={stats} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48, duration: 0.4 }}
          >
            <CategoryBarChart stats={categoryStats} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.56, duration: 0.4 }}
          >
            <LanguageBreakdown alerts={alerts} />
          </motion.div>
        </div>
      )}

      {/* ── Report History ───────────────────────────────────── */}
      <div className={`${CARD} mt-5 overflow-hidden`}>
        <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-white/10">
          <div className="p-2 rounded-xl bg-cyan-500/10 shrink-0">
            <FileText className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Report History</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {reportsLoading ? "Loading..." : `${reports.length} report${reports.length !== 1 ? "s" : ""} generated`}
            </p>
          </div>
        </div>

        {reportsLoading ? (
          <div className="animate-pulse p-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-4 px-4 py-4 border-b border-gray-50 dark:border-white/5">
                <div className="h-3 w-28 bg-gray-100 dark:bg-white/5 rounded-full" />
                <div className="h-3 w-40 bg-gray-100 dark:bg-white/5 rounded-full" />
                <div className="h-3 w-16 bg-gray-100 dark:bg-white/5 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10">
                  <th className="text-left py-3 px-4 text-xs text-gray-400 dark:text-gray-500 font-medium">Report ID</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-400 dark:text-gray-500 font-medium">Generated At</th>
                  <th className="text-left py-3 px-4 text-xs text-gray-400 dark:text-gray-500 font-medium">Total Incidents</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                      No reports generated yet — use the form above to create one
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr
                      key={report.report_id}
                      className="border-b border-gray-50 dark:border-white/5 hover:bg-indigo-50/50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400 font-mono text-xs truncate max-w-[200px]">
                        {report.report_id}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300 text-xs whitespace-nowrap">
                        {formatTimestamp(report.generated_at)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          {report.total_incidents} incident{report.total_incidents !== 1 ? "s" : ""}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
