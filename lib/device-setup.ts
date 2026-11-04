// QR "plug in, scan, done" device setup: reading the sticker, the setup code format,
// plain-language device states, and the one-time provisioning response.
// Pure functions only (tested in tests/device-setup.test.mjs).

import type { DeviceLifecycleStatus, EdgeDevice, ProvisionedBox } from "./types";

/** No 0/O or 1/I/L, so a code read off a sticker is unambiguous. Matches the backend. */
export const CLAIM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CLAIM_CODE_LENGTH = 12;
const DEVICE_CODE_PATTERN = /^[a-z0-9][a-z0-9._-]{2,99}$/;

export interface ClaimCodes {
  device_code: string;
  claim_code: string;
}

export function normalizeDeviceCode(value: string): string | null {
  const code = value.trim().toLowerCase();
  return DEVICE_CODE_PATTERN.test(code) ? code : null;
}

/** "abcd efgh-jkmn" -> "ABCDEFGHJKMN", or null when it cannot be a setup code. */
export function normalizeClaimCode(value: string): string | null {
  const compact = value.replace(/[\s-]+/g, "").toUpperCase();
  if (compact.length !== CLAIM_CODE_LENGTH) return null;
  for (const character of compact) {
    if (!CLAIM_CODE_ALPHABET.includes(character)) return null;
  }
  return compact;
}

export function formatClaimCode(normalized: string): string {
  return normalized.match(/.{1,4}/g)?.join("-") ?? normalized;
}

/**
 * Codes from a scanned sticker: echosense://claim?d=<device code>&c=<setup code>.
 * Anything else (a web link, another app's QR) is rejected so a stray code is never sent.
 */
export function parseClaimQr(text: string): ClaimCodes | null {
  const trimmed = text.trim();
  const match = /^echosense:\/\/claim\?(.*)$/i.exec(trimmed);
  if (!match) return null;
  const params = new URLSearchParams(match[1]);
  const device = normalizeDeviceCode(params.get("d") ?? "");
  const claim = normalizeClaimCode(params.get("c") ?? "");
  if (!device || !claim) return null;
  return { device_code: device, claim_code: formatClaimCode(claim) };
}

/** Typed codes: returns the cleaned codes or a plain-language problem. */
export function checkTypedCodes(
  deviceCode: string,
  claimCode: string
): { ok: true; codes: ClaimCodes } | { ok: false; error: string } {
  const device = normalizeDeviceCode(deviceCode);
  if (!device) {
    return { ok: false, error: "Enter the device code from the sticker, for example es-7k3m." };
  }
  const claim = normalizeClaimCode(claimCode);
  if (!claim) {
    return {
      ok: false,
      error: "Enter the 12-character setup code from the sticker, for example ABCD-EFGH-JKMN.",
    };
  }
  return { ok: true, codes: { device_code: device, claim_code: formatClaimCode(claim) } };
}

/** Older backends send no status: derive it from what they do send. */
export function lifecycleOf(device: Pick<EdgeDevice, "is_active"> & { status?: DeviceLifecycleStatus }): DeviceLifecycleStatus {
  if (device.status) return device.status;
  return device.is_active ? "active" : "disabled";
}

export type SetupPhase = "waiting" | "online" | "offline" | "disabled" | "gone";

/** What the person adding a box should see right now. */
export function setupPhase(
  device: (Pick<EdgeDevice, "is_active" | "classroom_id"> & { status?: DeviceLifecycleStatus }) | null,
  online: boolean | undefined
): SetupPhase {
  if (!device || device.classroom_id === null) return "gone";
  const status = lifecycleOf(device);
  if (status === "disabled") return "disabled";
  if (status === "claimed") return "waiting";
  return online ? "online" : "offline";
}

export const SETUP_PHASE_TEXT: Record<SetupPhase, { title: string; body: string }> = {
  waiting: {
    title: "Waiting for the box to connect",
    body: "Plug the box in and turn it on. It connects by itself within a minute and says “EchoSense connected”.",
  },
  online: {
    title: "Online",
    body: "The box is connected and listening in this classroom.",
  },
  offline: {
    title: "Connected, not online right now",
    body: "The box has its key. Check that it is plugged in and on Wi-Fi.",
  },
  disabled: { title: "Turned off", body: "This box is turned off. Turn it on to use it." },
  gone: { title: "Not in this classroom", body: "The box was removed or moved. Refresh the page." },
};

/** Words for the super admin's Boxes list. */
export const BOX_STATUS_LABEL: Record<DeviceLifecycleStatus, string> = {
  unclaimed: "Ready to add",
  claimed: "Waiting for box",
  active: "In use",
  disabled: "Turned off",
  removed: "Removed, needs reset",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * One box from POST /devices/provision or /devices/{id}/reset. The setup code and box
 * secret are shown only now; callers keep them in memory and drop them on close.
 */
export function parseProvisionedBox(
  value: unknown,
  parseDevice: (device: unknown) => EdgeDevice
): ProvisionedBox {
  if (
    !isRecord(value) ||
    !nonEmpty(value.device_code) ||
    !nonEmpty(value.claim_code) ||
    !nonEmpty(value.box_secret) ||
    !nonEmpty(value.qr_payload) ||
    parseClaimQr(value.qr_payload)?.device_code !== value.device_code
  ) {
    throw new Error("The server's answer did not match a new box.");
  }
  return {
    device: parseDevice(value.device),
    device_code: value.device_code,
    claim_code: value.claim_code,
    box_secret: value.box_secret,
    qr_payload: value.qr_payload,
  };
}

/** The identity.json a box needs (the same file tools/provision_box.py writes). */
export function identityFileText(box: ProvisionedBox, backendUrl: string): string {
  return `${JSON.stringify(
    {
      device_code: box.device_code,
      claim_code: box.claim_code,
      box_secret: box.box_secret,
      backend_url: backendUrl,
    },
    null,
    2
  )}\n`;
}
