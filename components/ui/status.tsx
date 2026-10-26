"use client";

import type { AlertSeverity, AlertStatus } from "@/lib/types";
import { severityLabel } from "@/lib/alert-presentation";
import { severityColor } from "@/lib/format";
import { deviceStatusLabel, isDeviceOnline } from "@/lib/device-status";

/** Severity is always a word plus color, never color alone. */
export function SeverityTag({ severity }: { severity: AlertSeverity }) {
  return (
    <span
      className={`inline-flex min-w-[4.25rem] items-center justify-center rounded-tag border px-1.5 py-0.5 text-small font-medium ${severityColor(severity)}`}
    >
      {severityLabel(severity)}
    </span>
  );
}

const SEVERITY_STRIPE: Record<AlertSeverity, string> = {
  high: "bg-sev-high",
  medium: "bg-sev-medium",
  low: "bg-sev-low",
  unknown: "bg-line-strong",
};

export function SeverityStripe({ severity }: { severity: AlertSeverity }) {
  return <span aria-hidden="true" className={`w-1 shrink-0 self-stretch rounded-full ${SEVERITY_STRIPE[severity]}`} />;
}

export function ReviewState({ status }: { status: AlertStatus }) {
  const label =
    status === "active" ? "Needs review" : status === "reviewed" ? "Reviewed" : status === "resolved" ? "Resolved" : "Status unavailable";
  return (
    <span className={`text-small ${status === "active" ? "font-medium text-ink" : "text-muted"}`}>{label}</span>
  );
}

/** Solid dot + "Online", or hollow ring + "Offline · last seen …". The words carry the meaning. */
export function DeviceStatus({
  lastSeenAt,
  now,
  className = "",
}: {
  lastSeenAt: string | null | undefined;
  now?: Date;
  className?: string;
}) {
  const current = now ?? new Date();
  const online = isDeviceOnline(lastSeenAt, current.getTime());
  return (
    <span className={`inline-flex items-center gap-2 text-body ${online ? "text-ink" : "text-muted"} ${className}`}>
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${online ? "bg-ink" : "border-2 border-muted"}`}
      />
      <span className="num">{deviceStatusLabel(lastSeenAt, current)}</span>
    </span>
  );
}
