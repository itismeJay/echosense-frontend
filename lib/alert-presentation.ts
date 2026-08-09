import type {
  Alert,
  AlertSeverity,
  MatchedTerm,
} from "./types";

export const REQUIRED_REVIEW_NOTICE =
  "Unverified possible-aggression alert. Human review required.";

export const HUMAN_REVIEW_NOTE =
  "This transcript and acoustic evidence are automated indicators. Staff must review the surrounding context before taking action.";

export const UNVERIFIED_EVIDENCE_NOTICE = REQUIRED_REVIEW_NOTICE;

export const MISSING_TRANSCRIPT_MESSAGE =
  "No transcript was available for this alert.";

export const NO_MATCHED_TERMS_MESSAGE =
  "No matched monitored terms available.";

export const HISTORICAL_SEVERITY_EVIDENCE_MESSAGE =
  "Detailed severity evidence was not recorded for this historical alert.";

export const UNAVAILABLE_SEVERITY_EVIDENCE_MESSAGE =
  "Detailed severity evidence is unavailable for this alert.";

export function severityLabel(severity: AlertSeverity): string {
  switch (severity) {
    case "high":
      return "HIGH";
    case "medium":
      return "MEDIUM";
    case "low":
      return "LOW";
    default:
      return "SEVERITY UNAVAILABLE";
  }
}

export function priorityLabel(severity: AlertSeverity): string {
  switch (severity) {
    case "high":
      return "High priority";
    case "medium":
      return "Medium priority";
    case "low":
      return "Low priority";
    default:
      return "Priority unavailable";
  }
}

export function severitySummary(severity: AlertSeverity): string {
  switch (severity) {
    case "high":
      return "High-priority classroom alert";
    case "medium":
      return "Possible verbal-aggression indicators";
    case "low":
      return "Possible classroom concern";
    default:
      return "Severity could not be determined";
  }
}

export function severityEvidenceAvailabilityLabel(alert: Alert): string {
  if (alert.severity_evidence) return "Severity explanation available";
  if (alert.severity_evidence === null) {
    return "Historical severity details unavailable";
  }
  return "Severity details unavailable";
}

export function alertStatusLabel(): string {
  return "Unverified — review required";
}

export function reviewStatusLabel(alert: Alert): string {
  if (alert.status === "resolved") return "Marked resolved";
  if (alert.status === "active") return "Awaiting review";
  return "Review status unavailable";
}

export function isTestAlert(alert: Alert): boolean {
  return alert.test_mode || alert.trigger_type === "TEST";
}

export function triggerTypeLabel(alert: Alert): string {
  if (isTestAlert(alert)) return "TEST — synthetic alert";
  if (alert.trigger_type === "KEYWORD") return "Monitored-term trigger";
  if (alert.trigger_type === "ACOUSTIC") return "Acoustic trigger";
  return "Trigger type unavailable";
}

export function classroomLabel(alert: Alert): string {
  return alert.classroom_name?.trim() || alert.location;
}

export function schoolLabel(alert: Alert): string {
  return alert.school_name?.trim() || "School unavailable";
}

export function eventTime(alert: Alert): string {
  return (
    alert.trigger_timestamp ||
    alert.event_start_timestamp ||
    alert.created_at
  );
}

export function monitoredTermCount(alert: Alert): number {
  if (alert.monitored_word_occurrences.length > 0) {
    return alert.monitored_word_occurrences.length;
  }
  if (alert.monitored_terms.length > 0) return alert.monitored_terms.length;
  return uniqueMatchedTerms(alert.matched_terms).length || (alert.detected_words ?? []).length;
}

export function monitoredTermSummary(alert: Alert): string {
  const count = monitoredTermCount(alert);
  if (count === 0) {
    return alert.monitored_word_detected === false
      ? "No monitored term detected"
      : NO_MATCHED_TERMS_MESSAGE;
  }
  return `${count} monitored-term occurrence${count === 1 ? "" : "s"}`;
}

export function deliveryStatusLabel(alert: Alert): string {
  return alert.delivery_status === "stored" ? "Stored" : "Delivery state unavailable";
}

export function pushStatusLabel(alert: Alert): string {
  if (alert.push_status === "unknown") return "Push state unavailable";
  return readableMachineKey(alert.push_status);
}

export function alertSummary(alert: Alert): string {
  return alert.transcribed_text
    ? "A stored transcript is available for staff review."
    : "No stored transcript is available for this alert.";
}

export function matchedTermsCountLabel(
  matchedTerms?: MatchedTerm[] | null
): string {
  const count = uniqueMatchedTerms(matchedTerms).length;
  if (count === 0) return NO_MATCHED_TERMS_MESSAGE;
  return `${count} possible matched term${count === 1 ? "" : "s"}`;
}

export function uniqueMatchedTerms(
  matchedTerms?: MatchedTerm[] | null
): MatchedTerm[] {
  const seen = new Set<string>();
  return (matchedTerms ?? []).filter((matchedTerm) => {
    const key = [
      matchedTerm.term,
      matchedTerm.language,
      matchedTerm.match_type,
    ].join("\u0000");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function exactTranscript(alert: Alert): string {
  const transcript = storedTranscript(alert);
  return transcript && transcript.length > 0
    ? transcript
    : MISSING_TRANSCRIPT_MESSAGE;
}

export function storedTranscript(alert: Alert): string | null | undefined {
  return typeof alert.transcript === "string"
    ? alert.transcript
    : alert.transcribed_text;
}

export function transcriptPreview(
  transcript?: string | null,
  maxLength = 160
): string {
  if (!transcript) return MISSING_TRANSCRIPT_MESSAGE;
  if (transcript.length <= maxLength) return transcript;
  return `${transcript.slice(0, Math.max(0, maxLength - 1))}…`;
}

export function yamnetRanExplanation(
  yamnetRan?: boolean | null
): string | null {
  if (yamnetRan === true) {
    return "Acoustic classification was executed.";
  }
  if (yamnetRan === false) {
    return "Acoustic classification was not executed.";
  }
  return null;
}

export function matchedTermEvidenceLabel(matchType: string): string {
  return matchType.toLowerCase() === "phrase"
    ? "Possible matched phrase"
    : "Possible detected term";
}

const SEVERITY_REASON_LABELS: Record<string, string> = {
  "term_category:self_harm_directive":
    "Severe self-harm directive detected in the transcript",
};

const SUPPORTING_EVIDENCE_LABELS: Record<string, string> = {
  laughter_or_excitement_marker_present:
    "Laughter or excitement was present, but it did not cancel the stronger text evidence",
};

const TERM_CATEGORY_LABELS: Record<string, string> = {
  self_harm_directive: "Severe self-harm directive",
};

function readableMachineKey(value: string): string {
  const readable = value
    .replace(/:/g, ": ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!readable) return "Recorded evidence";
  return readable.charAt(0).toUpperCase() + readable.slice(1);
}

export function severityReasonLabel(reason: string): string {
  const known = SEVERITY_REASON_LABELS[reason];
  if (known) return known;
  if (reason.startsWith("term_category:")) {
    return `Transcript matched the ${termCategoryEvidenceLabel(
      reason.slice("term_category:".length)
    ).toLowerCase()} category`;
  }
  return readableMachineKey(reason);
}

export function termCategoryEvidenceLabel(category: string): string {
  return TERM_CATEGORY_LABELS[category] ?? readableMachineKey(category);
}

export function supportingEvidenceLabel(evidence: string): string {
  return (
    SUPPORTING_EVIDENCE_LABELS[evidence] ?? readableMachineKey(evidence)
  );
}

export function localDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
