"use client";

// Report charts. Single-series marks use the neutral --chart token; severity uses the
// reserved severity tokens with a word beside every bar. All bucketing is in local time.

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Alert, CategoryStats } from "@/lib/types";
import { categoryLabel, languageLabel } from "@/lib/format";
import { Panel, Skeleton } from "@/components/ui";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);
  return mounted;
}

function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** A visually hidden table so every chart has a non-visual equivalent. */
function DataTable({ caption, headers, rows }: { caption: string; headers: [string, string]; rows: [string, number][] }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{headers[0]}</th>
          <th scope="col">{headers[1]}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Alerts per day (last 7 days) ───────────────────────────────────

export function alertsPerDay(alerts: Alert[], today: Date = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - index));
    const key = localDayKey(day);
    return {
      date: day.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
      count: alerts.filter((alert) => localDayKey(new Date(alert.created_at)) === key).length,
    };
  });
}

function DayTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const count = payload[0].value;
  return (
    <div className="rounded-control border border-line bg-bg px-3 py-2 text-small text-ink shadow-pop">
      <p className="font-medium">{label}</p>
      <p className="num text-muted">
        {count} {count === 1 ? "alert" : "alerts"}
      </p>
    </div>
  );
}

export function AlertsPerDayBar({ alerts }: { alerts: Alert[] }) {
  const mounted = useMounted();
  const data = alertsPerDay(alerts);
  return (
    <Panel title="Alerts per day" description="The last 7 days">
      {mounted ? (
        <div className="h-52" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barCategoryGap={10}>
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis dataKey="date" tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "var(--surface)" }} content={<DayTooltip />} />
              <Bar dataKey="count" fill="var(--chart)" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <Skeleton className="h-52" />
      )}
      <DataTable caption="Alerts per day, last 7 days" headers={["Day", "Alerts"]} rows={data.map((d) => [d.date, d.count])} />
    </Panel>
  );
}

// ── Labelled bar lists (severity, concern types, languages, words) ─

function BarList({
  rows,
  emptyText,
  caption,
}: {
  rows: { label: string; count: number; barClass?: string }[];
  emptyText: string;
  caption: string;
}) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  if (rows.every((row) => row.count === 0)) {
    return <p className="py-6 text-body text-muted">{emptyText}</p>;
  }
  return (
    <>
      <ul className="space-y-3" aria-hidden="true">
        {rows.map((row) => (
          <li key={row.label}>
            <div className="flex items-baseline justify-between gap-3 text-body">
              <span className="truncate text-ink">{row.label}</span>
              <span className="num text-muted">{row.count}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-surface">
              <div
                className={`h-2 rounded-full ${row.barClass ?? "bg-chart"}`}
                style={{ width: `${row.count === 0 ? 0 : Math.max(2, (row.count / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <DataTable caption={caption} headers={["Item", "Alerts"]} rows={rows.map((row) => [row.label, row.count])} />
    </>
  );
}

export function SeverityBreakdown({ alerts }: { alerts: Alert[] }) {
  const count = (severity: string) => alerts.filter((alert) => alert.severity === severity).length;
  return (
    <Panel title="By severity" description="All alerts in this view">
      <BarList
        caption="Alerts by severity"
        emptyText="No alerts yet."
        rows={[
          { label: "High", count: count("high"), barClass: "bg-sev-high" },
          { label: "Medium", count: count("medium"), barClass: "bg-sev-medium" },
          { label: "Low", count: count("low"), barClass: "bg-sev-low" },
        ]}
      />
    </Panel>
  );
}

const CATEGORY_KEYS = ["threat", "emotional_taunting", "academic_shaming", "appearance_shaming", "body_shaming"];

export function ConcernTypes({ stats, alerts }: { stats: CategoryStats | null; alerts: Alert[] }) {
  const counts = new Map<string, number>();
  if (stats) {
    for (const key of CATEGORY_KEYS) counts.set(key, Number(stats[key] ?? 0));
  } else {
    for (const alert of alerts) for (const category of alert.categories ?? []) counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  const rows = CATEGORY_KEYS.map((key) => ({ label: categoryLabel(key), count: counts.get(key) ?? 0 }));
  return (
    <Panel title="Types of concern" description="What the words were about">
      <BarList caption="Alerts by type of concern" rows={rows} emptyText="No concern types recorded yet. They appear when monitored words match a category." />
    </Panel>
  );
}

export function LanguageBreakdown({ alerts }: { alerts: Alert[] }) {
  const counts = new Map<string, number>();
  for (const alert of alerts) {
    const label = languageLabel(alert.language);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const rows = [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  return (
    <Panel title="Languages heard">
      <BarList caption="Alerts by language" rows={rows} emptyText="No alerts yet." />
    </Panel>
  );
}

export function CommonWords({ alerts }: { alerts: Alert[] }) {
  const counts = new Map<string, number>();
  for (const alert of alerts) {
    for (const raw of alert.detected_words ?? []) {
      const word = raw.trim();
      if (word) counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  const rows = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word, count]) => ({ label: `“${word}”`, count }));
  return (
    <Panel title="Words heard most often">
      <BarList caption="Most common words heard" rows={rows} emptyText="No words recorded yet." />
    </Panel>
  );
}

// ── When alerts happen (weekday × school hours) ────────────────────

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 12 }, (_, index) => index + 6); // 6 AM – 5 PM

function hourLabel(hour: number) {
  return hour === 12 ? "12p" : hour > 12 ? `${hour - 12}p` : `${hour}a`;
}

export function CommonTimes({ alerts }: { alerts: Alert[] }) {
  const counts = DAYS.map(() => HOURS.map(() => 0));
  let outside = 0;
  for (const alert of alerts) {
    const date = new Date(alert.created_at);
    const day = (date.getDay() + 6) % 7;
    const hourIndex = HOURS.indexOf(date.getHours());
    if (hourIndex === -1) outside++;
    else counts[day][hourIndex]++;
  }
  const max = Math.max(1, ...counts.flat());
  return (
    <Panel title="When alerts happen" description="Weekdays and school hours, 6 AM to 6 PM">
      <div className="overflow-x-auto" aria-hidden="true">
        <table className="w-full min-w-[30rem] table-fixed border-separate border-spacing-[2px]">
          <thead>
            <tr>
              <th className="w-10" />
              {HOURS.map((hour) => (
                <th key={hour} className="num text-center text-small font-normal text-muted">
                  {hourLabel(hour)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, dayIndex) => (
              <tr key={day}>
                <th className="pr-2 text-left text-small font-normal text-muted">{day}</th>
                {HOURS.map((hour, hourIndex) => {
                  const count = counts[dayIndex][hourIndex];
                  return (
                    <td
                      key={hour}
                      title={`${day} ${hourLabel(hour)}: ${count} ${count === 1 ? "alert" : "alerts"}`}
                      className="h-6 rounded-[3px]"
                      style={{
                        background:
                          count === 0
                            ? "var(--surface)"
                            : `color-mix(in oklab, var(--chart) ${25 + (count / max) * 75}%, var(--bg))`,
                      }}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {outside > 0 && (
        <p className="num mt-2 text-small text-muted">
          {outside} {outside === 1 ? "alert was" : "alerts were"} outside these hours.
        </p>
      )}
      <DataTable
        caption="Alerts by weekday during school hours"
        headers={["Weekday", "Alerts"]}
        rows={DAYS.map((day, index) => [day, counts[index].reduce((sum, value) => sum + value, 0)])}
      />
    </Panel>
  );
}
