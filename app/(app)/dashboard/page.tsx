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
  WifiOff,
} from "lucide-react";

export default function DashboardPage() {
  const { alerts, logs, stats, loading, online } = useAlerts();

  const latestAlert = alerts[0];
  const isDetected  = latestAlert?.severity === "high";
  const liveFeed    = alerts.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-6 space-y-5 max-w-screen-xl"
    >
      {loading && alerts.length === 0 ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 h-40 bg-white/60 dark:bg-white/5 rounded-2xl border border-white/80 dark:border-white/10" />
            <div className="h-40 bg-white/60 dark:bg-white/5 rounded-2xl border border-white/80 dark:border-white/10" />
          </div>
          <div className="h-28 bg-white/60 dark:bg-white/5 rounded-2xl border border-white/80 dark:border-white/10" />
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white/60 dark:bg-white/5 rounded-2xl border border-white/80 dark:border-white/10" />
            ))}
          </div>
          <div className="h-64 bg-white/60 dark:bg-white/5 rounded-2xl border border-white/80 dark:border-white/10" />
        </div>
      ) : !loading && !online && alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="p-4 rounded-2xl bg-gray-500/10 border border-gray-500/20">
            <WifiOff className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
              Connecting to backend...
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-xs">
              The backend is waking up. Data will appear automatically once connected.
            </p>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600">Retrying every 3 seconds</p>
        </div>
      ) : (
        <>
          {isDetected && latestAlert && (
            <AlertBanner key={latestAlert.id} alert={latestAlert} />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <DetectionStatus
                state={isDetected ? "detected" : "listening"}
                latest={latestAlert}
              />
            </div>
            <ConfidenceMeter value={latestAlert?.confidence ?? 0} />
          </div>

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

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: "Total Alerts",    value: stats.total_alerts,    icon: Activity,      accent: "indigo"  },
              { label: "High Severity",   value: stats.high_severity,   icon: ShieldAlert,   accent: "red"     },
              { label: "Medium Severity", value: stats.medium_severity, icon: AlertTriangle, accent: "amber"   },
              { label: "Low Severity",    value: stats.low_severity,    icon: AlertCircle,   accent: "emerald" },
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

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
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

            <div className="lg:col-span-3 bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Recent Logs
              </h2>
              <LogsTable rows={logs} pageSize={10} paginated={false} sortable={false} />
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
