// Explicit extension so node --test can load this module directly.
import { formatWhen } from "./format.ts";

// Mirrors ONLINE_WINDOW_SECONDS in the backend (app/services/device_status.py).
export const DEVICE_ONLINE_WINDOW_MS = 2 * 60 * 1000;

/** A device is online if it checked in during the last two minutes. */
export function isDeviceOnline(lastSeenAt: string | null | undefined, now: number = Date.now()): boolean {
  if (!lastSeenAt) return false;
  const seen = Date.parse(lastSeenAt);
  if (Number.isNaN(seen)) return false;
  return now - seen <= DEVICE_ONLINE_WINDOW_MS;
}

/** "Offline · last seen 8:15 AM", or "Offline · never checked in". */
export function offlineLabel(lastSeenAt: string | null | undefined, now: Date = new Date()): string {
  if (!lastSeenAt || Number.isNaN(Date.parse(lastSeenAt))) return "Offline · never checked in";
  return `Offline · last seen ${formatWhen(lastSeenAt, now)}`;
}

/** "Online", "Offline · last seen 8:15 AM", or "Offline · never checked in". */
export function deviceStatusLabel(lastSeenAt: string | null | undefined, now: Date = new Date()): string {
  return isDeviceOnline(lastSeenAt, now.getTime()) ? "Online" : offlineLabel(lastSeenAt, now);
}
