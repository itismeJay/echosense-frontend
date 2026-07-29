import type { Alert } from "./types";

export const NOTIFICATION_PREFERENCE_KEY =
  "echosense.notifications.enabled.v1";

export type BrowserNotificationPermission =
  | NotificationPermission
  | "unsupported";

export function parseNotificationPreference(
  value: string | null
): boolean {
  return value === "true";
}

export function browserNotificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getBrowserNotificationPermission(): BrowserNotificationPermission {
  if (!browserNotificationsSupported()) return "unsupported";
  return Notification.permission;
}

export function getBrowserNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return parseNotificationPreference(
    window.localStorage.getItem(NOTIFICATION_PREFERENCE_KEY)
  );
}

export function setBrowserNotificationsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    NOTIFICATION_PREFERENCE_KEY,
    String(enabled)
  );
}

export function shouldShowBrowserNotification({
  enabled,
  permission,
  severity,
}: {
  enabled: boolean;
  permission: BrowserNotificationPermission;
  severity: Alert["severity"];
}): boolean {
  return enabled && permission === "granted" && severity === "high";
}

export async function enableBrowserNotifications(): Promise<BrowserNotificationPermission> {
  if (!browserNotificationsSupported()) return "unsupported";
  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  setBrowserNotificationsEnabled(permission === "granted");
  return permission;
}

export function showAlertBrowserNotification(alert: Alert): void {
  const permission = getBrowserNotificationPermission();
  if (
    !shouldShowBrowserNotification({
      enabled: getBrowserNotificationsEnabled(),
      permission,
      severity: alert.severity,
    })
  ) {
    return;
  }

  new Notification("High priority possible alert", {
    body: `${alert.location} · Automated and unverified`,
    tag: `echosense-alert-${alert.id}`,
  });
}
