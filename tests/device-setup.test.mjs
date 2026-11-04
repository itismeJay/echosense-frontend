import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import QRCode from "qrcode";
import jsQR from "jsqr";
import {
  BOX_STATUS_LABEL,
  checkTypedCodes,
  identityFileText,
  lifecycleOf,
  normalizeClaimCode,
  parseClaimQr,
  parseProvisionedBox,
  setupPhase,
} from "../lib/device-setup.ts";
import { parseEdgeDeviceResponse } from "../lib/multi-room-contract.ts";
import { navItemsFor, routeRolesFor } from "../lib/access.ts";

const readSource = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

const DEVICE = {
  id: "3f1f3a0c-1234-4abc-8def-1234567890ab",
  device_code: "es-7k3m",
  display_name: "EchoSense box es-7k3m",
  school_id: null,
  school_name: null,
  classroom_id: null,
  classroom_name: null,
  assignment_state: "unassigned",
  is_active: true,
  status: "unclaimed",
  claimed_at: null,
  activated_at: null,
  created_at: "2026-11-05T00:00:00Z",
  updated_at: "2026-11-05T00:00:00Z",
  last_seen_at: null,
  assigned_at: null,
  key_rotated_at: null,
};
const PAYLOAD = "echosense://claim?d=es-7k3m&c=ABCD-EFGH-JKMN";

test("reads EchoSense stickers and rejects any other QR", () => {
  assert.deepEqual(parseClaimQr(PAYLOAD), { device_code: "es-7k3m", claim_code: "ABCD-EFGH-JKMN" });
  assert.deepEqual(parseClaimQr(" ECHOSENSE://claim?c=abcd%20efgh%20jkmn&d=ES-7K3M "), {
    device_code: "es-7k3m",
    claim_code: "ABCD-EFGH-JKMN",
  });
  for (const other of [
    "https://example.com/?d=es-7k3m&c=ABCD-EFGH-JKMN",
    "echosense://claim?d=es-7k3m",
    "echosense://claim?d=es-7k3m&c=ABCD-EFGH-JKM0", // 0 is not in the alphabet
    "echosense://claim?d=ES 7K3M&c=ABCD-EFGH-JKMN",
    "",
  ]) {
    assert.equal(parseClaimQr(other), null, other);
  }
});

test("typed codes are cleaned up and explained in plain words", () => {
  assert.equal(normalizeClaimCode(" abcd efgh-jkmn "), "ABCDEFGHJKMN");
  assert.equal(normalizeClaimCode("ABCD-EFGH"), null);
  assert.deepEqual(checkTypedCodes(" ES-7k3m ", "abcd efgh jkmn"), {
    ok: true,
    codes: { device_code: "es-7k3m", claim_code: "ABCD-EFGH-JKMN" },
  });
  const badDevice = checkTypedCodes("", "ABCD-EFGH-JKMN");
  assert.equal(badDevice.ok, false);
  assert.match(badDevice.error, /device code/);
  const badClaim = checkTypedCodes("es-7k3m", "1234");
  assert.equal(badClaim.ok, false);
  assert.match(badClaim.error, /12-character setup code/);
});

test("a label made with the qrcode library scans back with jsQR", async () => {
  const qr = QRCode.create(PAYLOAD, { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const scale = 6;
  const margin = 4 * scale;
  const width = size * scale + 2 * margin;
  const pixels = new Uint8ClampedArray(width * width * 4).fill(255);
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!qr.modules.get(row, col)) continue;
      for (let y = 0; y < scale; y += 1) {
        for (let x = 0; x < scale; x += 1) {
          const offset = ((margin + row * scale + y) * width + margin + col * scale + x) * 4;
          pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 0;
        }
      }
    }
  }
  const decoded = jsQR(pixels, width, width);
  assert.equal(decoded?.data, PAYLOAD);
  assert.deepEqual(parseClaimQr(decoded.data), { device_code: "es-7k3m", claim_code: "ABCD-EFGH-JKMN" });
});

test("device lifecycle: parsed when sent, derived for older backends, worded for staff", () => {
  const parsed = parseEdgeDeviceResponse(DEVICE);
  assert.equal(parsed.status, "unclaimed");
  const older = { ...DEVICE };
  delete older.status;
  delete older.claimed_at;
  delete older.activated_at;
  const legacy = parseEdgeDeviceResponse(older);
  assert.equal("status" in legacy, false);
  assert.equal(lifecycleOf(legacy), "active");
  assert.equal(lifecycleOf({ ...legacy, is_active: false }), "disabled");
  assert.throws(() => parseEdgeDeviceResponse({ ...DEVICE, status: "pending" }));
  assert.equal(BOX_STATUS_LABEL.removed, "Removed, needs reset");

  const inRoom = { ...DEVICE, classroom_id: "2f1f3a0c-1234-4abc-8def-1234567890ab" };
  assert.equal(setupPhase({ ...inRoom, status: "claimed" }, false), "waiting");
  assert.equal(setupPhase({ ...inRoom, status: "active" }, true), "online");
  assert.equal(setupPhase({ ...inRoom, status: "active" }, false), "offline");
  assert.equal(setupPhase({ ...inRoom, status: "disabled", is_active: false }, false), "disabled");
  assert.equal(setupPhase(DEVICE, false), "gone");
  assert.equal(setupPhase(null, false), "gone");
});

test("provisioned boxes are checked and turned into the box's identity file", () => {
  const box = {
    device: DEVICE,
    device_code: "es-7k3m",
    claim_code: "ABCD-EFGH-JKMN",
    box_secret: "ebs_secret",
    qr_payload: PAYLOAD,
  };
  const parsed = parseProvisionedBox(box, (device) => parseEdgeDeviceResponse(device));
  assert.equal(parsed.device.device_code, "es-7k3m");
  assert.deepEqual(JSON.parse(identityFileText(parsed, "http://localhost:8000")), {
    device_code: "es-7k3m",
    claim_code: "ABCD-EFGH-JKMN",
    box_secret: "ebs_secret",
    backend_url: "http://localhost:8000",
  });
  assert.throws(() => parseProvisionedBox({ ...box, qr_payload: "echosense://claim?d=es-other&c=ABCD-EFGH-JKMN" }, parseEdgeDeviceResponse));
  assert.throws(() => parseProvisionedBox({ ...box, box_secret: "" }, parseEdgeDeviceResponse));
});

test("Boxes is a super-admin platform page", () => {
  assert.deepEqual(routeRolesFor("/boxes"), ["super_admin"]);
  assert.ok(navItemsFor("super_admin", "platform").some((item) => item.href === "/boxes"));
  assert.ok(!navItemsFor("admin").some((item) => item.href === "/boxes"));
});

test("setup screens call the claim API, never show or store keys, and keep the manual flow under Advanced", async () => {
  const [api, flow, scanner, labels, boxes] = await Promise.all([
    readSource("lib/api.ts"),
    readSource("components/devices/AddDeviceFlow.tsx"),
    readSource("components/devices/QrScanner.tsx"),
    readSource("components/devices/BoxLabels.tsx"),
    readSource("app/(app)/boxes/page.tsx"),
  ]);
  for (const fragment of [
    '"/devices/provision"',
    "`/devices/${encodeURIComponent(deviceId)}/reset`",
    "`/classrooms/${encodeURIComponent(classroomId)}/devices/claim`",
    "`/devices/${encodeURIComponent(deviceId)}/move`",
    "`/devices/${encodeURIComponent(deviceId)}/remove`",
  ]) {
    assert.ok(api.includes(fragment), fragment);
  }
  assert.match(flow, /Scan QR/);
  assert.match(flow, /Type code instead/);
  assert.match(flow, /Advanced/);
  assert.match(flow, /Waiting|SETUP_PHASE_TEXT/);
  assert.doesNotMatch(flow, /device_key/);
  assert.match(scanner, /NotAllowedError/);
  assert.match(scanner, /getTracks\(\)\.forEach\(\(track\) => track\.stop\(\)\)/);
  const combined = `${flow}\n${scanner}\n${labels}\n${boxes}`;
  assert.doesNotMatch(combined, /localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(combined, /console\.(log|debug|info|warn|error)/);
});
