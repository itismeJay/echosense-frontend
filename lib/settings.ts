import type {
  Settings,
  SystemSettings,
  SystemSettingsUpdate,
} from "./types";

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
    typeof value.confidence_threshold !== "number" ||
    !Number.isFinite(value.confidence_threshold)
  ) {
    throw new SettingsContractError(
      "confidence_threshold must be a finite number"
    );
  }
  if (
    typeof value.aggression_duration_threshold !== "number" ||
    !Number.isFinite(value.aggression_duration_threshold)
  ) {
    throw new SettingsContractError(
      "aggression_duration_threshold must be a finite number"
    );
  }
  if (
    value.device_status !== "online" &&
    value.device_status !== "offline"
  ) {
    throw new SettingsContractError(
      "device_status must be online or offline"
    );
  }
  if (
    typeof value.vosk_version !== "string" ||
    typeof value.yamnet_version !== "string"
  ) {
    throw new SettingsContractError(
      "model version fields must be strings"
    );
  }

  return {
    setting_id: value.setting_id as number,
    confidence_threshold: value.confidence_threshold,
    aggression_duration_threshold: value.aggression_duration_threshold,
    device_status: value.device_status,
    last_heartbeat:
      readNullableString(value.last_heartbeat, "last_heartbeat") ?? null,
    vosk_version: value.vosk_version,
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

export function systemSettingsToForm(settings: SystemSettings): Settings {
  return {
    confidence_threshold_percent: Math.round(
      settings.confidence_threshold * 100
    ),
    aggression_duration_threshold:
      settings.aggression_duration_threshold,
  };
}

export function settingsToUpdatePayload(
  settings: Settings
): SystemSettingsUpdate {
  if (
    !Number.isFinite(settings.confidence_threshold_percent) ||
    settings.confidence_threshold_percent < 0 ||
    settings.confidence_threshold_percent > 100
  ) {
    throw new RangeError(
      "Alert sensitivity must be between 0 and 100 percent"
    );
  }
  if (
    !Number.isFinite(settings.aggression_duration_threshold) ||
    settings.aggression_duration_threshold <= 0
  ) {
    throw new RangeError("Minimum alert duration must be greater than zero");
  }

  return {
    confidence_threshold: settings.confidence_threshold_percent / 100,
    aggression_duration_threshold:
      settings.aggression_duration_threshold,
  };
}
