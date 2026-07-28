import type {
  AuditLog,
  AuditLogFilters,
  AuditLogListResponse,
  AuditLogStatus,
} from "./types";

export class ApiContractError extends Error {
  public readonly endpoint: string;

  constructor(endpoint: string, message: string) {
    super(`Invalid response from ${endpoint}: ${message}`);
    this.endpoint = endpoint;
    this.name = "ApiContractError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNullableString(
  entry: Record<string, unknown>,
  field: string,
  index: number
): string | null {
  const value = entry[field];
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw new ApiContractError(
      "/audit-logs",
      `items[${index}].${field} must be a string or null`
    );
  }
  return value;
}

function parseAuditLog(entry: unknown, index: number): AuditLog {
  const endpoint = "/audit-logs";
  if (!isRecord(entry)) {
    throw new ApiContractError(endpoint, `items[${index}] is not an object`);
  }

  if (
    typeof entry.id !== "string" ||
    typeof entry.action !== "string" ||
    typeof entry.resource !== "string"
  ) {
    throw new ApiContractError(
      endpoint,
      `items[${index}] is missing a valid id, action, or resource`
    );
  }

  const rawStatus = entry.status;
  if (
    rawStatus !== undefined &&
    rawStatus !== null &&
    rawStatus !== "SUCCESS" &&
    rawStatus !== "FAILURE"
  ) {
    throw new ApiContractError(
      endpoint,
      `items[${index}].status must be SUCCESS, FAILURE, or null`
    );
  }

  const rawMetadata = entry.metadata;
  if (
    rawMetadata !== undefined &&
    rawMetadata !== null &&
    !isRecord(rawMetadata)
  ) {
    throw new ApiContractError(
      endpoint,
      `items[${index}].metadata must be an object or null`
    );
  }

  return {
    id: entry.id,
    occurred_at: readNullableString(entry, "occurred_at", index),
    actor_user_id: readNullableString(entry, "actor_user_id", index),
    actor_email: readNullableString(entry, "actor_email", index),
    actor_role: readNullableString(entry, "actor_role", index),
    action: entry.action,
    resource: entry.resource,
    resource_id: readNullableString(entry, "resource_id", index),
    target: readNullableString(entry, "target", index),
    status: (rawStatus ?? null) as AuditLogStatus | null,
    description: readNullableString(entry, "description", index),
    ip_address: readNullableString(entry, "ip_address", index),
    user_agent: readNullableString(entry, "user_agent", index),
    request_id: readNullableString(entry, "request_id", index),
    metadata: (rawMetadata ?? null) as Record<string, unknown> | null,
    created_at: readNullableString(entry, "created_at", index),
  };
}

export function parseAuditLogListResponse(
  value: unknown
): AuditLogListResponse {
  const endpoint = "/audit-logs";
  if (!isRecord(value)) {
    throw new ApiContractError(endpoint, "expected a paginated object");
  }
  if (!Array.isArray(value.items)) {
    throw new ApiContractError(endpoint, "items must be an array");
  }

  const paginationFields = [
    "page",
    "page_size",
    "total",
    "total_pages",
  ] as const;
  for (const field of paginationFields) {
    const fieldValue = value[field];
    const minimum = field === "page" || field === "page_size" ? 1 : 0;
    if (
      typeof fieldValue !== "number" ||
      !Number.isInteger(fieldValue) ||
      fieldValue < minimum
    ) {
      throw new ApiContractError(
        endpoint,
        `${field} must be an integer greater than or equal to ${minimum}`
      );
    }
  }

  return {
    items: value.items.map(parseAuditLog),
    page: value.page as number,
    page_size: value.page_size as number,
    total: value.total as number,
    total_pages: value.total_pages as number,
  };
}

export const DEFAULT_AUDIT_FILTERS: AuditLogFilters = {
  page: 1,
  page_size: 25,
  search: "",
  actor_email: "",
  actor_role: "",
  action: "",
  resource: "",
  status: "",
  date_from: "",
  date_to: "",
  sort_order: "desc",
};

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Login",
  LOGIN_FAILED: "Failed Login",
  LOGOUT: "Logout",
  CREATE_USER: "Created User",
  UPDATE_USER: "Updated User",
  DELETE_USER: "Deleted User",
  CHANGE_USER_ROLE: "Changed User Role",
  ADD_MONITORED_TERM: "Added Monitored Term",
  UPDATE_MONITORED_TERM: "Updated Monitored Term",
  DELETE_MONITORED_TERM: "Deleted Monitored Term",
  UPDATE_SETTINGS: "Updated Settings",
};

const SENSITIVE_METADATA_KEY =
  /(password|token|authorization|cookie|secret|api[_-]?key|credential)/i;

export function formatAuditAction(action: string): string {
  const normalized = action.trim().replace(/[\s-]+/g, "_").toUpperCase();
  if (ACTION_LABELS[normalized]) return ACTION_LABELS[normalized];

  return normalized
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatAuditRole(role: string | null): string {
  if (!role?.trim()) return "Role unavailable";
  return role
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function sanitizeAuditMetadata(
  value: unknown,
  depth = 0
): unknown {
  if (depth > 6) return "[Truncated]";
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditMetadata(item, depth + 1));
  }
  if (typeof value !== "object") return String(value);

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      SENSITIVE_METADATA_KEY.test(key)
        ? "[REDACTED]"
        : sanitizeAuditMetadata(entry, depth + 1),
    ])
  );
}

export function auditFiltersFromSearchParams(
  params: { get(name: string): string | null }
): AuditLogFilters {
  const page = Number(params.get("page"));
  const pageSize = Number(params.get("page_size"));
  const sortOrder = params.get("sort_order");

  return {
    ...DEFAULT_AUDIT_FILTERS,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    page_size: [10, 25, 50].includes(pageSize) ? pageSize : 25,
    search: params.get("search") ?? "",
    actor_email: params.get("actor_email") ?? "",
    actor_role: params.get("actor_role") ?? "",
    action: params.get("action") ?? "",
    resource: params.get("resource") ?? "",
    status:
      params.get("status") === "SUCCESS" ||
      params.get("status") === "FAILURE"
        ? (params.get("status") as "SUCCESS" | "FAILURE")
        : "",
    date_from: params.get("date_from") ?? "",
    date_to: params.get("date_to") ?? "",
    sort_order: sortOrder === "asc" ? "asc" : "desc",
  };
}

export function auditFiltersToSearchParams(
  filters: AuditLogFilters
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page !== 1) params.set("page", String(filters.page));
  if (filters.page_size !== 25) {
    params.set("page_size", String(filters.page_size));
  }
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.actor_email) params.set("actor_email", filters.actor_email);
  if (filters.actor_role) params.set("actor_role", filters.actor_role);
  if (filters.action) params.set("action", filters.action);
  if (filters.resource) params.set("resource", filters.resource);
  if (filters.status) params.set("status", filters.status);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  if (filters.sort_order !== "desc") {
    params.set("sort_order", filters.sort_order);
  }
  return params;
}

export function auditFiltersToApiSearchParams(
  filters: AuditLogFilters,
  options: { includePagination?: boolean } = {}
): URLSearchParams {
  const params = new URLSearchParams();
  if (options.includePagination !== false) {
    params.set("page", String(filters.page));
    params.set("page_size", String(filters.page_size));
  }
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.actor_email.trim()) {
    params.set("actor_email", filters.actor_email.trim());
  }
  if (filters.actor_role) params.set("actor_role", filters.actor_role);
  if (filters.action.trim()) params.set("action", filters.action.trim());
  if (filters.resource.trim()) params.set("resource", filters.resource.trim());
  if (filters.status) params.set("status", filters.status);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  params.set("sort_order", filters.sort_order);
  return params;
}
