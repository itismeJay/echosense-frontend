import { ApiContractError } from "./audit-log";
import type { DictionaryEntry } from "./types";

const DICTIONARY_LANGUAGES = new Set(["fil", "ceb", "en"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseDictionaryEntry(
  value: unknown,
  endpoint = "/dictionary",
  path = "entry"
): DictionaryEntry {
  if (!isRecord(value)) {
    throw new ApiContractError(endpoint, `${path} must be an object`);
  }
  if (!Number.isInteger(value.term_id)) {
    throw new ApiContractError(endpoint, `${path}.term_id must be an integer`);
  }
  if (typeof value.slur_text !== "string" || value.slur_text.trim() === "") {
    throw new ApiContractError(
      endpoint,
      `${path}.slur_text must be a non-empty string`
    );
  }
  if (
    typeof value.language !== "string" ||
    !DICTIONARY_LANGUAGES.has(value.language)
  ) {
    throw new ApiContractError(
      endpoint,
      `${path}.language must be fil, ceb, or en`
    );
  }
  if (
    typeof value.severity_weight !== "number" ||
    !Number.isFinite(value.severity_weight)
  ) {
    throw new ApiContractError(
      endpoint,
      `${path}.severity_weight must be a finite number`
    );
  }
  if (
    value.added_at !== undefined &&
    typeof value.added_at !== "string"
  ) {
    throw new ApiContractError(
      endpoint,
      `${path}.added_at must be a string when present`
    );
  }

  return value as unknown as DictionaryEntry;
}

export function parseDictionaryListResponse(value: unknown): DictionaryEntry[] {
  const endpoint = "/dictionary";
  if (!Array.isArray(value)) {
    throw new ApiContractError(endpoint, "expected an array");
  }
  return value.map((entry, index) =>
    parseDictionaryEntry(entry, endpoint, `items[${index}]`)
  );
}
