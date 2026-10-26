"use client";

import { useCallback, useEffect, useState } from "react";
import { getDeviceStatuses } from "./api";
import type { DeviceStatusItem } from "./types";

/** Polls GET /devices/status every 30 s so Online/Offline stays current. */
export function useDeviceStatus() {
  const [devices, setDevices] = useState<DeviceStatusItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await getDeviceStatuses();
      setDevices(response.devices);
      setCheckedAt(new Date(response.checked_at));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Device status is unavailable.");
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(() => void load(), 0);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [load]);

  return { devices, error, checkedAt, reload: load };
}
