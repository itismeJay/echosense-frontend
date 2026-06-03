"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, BellRing, CheckCircle2, Clock3, ShieldAlert, UserRoundCheck } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";
import { useAlerts } from "@/lib/AlertsProvider";
import StatCard from "@/components/StatCard";
import SeverityBadge from "@/components/SeverityBadge";
import { formatRelative } from "@/lib/format";

const CARD = "bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]";

export default function CounselorPage() {
  const currentUser = useCurrentUser();
  const router = useRouter();
  const { alerts, loading } = useAlerts();

  useEffect(() => {
    if (currentUser && currentUser.role !== "admin" && currentUser.role !== "counselor") {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  const today = new Date().toISOString().slice(0, 10);

  const todayAlerts = useMemo(
    () => alerts.filter((a) => a.created_at.startsWith(today)),
    [alerts, today]
  );

  const activeToday   = todayAlerts.filter((a) => a.status === "active").length;
  const resolvedToday = todayAlerts.filter((a) => a.status === "resolved").length;
  const highToday     = todayAlerts.filter((a) => a.severity === "high").length;

  const weeklyTotal = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return alerts.filter((a) => new Date(a.created_at).getTime() >= cutoff).length;
  }, [alerts]);

  const recentIncidents = alerts.slice(0, 5);

  if (currentUser && currentUser.role !== "admin" && currentUser.role !== "counselor") return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-6 max-w-screen-xl space-y-5"
    >
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 shrink-0">
            <UserRoundCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Counselor Overview</h1>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">
              Active intervention snapshot and recent incidents
            </p>
          </div>
        </div>
      </div>

      {loading && alerts.length === 0 ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 animate-pulse">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white/60 dark:bg-white/5 rounded-2xl border border-white/80 dark:border-white/10" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: "Today's Active Alerts", value: activeToday,   icon: BellRing,      accent: "indigo"  as const },
            { label: "Resolved Today",         value: resolvedToday, icon: CheckCircle2,  accent: "emerald" as const },
            { label: "Total This Week",         value: weeklyTotal,   icon: Clock3,        accent: "amber"   as const },
            { label: "High Severity Today",     value: highToday,     icon: ShieldAlert,   accent: "red"     as const },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
            >
              <StatCard {...item} />
            </motion.div>
          ))}
        </div>
      )}

      <div className={CARD}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-400" />
            Recent Incidents
          </h2>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {recentIncidents.length === 0 ? "No incidents" : `Last ${recentIncidents.length}`}
          </span>
        </div>

        {loading && recentIncidents.length === 0 ? (
          <div className="space-y-2 animate-pulse">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-white/5" />
            ))}
          </div>
        ) : recentIncidents.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
            No incidents recorded yet
          </p>
        ) : (
          <div className="space-y-2">
            {recentIncidents.map((incident) => {
              const keyword = incident.detected_words?.[0] ?? incident.transcribed_text?.split(" ")[0] ?? null;
              return (
                <div
                  key={incident.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-100 dark:border-white/5 bg-white/60 dark:bg-white/5 p-4 transition-colors hover:bg-indigo-50/50 dark:hover:bg-white/8 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <SeverityBadge severity={incident.severity} dot />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {incident.location}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        #{incident.id}
                        {keyword && ` · Keyword: ${keyword}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 sm:text-right shrink-0">
                    {formatRelative(incident.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
