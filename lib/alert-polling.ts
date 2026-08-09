import type { Alert } from "./types";

function alertTimestamp(alert: Alert): number {
  for (const value of [
    alert.trigger_timestamp,
    alert.event_start_timestamp,
    alert.created_at,
  ]) {
    if (!value) continue;
    const timestamp = Date.parse(value);
    if (Number.isFinite(timestamp)) return timestamp;
  }
  return 0;
}

export function compareAlertRecency(a: Alert, b: Alert): number {
  const timestampDifference = alertTimestamp(b) - alertTimestamp(a);
  return timestampDifference || b.id - a.id;
}

export function newestAlert(alerts: Alert[]): Alert | undefined {
  return [...alerts].sort(compareAlertRecency)[0];
}

export function newlyObservedAlerts(
  alerts: Alert[],
  previouslySeenIds: ReadonlySet<number>
): Alert[] {
  return alerts
    .filter((alert) => !previouslySeenIds.has(alert.id))
    .sort(compareAlertRecency);
}

export function shouldMarkRetainedAlertsStale(alerts: Alert[]): boolean {
  return alerts.length > 0;
}

export async function runWithoutOverlap(
  inFlight: { current: boolean },
  operation: () => Promise<void>
): Promise<boolean> {
  if (inFlight.current) return false;
  inFlight.current = true;
  try {
    await operation();
    return true;
  } finally {
    inFlight.current = false;
  }
}
