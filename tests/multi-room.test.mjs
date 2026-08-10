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

test("classroom management includes lifecycle, detail, loading, empty, error, and confirmation UX", async () => {
  const source = await readSource("components/multi-room/ClassroomManagement.tsx");
  assert.match(source, /createClassroom/);
  assert.match(source, /updateClassroom/);
  assert.match(source, /Classroom reactivated\./);
  assert.match(source, /Classroom deactivated\./);
  assert.match(source, /No classrooms have been created yet\./);
  assert.match(source, /ResourceError/);
  assert.match(source, /ConfirmDialog/);
  assert.match(source, /href=\{`\/classrooms\/\$\{classroom\.id\}`\}/);
});

test("device management includes protected reassignment and every lifecycle action", async () => {
  const source = await readSource("components/multi-room/DeviceManagement.tsx");
  assert.match(source, /expected_current_classroom_id: assigning\.classroom_id/);
  assert.match(source, /This device assignment changed\. Refresh and try again\./);
  assert.match(source, /registerDevice/);
  assert.match(source, /unassignDevice/);
  assert.match(source, /disableDevice/);
  assert.match(source, /enableDevice/);
  assert.match(source, /rotateDeviceKey/);
  assert.match(source, /No Edge devices registered\./);
  assert.match(source, /ResourceError/);
});

test("one-time device keys are copied temporarily, cleared on close, never stored, and never logged", async () => {
  const [management, dialog] = await Promise.all([
    readSource("components/multi-room/DeviceManagement.tsx"),
    readSource("components/multi-room/DeviceSecretDialog.tsx"),
  ]);
  const combined = `${management}\n${dialog}`;
  assert.match(dialog, /navigator\.clipboard\.writeText\(result\.device_key\)/);
  assert.match(management, /onClose=\{\(\) => setSecret\(null\)\}/);
  assert.doesNotMatch(combined, /localStorage|sessionStorage|document\.cookie|URLSearchParams/);
  assert.doesNotMatch(combined, /console\.(log|debug|info|warn|error)/);
});

test("alerts use server-side room filters while preserving existing human-review and detail UI", async () => {
  const [collection, card] = await Promise.all([
    readSource("components/AlertCollection.tsx"),
    readSource("components/AlertCard.tsx"),
  ]);
  assert.match(collection, /getAlertsWithMetadata/);
  assert.match(collection, /classroom_id: classroomId/);
  assert.match(collection, /device_id: deviceId/);
  assert.match(collection, /school_id: activeSchoolId/);
  assert.match(collection, /Promise\.all\(\[getClassrooms\(\), getDevices\(\)\]\)/);
  assert.match(collection, /managementClassrooms\.forEach/);
  assert.match(collection, /managementDevices\.forEach/);
  assert.match(collection, /Concern category/);
  assert.match(collection, /Language/);
  assert.match(collection, /Detection reason/);
  assert.match(card, /REQUIRED_REVIEW_NOTICE/);
  assert.match(card, /Device:/);
});

test("management routes remain admin-only and API errors distinguish permission and conflict", async () => {
  const [proxy, api] = await Promise.all([
    readSource("proxy.ts"),
    readSource("lib/api.ts"),
  ]);
  assert.match(proxy, /"\/classrooms"/);
  assert.match(proxy, /"\/devices"/);
  assert.match(api, /status === 403/);
  assert.match(api, /status === 409/);
  assert.match(api, /status === 422/);
  assert.match(api, /Unable to connect to the EchoSense service\./);
});
