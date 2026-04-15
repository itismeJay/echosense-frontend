import type { Alert, LogsStats } from "./types";
import { MOCK_ALERTS, MOCK_LOGS, MOCK_STATS } from "./mockData";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

let _isMockMode = false;

export function getIsMockMode(): boolean {
  return _isMockMode;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(2000),
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getAlerts(): Promise<Alert[]> {
  try {
    const data = await apiFetch<Alert[]>("/alerts");
    _isMockMode = false;
    return data;
  } catch {
    _isMockMode = true;
    return MOCK_ALERTS;
  }
}

export async function createAlert(input: Omit<Alert, "id">): Promise<Alert> {
  try {
    const data = await apiFetch<Alert>("/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    _isMockMode = false;
    return data;
  } catch {
    _isMockMode = true;
    return { id: Date.now(), ...input };
  }
}

export async function getLogs(): Promise<Alert[]> {
  try {
    const data = await apiFetch<Alert[]>("/logs");
    _isMockMode = false;
    return data;
  } catch {
    _isMockMode = true;
    return MOCK_LOGS;
  }
}

export async function getLogsStats(): Promise<LogsStats> {
  try {
    const data = await apiFetch<LogsStats>("/logs/stats");
    _isMockMode = false;
    return data;
  } catch {
    _isMockMode = true;
    return MOCK_STATS;
  }
}
