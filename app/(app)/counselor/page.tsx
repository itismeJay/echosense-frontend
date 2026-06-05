"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle, BellRing, CheckCircle2, Clock3, ShieldAlert,
  UserRoundCheck, Tag, Globe, TrendingUp,
} from "lucide-react";
import { useCurrentUser } from "@/lib/auth";
import { useAlerts } from "@/lib/AlertsProvider";
import StatCard from "@/components/StatCard";
import SeverityBadge from "@/components/SeverityBadge";
import { formatRelative, categoryBadgeColor, categoryLabel, languageLabel } from "@/lib/format";

const CARD = "bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]";

const CATEGORY_DEFS = [
  { key: "academic_shaming",   label: "Academic Shaming"   },
  { key: "appearance_shaming", label: "Appearance Shaming" },
  { key: "body_shaming",       label: "Body Shaming"       },
  { key: "emotional_taunting", label: "Emotional Taunting" },
  { key: "threat",             label: "Threat"             },
];

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

  const weeklyAlerts = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return alerts.filter((a) => new Date(a.created_at).getTime() >= cutoff);
  }, [alerts]);

  const activeToday   = todayAlerts.filter((a) => a.status === "active").length;
  const resolvedToday = todayAlerts.filter((a) => a.status === "resolved").length;
  const weeklyTotal   = weeklyAlerts.length;
  const highToday     = todayAlerts.filter((a) => a.severity === "high").length;
  const recentIncidents = alerts.slice(0, 5);

  const todayHigh   = todayAlerts.filter((a) => a.severity === "high").length;
  const todayMedium = todayAlerts.filter((a) => a.severity === "medium").length;
  const todayLow    = todayAlerts.filter((a) => a.severity === "low").length;
  const weekHigh    = weeklyAlerts.filter((a) => a.severity === "high").length;
  const weekMedium  = weeklyAlerts.filter((a) => a.severity === "medium").length;
  const weekLow     = weeklyAlerts.filter((a) => a.severity === "low").length;

  // Category breakdown (weekly)
  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of weeklyAlerts) {
      for (const cat of a.categories ?? []) {
        counts[cat] = (counts[cat] ?? 0) + 1;
      }
    }
    return CATEGORY_DEFS.map((d) => ({ ...d, count: counts[d.key] ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }, [weeklyAlerts]);

  const topCategory = categoryBreakdown.find((c) => c.count > 0);

  // Top detected words (weekly)
  const topWords = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of weeklyAlerts) {
      for (const w of [...(a.hard_hits ?? []), ...(a.soft_hits ?? [])]) {
        const key = w.trim().toLowerCase();
        if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [weeklyAlerts]);

  // Language breakdown (weekly)
  const languageBreakdown = useMemo(() => {
    const counts: Record<string, number> = { tl: 0, ceb: 0, en: 0, mixed: 0 };
    for (const a of weeklyAlerts) {
      const k = a.language && ["tl", "ceb", "en"].includes(a.language) ? a.language : "mixed";
      counts[k]++;
    }
    return [
      { code: "tl",    label: "Filipino", count: counts.tl    },
      { code: "ceb",   label: "Bisaya",   count: counts.ceb   },
      { code: "en",    label: "English",  count: counts.en    },
      { code: "mixed", label: "Mixed",    count: counts.mixed  },
    ].filter((d) => d.count > 0);
  }, [weeklyAlerts]);

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

      {/* Stat cards */}
      {loading && alerts.length === 0 ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 animate-pulse">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white/60 dark:bg-white/5 rounded-2xl border border-white/80 dark:border-white/10" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: "Today's Active Alerts", value: activeToday,   icon: BellRing,     accent: "indigo"  as const },
            { label: "Resolved Today",         value: resolvedToday, icon: CheckCircle2, accent: "emerald" as const },
            { label: "Total This Week",         value: weeklyTotal,   icon: Clock3,       accent: "amber"   as const },
            { label: "High Severity Today",     value: highToday,     icon: ShieldAlert,  accent: "red"     as const },
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

      {/* Pattern Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Category breakdown */}
        <div className={`${CARD} space-y-3`}>
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Bullying Type This Week
            </h2>
          </div>
          {topCategory && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Most common: <span className="font-semibold text-gray-800 dark:text-gray-200">{topCategory.label}</span> — {topCategory.count} case{topCategory.count !== 1 ? "s" : ""}
            </p>
          )}
          <div className="space-y-2">
            {categoryBreakdown.map((cat) => (
              <div key={cat.key} className="flex items-center justify-between">
                <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${categoryBadgeColor(cat.key)}`}>
                  {cat.label}
                </span>
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                  {cat.count} case{cat.count !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
            {categoryBreakdown.every((c) => c.count === 0) && (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">
                No category data this week
              </p>
            )}
          </div>
        </div>

        {/* Top detected words */}
        <div className={`${CARD} space-y-3`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Top Detected Words This Week
            </h2>
          </div>
          {topWords.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
              No keyword data this week
            </p>
          ) : (
            <div className="space-y-2">
              {topWords.map(([word, count], i) => (
                <div key={word} className="flex items-center gap-2">
                  <span className="w-5 text-xs text-gray-400 dark:text-gray-600 font-mono shrink-0">
                    #{i + 1}
                  </span>
                  <span className="flex-1 px-2.5 py-1 text-xs font-medium rounded-full border bg-red-500/10 text-red-600 border-red-500/25 dark:bg-red-500/15 dark:text-red-400 truncate">
                    {word}
                  </span>
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400 shrink-0">
                    ×{count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Language breakdown */}
        <div className={`${CARD} space-y-3`}>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Language Breakdown This Week
            </h2>
          </div>
          {languageBreakdown.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
              No language data this week
            </p>
          ) : (
            <div className="space-y-2.5">
              {languageBreakdown.map((lang) => (
                <div key={lang.code}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{lang.label}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                      {lang.count} incident{lang.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      style={{
                        width: `${weeklyTotal > 0 ? Math.round((lang.count / weeklyTotal) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Today vs This Week Comparison */}
      <div className={CARD}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Today vs This Week
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Today</p>
            <div className="space-y-2">
              {[
                { label: "Total", value: todayAlerts.length, cls: "text-gray-900 dark:text-white" },
                { label: "High",  value: todayHigh,          cls: "text-red-600 dark:text-red-400" },
                { label: "Medium",value: todayMedium,        cls: "text-amber-600 dark:text-amber-400" },
                { label: "Low",   value: todayLow,           cls: "text-emerald-600 dark:text-emerald-400" },
              ].map(({ label, value, cls }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{label}</span>
                  <span className={`font-bold tabular-nums ${cls}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">This Week</p>
            <div className="space-y-2">
              {[
                { label: "Total", value: weeklyTotal, cls: "text-gray-900 dark:text-white" },
                { label: "High",  value: weekHigh,    cls: "text-red-600 dark:text-red-400" },
                { label: "Medium",value: weekMedium,  cls: "text-amber-600 dark:text-amber-400" },
                { label: "Low",   value: weekLow,     cls: "text-emerald-600 dark:text-emerald-400" },
              ].map(({ label, value, cls }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{label}</span>
                  <span className={`font-bold tabular-nums ${cls}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {weeklyTotal > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 text-xs text-gray-400 dark:text-gray-500">
            Today accounts for{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {Math.round((todayAlerts.length / weeklyTotal) * 100)}%
            </span>{" "}
            of this week&apos;s incidents
          </div>
        )}
      </div>

      {/* Recent Incidents */}
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
              const firstCat = incident.categories?.[0];
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
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          #{incident.id}
                        </span>
                        {firstCat && (
                          <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full border ${categoryBadgeColor(firstCat)}`}>
                            {categoryLabel(firstCat)}
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/15 dark:text-purple-400">
                          {languageLabel(incident.language)}
                        </span>
                      </div>
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
