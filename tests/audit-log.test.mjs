import test from "node:test";
import assert from "node:assert/strict";
import {
  auditFiltersFromSearchParams,
  auditFiltersToSearchParams,
  createAuditCsv,
  DEFAULT_AUDIT_FILTERS,
  filterAndSortAuditLogs,
  formatAuditAction,
  paginateAuditLogs,
  sanitizeAuditMetadata,
} from "../lib/audit-log.ts";
import { ApiContractError, parseAuditLogs } from "../lib/api.ts";
import { formatTimestamp } from "../lib/format.ts";

const LEGACY_RECORD = {
  log_id: 7,
  user_id: 10,
  actor_email: "admin@school.edu",
  action: "Updated System Settings",
  module: "System Settings",
  target: "Detection Threshold",
  performed_at: "2026-07-27T10:42:00Z",
};

test("parses and normalizes the verified legacy audit response", () => {
  const [record] = parseAuditLogs([LEGACY_RECORD]);

  assert.equal(record.id, "7");
  assert.equal(record.occurred_at, LEGACY_RECORD.performed_at);
  assert.equal(record.actor_user_id, "10");
  assert.equal(record.resource, "System Settings");
  assert.equal(record.status, null);
  assert.equal(record.metadata, null);
});

test("rejects an object when the verified backend contract requires an array", () => {
  assert.throws(
    () =>
      parseAuditLogs({
        items: [LEGACY_RECORD],
        page: 1,
        page_size: 25,
        total: 1,
        total_pages: 1,
      }),
    ApiContractError
  );
});

test("rejects structurally malformed audit records", () => {
  assert.throws(
    () => parseAuditLogs([{ ...LEGACY_RECORD, action: null }]),
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

test("filters all loaded records before client pagination", () => {
  const logs = parseAuditLogs([
    LEGACY_RECORD,
    {
      ...LEGACY_RECORD,
      log_id: 8,
      action: "Created User",
      target: "teacher@school.edu",
      performed_at: "2026-07-27T11:00:00Z",
    },
  ]);
  const filtered = filterAndSortAuditLogs(logs, {
    ...DEFAULT_AUDIT_FILTERS,
    search: "teacher@school.edu",
  });
  const page = paginateAuditLogs(filtered, 1, 10);

  assert.equal(filtered.length, 1);
  assert.equal(page.total_loaded, 1);
  assert.equal(page.items[0].id, "8");
});

test("serializes shareable filter state and omits defaults", () => {
  const params = auditFiltersToSearchParams({
    ...DEFAULT_AUDIT_FILTERS,
    page: 2,
    page_size: 50,
    search: "login",
    action: "LOGIN",
  });

  assert.equal(params.get("page"), "2");
  assert.equal(params.get("page_size"), "50");
  assert.equal(params.get("search"), "login");
  assert.equal(params.get("action"), "LOGIN");
  assert.equal(params.has("sort_order"), false);

  const restored = auditFiltersFromSearchParams(params);
  assert.equal(restored.page, 2);
  assert.equal(restored.page_size, 50);
  assert.equal(restored.search, "login");
});

test("CSV export includes all filtered rows and redacts metadata", () => {
  const record = {
    ...parseAuditLogs([LEGACY_RECORD])[0],
    metadata: {
      token: "do-not-export",
      changed: "threshold",
    },
  };
  const csv = createAuditCsv([record]);

  assert.match(csv, /Updated System Settings/);
  assert.match(csv, /\[REDACTED\]/);
  assert.doesNotMatch(csv, /do-not-export/);
});
