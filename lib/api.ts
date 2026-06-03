import type { Alert, LogsStats, Settings, User, DictionaryEntry, AuditLog, SystemSettings, Report } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

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
    signal: AbortSignal.timeout(8000),
    ...options,
    headers: {
      ...(options?.headers as Record<string, string>),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 401) {
    document.cookie = "echosense_token=; path=/; max-age=0";
    window.location.href = "/login";
    throw new ApiError(401, "Unauthorized");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { detail?: string };
    throw new ApiError(res.status, body.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function getAlerts(): Promise<Alert[]> {
  return apiFetch<Alert[]>("/alerts/");
}

export async function createAlert(input: Omit<Alert, "id">): Promise<Alert> {
  return apiFetch<Alert>("/alerts/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function getLogs(): Promise<Alert[]> {
  return apiFetch<Alert[]>("/logs/");
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

export async function getUsers(): Promise<User[]> {
  return apiFetch<User[]>("/users");
}

export async function registerUser(
  data: { email: string; password: string; role: "admin" | "staff" | "counselor" }
): Promise<User> {
  return apiFetch<User>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function getDictionary(): Promise<DictionaryEntry[]> {
  return apiFetch<DictionaryEntry[]>("/dictionary");
}

export async function addDictionaryEntry(entry: {
  keyword: string;
  language: string;
  severity_weight: number;
}): Promise<DictionaryEntry> {
  return apiFetch<DictionaryEntry>("/dictionary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
}

export async function deleteDictionaryEntry(termId: number): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_URL}/dictionary/${termId}`, {
    method: "DELETE",
    signal: AbortSignal.timeout(8000),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) {
    document.cookie = "echosense_token=; path=/; max-age=0";
    window.location.href = "/login";
    throw new ApiError(401, "Unauthorized");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { detail?: string };
    throw new ApiError(res.status, body.detail ?? `HTTP ${res.status}`);
  }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  return apiFetch<AuditLog[]>("/audit-logs");
}

export async function getSystemSettings(): Promise<SystemSettings> {
  return apiFetch<SystemSettings>("/system-settings");
}

export async function getReports(): Promise<Report[]> {
  return apiFetch<Report[]>("/reports");
}

export async function generateReport(params: {
  date_from: string;
  date_to: string;
}): Promise<Report> {
  return apiFetch<Report>("/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export async function deleteUser(userId: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_URL}/users/${userId}`, {
    method: "DELETE",
    signal: AbortSignal.timeout(8000),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) {
    document.cookie = "echosense_token=; path=/; max-age=0";
    window.location.href = "/login";
    throw new ApiError(401, "Unauthorized");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { detail?: string };
    throw new ApiError(res.status, body.detail ?? `HTTP ${res.status}`);
  }
}
