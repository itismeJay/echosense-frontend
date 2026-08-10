import type {
  Classroom,
  ClassroomDeviceSummary,
  DeviceRegistrationResult,
  EdgeDevice,
} from "./types";

export class MultiRoomContractError extends Error {
  public readonly endpoint: string;

  constructor(endpoint: string, message: string) {
    super(`Invalid response from ${endpoint}: ${message}`);
    this.endpoint = endpoint;
    this.name = "MultiRoomContractError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function requiredString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function nullableUuid(value: unknown): value is string | null {
  return value === null || isUuid(value);
}

function nullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function nullableTimestamp(value: unknown): value is string | null {
  return value === null || isTimestamp(value);
}

function parseClassroomDevice(
  value: unknown,
  path: string,
  endpoint: string
): ClassroomDeviceSummary {
  if (
    !isRecord(value) ||
    !isUuid(value.id) ||
    !requiredString(value.device_code) ||
    !requiredString(value.display_name) ||
    typeof value.is_active !== "boolean"
  ) {
    throw new MultiRoomContractError(
      endpoint,
      `${path} does not match the classroom device summary schema`
    );
  }
  return {
    id: value.id,
    device_code: value.device_code,
    display_name: value.display_name,
    is_active: value.is_active,
  };
}

export function parseClassroomResponse(
  value: unknown,
  endpoint = "/classrooms"
): Classroom {
  if (
    !isRecord(value) ||
    !isUuid(value.id) ||
    !isUuid(value.school_id) ||
    !requiredString(value.school_name) ||
    !requiredString(value.name) ||
    typeof value.is_active !== "boolean" ||
    !isTimestamp(value.created_at) ||
    !isTimestamp(value.updated_at) ||
    !Array.isArray(value.devices)
  ) {
    throw new MultiRoomContractError(
      endpoint,
      "response does not match the classroom schema"
    );
  }
  return {
    id: value.id,
    school_id: value.school_id,
    school_name: value.school_name,
    name: value.name,
    is_active: value.is_active,
    created_at: value.created_at,
    updated_at: value.updated_at,
    devices: value.devices.map((device, index) =>
      parseClassroomDevice(device, `devices[${index}]`, endpoint)
    ),
  };
}

export function parseClassroomListResponse(
  value: unknown,
  endpoint = "/classrooms"
): Classroom[] {
  if (!Array.isArray(value)) {
    throw new MultiRoomContractError(endpoint, "expected an array");
  }
  return value.map((classroom, index) =>
    parseClassroomResponse(classroom, `${endpoint} item ${index}`)
  );
}

export function parseEdgeDeviceResponse(
  value: unknown,
  endpoint = "/devices"
): EdgeDevice {
  if (
    !isRecord(value) ||
    !isUuid(value.id) ||
    !requiredString(value.device_code) ||
    !requiredString(value.display_name) ||
    !nullableUuid(value.school_id) ||
    !nullableString(value.school_name) ||
    !nullableUuid(value.classroom_id) ||
    !nullableString(value.classroom_name) ||
    (value.assignment_state !== "assigned" &&
      value.assignment_state !== "unassigned") ||
    typeof value.is_active !== "boolean" ||
    !isTimestamp(value.created_at) ||
    !isTimestamp(value.updated_at) ||
    !nullableTimestamp(value.last_seen_at) ||
    !nullableTimestamp(value.assigned_at) ||
    !nullableTimestamp(value.key_rotated_at)
  ) {
    throw new MultiRoomContractError(
      endpoint,
      "response does not match the edge device schema"
    );
  }
  if (
    (value.assignment_state === "assigned" && value.classroom_id === null) ||
    (value.assignment_state === "unassigned" && value.classroom_id !== null)
  ) {
    throw new MultiRoomContractError(
      endpoint,
      "assignment state does not match classroom assignment"
    );
  }
  return {
    id: value.id,
    device_code: value.device_code,
    display_name: value.display_name,
    school_id: value.school_id,
    school_name: value.school_name,
    classroom_id: value.classroom_id,
    classroom_name: value.classroom_name,
    assignment_state: value.assignment_state,
    is_active: value.is_active,
    created_at: value.created_at,
    updated_at: value.updated_at,
    last_seen_at: value.last_seen_at,
    assigned_at: value.assigned_at,
    key_rotated_at: value.key_rotated_at,
  };
}

export function parseEdgeDeviceListResponse(
  value: unknown,
  endpoint = "/devices"
): EdgeDevice[] {
  if (!Array.isArray(value)) {
    throw new MultiRoomContractError(endpoint, "expected an array");
  }
  return value.map((device, index) =>
    parseEdgeDeviceResponse(device, `${endpoint} item ${index}`)
  );
}

export function parseDeviceKeyResponse(
  value: unknown,
  endpoint: string
): DeviceRegistrationResult {
  if (
    !isRecord(value) ||
    !requiredString(value.device_key) ||
    value.warning !== "Store this key securely. It will not be shown again."
  ) {
    throw new MultiRoomContractError(
      endpoint,
      "response does not match the one-time device key schema"
    );
  }
  return {
    device: parseEdgeDeviceResponse(value.device, `${endpoint} device`),
    device_key: value.device_key,
    warning: value.warning,
  };
}

export function schoolSummariesFromResources(
  classrooms: Classroom[],
  devices: EdgeDevice[] = []
) {
  const schools = new Map<string, string>();
  classrooms.forEach((classroom) =>
    schools.set(classroom.school_id, classroom.school_name)
  );
  devices.forEach((device) => {
    if (device.school_id && device.school_name) {
      schools.set(device.school_id, device.school_name);
    }
  });
  return [...schools]
    .map(([id, name]) => ({ id, name }))
    .sort((left, right) => left.name.localeCompare(right.name));
}
