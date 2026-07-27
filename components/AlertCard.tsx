"use client";

import Link from "next/link";
import { ArrowRight, Clock3, MapPin } from "lucide-react";
import type { Alert } from "@/lib/types";
import { alertStatusLabel, alertSummary } from "@/lib/alert-presentation";
import { formatDate, formatTime } from "@/lib/format";
import SeverityBadge from "./SeverityBadge";

interface AlertCardProps {
  alert: Alert;
  compact?: boolean;
}

export default function AlertCard({ alert, compact = false }: AlertCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SeverityBadge severity={alert.severity} dot />
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {alertStatusLabel(alert)}
        </span>
      </div>

      <div className="mt-4">
        <h2 className={`${compact ? "text-base" : "text-lg"} font-semibold text-slate-950 dark:text-white`}>
          {alert.location}
        </h2>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            {formatTime(alert.created_at)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {formatDate(alert.created_at)}
          </span>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-200">
        {alertSummary(alert)}
      </p>

      <div className="mt-5 flex justify-end">
        <Link
          href={`/alerts/${alert.id}`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 dark:ring-offset-slate-900"
          aria-label={`View details for the alert in ${alert.location}`}
        >
          View Details
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
