"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, getClassrooms, getDeviceStatuses, getDevices } from "./api";
import type { Classroom, DeviceStatusItem, EdgeDevice } from "./types";

/** Classrooms, their devices, and each device's Online/Offline state, refreshed every 30 s. */
export function useClassroomData() {
  const [classrooms, setClassrooms] = useState<Classroom[] | null>(null);
  const [devices, setDevices] = useState<EdgeDevice[]>([]);
  const [statuses, setStatuses] = useState<Map<string, DeviceStatusItem>>(new Map());
  const [error, setError] = useState<{ message: string; status: number | null } | null>(null);

  const load = useCallback(async () => {
    try {
      const [nextClassrooms, nextDevices, nextStatus] = await Promise.all([
        getClassrooms(),
        getDevices(),
        getDeviceStatuses().catch(() => null),
      ]);
      setClassrooms(nextClassrooms);
      setDevices(nextDevices);
      if (nextStatus) setStatuses(new Map(nextStatus.devices.map((device) => [device.id, device])));
      setError(null);
    } catch (caught) {
      setError({
        message: caught instanceof Error ? caught.message : "Classrooms are unavailable.",
        status: caught instanceof ApiError ? caught.status : null,
      });
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

  return { classrooms, devices, statuses, error, reload: load };
}
