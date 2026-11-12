import type {
  Alert,
  AlertSeverity,
  MatchedTerm,
  MonitoredTermLanguage,
} from "./types";

export const REQUIRED_REVIEW_NOTICE =
  "Unverified possible-aggression alert. Human review required.";

/** The short disclaimer shown on the alert detail page. */
export const SHORT_REVIEW_NOTICE = "Automated alert, needs human review.";

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
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    default:
      return "Severity unavailable";
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
  if (alert.status === "resolved") return "Resolved";
  if (alert.status === "reviewed") return "Reviewed";
  if (alert.status === "active") return "Needs review";
  return "Review status unavailable";
}

/** An alert needs review until someone marks it reviewed or resolved. */
export function needsReview(alert: Alert): boolean {
  return alert.status === "active";
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
  return alertTerms(alert).length || (alert.detected_words ?? []).length;
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

export interface DisplayTerm {
  term: string;
  language: MonitoredTermLanguage | null;
  match_type: string;
  /** global: in the dictionary; school: this school's word; unlisted: kept as heard. */
  source: "global" | "school" | "unlisted";
}

/** Every term the device matched: dictionary terms, then school words and unlisted ones. */
export function alertTerms(alert: Alert): DisplayTerm[] {
  const terms: DisplayTerm[] = [
    ...uniqueMatchedTerms(alert.matched_terms).map((term) => ({
      term: term.term,
      language: term.language,
      match_type: term.match_type,
      source: "global" as const,
    })),
    ...(alert.unlisted_terms ?? []),
  ];
  const seen = new Set<string>();
  return terms.filter((term) => {
    const key = [term.term.toLocaleLowerCase(), term.match_type].join("\u0000");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function termSourceLabel(source: DisplayTerm["source"]): string | null {
  if (source === "school") return "School word";
  if (source === "unlisted") return "Not in the word list";
  return null;
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

/**
 * The words the device heard that made this alert, for the inbox. Matched dictionary
 * terms first, then finalized monitored terms, then raw detected words; deduplicated
 * case-insensitively without changing the original spelling.
 */
export function wordsHeard(alert: Alert, limit = 4): string[] {
  const candidates = [
    ...alertTerms(alert).map((term) => term.term),
    ...alert.monitored_terms.filter((term): term is string => typeof term === "string"),
    ...(alert.detected_words ?? []),
  ];
  const seen = new Set<string>();
  const words: string[] = [];
  for (const word of candidates) {
    const trimmed = word.trim();
    const key = trimmed.toLocaleLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    words.push(trimmed);
    if (words.length === limit) break;
  }
  return words;
}

/** What to show when no words were recorded: why the device flagged it, in plain words. */
export function noWordsReason(alert: Alert): string {
  if (alert.trigger_type === "ACOUSTIC") return "Raised voices or a loud sound";
  return "No words recorded";
}

/** A transcript piece; `match` marks a monitored term to highlight. */
export interface TranscriptPart {
  text: string;
  match: boolean;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Splits text into plain and matched parts (case-insensitive, longest term first). */
export function highlightTerms(text: string, terms: string[]): TranscriptPart[] {
  const unique = [...new Set(terms.map((term) => term.trim()).filter(Boolean))].sort(
    (a, b) => b.length - a.length
  );
  if (!text || unique.length === 0) return text ? [{ text, match: false }] : [];
  const pattern = new RegExp(`(${unique.map(escapeRegExp).join("|")})`, "giu");
  return text
    .split(pattern)
    .filter((part) => part !== "")
    .map((part) => ({
      text: part,
      match: unique.some((term) => term.toLocaleLowerCase() === part.toLocaleLowerCase()),
    }));
}

/**
 * A short quote of the transcript for the list: up to `maxLength` characters, shifted so the
 * first matched term is visible, with an ellipsis where text was cut. Null without a transcript.
 */
export function transcriptSnippet(alert: Alert, maxLength = 80): string | null {
  const transcript = storedTranscript(alert)?.replace(/\s+/g, " ").trim();
  if (!transcript) return null;
  if (transcript.length <= maxLength) return transcript;
  const lower = transcript.toLocaleLowerCase();
  const firstMatch = wordsHeard(alert, 12)
    .map((term) => lower.indexOf(term.toLocaleLowerCase()))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  let start = firstMatch !== undefined && firstMatch > maxLength - 30 ? firstMatch - 20 : 0;
  start = Math.max(0, Math.min(start, transcript.length - maxLength));
  const end = start + maxLength;
  return `${start > 0 ? "…" : ""}${transcript.slice(start, end).trim()}${end < transcript.length ? "…" : ""}`;
}

const REASON_CATEGORIES: Array<[RegExp, string]> = [
  [/self[_-]?harm/, "Words telling someone to hurt themselves"],
  [/threat|violen/, "Possible threat"],
  [/body|appearance/, "Comment about someone's looks"],
  [/academic/, "Put-down about someone's schoolwork"],
  [/taunt|insult|slur|curse|profan|shaming/, "Insult"],
];

function evidenceFlag(evidence: Alert["direct_address_evidence"]): boolean {
  if (!evidence) return false;
  return ["detected", "present", "is_direct", "direct"].some((key) => evidence[key] === true);
}

/** One plain-language line on why the alert was raised, built from the alert's own fields. */
export function alertReason(alert: Alert): string {
  if (isTestAlert(alert)) return "Test alert sent to check the system";
  const keys = [
    ...(alert.categories ?? []),
    ...Object.keys(alert.severity_evidence?.term_categories ?? {}),
    ...alert.severity_reasons,
    ...(alert.severity_evidence?.reasons ?? []),
  ].map((key) => key.toLowerCase());
  const what =
    REASON_CATEGORIES.find(([pattern]) => keys.some((key) => pattern.test(key)))?.[1] ??
    (alert.trigger_type === "ACOUSTIC"
      ? "Raised voices or a loud sound"
      : wordsHeard(alert).length > 0
        ? "Hurtful or worrying words"
        : "Possible classroom concern");

  const details: string[] = [];
  if (evidenceFlag(alert.direct_address_evidence)) details.push("aimed at someone");
  const tone = (alert.emotion ?? "").toLowerCase();
  if (/angry|anger|aggress|hostile/.test(tone)) details.push("said in an angry tone");
  else if (alert.trigger_type === "KEYWORD" && alert.acoustic_trigger_evidence) details.push("said in a loud tone");
  const repeats = alert.repetition_evidence?.count;
  if (typeof repeats === "number" && repeats > 1) details.push(`repeated ${repeats} times`);

  if (details.length === 0) return what;
  const [first, ...rest] = details;
  return `${what} ${first}${rest.length ? `, ${rest.join(", ")}` : ""}`;
}

export const WHAT_TO_DO = [
  "Check on the students involved.",
  "Talk to them privately.",
  "Refer to the counselor if it repeats or is a threat.",
] as const;
