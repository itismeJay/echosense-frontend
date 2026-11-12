const SETUP_PORTAL_URL = "http://10.42.0.1/";

function isPrivateIpv4(hostname: string): boolean {
  const octets = hostname.split(".").map(Number);
  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return false;
  }
  const [first, second] = octets;
  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254) ||
    (first === 100 && second >= 64 && second <= 127)
  );
}

/** Accept only the private HTTP root URL produced by the Pi heartbeat. */
export function safeLocalPortalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "http:" ||
      url.port ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      !isPrivateIpv4(url.hostname)
    ) {
      return null;
    }
    return `${url.origin}/`;
  } catch {
    return null;
  }
}

export function wifiStatusLabel(
  online: boolean,
  reported: "connected" | "disconnected" | null | undefined
): string {
  if (!online) return "Offline";
  if (reported === "connected") return "Connected";
  if (reported === "disconnected") return "Disconnected";
  return "Not reported";
}

export { SETUP_PORTAL_URL };

// --- Managed Wi-Fi (GET/POST/PATCH/DELETE /devices/{id}/wifi...) ---

export const MAX_WIFI_PRIORITY = 999;
export const CONNECT_ROLLBACK_NOTE =
  "The box returns to the previous network if it fails within 2 min.";

export interface WifiNetwork {
  ssid: string;
  priority: number;
  has_password: boolean;
  last_status: "pending" | "applied" | "failed" | null;
  last_error: string | null;
  updated_at: string;
}

export interface WifiCommand {
  id: string;
  action: "add" | "update" | "remove" | "set_priority" | "connect_now" | "scan";
  ssid: string;
  priority: number | null;
  status: "pending" | "applied" | "failed";
  error: string | null;
  created_at: string;
  applied_at: string | null;
}

export interface DeviceWifi {
  device_id: string;
  can_manage: boolean;
  current: {
    ssid: string | null;
    wifi_status: "connected" | "disconnected" | null;
    signal: number | null;
    online: boolean;
    last_seen_at: string | null;
  };
  networks: WifiNetwork[];
  pending_commands: WifiCommand[];
  /** False when the box's software can't scan remotely (older edge). */
  remote_scan_supported?: boolean;
  /** Admins only; null until the box has reported a scan. */
  last_scan?: WifiScan | null;
}

export interface WifiScanNetwork {
  ssid: string;
  /** 0-100 quality. */
  signal: number;
  security: string;
  /** The box already has this network saved. */
  known: boolean;
}

export interface WifiScan {
  scanned_at: string;
  networks: WifiScanNetwork[];
}

/** Only admins (school admin, or super admin) may change Wi-Fi; the backend says the same via can_manage. */
export function canManageWifi(
  user: { role: string } | null | undefined,
  wifi: Pick<DeviceWifi, "can_manage"> | null | undefined
): boolean {
  return user?.role === "admin" && wifi?.can_manage === true;
}

const RESULT_TEXT: Record<string, string> = {
  applied: "Applied",
  not_supported_on_this_device: "This device can't change Wi-Fi",
  in_use_no_alternative: "Can't remove: no other saved network in range",
  backend_unreachable_rolled_back: "Couldn't connect, went back to previous network",
  connect_failed: "Couldn't connect, went back to previous network",
};

/** Plain wording for a network's last command result; null when there is nothing to say. */
export function wifiResultText(
  status: WifiNetwork["last_status"],
  error: string | null | undefined
): string | null {
  if (status === "pending") return "Waiting for the box";
  if (status === "applied") return RESULT_TEXT.applied;
  if (status === "failed") return (error && RESULT_TEXT[error]) || "Failed";
  return null;
}

export function signalLabel(signal: number | null | undefined): string {
  if (signal === null || signal === undefined) return "Not reported";
  // Accept either a 0-100 quality or a negative dBm reading.
  const quality = signal < 0 ? Math.max(0, Math.min(100, 2 * (signal + 100))) : signal;
  const word = quality >= 70 ? "Strong" : quality >= 40 ? "Fair" : "Weak";
  return signal < 0 ? `${word} (${signal} dBm)` : `${word} (${signal}%)`;
}

export function ssidError(ssid: string): string | null {
  if (!ssid) return "Enter the network name.";
  if (new TextEncoder().encode(ssid).length > 32) return "Network name is too long (32 bytes max).";
  if ([...ssid].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127)) {
    return "Network name has invalid characters.";
  }
  return null;
}

/** Empty = open network. Otherwise 8-63 printable ASCII, or 64 hex digits. */
export function wifiPasswordError(password: string): string | null {
  if (password === "") return null;
  if (/^[0-9a-fA-F]{64}$/.test(password)) return null;
  if (password.length < 8 || password.length > 63 || !/^[\x20-\x7e]+$/.test(password)) {
    return "Password must be 8 to 63 characters (letters, numbers, symbols).";
  }
  return null;
}

export function priorityError(value: string): string | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > MAX_WIFI_PRIORITY) {
    return `Priority must be a whole number from 0 to ${MAX_WIFI_PRIORITY}.`;
  }
  return null;
}

export interface WifiAddForm {
  ssid: string;
  password: string;
  priority: string;
}

export function buildAddPayload(
  form: WifiAddForm
): { ok: true; body: { ssid: string; password?: string; priority?: number } } | { ok: false; error: string } {
  const error = ssidError(form.ssid) ?? wifiPasswordError(form.password) ?? priorityError(form.priority);
  if (error) return { ok: false, error };
  const body: { ssid: string; password?: string; priority?: number } = { ssid: form.ssid };
  if (form.password) body.password = form.password;
  if (form.priority.trim() !== "") body.priority = Number(form.priority);
  return { ok: true, body };
}

export interface WifiEditForm {
  /** Only sent when "change password" is ticked; empty then makes it an open network. */
  changePassword: boolean;
  password: string;
  priority: string;
}

export function buildUpdatePayload(
  form: WifiEditForm,
  currentPriority: number
): { ok: true; body: { password?: string | null; priority?: number } } | { ok: false; error: string } {
  const error = (form.changePassword ? wifiPasswordError(form.password) : null) ?? priorityError(form.priority);
  if (error) return { ok: false, error };
  const body: { password?: string | null; priority?: number } = {};
  if (form.changePassword) body.password = form.password === "" ? null : form.password;
  if (form.priority.trim() !== "" && Number(form.priority) !== currentPriority) {
    body.priority = Number(form.priority);
  }
  if (Object.keys(body).length === 0) return { ok: false, error: "Nothing to change." };
  return { ok: true, body };
}

// --- Nearby network scan (POST /devices/{id}/wifi/scan) ---

export const SCANNING_TEXT = "Scanning… usually within a minute";

export function isScanPending(wifi: Pick<DeviceWifi, "pending_commands"> | null | undefined): boolean {
  return !!wifi?.pending_commands.some((command) => command.action === "scan" && command.status === "pending");
}

/** 0-4 bars from a 0-100 quality. */
export function signalBars(signal: number): number {
  if (!Number.isFinite(signal) || signal <= 0) return 0;
  return Math.min(4, Math.ceil(signal / 25));
}

export function isSecuredNetwork(security: string): boolean {
  return !["", "open", "none", "--"].includes(security.trim().toLowerCase());
}

/** Saved on the box (scan says so) or in the dashboard's saved list. */
export function isSavedNetwork(network: WifiScanNetwork, saved: readonly Pick<WifiNetwork, "ssid">[]): boolean {
  return network.known || saved.some((item) => item.ssid === network.ssid);
}
