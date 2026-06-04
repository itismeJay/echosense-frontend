"use client";

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import type { Alert, LogsStats, CategoryStats } from "@/lib/types";

const GLASS =
  "bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]";

function useTooltipStyle(theme: string | undefined) {
  const isDark = theme === "dark";
  return {
    contentStyle: isDark
      ? {
          background: "#1a1a2e",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "12px",
          color: "#e5e7eb",
          fontSize: 12,
        }
      : {
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: "12px",
          color: "#1e293b",
          fontSize: 12,
        },
    itemStyle: { color: isDark ? "#e5e7eb" : "#1e293b" },
    cursor: { fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" },
  };
}

// Recharts needs the DOM, guard SSR — use setTimeout to avoid setState-in-effect lint
function useIsMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);
  return mounted;
}

function ChartSkeleton() {
  return <div className="h-48 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getAlertsPerDay(alerts: Alert[]) {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const count = alerts.filter((a) => a.created_at.startsWith(dateStr)).length;
    return { date: label, count };
  });
}

function getSeverityBreakdown(alerts: Alert[]) {
  const high   = alerts.filter((a) => a.severity === "high").length;
  const medium = alerts.filter((a) => a.severity === "medium").length;
  const low    = alerts.filter((a) => a.severity === "low").length;
  return [
    { name: "High",   value: high,   color: "#ef4444" },
    { name: "Medium", value: medium, color: "#f59e0b" },
    { name: "Low",    value: low,    color: "#10b981" },
  ];
}

function getConfidenceOverTime(alerts: Alert[]) {
  return [...alerts]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(-20)
    .map((a, i) => ({
      index: i + 1,
      confidence: Math.round(a.confidence * 100),
    }));
}

const EMOTION_COLORS: Record<string, string> = {
  angry:      "#ef4444",
  aggressive: "#f97316",
  distressed: "#eab308",
  upset:      "#f59e0b",
  neutral:    "#10b981",
  unknown:    "#6b7280",
};

function getEmotionBreakdown(stats: LogsStats) {
  const b = stats.emotion_breakdown;
  if (!b) return [];
  return (Object.keys(EMOTION_COLORS) as (keyof typeof EMOTION_COLORS)[])
    .map((key) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: b[key as keyof typeof b] ?? 0,
      color: EMOTION_COLORS[key],
    }))
    .filter((d) => d.value > 0);
}

function getTopKeywords(alerts: Alert[], stats: LogsStats) {
  const counts = new Map<string, number>();
  for (const a of alerts) {
    for (const raw of a.detected_words ?? []) {
      const w = raw.trim();
      if (!w) continue;
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }
  const ordered =
    stats.top_detected_words && stats.top_detected_words.length > 0
      ? stats.top_detected_words
      : [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([w]) => w);
  return ordered.slice(0, 10).map((word) => ({
    word,
    count: counts.get(word) ?? counts.get(word.trim()) ?? 0,
  }));
}

function getPeakHours(alerts: Alert[]) {
  const counts: number[][] = Array.from({ length: 7 }, () =>
    new Array(24).fill(0)
  );
  alerts.forEach((a) => {
    const d = new Date(a.created_at);
    counts[d.getUTCDay()][d.getUTCHours()]++;
  });
  const max = Math.max(...counts.flat(), 1);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return { counts, max, dayNames };
}

// ─── Components ─────────────────────────────────────────────────────────────

export function AlertsPerDayBar({ alerts }: { alerts: Alert[] }) {
  const mounted = useIsMounted();
  const { theme } = useTheme();
  const tooltipStyle = useTooltipStyle(theme);
  const data = useMemo(() => getAlertsPerDay(alerts), [alerts]);

  return (
    <div className={GLASS}>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        Alerts Per Day — Last 7 Days
      </h3>
      {!mounted ? (
        <ChartSkeleton />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip {...tooltipStyle} />
            <Bar
              dataKey="count"
              fill="url(#barGrad)"
              radius={[4, 4, 0, 0]}
              name="Alerts"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function SeverityPie({ alerts }: { alerts: Alert[] }) {
  const mounted = useIsMounted();
  const { theme } = useTheme();
  const tooltipStyle = useTooltipStyle(theme);
  const data = useMemo(() => getSeverityBreakdown(alerts), [alerts]);

  return (
    <div className={GLASS}>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        Severity Breakdown
      </h3>
      {!mounted ? (
        <ChartSkeleton />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={45}
                paddingAngle={3}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle.contentStyle}
                itemStyle={tooltipStyle.itemStyle}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-5 mt-1">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: d.color }}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {d.name} ({d.value})
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function ConfidenceOverTimeLine({ alerts }: { alerts: Alert[] }) {
  const mounted = useIsMounted();
  const { theme } = useTheme();
  const tooltipStyle = useTooltipStyle(theme);
  const data = useMemo(() => getConfidenceOverTime(alerts), [alerts]);

  return (
    <div className={GLASS}>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        Confidence Over Time (Last 20 Detections)
      </h3>
      {!mounted ? (
        <ChartSkeleton />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="index"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              unit="%"
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(v) => [`${v}%`, "Confidence"]}
            />
            <Area
              type="monotone"
              dataKey="confidence"
              stroke="#a855f7"
              strokeWidth={2}
              fill="url(#confGrad)"
              dot={false}
              name="Confidence"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function PeakHoursHeatmap({ alerts }: { alerts: Alert[] }) {
  const { counts, max, dayNames } = useMemo(() => getPeakHours(alerts), [alerts]);
  const hours = Array.from({ length: 24 }, (_, i) => {
    if (i === 0) return "12a";
    if (i < 12) return `${i}a`;
    if (i === 12) return "12p";
    return `${i - 12}p`;
  });

  return (
    <div className={GLASS}>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        Peak Detection Hours
      </h3>
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Hour labels */}
          <div className="flex mb-1 ml-9">
            {hours.map((h, i) => (
              <div
                key={i}
                className="w-5 text-center"
                style={{ fontSize: 8, color: "#4b5563" }}
              >
                {i % 4 === 0 ? h : ""}
              </div>
            ))}
          </div>
          {/* Rows */}
          {dayNames.map((day, di) => (
            <div key={day} className="flex items-center mb-0.5">
              <div
                className="w-9 text-right pr-2 text-gray-400 dark:text-gray-600 shrink-0"
                style={{ fontSize: 9 }}
              >
                {day}
              </div>
              {counts[di].map((count, hi) => (
                <div
                  key={hi}
                  className="w-5 h-4 rounded-sm mx-px transition-colors"
                  style={{
                    background:
                      count > 0
                        ? `rgba(99, 102, 241, ${0.15 + (count / max) * 0.85})`
                        : "rgba(0,0,0,0.04)",
                  }}
                  title={`${day} ${hours[hi]}: ${count} alert${count !== 1 ? "s" : ""}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EmotionDonut({ stats }: { stats: LogsStats }) {
  const mounted = useIsMounted();
  const { theme } = useTheme();
  const tooltipStyle = useTooltipStyle(theme);
  const data = useMemo(() => getEmotionBreakdown(stats), [stats]);

  return (
    <div className={GLASS}>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
        Emotion Breakdown
      </h3>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
        Emotion profile of incidents
      </p>
      {!mounted ? (
        <ChartSkeleton />
      ) : data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
          No emotion data yet
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={45}
                paddingAngle={3}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle.contentStyle}
                itemStyle={tooltipStyle.itemStyle}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 mt-1">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: d.color }}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {d.name} ({d.value})
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const CATEGORY_CHART_DATA = [
  { key: "academic_shaming",   label: "Academic",  color: "#3b82f6" },
  { key: "body_shaming",       label: "Physical",  color: "#f97316" },
  { key: "emotional_taunting", label: "Emotional", color: "#eab308" },
  { key: "threat",             label: "Threat",    color: "#ef4444" },
];

export function CategoryBarChart({ stats }: { stats: CategoryStats | null; loading?: boolean }) {
  const mounted = useIsMounted();
  const { theme } = useTheme();
  const tooltipStyle = useTooltipStyle(theme);

  const data = useMemo(() => {
    if (!stats) return [];
    return CATEGORY_CHART_DATA.map((d) => ({
      name: d.label,
      count: stats[d.key] ?? 0,
      color: d.color,
    }));
  }, [stats]);

  return (
    <div className={GLASS}>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
        Type of Bullying Detected
      </h3>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
        Incident count by bullying category
      </p>
      {!mounted ? (
        <ChartSkeleton />
      ) : !stats || data.every((d) => d.count === 0) ? (
        <div className="h-48 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
          No category data yet
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Incidents">
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 mt-2">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{d.name} ({d.count})</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function LanguageBreakdown({ alerts }: { alerts: Alert[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = { tl: 0, ceb: 0, en: 0, mixed: 0 };
    for (const a of alerts) {
      const k = a.language && ["tl", "ceb", "en"].includes(a.language) ? a.language : "mixed";
      counts[k]++;
    }
    return [
      { code: "tl",    label: "Filipino", count: counts.tl,    color: "#6366f1" },
      { code: "ceb",   label: "Bisaya",   count: counts.ceb,   color: "#a855f7" },
      { code: "en",    label: "English",  count: counts.en,    color: "#22d3ee" },
      { code: "mixed", label: "Mixed",    count: counts.mixed, color: "#6b7280" },
    ].filter((d) => d.count > 0);
  }, [alerts]);

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className={GLASS}>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
        Language Used in Bullying Incidents
      </h3>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
        Reflects multilingual detection for Davao classrooms
      </p>
      {total === 0 ? (
        <div className="h-24 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
          No data yet
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((d) => {
            const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
            return (
              <div key={d.code}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{d.label}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                    {d.count} incident{d.count !== 1 ? "s" : ""} · {pct}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: d.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TopKeywordsBar({
  alerts,
  stats,
}: {
  alerts: Alert[];
  stats: LogsStats;
}) {
  const mounted = useIsMounted();
  const { theme } = useTheme();
  const tooltipStyle = useTooltipStyle(theme);
  const data = useMemo(() => getTopKeywords(alerts, stats), [alerts, stats]);

  return (
    <div className={GLASS}>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
        Top Keywords
      </h3>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
        Most frequent detected keywords
      </p>
      {!mounted ? (
        <ChartSkeleton />
      ) : data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
          No keyword data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 28)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
          >
            <XAxis
              type="number"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="word"
              width={90}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Count" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
