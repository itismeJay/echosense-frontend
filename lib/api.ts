import type { Alert, LogsStats, Settings, User, DictionaryEntry, AuditLog, SystemSettings, Report, CategoryStats, AnalyticsSummary, HeartbeatStatus, PiLog, SystemLogsResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export class ApiContractError extends Error {
  public readonly endpoint: string;

  constructor(endpoint: string, message: string) {
    super(`Invalid response from ${endpoint}: ${message}`);
    this.endpoint = endpoint;
    this.name = "ApiContractError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseAuditLogs(value: unknown): AuditLog[] {
  const endpoint = "/audit-logs";
  if (!Array.isArray(value)) {
    throw new ApiContractError(endpoint, "expected an array");
  }

  return value.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new ApiContractError(endpoint, `entry ${index} is not an object`);
    }
    const performedAt = entry.performed_at;
    if (
      typeof entry.log_id !== "number" ||
      (entry.user_id !== undefined &&
        entry.user_id !== null &&
        typeof entry.user_id !== "number") ||
      (entry.actor_email !== undefined &&
        entry.actor_email !== null &&
        typeof entry.actor_email !== "string") ||
      typeof entry.action !== "string" ||
      typeof entry.module !== "string" ||
      (entry.target !== undefined &&
        entry.target !== null &&
        typeof entry.target !== "string") ||
      (performedAt !== undefined &&
        performedAt !== null &&
        typeof performedAt !== "string")
    ) {
      throw new ApiContractError(
        endpoint,
        `entry ${index} does not match the audit-log schema`
      );
    }
    return {
      id: String(entry.log_id),
      occurred_at: typeof performedAt === "string" ? performedAt : null,
      actor_user_id:
        typeof entry.user_id === "number" ? String(entry.user_id) : null,
      actor_email:
        typeof entry.actor_email === "string" ? entry.actor_email : null,
      actor_role: null,
      action: entry.action,
      resource: entry.module,
      resource_id: null,
      target: typeof entry.target === "string" ? entry.target : null,
      status: null,
      description: null,
      ip_address: null,
      user_agent: null,
      request_id: null,
      metadata: null,
      created_at: null,
    };
  });
}

function parseSystemLogsResponse(value: unknown): SystemLogsResponse {
  const endpoint = "/system/logs";
  if (!isRecord(value)) {
    throw new ApiContractError(endpoint, "expected an object");
  }
  if (!Array.isArray(value.lines)) {
    throw new ApiContractError(endpoint, "expected lines to be an array");
  }
  if (typeof value.total !== "number") {
    throw new ApiContractError(endpoint, "expected total to be a number");
  }

  const lines = value.lines.map((line, index): PiLog => {
    if (
      !isRecord(line) ||
      (line.id !== undefined &&
        typeof line.id !== "number" &&
        typeof line.id !== "string") ||
      typeof line.timestamp !== "string" ||
      Number.isNaN(Date.parse(line.timestamp)) ||
      typeof line.type !== "string" ||
      typeof line.message !== "string"
    ) {
      throw new ApiContractError(
        endpoint,
        `line ${index} does not match the system-log schema`
      );
    }
    return {
      id: line.id as number | string | undefined,
      timestamp: line.timestamp,
      type: line.type,
      message: line.message,
    };
  });

  return { lines, total: value.total };
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

export async function getAlerts(params?: {
  category?: string;
  language?: string;
  severity?: string;
  duration_gate?: string;
}): Promise<Alert[]> {
  const qs = new URLSearchParams();
  if (params?.category) qs.set("category", params.category);
  if (params?.language) qs.set("language", params.language);
  if (params?.severity) qs.set("severity", params.severity);
  if (params?.duration_gate) qs.set("duration_gate", params.duration_gate);
  const query = qs.toString();
  return apiFetch<Alert[]>(`/alerts/${query ? `?${query}` : ""}`);
}

export async function getCategoryStats(): Promise<CategoryStats> {
  return apiFetch<CategoryStats>("/alerts/analytics/categories");
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  return apiFetch<AnalyticsSummary>("/alerts/analytics/summary");
}

export async function getHeartbeat(): Promise<HeartbeatStatus> {
  return apiFetch<HeartbeatStatus>("/system-settings/heartbeat");
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
  slur_text: string;
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
  return parseAuditLogs(await apiFetch<unknown>("/audit-logs/"));
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

export async function getSystemLogs(): Promise<SystemLogsResponse> {
  return parseSystemLogsResponse(await apiFetch<unknown>("/system/logs"));
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
