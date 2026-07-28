import test from "node:test";
import assert from "node:assert/strict";
import {
  ApiContractError,
  auditFiltersFromSearchParams,
  auditFiltersToApiSearchParams,
  auditFiltersToSearchParams,
  DEFAULT_AUDIT_FILTERS,
  formatAuditAction,
  parseAuditLogListResponse,
  sanitizeAuditMetadata,
} from "../lib/audit-log.ts";
import { formatTimestamp } from "../lib/format.ts";

const AUDIT_RECORD = {
  id: "7",
  occurred_at: "2026-07-27T10:42:00Z",
  actor_user_id: "10",
  actor_email: "admin@school.edu",
  actor_role: "admin",
  action: "UPDATE_SETTINGS",
  resource: "Detection Settings",
  resource_id: "settings-1",
  target: "Confidence Threshold",
  status: "SUCCESS",
  description: "Changed confidence threshold.",
  ip_address: "127.0.0.1",
  user_agent: "Mozilla/5.0",
  request_id: "request-7",
  metadata: { previous: 0.8, current: 0.85 },
  created_at: "2026-07-27T10:42:00Z",
};

const AUDIT_PAGE = {
  items: [AUDIT_RECORD],
  page: 1,
  page_size: 25,
  total: 1,
  total_pages: 1,
};

test("parses the deployed paginated audit response", () => {
  const page = parseAuditLogListResponse(AUDIT_PAGE);

  assert.equal(page.items[0].id, "7");
  assert.equal(page.items[0].occurred_at, AUDIT_RECORD.occurred_at);
  assert.equal(page.items[0].actor_role, "admin");
  assert.equal(page.items[0].status, "SUCCESS");
  assert.equal(page.total, 1);
  assert.equal(page.total_pages, 1);
});

test("accepts nullable legacy fields from the deployed schema", () => {
  const page = parseAuditLogListResponse({
    ...AUDIT_PAGE,
    items: [
      {
        id: "8",
        action: "LOGIN_FAILED",
        resource: "Authentication",
        occurred_at: null,
        status: null,
        metadata: {},
      },
    ],
  });

  assert.equal(page.items[0].occurred_at, null);
  assert.equal(page.items[0].actor_email, null);
  assert.equal(page.items[0].status, null);
});

test("rejects the old raw-array audit response", () => {
  assert.throws(
    () => parseAuditLogListResponse([AUDIT_RECORD]),
    ApiContractError
  );
});

test("rejects malformed pagination and audit records", () => {
  assert.throws(
    () => parseAuditLogListResponse({ ...AUDIT_PAGE, total: "1" }),
    ApiContractError
  );
  assert.throws(
    () =>
      parseAuditLogListResponse({
        ...AUDIT_PAGE,
        items: [{ ...AUDIT_RECORD, status: "UNKNOWN" }],
      }),
    ApiContractError
  );
});

test("invalid and missing timestamps never throw", () => {
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (...values) => warnings.push(values);

  try {
    assert.equal(
      formatTimestamp("not-a-date", {
        recordId: "audit-7",
        field: "occurred_at",
      }),
      "Invalid timestamp"
    );
    assert.equal(
      formatTimestamp(null, {
        recordId: "audit-8",
        field: "occurred_at",
      }),
      "Time unavailable"
    );
    assert.equal(warnings.length, 2);
    assert.equal(warnings[0][1].recordId, "audit-7");
  } finally {
    console.warn = originalWarn;
  }
});

test("formats stable action values without changing filter values", () => {
  assert.equal(formatAuditAction("LOGIN_FAILED"), "Failed Login");
  assert.equal(formatAuditAction("CREATE_USER"), "Created User");
  assert.equal(
    formatAuditAction("Updated System Settings"),
    "Updated System Settings"
  );
});

test("redacts sensitive metadata recursively", () => {
  const safe = sanitizeAuditMetadata({
    change: "updated",
    password: "do-not-show",
    nested: {
      access_token: "do-not-show",
      api_key: "do-not-show",
      visible: true,
    },
  });

  assert.deepEqual(safe, {
    change: "updated",
    password: "[REDACTED]",
    nested: {
      access_token: "[REDACTED]",
      api_key: "[REDACTED]",
      visible: true,
    },
  });
});

test("serializes every backend filter and pagination field", () => {
  const filters = {
    ...DEFAULT_AUDIT_FILTERS,
    page: 2,
    page_size: 50,
    search: "login",
    actor_email: "admin@school.edu",
    actor_role: "admin",
    action: "LOGIN",
    resource: "Authentication",
    status: "SUCCESS",
    date_from: "2026-07-01",
    date_to: "2026-07-31",
    sort_order: "asc",
  };
  const params = auditFiltersToApiSearchParams(filters);

  assert.equal(params.get("page"), "2");
  assert.equal(params.get("page_size"), "50");
  assert.equal(params.get("search"), "login");
  assert.equal(params.get("actor_email"), "admin@school.edu");
  assert.equal(params.get("actor_role"), "admin");
  assert.equal(params.get("action"), "LOGIN");
  assert.equal(params.get("resource"), "Authentication");
  assert.equal(params.get("status"), "SUCCESS");
  assert.equal(params.get("date_from"), "2026-07-01");
  assert.equal(params.get("date_to"), "2026-07-31");
  assert.equal(params.get("sort_order"), "asc");

  const exportParams = auditFiltersToApiSearchParams(filters, {
    includePagination: false,
  });
  assert.equal(exportParams.has("page"), false);
  assert.equal(exportParams.has("page_size"), false);
  assert.equal(exportParams.get("status"), "SUCCESS");
});

test("preserves all shareable audit filters in the URL", () => {
  const params = auditFiltersToSearchParams({
    ...DEFAULT_AUDIT_FILTERS,
    page: 2,
    actor_role: "admin",
    status: "FAILURE",
  });
  const restored = auditFiltersFromSearchParams(params);

  assert.equal(restored.page, 2);
  assert.equal(restored.actor_role, "admin");
  assert.equal(restored.status, "FAILURE");
});
