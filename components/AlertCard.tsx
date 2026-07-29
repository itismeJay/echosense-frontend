"use client";

import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Globe2,
  Info,
  MapPin,
  Tags,
} from "lucide-react";
import type { Alert } from "@/lib/types";
import {
  alertStatusLabel,
  matchedTermsCountLabel,
  REQUIRED_REVIEW_NOTICE,
  transcriptPreview,
} from "@/lib/alert-presentation";
import {
  formatDate,
  formatLanguageConfidence,
  formatTime,
  languageLabel,
} from "@/lib/format";
import SeverityBadge from "./SeverityBadge";

interface AlertCardProps {
  alert: Alert;
  compact?: boolean;
}

export default function AlertCard({ alert, compact = false }: AlertCardProps) {
  const languageConfidence = formatLanguageConfidence(
    alert.language_confidence
  );

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SeverityBadge severity={alert.severity} dot />
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {alertStatusLabel()}
        </span>
      </div>

      <div className="mt-4">
        <h2 className={`${compact ? "text-base" : "text-lg"} font-semibold text-slate-950 dark:text-white`}>
          Possible aggression alert
        </h2>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            {formatTime(alert.created_at)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {alert.location} · {formatDate(alert.created_at)}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Transcript preview
        </p>
        <p className="mt-1 line-clamp-3 break-words text-sm leading-6 text-slate-700 dark:text-slate-200">
          {transcriptPreview(alert.transcribed_text)}
        </p>
      </div>

      <dl className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
        <div className="flex flex-wrap items-center gap-2">
          <Globe2 className="h-4 w-4" aria-hidden="true" />
          <dt className="font-medium">Language:</dt>
          <dd>{languageLabel(alert.language)}</dd>
        </div>
        {languageConfidence && (
          <div className="flex flex-wrap items-center gap-2 pl-6">
            <dt className="font-medium">Language confidence:</dt>
            <dd>{languageConfidence}</dd>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Tags className="h-4 w-4" aria-hidden="true" />
          <dt className="sr-only">Detected monitored terms:</dt>
          <dd>{matchedTermsCountLabel(alert.matched_terms)}</dd>
        </div>
      </dl>

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
