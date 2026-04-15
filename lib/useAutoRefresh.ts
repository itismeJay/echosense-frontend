"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface AutoRefreshState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

export function useAutoRefresh<T>(
  fn: () => Promise<T>,
  intervalMs = 3000
): AutoRefreshState<T> {
  const [state, setState] = useState<AutoRefreshState<T>>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(async () => {
    try {
      const data = await fnRef.current();
      setState({
        data,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }));
    }
  }, []);

  useEffect(() => {
    run();
    const id = setInterval(run, intervalMs);
    return () => clearInterval(id);
  }, [run, intervalMs]);

  return state;
}
