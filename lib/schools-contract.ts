import type { School } from "./types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class SchoolContractError extends Error {
  constructor(endpoint: string, message: string) {
    super(`Invalid response from ${endpoint}: ${message}`);
    this.name = "SchoolContractError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseSchool(value: unknown, endpoint = "/schools", path = "school"): School {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !UUID_PATTERN.test(value.id) ||
    typeof value.name !== "string" ||
    typeof value.is_active !== "boolean" ||
    typeof value.created_at !== "string" ||
    typeof value.updated_at !== "string"
  ) {
    throw new SchoolContractError(endpoint, `${path} does not match the school schema`);
  }
  return {
    id: value.id,
    name: value.name,
    is_active: value.is_active,
    created_at: value.created_at,
    updated_at: value.updated_at,
  };
}

export function parseSchoolList(value: unknown, endpoint = "/schools"): School[] {
  if (!Array.isArray(value)) throw new SchoolContractError(endpoint, "expected an array");
  return value.map((school, index) => parseSchool(school, endpoint, `items[${index}]`));
}

export const DUPLICATE_SCHOOL_MESSAGE =
  "A school with this name already exists. Choose a different name.";

/** Friendly text for the backend's /schools errors. */
export function schoolErrorMessage(status: number, fallback: string): string {
  if (status === 409) return DUPLICATE_SCHOOL_MESSAGE;
  if (status === 404) return "This school no longer exists. Refresh the list.";
  if (status === 403) return "Only a super administrator can manage schools.";
  if (status === 422) return "Enter a school name between 1 and 200 characters.";
  return fallback;
}
