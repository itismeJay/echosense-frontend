import type { Alert, LogsStats, Settings } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find(r => r.startsWith("echosense_token="))
    ?.split("=")[1];
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(2000),
    ...options,
    headers: {
      ...(options?.headers as Record<string, string>),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 401) {
    document.cookie = "echosense_token=; path=/; max-age=0";
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getAlerts(): Promise<Alert[]> {
  return apiFetch<Alert[]>("/alerts");
}

export async function createAlert(input: Omit<Alert, "id">): Promise<Alert> {
  return apiFetch<Alert>("/alerts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function getLogs(): Promise<Alert[]> {
  return apiFetch<Alert[]>("/logs");
}

export async function getLogsStats(): Promise<LogsStats> {
  return apiFetch<LogsStats>("/logs/stats");
}

export async function getSettings(): Promise<Settings> {
  return apiFetch<Settings>("/settings");
}

export async function saveSettings(settings: Settings): Promise<Settings> {
  return apiFetch<Settings>("/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
}
