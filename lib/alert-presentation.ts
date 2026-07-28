import type { Alert, MatchedTerm, Severity } from "./types";

export const UNVERIFIED_EVIDENCE_NOTICE =
  "Automated and unverified evidence. The transcript and matched terms may be inaccurate.";

export const NO_MATCHED_TERMS_MESSAGE =
  "No matched monitored terms available.";

export function priorityLabel(severity: Severity): string {
  return `${severity} priority`;
}

export function alertStatusLabel(alert: Alert): string {
  return alert.status === "resolved"
    ? "Recorded alert · Marked resolved"
    : "Possible alert · Unverified";
}

export function alertSummary(alert: Alert): string {
  const modelClass = alert.yamnet_class?.toLowerCase() ?? "";
  const hasRaisedVoice =
    modelClass.includes("shout") ||
    modelClass.includes("yell") ||
    modelClass.includes("scream");
  const hasDetectedTerms =
    (alert.matched_terms?.length ?? 0) > 0 ||
    (alert.hard_hits?.length ?? 0) > 0 ||
    (alert.soft_hits?.length ?? 0) > 0 ||
    (alert.detected_words?.length ?? 0) > 0;
  const hasThreatCategory = alert.categories?.includes("threat") ?? false;

  if (hasRaisedVoice && hasDetectedTerms) {
    return "Possible shouting and harmful language were detected.";
  }
  if (hasThreatCategory) {
    return "Possible threatening or concerning speech was detected.";
  }
  if (hasDetectedTerms) {
    return "Possible harmful language or concerning speech was detected.";
  }
  if (hasRaisedVoice) {
    return "Possible shouting or a raised voice was detected.";
  }
  if (alert.transcribed_text) {
    return "Possible concerning speech was detected.";
  }
  return "The classroom monitoring system noticed a possible concerning sound.";
}

export function matchedTermsCountLabel(
  matchedTerms?: MatchedTerm[]
): string {
  const count = matchedTerms?.length ?? 0;
  if (count === 0) return NO_MATCHED_TERMS_MESSAGE;
  return `${count} possible matched term${count === 1 ? "" : "s"}`;
}

export function matchedTermEvidenceLabel(matchType: string): string {
  return matchType.toLowerCase() === "phrase"
    ? "Possible matched phrase"
    : "Possible detected term";
}

export function localDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
