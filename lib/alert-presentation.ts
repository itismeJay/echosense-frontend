import type { Alert, Severity } from "./types";

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

export function localDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
