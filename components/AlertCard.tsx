"use client";

import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Info,
  MapPin,
  School,
  Tags,
} from "lucide-react";
import type { Alert } from "@/lib/types";
import {
  classroomLabel,
  deliveryStatusLabel,
  eventTime,
  isTestAlert,
  monitoredTermSummary,
  pushStatusLabel,
  REQUIRED_REVIEW_NOTICE,
  reviewStatusLabel,
  schoolLabel,
  severityEvidenceAvailabilityLabel,
  severitySummary,
  triggerTypeLabel,
} from "@/lib/alert-presentation";
import {
  formatDate,
  formatTime,
} from "@/lib/format";
import SeverityBadge from "./SeverityBadge";

interface AlertCardProps {
  alert: Alert;
  compact?: boolean;
}

export default function AlertCard({ alert, compact = false }: AlertCardProps) {
  const testAlert = isTestAlert(alert);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SeverityBadge severity={alert.severity} dot />
        <div className="flex flex-wrap justify-end gap-2">
          {testAlert && (
            <span className="rounded-full border-2 border-blue-600 bg-blue-50 px-3 py-1 text-xs font-black tracking-wide text-blue-800 dark:bg-blue-950/50 dark:text-blue-100">
              TEST ALERT — NOT A REAL INCIDENT
            </span>
          )}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {reviewStatusLabel(alert)}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <h2 className={`${compact ? "text-base" : "text-lg"} font-semibold text-slate-950 dark:text-white`}>
          {severitySummary(alert.severity)}
        </h2>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            {formatTime(eventTime(alert))}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {classroomLabel(alert)} · {formatDate(eventTime(alert))}
          </span>
        </div>
      </div>

      <dl className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
        <div className="flex flex-wrap items-center gap-2">
          <School className="h-4 w-4" aria-hidden="true" />
          <dt className="font-medium">School:</dt>
          <dd>{schoolLabel(alert)}</dd>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tags className="h-4 w-4" aria-hidden="true" />
          <dt className="font-medium">Trigger:</dt>
          <dd>{triggerTypeLabel(alert)}</dd>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-6">
          <dt className="font-medium">Monitored terms:</dt>
          <dd>{monitoredTermSummary(alert)}</dd>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 pl-6 text-xs">
          <span>Delivery: {deliveryStatusLabel(alert)}</span>
          {alert.push_status !== "unknown" && <span>Push: {pushStatusLabel(alert)}</span>}
        </div>
      </dl>

      <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
        {severityEvidenceAvailabilityLabel(alert)}
      </p>

      <p className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Info className="h-4 w-4" aria-hidden="true" />
        {REQUIRED_REVIEW_NOTICE}
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
