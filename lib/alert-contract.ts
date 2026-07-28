import type { Alert, AlertLanguage, MatchedTerm } from "./types";

export class AlertContractError extends Error {
  public readonly endpoint: string;

  constructor(endpoint: string, message: string) {
    super(`Invalid response from ${endpoint}: ${message}`);
    this.endpoint = endpoint;
    this.name = "AlertContractError";
  }
}

const ALERT_LANGUAGES = new Set<AlertLanguage>([
  "fil",
  "ceb",
  "en",
  "mixed",
  "unknown",
]);
const MATCHED_TERM_LANGUAGES = new Set(["fil", "ceb", "en"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validateOptionalString(
  alert: Record<string, unknown>,
  field: string,
  path: string,
  endpoint: string,
  nullable = false
) {
  const value = alert[field];
  if (value === undefined || (nullable && value === null)) return;
  if (typeof value !== "string") {
    throw new AlertContractError(
      endpoint,
      `${path}.${field} must be a string${nullable ? " or null" : ""}`
    );
  }
}

function validateOptionalNumber(
  alert: Record<string, unknown>,
  field: string,
  path: string,
  endpoint: string,
  nullable = false
) {
  const value = alert[field];
  if (value === undefined || (nullable && value === null)) return;
  if (!isFiniteNumber(value)) {
    throw new AlertContractError(
      endpoint,
      `${path}.${field} must be a finite number${nullable ? " or null" : ""}`
    );
  }
}

function validateOptionalArray(
  alert: Record<string, unknown>,
  field: string,
  path: string,
  endpoint: string,
  itemIsValid: (item: unknown) => boolean,
  nullable = false
) {
  const value = alert[field];
  if (value === undefined || (nullable && value === null)) return;
  if (!Array.isArray(value) || !value.every(itemIsValid)) {
    throw new AlertContractError(
      endpoint,
      `${path}.${field} has an invalid array structure`
    );
  }
}

function parseMatchedTerm(
  value: unknown,
  alertIndex: number,
  termIndex: number,
  endpoint: string
): MatchedTerm {
  const path = `items[${alertIndex}].matched_terms[${termIndex}]`;
  if (!isRecord(value)) {
    throw new AlertContractError(endpoint, `${path} must be an object`);
  }
  if (!Number.isInteger(value.term_id)) {
    throw new AlertContractError(endpoint, `${path}.term_id must be an integer`);
  }
  if (typeof value.term !== "string" || value.term.trim() === "") {
    throw new AlertContractError(
      endpoint,
      `${path}.term must be a non-empty string`
    );
  }
  if (
    typeof value.language !== "string" ||
    !MATCHED_TERM_LANGUAGES.has(value.language)
  ) {
    throw new AlertContractError(
      endpoint,
      `${path}.language must be fil, ceb, or en`
    );
  }
  if (typeof value.match_type !== "string" || value.match_type.trim() === "") {
    throw new AlertContractError(
      endpoint,
      `${path}.match_type must be a non-empty string`
    );
  }

  return value as unknown as MatchedTerm;
}

function parseAlert(value: unknown, index: number, endpoint: string): Alert {
  const path = `items[${index}]`;
  if (!isRecord(value)) {
    throw new AlertContractError(endpoint, `${path} must be an object`);
  }
  if (!Number.isInteger(value.id)) {
    throw new AlertContractError(endpoint, `${path}.id must be an integer`);
  }
  if (!["high", "medium", "low"].includes(String(value.severity))) {
    throw new AlertContractError(
      endpoint,
      `${path}.severity must be high, medium, or low`
    );
  }
  if (
    !isFiniteNumber(value.confidence) ||
    value.confidence < 0 ||
    value.confidence > 1
  ) {
    throw new AlertContractError(
      endpoint,
      `${path}.confidence must be between 0 and 1`
    );
  }
  if (!isFiniteNumber(value.duration) || value.duration < 0) {
    throw new AlertContractError(
      endpoint,
      `${path}.duration must be a non-negative finite number`
    );
  }
  if (
    typeof value.location !== "string" ||
    (value.status !== "active" && value.status !== "resolved") ||
    typeof value.created_at !== "string"
  ) {
    throw new AlertContractError(
      endpoint,
      `${path} is missing a valid location, status, or created_at`
    );
  }

  for (const field of [
    "transcribed_text",
    "yamnet_class",
    "emotion",
    "duration_gate",
  ]) {
    validateOptionalString(value, field, path, endpoint, true);
  }
  for (const field of [
    "yamnet_score",
    "rms",
    "energy_variance",
    "zero_crossing_rate",
    "peak_to_average",
    "required_duration",
  ]) {
    validateOptionalNumber(
      value,
      field,
      path,
      endpoint,
      true
    );
  }
  for (const field of [
    "detected_words",
    "categories",
    "hard_hits",
    "soft_hits",
  ]) {
    validateOptionalArray(
      value,
      field,
      path,
      endpoint,
      (item) => typeof item === "string",
      true
    );
  }
  validateOptionalArray(
    value,
    "waveform_snapshot",
    path,
    endpoint,
    isFiniteNumber,
    true
  );

  if (
    value.language !== undefined &&
    value.language !== null &&
    (typeof value.language !== "string" ||
      !ALERT_LANGUAGES.has(value.language as AlertLanguage))
  ) {
    throw new AlertContractError(
      endpoint,
      `${path}.language must be fil, ceb, en, mixed, unknown, or null`
    );
  }
  if (
    value.language_confidence !== undefined &&
    value.language_confidence !== null &&
    (!isFiniteNumber(value.language_confidence) ||
      value.language_confidence < 0 ||
      value.language_confidence > 1)
  ) {
    throw new AlertContractError(
      endpoint,
      `${path}.language_confidence must be between 0 and 1 or null`
    );
  }
  if (value.matched_terms !== undefined) {
    if (!Array.isArray(value.matched_terms)) {
      throw new AlertContractError(
        endpoint,
        `${path}.matched_terms must be an array`
      );
    }
    value.matched_terms.map((term, termIndex) =>
      parseMatchedTerm(term, index, termIndex, endpoint)
    );
  }

  return value as unknown as Alert;
}

export function parseAlertListResponse(
  value: unknown,
  endpoint = "/alerts/"
): Alert[] {
  if (!Array.isArray(value)) {
    throw new AlertContractError(endpoint, "expected an array");
  }
  return value.map((alert, index) => parseAlert(alert, index, endpoint));
}

export function parseAlertResponse(
  value: unknown,
  endpoint = "/alerts/"
): Alert {
  return parseAlert(value, 0, endpoint);
}
