// Global engine information (super admins only). The old confidence/duration sliders were
// removed from the backend: the edge never read them. Per-school settings live in
// ./school-settings.
import type { SystemSettings } from "./types";

export class SettingsContractError extends Error {
  constructor(message: string) {
    super(`Invalid response from /system-settings/: ${message}`);
    this.name = "SettingsContractError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNullableString(
  value: unknown,
  field: string
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || typeof value === "string") return value;
  throw new SettingsContractError(`${field} must be a string or null`);
}

function readOptionalNumber(
  value: unknown,
  field: string
): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  throw new SettingsContractError(`${field} must be a finite number`);
}

export function parseSystemSettings(value: unknown): SystemSettings {
  if (!isRecord(value)) {
    throw new SettingsContractError("expected an object");
  }
  if (!Number.isInteger(value.setting_id)) {
    throw new SettingsContractError("setting_id must be an integer");
  }
  if (
    value.device_status !== "online" &&
    value.device_status !== "offline"
  ) {
    throw new SettingsContractError(
      "device_status must be online or offline"
    );
  }
  // stt_model_version replaced vosk_version (backend migration 20261021_0012). The old
  // field is accepted only as a fallback for a backend that has not been migrated yet.
  const sttModelVersion =
    typeof value.stt_model_version === "string"
      ? value.stt_model_version
      : value.vosk_version;
  if (
    typeof sttModelVersion !== "string" ||
    typeof value.yamnet_version !== "string"
  ) {
    throw new SettingsContractError(
      "model version fields must be strings"
    );
  }

  return {
    setting_id: value.setting_id as number,
    device_status: value.device_status,
    last_heartbeat:
      readNullableString(value.last_heartbeat, "last_heartbeat") ?? null,
    stt_model_version: sttModelVersion,
    yamnet_version: value.yamnet_version,
    last_ota_update: readNullableString(
      value.last_ota_update,
      "last_ota_update"
    ),
    updated_at: readNullableString(value.updated_at, "updated_at"),
    cpu_usage: readOptionalNumber(value.cpu_usage, "cpu_usage"),
    temperature: readOptionalNumber(value.temperature, "temperature"),
    uptime_seconds: readOptionalNumber(
      value.uptime_seconds,
      "uptime_seconds"
    ),
  };
}
