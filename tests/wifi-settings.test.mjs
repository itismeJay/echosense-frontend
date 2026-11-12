import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  buildAddPayload,
  buildUpdatePayload,
  canManageWifi,
  CONNECT_ROLLBACK_NOTE,
  priorityError,
  safeLocalPortalUrl,
  ssidError,
  wifiPasswordError,
  wifiResultText,
  SETUP_PORTAL_URL,
  wifiStatusLabel,
} from "../lib/wifi-settings.ts";
import { parseEdgeDeviceResponse } from "../lib/multi-room-contract.ts";

const DEVICE = {
  id: "3f1f3a0c-1234-4abc-8def-1234567890ab",
  device_code: "classroom-pi-01",
  display_name: "EchoSense Device 01",
  school_id: "1f1f3a0c-1234-4abc-8def-1234567890ab",
  school_name: "School Alpha",
  classroom_id: "2f1f3a0c-1234-4abc-8def-1234567890ab",
  classroom_name: "Classroom A101",
  assignment_state: "assigned",
  is_active: true,
  created_at: "2026-08-11T00:00:00Z",
  updated_at: "2026-08-11T00:01:00Z",
  last_seen_at: "2026-11-09T00:00:00Z",
  assigned_at: "2026-08-11T00:00:00Z",
  key_rotated_at: null,
};

test("accepts only private Pi-local HTTP portal roots", () => {
  assert.equal(safeLocalPortalUrl("http://192.168.50.8/"), "http://192.168.50.8/");
  assert.equal(safeLocalPortalUrl("http://10.42.0.1/"), SETUP_PORTAL_URL);
  assert.equal(safeLocalPortalUrl("http://100.64.10.2/"), "http://100.64.10.2/");
  for (const unsafe of [
    "https://192.168.50.8/",
    "http://203.0.113.10/",
    "http://device.example.test/",
    "http://user:secret@192.168.50.8/",
    "http://192.168.50.8:8080/",
    "http://192.168.50.8/settings",
  ]) {
    assert.equal(safeLocalPortalUrl(unsafe), null, unsafe);
  }
});

test("offline state overrides a stale connected heartbeat", () => {
  assert.equal(wifiStatusLabel(false, "connected"), "Offline");
  assert.equal(wifiStatusLabel(true, "connected"), "Connected");
  assert.equal(wifiStatusLabel(true, null), "Not reported");
});

test("device response parser preserves optional non-secret Wi-Fi fields", () => {
  const withWifi = {
    ...DEVICE,
    wifi_status: "connected",
    wifi_ssid: "School Staff",
    wifi_local_url: "http://192.168.50.8/",
  };
  assert.deepEqual(parseEdgeDeviceResponse(withWifi), withWifi);
  assert.deepEqual(parseEdgeDeviceResponse(DEVICE), DEVICE);
});

test("only admins (school or super) with can_manage get Wi-Fi controls", () => {
  const managed = { can_manage: true };
  assert.equal(canManageWifi({ role: "admin" }, managed), true);
  assert.equal(canManageWifi({ role: "admin", is_super_admin: true }, managed), true);
  assert.equal(canManageWifi({ role: "counselor" }, managed), false);
  assert.equal(canManageWifi({ role: "staff" }, managed), false);
  assert.equal(canManageWifi({ role: "admin" }, { can_manage: false }), false);
  assert.equal(canManageWifi(null, managed), false);
  assert.equal(canManageWifi({ role: "admin" }, null), false);
});

test("command results read as plain words", () => {
  assert.equal(wifiResultText("applied", null), "Applied");
  assert.equal(wifiResultText("failed", "not_supported_on_this_device"), "This device can't change Wi-Fi");
  assert.equal(wifiResultText("failed", "in_use_no_alternative"), "Can't remove: no other saved network in range");
  for (const code of ["backend_unreachable_rolled_back", "connect_failed"]) {
    assert.equal(wifiResultText("failed", code), "Couldn't connect, went back to previous network");
  }
  assert.equal(wifiResultText("failed", "something_new"), "Failed");
  assert.equal(wifiResultText("pending", null), "Waiting for the box");
  assert.equal(wifiResultText(null, null), null);
});

test("add form validates and omits empty password and priority", () => {
  assert.deepEqual(buildAddPayload({ ssid: "Staff", password: "", priority: "" }), {
    ok: true,
    body: { ssid: "Staff" },
  });
  assert.deepEqual(buildAddPayload({ ssid: "Staff", password: "secret-pass", priority: "5" }), {
    ok: true,
    body: { ssid: "Staff", password: "secret-pass", priority: 5 },
  });
  assert.equal(buildAddPayload({ ssid: "", password: "", priority: "" }).ok, false);
  assert.equal(buildAddPayload({ ssid: "Staff", password: "short", priority: "" }).ok, false);
  assert.equal(buildAddPayload({ ssid: "Staff", password: "", priority: "1000" }).ok, false);
  assert.ok(ssidError("x".repeat(33)));
  assert.equal(ssidError("é".repeat(16)), null);
  assert.ok(ssidError("é".repeat(17)));
  assert.equal(wifiPasswordError("a".repeat(64)), null);
  assert.ok(wifiPasswordError("z".repeat(64)));
  assert.ok(priorityError("1.5"));
  assert.ok(priorityError("-1"));
});

test("edit form sends only what changed; password only when ticked", () => {
  assert.deepEqual(buildUpdatePayload({ changePassword: false, password: "", priority: "7" }, 3), {
    ok: true,
    body: { priority: 7 },
  });
  assert.deepEqual(buildUpdatePayload({ changePassword: true, password: "new-secret", priority: "3" }, 3), {
    ok: true,
    body: { password: "new-secret" },
  });
  assert.deepEqual(buildUpdatePayload({ changePassword: true, password: "", priority: "3" }, 3), {
    ok: true,
    body: { password: null },
  });
  assert.equal(buildUpdatePayload({ changePassword: false, password: "", priority: "3" }, 3).ok, false);
  assert.equal(buildUpdatePayload({ changePassword: true, password: "short", priority: "3" }, 3).ok, false);
});

test("Wi-Fi UI: masked, never-prefilled passwords; confirms; read-only without controls", async () => {
  const source = await readFile(
    new URL("../components/devices/WifiSettings.tsx", import.meta.url),
    "utf8"
  );
  const passwordInputs = source
    .split("<input")
    .slice(1)
    .map((chunk) => chunk.slice(0, chunk.indexOf("/>")))
    .filter((input) => /new-password/.test(input));
  assert.equal(passwordInputs.length, 2);
  for (const input of passwordInputs) {
    assert.match(input, /type="password"/);
    assert.match(input, /value=\{password\}/);
  }
  assert.match(source, /useState\(""\)/);
  assert.doesNotMatch(source, /type=\{?["']?text["']?\}?[^>]*password/i);
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
  assert.match(source, /CONNECT_ROLLBACK_NOTE/);
  assert.match(CONNECT_ROLLBACK_NOTE, /returns to the previous network if it fails within 2 min/);
  assert.match(source, /kind: "remove"/);
  // Every action button sits behind the manage check.
  assert.match(source, /manage && !adding/);
  assert.match(source, /manage && wifi &&/);
  assert.match(source, /Only school admins can change Wi-Fi/);
});
