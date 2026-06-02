"use client";

import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAlerts } from "@/lib/AlertsProvider";
import { CalendarDays, Download, FileText } from "lucide-react";
import {
  AlertsPerDayBar,
  SeverityPie,
  ConfidenceOverTimeLine,
  PeakHoursHeatmap,
  EmotionDonut,
  TopKeywordsBar,
} from "@/components/Charts";

const CARD = "bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]";
const INPUT = "w-full px-4 py-2.5 bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors";
const TOAST_SUCCESS = { style: { background: "#1a1a2e", color: "#86efac", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "12px" } };

const reportHistory = [
  { id: "RPT-2026-001", generatedAt: "Today, 8:30 AM", totalIncidents: 24 },
  { id: "RPT-2026-002", generatedAt: "Yesterday, 4:15 PM", totalIncidents: 18 },
  { id: "RPT-2026-003", generatedAt: "May 31, 2026, 9:00 AM", totalIncidents: 31 },
];

export default function AnalyticsPage() {
  const { alerts, stats, loading } = useAlerts();

  const handleGenerateReport = () => {
    toast.success("Report generated", TOAST_SUCCESS);
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

      <div className={`${CARD} p-5 mb-5`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-indigo-500/10 shrink-0">
            <CalendarDays className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Date Range</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Generate a static analytics report</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 md:items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Date From
            </label>
            <input type="date" defaultValue="2026-06-01" className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Date To
            </label>
            <input type="date" defaultValue="2026-06-03" className={INPUT} />
          </div>
          <button
            type="button"
            onClick={handleGenerateReport}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity shadow-lg shadow-indigo-500/20"
          >
            <FileText className="w-4 h-4" />
            Generate Report
          </button>
        </div>
      </div>

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
        </div>
      )}

      <div className={`${CARD} mt-5 overflow-hidden`}>
        <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-white/10">
          <div className="p-2 rounded-xl bg-cyan-500/10 shrink-0">
            <FileText className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Report History</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Static generated report samples</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/10">
                <th className="text-left py-3 px-4 text-xs text-gray-400 dark:text-gray-500 font-medium">Report ID</th>
                <th className="text-left py-3 px-4 text-xs text-gray-400 dark:text-gray-500 font-medium">Generated At</th>
                <th className="text-left py-3 px-4 text-xs text-gray-400 dark:text-gray-500 font-medium">Total Incidents</th>
                <th className="text-right py-3 px-4 text-xs text-gray-400 dark:text-gray-500 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {reportHistory.map((report) => (
                <tr
                  key={report.id}
                  className="border-b border-gray-50 dark:border-white/5 hover:bg-indigo-50/50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-900 dark:text-white font-mono text-xs">{report.id}</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{report.generatedAt}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300 tabular-nums">{report.totalIncidents}</td>
                  <td className="py-3 px-4 text-right">
                    <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-indigo-500/10 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
