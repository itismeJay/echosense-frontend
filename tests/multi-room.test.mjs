import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  MultiRoomContractError,
  parseClassroomListResponse,
  parseDeviceKeyResponse,
  parseEdgeDeviceListResponse,
  schoolSummariesFromResources,
} from "../lib/multi-room-contract.ts";
import { parseAlertResponse } from "../lib/alert-contract.ts";

const readSource = (relativePath) =>
  readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

const SCHOOL_ID = "1f1f3a0c-1234-4abc-8def-1234567890ab";
const CLASSROOM_ID = "2f1f3a0c-1234-4abc-8def-1234567890ab";
const DEVICE_ID = "3f1f3a0c-1234-4abc-8def-1234567890ab";

const DEVICE = {
  id: DEVICE_ID,
  device_code: "classroom-pi-01",
  display_name: "EchoSense Device 01",
  school_id: SCHOOL_ID,
  school_name: "School Alpha",
  classroom_id: CLASSROOM_ID,
  classroom_name: "Classroom A101",
  assignment_state: "assigned",
  is_active: true,
  created_at: "2026-08-11T00:00:00Z",
  updated_at: "2026-08-11T00:01:00Z",
  last_seen_at: null,
  assigned_at: "2026-08-11T00:00:00Z",
  key_rotated_at: null,
};

const CLASSROOM = {
  id: CLASSROOM_ID,
  school_id: SCHOOL_ID,
  school_name: "School Alpha",
  name: "Classroom A101",
  is_active: true,
  created_at: "2026-08-11T00:00:00Z",
  updated_at: "2026-08-11T00:01:00Z",
  devices: [
    {
      id: DEVICE_ID,
      device_code: DEVICE.device_code,
      display_name: DEVICE.display_name,
      is_active: true,
    },
  ],
};

test("parses classroom lists with exact school and assigned-device fields", () => {
  assert.deepEqual(parseClassroomListResponse([CLASSROOM]), [CLASSROOM]);
});

test("parses assigned and unassigned devices with exact nullable metadata", () => {
  const unassigned = {
    ...DEVICE,
    classroom_id: null,
    classroom_name: null,
    assignment_state: "unassigned",
    assigned_at: null,
  };
  assert.deepEqual(parseEdgeDeviceListResponse([DEVICE, unassigned]), [DEVICE, unassigned]);
});

test("rejects contradictory device assignment state", () => {
  assert.throws(
    () => parseEdgeDeviceListResponse([{ ...DEVICE, assignment_state: "unassigned" }]),
    MultiRoomContractError
  );
});

test("parses registration and rotation one-time key responses without adding persistence", () => {
  const response = {
    device: DEVICE,
    device_key: "synthetic_test_key_not_a_real_credential",
    warning: "Store this key securely. It will not be shown again.",
  };
  assert.deepEqual(parseDeviceKeyResponse(response, "/devices"), response);
  assert.deepEqual(parseDeviceKeyResponse(response, `/devices/${DEVICE_ID}/rotate-key`), response);
});

test("rejects malformed one-time key responses", () => {
  assert.throws(
    () => parseDeviceKeyResponse({ device: DEVICE }, "/devices"),
    MultiRoomContractError
  );
});

test("derives legitimate super-admin school choices only from returned resources", () => {
  assert.deepEqual(schoolSummariesFromResources([CLASSROOM], [DEVICE]), [
    { id: SCHOOL_ID, name: "School Alpha" },
  ]);
  assert.deepEqual(schoolSummariesFromResources([], []), []);
});

test("alert parsing preserves immutable classroom, school, and device snapshot attribution", () => {
  const alert = parseAlertResponse({
    id: 1,
    severity: "high",
    severity_level: "HIGH",
    classroom_id: CLASSROOM_ID,
    classroom_name: "Classroom A101",
    school_id: SCHOOL_ID,
    school_name: "School Alpha",
    device_id: DEVICE_ID,
    device_display_name: DEVICE.display_name,
    location: "Legacy location",
    created_at: "2026-08-11T00:00:00Z",
  });
  assert.equal(alert.classroom_id, CLASSROOM_ID);
  assert.equal(alert.classroom_name, "Classroom A101");
  assert.equal(alert.location, "Classroom A101");
  assert.equal(alert.school_id, SCHOOL_ID);
  assert.equal(alert.device_id, DEVICE_ID);
});

test("central API exposes every verified Multi-Room endpoint and server alert filter", async () => {
  const api = await readSource("lib/api.ts");
  for (const fragment of [
    '"/classrooms"',
    "`/classrooms/${encodeURIComponent(classroomId)}`",
    '"/devices"',
    "`/devices/${encodeURIComponent(deviceId)}`",
    '"assign"',
    '"unassign"',
    '"disable"',
    '"enable"',
    "`/devices/${encodeURIComponent(deviceId)}/rotate-key`",
  ]) {
    assert.match(api, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(api, /qs\.set\("classroom_id", params\.classroom_id\)/);
  assert.match(api, /qs\.set\("device_id", params\.device_id\)/);
  assert.match(api, /qs\.set\("school_id", params\.school_id\)/);
});

test("classrooms include lifecycle, detail, loading, empty, error, and confirmation UX", async () => {
  const [list, detail] = await Promise.all([
    readSource("app/(app)/classrooms/page.tsx"),
    readSource("app/(app)/classrooms/[id]/page.tsx"),
  ]);
  assert.match(list, /createClassroom/);
  assert.match(list, /No classrooms yet/);
  assert.match(list, /Classrooms couldn't be loaded/);
  assert.match(list, /LoadingRows/);
  assert.match(list, /href=\{`\/classrooms\/\$\{classroom\.id\}`\}/);
  assert.match(detail, /updateClassroom\(classroom\.id, \{ is_active: active \}\)/);
  assert.match(detail, /updateClassroom\(classroom\.id, \{ name \}\)/);
  assert.match(detail, /ConfirmDialog/);
  assert.match(detail, /Classroom not found/);
});

test("each classroom card shows its device, online status, last check-in and area map", async () => {
  const list = await readSource("app/(app)/classrooms/page.tsx");
  assert.match(list, /<DeviceStatus lastSeenAt=\{device\.last_seen_at\} online=\{status\?\.online\}/);
  assert.match(list, /Last check-in/);
  assert.match(list, /Area map/);
  assert.match(list, /alerts this week/);
});

test("device management lives inside the classroom with protected moves and every lifecycle action", async () => {
  const source = await readSource("app/(app)/classrooms/[id]/page.tsx");
  assert.match(source, /expected_current_classroom_id: dialog\.device\.classroom_id/);
  assert.match(source, /caught\.status === 409/);
  assert.match(source, /Someone else just changed this/);
  assert.match(source, /registerDevice\(\{ \.\.\.input, school_id: classroom\.school_id, classroom_id: classroom\.id \}\)/);
  assert.match(source, /unassignDevice/);
  assert.match(source, /disableDevice/);
  assert.match(source, /enableDevice/);
  assert.match(source, /rotateDeviceKey/);
  assert.match(source, /No device in this classroom/);
});

test("one-time device keys are copied temporarily, cleared on close, never stored, and never logged", async () => {
  const [management, dialog] = await Promise.all([
    readSource("app/(app)/classrooms/[id]/page.tsx"),
    readSource("components/multi-room/DeviceSecretDialog.tsx"),
  ]);
  const combined = `${management}\n${dialog}`;
  assert.match(dialog, /navigator\.clipboard\.writeText\(result\.device_key\)/);
  assert.match(management, /onClose=\{\(\) => setSecret\(null\)\}/);
  assert.doesNotMatch(combined, /localStorage|sessionStorage|document\.cookie|URLSearchParams/);
  assert.doesNotMatch(combined, /console\.(log|debug|info|warn|error)/);
});

test("alerts filter by severity, date and classroom; the entered school scopes the data", async () => {
  const [view, api, detail] = await Promise.all([
    readSource("components/AlertsView.tsx"),
    readSource("lib/api.ts"),
    readSource("app/(app)/alerts/[id]/page.tsx"),
  ]);
  for (const label of ["Severity", "Classroom", "From", "To"]) {
    assert.match(view, new RegExp(`>\\s*${label}\\s*<`), label);
  }
  assert.match(view, /alert\.severity !== severity/);
  assert.match(view, /classroomLabel\(alert\) !== classroom/);
  assert.match(view, /day < from/);
  assert.match(view, /day > to/);
  assert.match(view, /\{ href: "\/alerts", label: "Needs review", count: waitingCount \}/);
  assert.match(view, /\{ href: "\/alerts\/all", label: "All alerts" \}/);
  assert.match(api, /qs\.set\("status", params\.status\)/);
  assert.match(detail, /REQUIRED_REVIEW_NOTICE/);
});

test("management routes remain admin-only and API errors distinguish permission and conflict", async () => {
  const [access, api] = await Promise.all([
    readSource("lib/access.ts"),
    readSource("lib/api.ts"),
  ]);
  assert.match(access, /\{ prefix: "\/classrooms", roles: ADMINS \}/);
  // Device management lives inside Classrooms now; /devices redirects there.
  assert.doesNotMatch(access, /prefix: "\/devices"/);
  assert.match(api, /status === 403/);
  assert.match(api, /status === 409/);
  assert.match(api, /status === 422/);
  assert.match(api, /Unable to connect to the EchoSense service\./);
});
