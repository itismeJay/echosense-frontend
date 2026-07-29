import {
  ApiContractError,
  auditFiltersToApiSearchParams,
  parseAuditLogListResponse,
} from "./audit-log";
import {
  parseAlertListResponse,
  parseAlertResponse,
} from "./alert-contract";
import { API_URL } from "./config";
import { buildApiHeaders } from "./api-headers";
import {
  parseDictionaryEntry,
  parseDictionaryListResponse,
} from "./dictionary-contract";
import {
  parseSystemSettings,
  settingsToUpdatePayload,
  systemSettingsToForm,
} from "./settings";
import type {
  Alert,
  AlertLanguage,
  AnalyticsSummary,
  AuditLogFilters,
  AuditLogListResponse,
  CategoryStats,
  DictionaryEntry,
  HeartbeatStatus,
  LogsStats,
  MonitoredTermLanguage,
  PiLog,
  Report,
  Settings,
  SystemLogsResponse,
  SystemSettings,
  User,
} from "./types";

const API_TIMEOUT_MS = 60_000;

export class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function getRequestSignal(externalSignal?: AbortSignal | null): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(API_TIMEOUT_MS);
  return externalSignal
    ? AbortSignal.any([externalSignal, timeoutSignal])
    : timeoutSignal;
}

function getApiErrorMessage(status: number): string {
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "The requested record was not found.";
  if (status >= 500) return "The EchoSense service is temporarily unavailable.";
  return "The request could not be completed.";
}

function handleUnauthorizedResponse() {
  if (typeof document === "undefined") return;
  document.cookie = "echosense_token=; path=/; max-age=0";
  window.location.href = "/login";
}

async function apiRequest(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const token = getToken();
  const headers = buildApiHeaders(token, options?.headers);
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...options,
    signal: getRequestSignal(options?.signal),
    headers,
  });
  if (res.status === 401) {
    handleUnauthorizedResponse();
    throw new ApiError(401, "Unauthorized");
  }
  if (!res.ok) {
    throw new ApiError(res.status, getApiErrorMessage(res.status));
  }
  return res;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await apiRequest(path, options);
  return res.json() as Promise<T>;
}

export async function getAlerts(params?: {
  category?: string;
  language?: AlertLanguage;
  severity?: string;
  duration_gate?: string;
}): Promise<Alert[]> {
  const qs = new URLSearchParams();
  if (params?.category) qs.set("category", params.category);
  if (params?.language) qs.set("language", params.language);
  if (params?.severity) qs.set("severity", params.severity);
  if (params?.duration_gate) qs.set("duration_gate", params.duration_gate);
  const query = qs.toString();
  const value = await apiFetch<unknown>(
    `/alerts/${query ? `?${query}` : ""}`
  );
  return parseAlertListResponse(value, "/alerts/");
}

export async function getAlert(alertId: number): Promise<Alert> {
  const endpoint = `/alerts/${alertId}`;
  return parseAlertResponse(
    await apiFetch<unknown>(endpoint),
    endpoint
  );
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

export async function checkBackendHealth(): Promise<void> {
  await apiRequest("/health");
}

export async function createAlert(input: Omit<Alert, "id">): Promise<Alert> {
  return parseAlertResponse(
    await apiFetch<unknown>("/alerts/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
    "/alerts/"
  );
}

export async function getLogs(): Promise<Alert[]> {
  const value = await apiFetch<unknown>("/logs/");
  return parseAlertListResponse(value, "/logs/");
}

export async function getLogsStats(): Promise<LogsStats> {
  return apiFetch<LogsStats>("/logs/stats");
}

export async function getSettings(): Promise<Settings> {
  return systemSettingsToForm(await getSystemSettings());
}

export async function saveSettings(settings: Settings): Promise<Settings> {
  const response = await apiFetch<unknown>("/system-settings/", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settingsToUpdatePayload(settings)),
  });
  return systemSettingsToForm(parseSystemSettings(response));
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
  return parseDictionaryListResponse(
    await apiFetch<unknown>("/dictionary/")
  );
}

export async function addDictionaryEntry(entry: {
  slur_text: string;
  language: MonitoredTermLanguage;
  severity_weight: number;
}): Promise<DictionaryEntry> {
  return parseDictionaryEntry(
    await apiFetch<unknown>("/dictionary/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    })
  );
}

export async function deleteDictionaryEntry(termId: number): Promise<void> {
  await apiRequest(`/dictionary/${termId}`, {
    method: "DELETE",
  });
}

export async function getAuditLogs(
  filters: AuditLogFilters,
  signal?: AbortSignal
): Promise<AuditLogListResponse> {
  const query = auditFiltersToApiSearchParams(filters).toString();
  const value = await apiFetch<unknown>(`/audit-logs?${query}`, { signal });
  return parseAuditLogListResponse(value);
}

export interface AuditLogExport {
  blob: Blob;
  filename: string | null;
}

function getDownloadFilename(response: Response): string | null {
  const disposition = response.headers.get("content-disposition");
  if (!disposition) return null;

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const simpleMatch = disposition.match(/filename="?([^";]+)"?/i);
  const encodedFilename = utf8Match?.[1] ?? simpleMatch?.[1];
  if (!encodedFilename) return null;

  let filename = encodedFilename;
  try {
    filename = decodeURIComponent(encodedFilename);
  } catch {
    // Use the valid, undecoded header value.
  }
  const safeFilename = filename.split(/[\\/]/).pop()?.trim();
  return safeFilename || null;
}

export async function exportAuditLogs(
  filters: AuditLogFilters
): Promise<AuditLogExport> {
  const query = auditFiltersToApiSearchParams(filters, {
    includePagination: false,
  }).toString();
  const response = await apiRequest(`/audit-logs/export?${query}`);
  return {
    blob: await response.blob(),
    filename: getDownloadFilename(response),
  };
}

export async function getSystemSettings(): Promise<SystemSettings> {
  return parseSystemSettings(
    await apiFetch<unknown>("/system-settings/")
  );
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
  await apiRequest(`/users/${userId}`, {
    method: "DELETE",
  });
}
