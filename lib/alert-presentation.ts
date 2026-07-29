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

export function alertStatusLabel(): string {
  return "Unverified — review required";
}

export function reviewStatusLabel(alert: Alert): string {
  if (alert.status === "resolved") return "Marked resolved";
  if (alert.status === "active") return "Awaiting review";
  return "Review status unavailable";
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
  return alert.transcribed_text && alert.transcribed_text.length > 0
    ? alert.transcribed_text
    : MISSING_TRANSCRIPT_MESSAGE;
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

export function localDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
