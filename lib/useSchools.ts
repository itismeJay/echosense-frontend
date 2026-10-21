"use client";

import { useCallback, useEffect, useState } from "react";
import { getSchools } from "./api";
import type { School } from "./types";

/** Loads GET /schools for super admins (every other role gets 403, so pass enabled=false). */
export function useSchools(enabled: boolean) {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setSchools(await getSchools());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => {
      void reload();
    }, 0);
    return () => clearTimeout(timer);
  }, [enabled, reload]);

  return { schools, setSchools, loading: enabled && loading, error, reload };
}
