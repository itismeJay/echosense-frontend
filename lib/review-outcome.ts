/** What a reviewer concluded about an alert (backend `review_outcome`). */
export type ReviewOutcome = "confirmed_bullying" | "false_alert" | "joking_banter" | "misheard";

export const REVIEW_OUTCOMES: readonly { value: ReviewOutcome; label: string }[] = [
  { value: "confirmed_bullying", label: "Confirmed" },
  { value: "false_alert", label: "False alert" },
  { value: "joking_banter", label: "Just joking" },
  { value: "misheard", label: "Misheard" },
];

export const REVIEW_NOTE_MAX = 500;

export function parseReviewOutcome(value: unknown): ReviewOutcome | null {
  return REVIEW_OUTCOMES.some((outcome) => outcome.value === value) ? (value as ReviewOutcome) : null;
}

export function reviewOutcomeLabel(outcome: ReviewOutcome | null | undefined): string | null {
  return REVIEW_OUTCOMES.find((item) => item.value === outcome)?.label ?? null;
}

/** False alerts as a share of alerts that have an outcome. Null when none have one yet. */
export function falseAlertRate(
  counts: Partial<Record<string, number>> | null | undefined
): { falseAlerts: number; withOutcome: number; percent: number } | null {
  if (!counts) return null;
  const withOutcome = REVIEW_OUTCOMES.reduce((sum, { value }) => sum + (Number(counts[value]) || 0), 0);
  if (withOutcome === 0) return null;
  const falseAlerts = Number(counts.false_alert) || 0;
  return { falseAlerts, withOutcome, percent: Math.round((falseAlerts / withOutcome) * 100) };
}
