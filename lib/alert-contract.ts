import type {
  Alert,
  AlertLanguage,
  AlertSeverity,
  AlertStatus,
  AlertTriggerType,
  CanonicalSeverity,
  DeliveryStatus,
  EvidenceObject,
  EvidenceValue,
  MatchedTerm,
  PushStatus,
  RawAlertDto,
  SeverityEvidence,
} from "./types";

const REVIEW_MESSAGE =
  "Unverified possible-aggression alert. Human review required.";
const ALERT_LANGUAGES = new Set<AlertLanguage>([
  "fil",
  "ceb",
  "en",
  "mixed",
  "unknown",
]);
const MATCHED_TERM_LANGUAGES = new Set(["fil", "ceb", "en"]);
const PUSH_STATUSES = new Set<PushStatus>([
  "pending",
  "accepted",
  "partial",
  "rejected",
  "failed",
  "skipped",
]);
const PROHIBITED_EVIDENCE_KEYS = new Set([
  "raw_audio",
  "raw_pcm",
  "pcm",
  "pcm_samples",
  "audio_bytes",
  "audio_blob",
  "audio_base64",
  "wav",
  "recorded_audio",
  "password",
  "access_token",
  "authorization",
  "api_key",
]);
const MAX_EVIDENCE_DEPTH = 8;
const MAX_EVIDENCE_ITEMS = 256;
const MAX_EVIDENCE_STRING_LENGTH = 10_000;

export class AlertContractError extends Error {
  public readonly endpoint: string;

  constructor(endpoint: string, message: string) {
    super(`Invalid response from ${endpoint}: ${message}`);
    this.endpoint = endpoint;
    this.name = "AlertContractError";
  }
}

export interface AlertListParseResult {
  alerts: Alert[];
  malformedCount: number;
  warning: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function nonBlankString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function nullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === "string" ? value : undefined;
}

function nullableUuid(
  value: unknown,
  path: string,
  endpoint: string
): string | null | undefined {
  if (value === undefined || value === null) return value;
  if (typeof value !== "string" || !isUuid(value)) {
    throw new AlertContractError(endpoint, `${path} must be a UUID string or null`);
  }
  return value;
}

function validTimestamp(value: unknown): string | undefined {
  return typeof value === "string" && !Number.isNaN(Date.parse(value))
    ? value
    : undefined;
}

function validOptionalTimestamp(value: unknown): string | null | undefined {
  if (value === null) return null;
  return validTimestamp(value);
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.every((item) => typeof item === "string")
    ? [...value]
    : undefined;
}

function normalizedPrivacyKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function parseEvidenceValue(value: unknown, depth = 0): EvidenceValue | undefined {
  if (depth > MAX_EVIDENCE_DEPTH) return undefined;
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    if (typeof value === "string" && value.length > MAX_EVIDENCE_STRING_LENGTH) {
      return undefined;
    }
    return value;
  }
  if (isFiniteNumber(value)) return value;
  if (Array.isArray(value)) {
    if (value.length > MAX_EVIDENCE_ITEMS) return undefined;
    const parsed: EvidenceValue[] = [];
    for (const item of value) {
      const nested = parseEvidenceValue(item, depth + 1);
      if (nested === undefined) return undefined;
      parsed.push(nested);
    }
    return parsed;
  }
  if (isRecord(value)) {
    if (Object.keys(value).length > MAX_EVIDENCE_ITEMS) return undefined;
    const parsed: EvidenceObject = {};
    for (const [key, item] of Object.entries(value)) {
      if (PROHIBITED_EVIDENCE_KEYS.has(normalizedPrivacyKey(key))) return undefined;
      const nested = parseEvidenceValue(item, depth + 1);
      if (nested === undefined) return undefined;
      parsed[key] = nested;
    }
    return parsed;
  }
  return undefined;
}

function evidenceObject(value: unknown): EvidenceObject | null | undefined {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  const parsed = parseEvidenceValue(value);
  return isRecord(parsed) ? (parsed as EvidenceObject) : undefined;
}

function evidenceArray(value: unknown): EvidenceValue[] | undefined {
  const parsed = parseEvidenceValue(value);
  return Array.isArray(parsed) ? parsed : undefined;
}

function evidenceObjectArray(value: unknown): EvidenceObject[] | undefined {
  const parsed = evidenceArray(value);
  return parsed?.every(isRecord) ? (parsed as EvidenceObject[]) : undefined;
}

export function normalizeAlertSeverity(value: unknown): AlertSeverity {
  if (typeof value !== "string") return "unknown";
  switch (value.trim().toUpperCase()) {
    case "HIGH":
      return "high";
    case "MEDIUM":
      return "medium";
    case "LOW":
      return "low";
    default:
      return "unknown";
  }
}

function canonicalSeverity(value: unknown): CanonicalSeverity | undefined {
  const normalized = normalizeAlertSeverity(value);
  return normalized === "unknown"
    ? undefined
    : (normalized.toUpperCase() as CanonicalSeverity);
}

export function normalizeAlertStatus(value: unknown): AlertStatus {
  return value === "active" || value === "resolved" ? value : "unknown";
}

function triggerType(value: unknown): AlertTriggerType {
  if (typeof value !== "string") return "UNKNOWN";
  const normalized = value.trim().toUpperCase();
  return normalized === "KEYWORD" || normalized === "ACOUSTIC" || normalized === "TEST"
    ? normalized
    : "UNKNOWN";
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseMatchedTerm(
  value: unknown,
  path: string,
  endpoint: string
): MatchedTerm {
  if (!isRecord(value)) {
    throw new AlertContractError(endpoint, `${path} must be an object`);
  }
  if (!Number.isInteger(value.term_id) || Number(value.term_id) < 1) {
    throw new AlertContractError(endpoint, `${path}.term_id must be a positive integer`);
  }
  const term = nonBlankString(value.term);
  const matchType = nonBlankString(value.match_type);
  if (!term || !matchType || !MATCHED_TERM_LANGUAGES.has(String(value.language))) {
    throw new AlertContractError(endpoint, `${path} has an invalid term, language, or match type`);
  }
  return {
    term_id: value.term_id as number,
    term,
    language: value.language as MatchedTerm["language"],
    match_type: matchType,
  };
}

function parseSeverityEvidence(value: unknown): SeverityEvidence | null | undefined {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  const level = canonicalSeverity(value.level);
  const reasons = stringArray(value.reasons)?.filter((reason) => reason.trim());
  if (!level || !reasons?.length) return undefined;

  const termCategories: Record<string, string[]> = {};
  if (value.term_categories !== undefined) {
    if (!isRecord(value.term_categories)) return undefined;
    for (const [category, terms] of Object.entries(value.term_categories)) {
      const parsedTerms = stringArray(terms);
      if (!category.trim() || !parsedTerms) return undefined;
      termCategories[category] = parsedTerms;
    }
  }
  const supportingEvidence =
    value.supporting_evidence === undefined
      ? []
      : stringArray(value.supporting_evidence);
  if (!supportingEvidence) return undefined;
  return {
    level,
    reasons,
    term_categories: termCategories,
    supporting_evidence: supportingEvidence,
  };
}

function parseSchemaVersion(value: unknown, path: string, endpoint: string): number | null {
  if (value === undefined || value === null) return null;
  if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > 2) {
    throw new AlertContractError(endpoint, `${path}.schema_version is unsupported`);
  }
  return value as number;
}

function parseAlert(value: unknown, index: number, endpoint: string): Alert {
  const path = `items[${index}]`;
  if (!isRecord(value)) {
    throw new AlertContractError(endpoint, `${path} must be an object`);
  }
  const dto = value as RawAlertDto;
  if (!Number.isInteger(dto.id) || Number(dto.id) < 1) {
    throw new AlertContractError(endpoint, `${path}.id must be a positive integer`);
  }
  const schemaVersion = parseSchemaVersion(dto.schema_version, path, endpoint);
  const normalizedTrigger = triggerType(dto.trigger_type);
  if (schemaVersion === 2 && normalizedTrigger === "UNKNOWN") {
    throw new AlertContractError(endpoint, `${path}.trigger_type is invalid for schema_version 2`);
  }
  const level = canonicalSeverity(dto.severity_level) ?? canonicalSeverity(dto.severity);
  if (!level) {
    throw new AlertContractError(endpoint, `${path}.severity is invalid`);
  }
  if (
    dto.event_id !== undefined &&
    dto.event_id !== null &&
    (typeof dto.event_id !== "string" || !isUuid(dto.event_id))
  ) {
    throw new AlertContractError(endpoint, `${path}.event_id must be a UUID string or null`);
  }

  const createdAt =
    validTimestamp(dto.created_at) ??
    validTimestamp(value.event_start_timestamp) ??
    validTimestamp(value.trigger_timestamp) ??
    validTimestamp(value.event_end_timestamp);
  if (!createdAt) {
    throw new AlertContractError(endpoint, `${path} has no valid finalized or legacy timestamp`);
  }
  const matchedTerms =
    value.matched_terms === undefined || value.matched_terms === null
      ? value.matched_terms
      : Array.isArray(value.matched_terms)
        ? value.matched_terms.map((item, termIndex) =>
            parseMatchedTerm(item, `${path}.matched_terms[${termIndex}]`, endpoint)
          )
        : (() => {
            throw new AlertContractError(endpoint, `${path}.matched_terms must be an array`);
          })();

  const classroomName = nullableString(value.classroom_name);
  const legacyLocation = nullableString(value.location);
  const normalizedClassroom = nonBlankString(classroomName) ?? nonBlankString(legacyLocation);
  const reviewMessage =
    nonBlankString(value.review_message) ??
    nonBlankString(value.review_notice) ??
    REVIEW_MESSAGE;
  const finalizedReasons = stringArray(value.severity_reasons);
  const severityEvidence = parseSeverityEvidence(value.severity_evidence);
  const transcript = nullableString(value.transcript) ?? nullableString(value.transcribed_text);
  const testMode = value.test_mode === true || normalizedTrigger === "TEST";
  if (schemaVersion === 2 && value.test_mode !== undefined && typeof value.test_mode !== "boolean") {
    throw new AlertContractError(endpoint, `${path}.test_mode must be a boolean`);
  }

  const confidence = value.confidence === null ? null : isFiniteNumber(value.confidence) && value.confidence >= 0 && value.confidence <= 1 ? value.confidence : undefined;
  const duration = value.duration === null ? null : isFiniteNumber(value.duration) && value.duration >= 0 ? value.duration : undefined;
  const language =
    value.language === null
      ? null
      : typeof value.language === "string" && ALERT_LANGUAGES.has(value.language as AlertLanguage)
        ? (value.language as AlertLanguage)
        : undefined;
  const languageConfidence =
    value.language_confidence === null
      ? null
      : isFiniteNumber(value.language_confidence) && value.language_confidence >= 0 && value.language_confidence <= 1
        ? value.language_confidence
        : undefined;
  const delivery = typeof value.delivery_status === "string" && value.delivery_status.toLowerCase() === "stored" ? "stored" : "unknown";
  const push = typeof value.push_status === "string" && PUSH_STATUSES.has(value.push_status.toLowerCase() as PushStatus) ? value.push_status.toLowerCase() as PushStatus : "unknown";
  const monitoredTerms = evidenceArray(value.monitored_terms) ??
    (stringArray(value.detected_words) ?? []).map((item) => item as EvidenceValue);

  return {
    id: dto.id as number,
    event_id: dto.event_id as string | null | undefined,
    schema_version: schemaVersion,
    trigger_type: normalizedTrigger,
    severity: normalizeAlertSeverity(level),
    severity_level: level,
    severity_reasons: finalizedReasons ?? severityEvidence?.reasons ?? [],
    severity_evidence: severityEvidence,
    review_message: reviewMessage,
    review_notice: nullableString(value.review_notice),
    confidence,
    duration,
    location: normalizedClassroom ?? "Classroom unavailable",
    classroom_id: nullableUuid(value.classroom_id, `${path}.classroom_id`, endpoint),
    school_id: nullableUuid(value.school_id, `${path}.school_id`, endpoint),
    classroom_name: classroomName,
    school_name: nullableString(value.school_name),
    device_id: nullableString(value.device_id),
    device_code: nullableString(value.device_code),
    device_display_name: nullableString(value.device_display_name),
    device_identifier: nullableString(value.device_identifier),
    device_source: evidenceObject(value.device_source),
    status: normalizeAlertStatus(value.status),
    created_at: createdAt,
    event_start_timestamp: validOptionalTimestamp(value.event_start_timestamp),
    event_end_timestamp: validOptionalTimestamp(value.event_end_timestamp),
    trigger_timestamp: validOptionalTimestamp(value.trigger_timestamp),
    test_mode: testMode,
    delivery_status: delivery as DeliveryStatus,
    push_status: push,
    push_attempt_count: value.push_attempt_count === null ? null : Number.isInteger(value.push_attempt_count) && Number(value.push_attempt_count) >= 0 ? value.push_attempt_count as number : undefined,
    push_submitted_at: validOptionalTimestamp(value.push_submitted_at),
    transcript,
    transcribed_text: nullableString(value.transcribed_text),
    transcription_status: nullableString(value.transcription_status),
    monitored_terms: monitoredTerms,
    monitored_word_detected: value.monitored_word_detected === null || typeof value.monitored_word_detected === "boolean" ? value.monitored_word_detected : undefined,
    monitored_word_occurrences: evidenceObjectArray(value.monitored_word_occurrences) ?? [],
    acoustic_trigger_evidence: evidenceObject(value.acoustic_trigger_evidence),
    detailed_acoustic_evidence: evidenceObject(value.detailed_acoustic_evidence),
    tone_evidence: evidenceObject(value.tone_evidence),
    repetition_evidence: evidenceObject(value.repetition_evidence),
    direct_address_evidence: evidenceObject(value.direct_address_evidence),
    laughter_context: evidenceObject(value.laughter_context),
    detected_words: value.detected_words === null ? null : stringArray(value.detected_words),
    yamnet_class: nullableString(value.yamnet_class),
    yamnet_score: value.yamnet_score === null ? null : isFiniteNumber(value.yamnet_score) ? value.yamnet_score : undefined,
    yamnet_ran: value.yamnet_ran === null || typeof value.yamnet_ran === "boolean" ? value.yamnet_ran : undefined,
    emotion: nullableString(value.emotion),
    rms: value.rms === null ? null : isFiniteNumber(value.rms) ? value.rms : undefined,
    energy_variance: value.energy_variance === null ? null : isFiniteNumber(value.energy_variance) ? value.energy_variance : undefined,
    zero_crossing_rate: value.zero_crossing_rate === null ? null : isFiniteNumber(value.zero_crossing_rate) ? value.zero_crossing_rate : undefined,
    peak_to_average: value.peak_to_average === null ? null : isFiniteNumber(value.peak_to_average) ? value.peak_to_average : undefined,
    waveform_snapshot: value.waveform_snapshot === null ? null : Array.isArray(value.waveform_snapshot) && value.waveform_snapshot.every(isFiniteNumber) ? [...value.waveform_snapshot] : undefined,
    categories: value.categories === null ? null : stringArray(value.categories),
    language,
    language_confidence: languageConfidence,
    matched_terms: matchedTerms as MatchedTerm[] | null | undefined,
    hard_hits: value.hard_hits === null ? null : stringArray(value.hard_hits),
    soft_hits: value.soft_hits === null ? null : stringArray(value.soft_hits),
    duration_gate: nullableString(value.duration_gate),
    required_duration: value.required_duration === null ? null : isFiniteNumber(value.required_duration) ? value.required_duration : undefined,
  };
}

export function parseAlertListResult(
  value: unknown,
  endpoint = "/alerts/"
): AlertListParseResult {
  if (!Array.isArray(value)) {
    throw new AlertContractError(endpoint, "expected an array");
  }
  const alerts: Alert[] = [];
  let malformedCount = 0;
  value.forEach((item, index) => {
    try {
      alerts.push(parseAlert(item, index, endpoint));
    } catch (error) {
      if (!(error instanceof AlertContractError)) throw error;
      malformedCount += 1;
    }
  });
  return {
    alerts,
    malformedCount,
    warning: malformedCount
      ? `${malformedCount} malformed alert record${malformedCount === 1 ? " was" : "s were"} omitted.`
      : null,
  };
}

export function parseAlertListResponse(value: unknown, endpoint = "/alerts/"): Alert[] {
  return parseAlertListResult(value, endpoint).alerts;
}

export function parseAlertResponse(value: unknown, endpoint = "/alerts/"): Alert {
  return parseAlert(value, 0, endpoint);
}
