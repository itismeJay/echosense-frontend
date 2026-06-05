"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAlerts } from "@/lib/AlertsProvider";
import { formatConfidence, formatRelative, emotionBadgeColor, categoryBadgeColor, categoryLabel, languageLabel } from "@/lib/format";
import StatCard from "@/components/StatCard";
import AlertEvidence from "@/components/AlertEvidence";
import AudioVisualizer from "@/components/AudioVisualizer";
import DetectionStatus from "@/components/DetectionStatus";
import ConfidenceMeter from "@/components/ConfidenceMeter";
import AlertBanner from "@/components/AlertBanner";
import LogsTable from "@/components/LogsTable";
import SeverityBadge from "@/components/SeverityBadge";
import CategoryBadge from "@/components/CategoryBadge";
import { CategoryBarChart, LanguageBreakdown } from "@/components/Charts";
import { getCategoryStats, getHeartbeat } from "@/lib/api";
import type { CategoryStats } from "@/lib/types";
import {
  Activity,
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  WifiOff,
  Cpu,
} from "lucide-react";

export default function DashboardPage() {
  const { alerts, logs, stats, loading, online } = useAlerts();
  const [categoryStats, setCategoryStats] = useState<CategoryStats | null>(null);
  const [piOnline, setPiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPi = async () => {
      try {
        const data = await getHeartbeat();
        const isOnline = data.last_heartbeat
          ? Date.now() - new Date(data.last_heartbeat).getTime() < 3 * 60 * 1000
          : data.device_status === "online";
        setPiOnline(isOnline);
      } catch {
        setPiOnline(false);
      }
    };
    void checkPi();
    const id = setInterval(() => void checkPi(), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    getCategoryStats().then(setCategoryStats).catch(() => {});
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const todayAlerts = useMemo(
    () => alerts.filter((a) => a.created_at.startsWith(today)),
    [alerts, today]
  );

  const todayHigh   = todayAlerts.filter((a) => a.severity === "high").length;
  const todayMedium = todayAlerts.filter((a) => a.severity === "medium").length;
  const todayLow    = todayAlerts.filter((a) => a.severity === "low").length;

  const topTodayCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of todayAlerts) {
      for (const cat of a.categories ?? []) {
        counts[cat] = (counts[cat] ?? 0) + 1;
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }, [todayAlerts]);

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
          <div className="h-16 bg-white/60 dark:bg-white/5 rounded-2xl border border-white/80 dark:border-white/10" />
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
          {/* ── Today Summary Banner ── */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl px-5 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
            {todayAlerts.length === 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  No incidents today
                </span>
                <span className="text-sm">✅</span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Today</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums">
                    {todayAlerts.length}
                    <span className="text-sm font-normal text-gray-400 ml-1">alert{todayAlerts.length !== 1 ? "s" : ""}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/15 dark:text-red-400">
                    {todayHigh} High
                  </span>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400">
                    {todayMedium} Medium
                  </span>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400">
                    {todayLow} Low
                  </span>
                </div>
                {topTodayCategory && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500">Most common:</span>
                    <CategoryBadge category={topTodayCategory} size="md" />
                  </div>
                )}
              </div>
            )}
          </div>

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

          {/* ── Audio Feed + Pi Status ── */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl px-6 py-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest font-medium">
                Live Audio Feed — Raspberry Pi 5
              </p>
              <div className="flex items-center gap-3">
                {/* Pi status */}
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  {piOnline === null ? (
                    <span className="text-gray-400 dark:text-gray-500">Checking...</span>
                  ) : piOnline ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Pi Online
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      Pi Offline
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1.5 text-xs text-emerald-500 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Always On
                </span>
              </div>
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
                  {liveFeed.map((alert) => {
                    const cats = alert.categories ?? [];
                    const hasClassification = cats.length !== 0 || !!alert.language;
                    const excerpt = alert.transcribed_text
                      ? alert.transcribed_text.slice(0, 60) + (alert.transcribed_text.length > 60 ? "…" : "")
                      : null;
                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ x: 40, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -40, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col gap-2 p-3 bg-white/60 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/8 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 shrink-0">
                            <SeverityBadge severity={alert.severity} dot />
                            {alert.emotion && (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide ${emotionBadgeColor(alert.emotion)}`}
                              >
                                {alert.emotion}
                              </span>
                            )}
                          </div>
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
                        </div>

                        {hasClassification && (
                          <div className="flex flex-wrap gap-1 pl-1">
                            {cats.slice(0, 2).map((cat) => (
                              <span
                                key={cat}
                                className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full border ${categoryBadgeColor(cat)}`}
                              >
                                {categoryLabel(cat)}
                              </span>
                            ))}
                            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full border bg-gray-500/10 text-gray-600 border-gray-300/40 dark:bg-gray-500/15 dark:text-gray-300 dark:border-gray-400/25">
                              {languageLabel(alert.language)}
                            </span>
                          </div>
                        )}

                        {excerpt && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic truncate pl-1">
                            {`"${excerpt}"`}
                          </p>
                        )}

                        <AlertEvidence alert={alert} />
                      </motion.div>
                    );
                  })}
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

          {/* ── Bullying Type + Language Breakdown ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <CategoryBarChart stats={categoryStats} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.4 }}
            >
              <LanguageBreakdown alerts={alerts} />
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
}
