import type {
  AuditLog,
  AuditLogClientPage,
  AuditLogFilters,
} from "./types";

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

export const UNKNOWN_AUDIT_ACTOR = "__unknown_actor__";

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

export function getAuditTimestamp(log: AuditLog): number | null {
  if (!log.occurred_at?.trim()) return null;
  const timestamp = Date.parse(log.occurred_at);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function filterAndSortAuditLogs(
  logs: AuditLog[],
  filters: AuditLogFilters
): AuditLog[] {
  const normalizedSearch = filters.search.trim().toLowerCase();
  const dateFrom = filters.date_from
    ? new Date(`${filters.date_from}T00:00:00`).getTime()
    : null;
  const dateTo = filters.date_to
    ? new Date(`${filters.date_to}T23:59:59.999`).getTime()
    : null;

  return logs
    .filter((log) => {
      const timestamp = getAuditTimestamp(log);
      if ((dateFrom !== null || dateTo !== null) && timestamp === null) {
        return false;
      }
      if (dateFrom !== null && timestamp !== null && timestamp < dateFrom) {
        return false;
      }
      if (dateTo !== null && timestamp !== null && timestamp > dateTo) {
        return false;
      }
      if (filters.actor_email) {
        const actorValue = log.actor_email ?? UNKNOWN_AUDIT_ACTOR;
        if (actorValue !== filters.actor_email) return false;
      }
      if (filters.actor_role && log.actor_role !== filters.actor_role) {
        return false;
      }
      if (filters.action && log.action !== filters.action) return false;
      if (filters.resource && log.resource !== filters.resource) return false;
      if (filters.status && log.status !== filters.status) return false;
      if (!normalizedSearch) return true;

      return [
        log.actor_email ?? "",
        log.action,
        formatAuditAction(log.action),
        log.resource,
        log.target ?? "",
        log.description ?? "",
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
    })
    .sort((a, b) => {
      const aTimestamp = getAuditTimestamp(a);
      const bTimestamp = getAuditTimestamp(b);
      if (aTimestamp === null && bTimestamp === null) {
        return b.id.localeCompare(a.id, undefined, { numeric: true });
      }
      if (aTimestamp === null) return 1;
      if (bTimestamp === null) return -1;
      return filters.sort_order === "desc"
        ? bTimestamp - aTimestamp
        : aTimestamp - bTimestamp;
    });
}

export function paginateAuditLogs(
  logs: AuditLog[],
  page: number,
  pageSize: number
): AuditLogClientPage {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(logs.length / safePageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * safePageSize;

  return {
    items: logs.slice(start, start + safePageSize),
    page: safePage,
    page_size: safePageSize,
    total_loaded: logs.length,
    total_pages: totalPages,
  };
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

function csvEscape(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const protectedValue = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  if (
    protectedValue.includes(",") ||
    protectedValue.includes('"') ||
    protectedValue.includes("\n")
  ) {
    return `"${protectedValue.replace(/"/g, '""')}"`;
  }
  return protectedValue;
}

export function createAuditCsv(logs: AuditLog[]): string {
  const headers = [
    "Timestamp",
    "User ID",
    "User",
    "Role",
    "Action",
    "Resource",
    "Resource ID",
    "Target",
    "Status",
    "Description",
    "IP Address",
    "User Agent",
    "Request ID",
    "Metadata",
    "Created At",
  ];
  const rows = logs.map((log) => [
    log.occurred_at,
    log.actor_user_id,
    log.actor_email,
    log.actor_role,
    log.action,
    log.resource,
    log.resource_id,
    log.target,
    log.status,
    log.description,
    log.ip_address,
    log.user_agent,
    log.request_id,
    log.metadata
      ? JSON.stringify(sanitizeAuditMetadata(log.metadata))
      : "",
    log.created_at,
  ]);

  return [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");
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
    action: params.get("action") ?? "",
    resource: params.get("resource") ?? "",
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
  if (filters.action) params.set("action", filters.action);
  if (filters.resource) params.set("resource", filters.resource);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  if (filters.sort_order !== "desc") {
    params.set("sort_order", filters.sort_order);
  }
  return params;
}
