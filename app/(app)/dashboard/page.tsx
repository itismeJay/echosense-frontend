"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAlerts } from "@/lib/AlertsProvider";
import { formatConfidence, formatRelative } from "@/lib/format";
import StatCard from "@/components/StatCard";
import AudioVisualizer from "@/components/AudioVisualizer";
import DetectionStatus from "@/components/DetectionStatus";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import AlertBanner from "@/components/AlertBanner";
import LogsTable from "@/components/LogsTable";
import SeverityBadge from "@/components/SeverityBadge";
import {
  Activity,
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";

export default function DashboardPage() {
  const { alerts, logs, stats, loading } = useAlerts();

  const latestAlert = alerts[0];
  const isDetected = latestAlert?.severity === "high";
  const liveFeed = alerts.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-6 space-y-5 max-w-screen-xl"
    >
      {/* HIGH alert banner — key resets dismissed state when a new alert arrives */}
      {isDetected && latestAlert && (
        <AlertBanner key={latestAlert.id} alert={latestAlert} />
      )}

      {/* Row 1: Detection Status + Confidence Meter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <DetectionStatus
            state={isDetected ? "detected" : "listening"}
            latest={latestAlert}
          />
        </div>
        <ConfidenceMeter value={latestAlert?.confidence ?? 0} />
      </div>

      {/* Row 2: Audio Visualizer */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl px-6 py-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest font-medium">
            Live Audio Feed — Raspberry Pi 5
          </p>
          <span className="flex items-center gap-1.5 text-xs text-emerald-500 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Always On
          </span>
        </div>
        <AudioVisualizer
          variant="dashboard"
          intensity={isDetected ? "alert" : "idle"}
        />
      </div>

      {/* Row 3: Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Total Alerts",   value: loading && !stats.total_alerts   ? undefined : stats.total_alerts,   icon: Activity,     accent: "indigo"  },
          { label: "High Severity",  value: loading && !stats.high_severity  ? undefined : stats.high_severity,  icon: ShieldAlert,  accent: "red"     },
          { label: "Medium Severity",value: loading && !stats.medium_severity? undefined : stats.medium_severity,icon: AlertTriangle, accent: "amber"  },
          { label: "Low Severity",   value: loading && !stats.low_severity   ? undefined : stats.low_severity,   icon: AlertCircle,  accent: "emerald" },
        ].map(({ label, value, icon, accent }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <StatCard
              label={label}
              value={value}
              icon={icon}
              accent={accent as "indigo" | "red" | "amber" | "emerald"}
            />
          </motion.div>
        ))}
      </div>

      {/* Row 4: Live feed + Recent logs */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Live alerts feed */}
        <div className="lg:col-span-2 bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Alerts Feed
          </h2>
          <div className="space-y-2">
            {liveFeed.length === 0 && (
              <p className="text-gray-400 dark:text-gray-600 text-sm py-4 text-center">
                No alerts yet...
              </p>
            )}
            <AnimatePresence mode="popLayout">
              {liveFeed.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -40, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 p-3 bg-white/60 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/8 transition-colors"
                >
                  <SeverityBadge severity={alert.severity} dot />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                      {alert.location}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-600">
                      {formatRelative(alert.created_at)}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-gray-400 shrink-0">
                    {formatConfidence(alert.confidence)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Recent logs table */}
        <div className="lg:col-span-3 bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Recent Logs
          </h2>
          <LogsTable rows={logs} pageSize={10} paginated={false} sortable={false} />
        </div>
      </div>
    </motion.div>
  );
}
