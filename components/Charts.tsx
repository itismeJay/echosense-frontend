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
import type { Alert } from "@/lib/types";

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
