import {
  ApiContractError,
  auditFiltersToApiSearchParams,
  parseAuditLogListResponse,
} from "./audit-log";
import {
  parseAlertListResponse,
  parseAlertListResult,
  parseAlertResponse,
} from "./alert-contract";
import type { AlertListParseResult } from "./alert-contract";
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
import {
  parseClassroomListResponse,
  parseClassroomResponse,
  parseDeviceKeyResponse,
  parseEdgeDeviceListResponse,
  parseEdgeDeviceResponse,
} from "./multi-room-contract";
import type {
  Alert,
  AlertFilters,
  AnalyticsSummary,
  AuditLogFilters,
  AuditLogListResponse,
  CategoryStats,
  DictionaryEntry,
  Classroom,
  ClassroomCreateRequest,
  ClassroomFilters,
  ClassroomUpdateRequest,
  DeviceAssignmentRequest,
  DeviceCreateRequest,
  DeviceFilters,
  DeviceRegistrationResult,
  DeviceRotationResult,
  DeviceUpdateRequest,
  EdgeDevice,
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
import { parseValidJwtClaims } from "./auth-token";

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
  const token = document.cookie
    .split("; ")
    .find(r => r.startsWith("echosense_token="))
    ?.split("=")[1];
  if (token && !parseValidJwtClaims(token)) {
    document.cookie = "echosense_token=; path=/; max-age=0";
    return undefined;
  }
  return token;
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
  if (status === 409) return "The request conflicts with a recent change.";
  if (status === 422) return "Please check the information you entered.";
  if (status >= 500) return "The EchoSense service is temporarily unavailable.";
  return "The request could not be completed.";
}

async function responseErrorMessage(response: Response): Promise<string> {
  const fallback = getApiErrorMessage(response.status);
  if (![403, 404, 409, 422].includes(response.status)) return fallback;
  try {
    const value = (await response.json()) as unknown;
    if (!isRecord(value)) return fallback;
    if (typeof value.detail === "string" && value.detail.trim()) {
      return value.detail.trim().slice(0, 300);
    }
    if (response.status === 422 && Array.isArray(value.detail)) {
      const messages = value.detail
        .map((item) =>
          isRecord(item) && typeof item.msg === "string" ? item.msg.trim() : ""
        )
        .filter(Boolean);
      if (messages.length > 0) return messages.slice(0, 3).join(" ").slice(0, 300);
    }
  } catch {
    // Fall back to the status-specific safe message.
  }
  return fallback;
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
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
      ...options,
      signal: getRequestSignal(options?.signal),
      headers,
    });
  } catch (error) {
    if (options?.signal?.aborted) throw error;
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ApiError(0, "The request took too long. Please try again.");
    }
    throw new ApiError(0, "Unable to connect to the EchoSense service.");
  }
  if (res.status === 401) {
    handleUnauthorizedResponse();
    throw new ApiError(401, "Unauthorized");
  }
  if (!res.ok) {
    throw new ApiError(res.status, await responseErrorMessage(res));
  }
  return res;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await apiRequest(path, options);
  return res.json() as Promise<T>;
}

export async function getAlerts(params?: AlertFilters): Promise<Alert[]> {
  return (await getAlertsWithMetadata(params)).alerts;
}

export async function getAlertsWithMetadata(
  params?: AlertFilters
): Promise<AlertListParseResult> {
  const qs = new URLSearchParams();
  if (params?.event_id) qs.set("event_id", params.event_id);
  if (params?.classroom_id) qs.set("classroom_id", params.classroom_id);
  if (params?.school_id) qs.set("school_id", params.school_id);
  if (params?.device_id) qs.set("device_id", params.device_id);
  if (params?.category) qs.set("category", params.category);
  if (params?.language) qs.set("language", params.language);
  if (params?.severity) qs.set("severity", params.severity);
  if (params?.duration_gate) qs.set("duration_gate", params.duration_gate);
  if (params?.skip !== undefined) qs.set("skip", String(params.skip));
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const query = qs.toString();
  const value = await apiFetch<unknown>(
    `/alerts/${query ? `?${query}` : ""}`
  );
  return parseAlertListResult(value, "/alerts/");
}

function addBooleanParam(
  query: URLSearchParams,
  name: string,
  value: boolean | undefined
) {
  if (value !== undefined) query.set(name, String(value));
}

export async function getClassrooms(
  filters?: ClassroomFilters
): Promise<Classroom[]> {
  const query = new URLSearchParams();
  if (filters?.school_id) query.set("school_id", filters.school_id);
  addBooleanParam(query, "is_active", filters?.is_active);
  const endpoint = `/classrooms${query.size ? `?${query}` : ""}`;
  return parseClassroomListResponse(await apiFetch<unknown>(endpoint), endpoint);
}

export async function getClassroom(classroomId: string): Promise<Classroom> {
  const endpoint = `/classrooms/${encodeURIComponent(classroomId)}`;
  return parseClassroomResponse(await apiFetch<unknown>(endpoint), endpoint);
}

export async function createClassroom(
  input: ClassroomCreateRequest
): Promise<Classroom> {
  const endpoint = "/classrooms";
  return parseClassroomResponse(
    await apiFetch<unknown>(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
    endpoint
  );
}

export async function updateClassroom(
  classroomId: string,
  input: ClassroomUpdateRequest
): Promise<Classroom> {
  const endpoint = `/classrooms/${encodeURIComponent(classroomId)}`;
  return parseClassroomResponse(
    await apiFetch<unknown>(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
    endpoint
  );
}

export async function getDevices(filters?: DeviceFilters): Promise<EdgeDevice[]> {
  const query = new URLSearchParams();
  if (filters?.school_id) query.set("school_id", filters.school_id);
  if (filters?.classroom_id) query.set("classroom_id", filters.classroom_id);
  addBooleanParam(query, "is_active", filters?.is_active);
  addBooleanParam(query, "unassigned", filters?.unassigned);
  const endpoint = `/devices${query.size ? `?${query}` : ""}`;
  return parseEdgeDeviceListResponse(await apiFetch<unknown>(endpoint), endpoint);
}

export async function getDevice(deviceId: string): Promise<EdgeDevice> {
  const endpoint = `/devices/${encodeURIComponent(deviceId)}`;
  return parseEdgeDeviceResponse(await apiFetch<unknown>(endpoint), endpoint);
}

export async function registerDevice(
  input: DeviceCreateRequest
): Promise<DeviceRegistrationResult> {
  const endpoint = "/devices";
  return parseDeviceKeyResponse(
    await apiFetch<unknown>(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
    endpoint
  );
}

export async function updateDevice(
  deviceId: string,
  input: DeviceUpdateRequest
): Promise<EdgeDevice> {
  const endpoint = `/devices/${encodeURIComponent(deviceId)}`;
  return parseEdgeDeviceResponse(
    await apiFetch<unknown>(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
    endpoint
  );
}

async function deviceAction(
  deviceId: string,
  action: "assign" | "unassign" | "disable" | "enable",
  input?: DeviceAssignmentRequest
): Promise<EdgeDevice> {
  const endpoint = `/devices/${encodeURIComponent(deviceId)}/${action}`;
  return parseEdgeDeviceResponse(
    await apiFetch<unknown>(endpoint, {
      method: "POST",
      ...(input
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        : {}),
    }),
    endpoint
  );
}

export function assignDevice(
  deviceId: string,
  input: DeviceAssignmentRequest
): Promise<EdgeDevice> {
  return deviceAction(deviceId, "assign", input);
}

export function unassignDevice(deviceId: string): Promise<EdgeDevice> {
  return deviceAction(deviceId, "unassign");
}

export function disableDevice(deviceId: string): Promise<EdgeDevice> {
  return deviceAction(deviceId, "disable");
}

export function enableDevice(deviceId: string): Promise<EdgeDevice> {
  return deviceAction(deviceId, "enable");
}

export async function rotateDeviceKey(
  deviceId: string
): Promise<DeviceRotationResult> {
  const endpoint = `/devices/${encodeURIComponent(deviceId)}/rotate-key`;
  return parseDeviceKeyResponse(
    await apiFetch<unknown>(endpoint, { method: "POST" }),
    endpoint
  );
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
