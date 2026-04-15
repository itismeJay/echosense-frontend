"use client";

import { motion } from "framer-motion";
import { useAlerts } from "@/lib/AlertsProvider";
import {
  AlertsPerDayBar,
  SeverityPie,
  ConfidenceOverTimeLine,
  PeakHoursHeatmap,
} from "@/components/Charts";

export default function AnalyticsPage() {
  const { alerts, loading } = useAlerts();

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
        </div>
      )}
    </motion.div>
  );
}
