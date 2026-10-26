"use client";

import { useEffect, useState } from "react";
import { BellRing, BellOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  enableBrowserNotifications,
  getBrowserNotificationPermission,
  getBrowserNotificationsEnabled,
  setBrowserNotificationsEnabled,
  type BrowserNotificationPermission,
} from "@/lib/notifications";

function permissionMessage(
  permission: BrowserNotificationPermission
): string {
  switch (permission) {
    case "granted":
      return "This browser can show high-priority alert notifications.";
    case "denied":
      return "Notifications are blocked in this browser. Allow them in your browser settings to enable this option.";
    case "unsupported":
      return "This browser does not support desktop notifications.";
    default:
      return "Your browser will ask for permission when you enable notifications.";
  }
}

export default function NotificationSettings() {
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] =
    useState<BrowserNotificationPermission>("default");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextPermission = getBrowserNotificationPermission();
      setPermission(nextPermission);
      setEnabled(
        nextPermission === "granted" &&
          getBrowserNotificationsEnabled()
      );
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleToggle = async () => {
    if (enabled) {
      setBrowserNotificationsEnabled(false);
      setEnabled(false);
      toast.success("Browser notifications turned off.");
      return;
    }

    setUpdating(true);
    try {
      const nextPermission = await enableBrowserNotifications();
      setPermission(nextPermission);
      const nextEnabled = nextPermission === "granted";
      setEnabled(nextEnabled);
      if (nextEnabled) {
        toast.success("Browser notifications turned on.");
      } else if (nextPermission === "denied") {
        toast.error(
          "Notifications are blocked. Allow them in your browser settings first."
        );
      } else if (nextPermission === "unsupported") {
        toast.error("This browser does not support notifications.");
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <section
      aria-labelledby="notification-settings-title"
      className="rounded-panel border border-line bg-bg p-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="rounded-control bg-amber-50 p-2.5 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
          {enabled ? (
            <BellRing className="h-5 w-5" aria-hidden="true" />
          ) : (
            <BellOff className="h-5 w-5" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2
                id="notification-settings-title"
                className="font-semibold text-ink"
              >
                Browser Alert Notifications
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Show a notification on this device when a new high-priority
                possible alert arrives.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label="Browser alert notifications"
              disabled={updating || permission === "unsupported"}
              onClick={() => void handleToggle()}
              className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors   focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                enabled
                  ? "border-line bg-brand"
                  : "border-line-strong bg-surface  "
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-bg  transition-transform ${
                  enabled ? "translate-x-7" : "translate-x-1"
                }`}
              >
                {updating && (
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin text-link"
                    aria-hidden="true"
                  />
                )}
              </span>
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted">
            {permissionMessage(permission)} This preference applies only to
            this browser and device.
          </p>
        </div>
      </div>
    </section>
  );
}
