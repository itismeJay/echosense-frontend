// Per-school settings (backend /school-settings, migration 20261027_0013). Parsers check
// the response shape; builders produce the PATCH body. Pure, so node --test covers them.

import type { MonitoredTermLanguage } from "./types";

export type PushLevel = "HIGH" | "MEDIUM" | "LOW";
export type Sensitivity = "normal" | "strict";

export interface SchoolHours {
  enabled: boolean;
  /** ISO weekdays: 1 = Monday ... 7 = Sunday. */
  weekdays: number[];
  /** "HH:MM" */
  start: string;
  end: string;
  timezone: string;
}

export interface SchoolSettings {
  school_id: string;
  push_levels: PushLevel[];
  school_hours: SchoolHours;
  sensitivity: Sensitivity;
  updated_at: string | null;
}

export interface GlobalTermForSchool {
  term_id: number;
  text: string;
  language: MonitoredTermLanguage;
  severity_weight: number;
  enabled_for_school: boolean;
}

export interface SchoolTerm {
  id: number;
  text: string;
  language: MonitoredTermLanguage;
  severity_weight: number;
  created_at: string;
}

export interface SchoolTerms {
  school_id: string;
  global_terms: GlobalTermForSchool[];
  school_terms: SchoolTerm[];
}

export interface SchoolSettingsUpdate {
  push_levels?: PushLevel[];
  school_hours?: SchoolHours;
  sensitivity?: Sensitivity;
}

export const PUSH_LEVEL_OPTIONS: ReadonlyArray<{ value: PushLevel; label: string; hint: string }> = [
  { value: "HIGH", label: "Send phone alerts for High", hint: "Likely bullying or a fight. Recommended." },
  { value: "MEDIUM", label: "Send phone alerts for Medium", hint: "Possible bullying that someone should check." },
  { value: "LOW", label: "Send phone alerts for Low", hint: "Minor signs. Usually reviewed on the dashboard instead." },
];

export const SENSITIVITY_OPTIONS: ReadonlyArray<{ value: Sensitivity; label: string; explanation: string }> = [
  {
    value: "normal",
    label: "Normal",
    explanation: "Alerts when a monitored word is clearly heard. Fewer false alarms.",
  },
  {
    value: "strict",
    label: "Strict",
    explanation: "Also alerts on partial or unclear matches. Catches more, with more false alarms.",
  },
];

export const WEEKDAY_OPTIONS: ReadonlyArray<{ value: number; short: string; label: string }> = [
  { value: 1, short: "Mon", label: "Monday" },
  { value: 2, short: "Tue", label: "Tuesday" },
  { value: 3, short: "Wed", label: "Wednesday" },
  { value: 4, short: "Thu", label: "Thursday" },
  { value: 5, short: "Fri", label: "Friday" },
  { value: 6, short: "Sat", label: "Saturday" },
  { value: 7, short: "Sun", label: "Sunday" },
];

const PUSH_LEVELS: readonly PushLevel[] = ["HIGH", "MEDIUM", "LOW"];
const LANGUAGES: readonly MonitoredTermLanguage[] = ["fil", "ceb", "en"];

export class SchoolSettingsContractError extends Error {
  constructor(message: string) {
    super(`Invalid response from /school-settings: ${message}`);
    this.name = "SchoolSettingsContractError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string") throw new SchoolSettingsContractError(`${field} must be a string`);
  return value;
}

/** "07:00:00" or "07:00" -> "07:00". */
export function toClock(value: unknown, field = "time"): string {
  const text = requireString(value, field);
  const match = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.exec(text);
  if (!match) throw new SchoolSettingsContractError(`${field} must be HH:MM`);
  return `${match[1]}:${match[2]}`;
}

function readLanguage(value: unknown, field: string): MonitoredTermLanguage {
  if (LANGUAGES.includes(value as MonitoredTermLanguage)) return value as MonitoredTermLanguage;
  throw new SchoolSettingsContractError(`${field} must be fil, ceb or en`);
}

function readWeight(value: unknown, field: string): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1) return value;
  throw new SchoolSettingsContractError(`${field} must be a number from 0 to 1`);
}

export function parseSchoolSettings(value: unknown): SchoolSettings {
  if (!isRecord(value)) throw new SchoolSettingsContractError("expected an object");
  const hours = value.school_hours;
  if (!isRecord(hours)) throw new SchoolSettingsContractError("school_hours must be an object");
  if (!Array.isArray(value.push_levels) || value.push_levels.some((level) => !PUSH_LEVELS.includes(level))) {
    throw new SchoolSettingsContractError("push_levels must list HIGH, MEDIUM or LOW");
  }
  if (value.sensitivity !== "normal" && value.sensitivity !== "strict") {
    throw new SchoolSettingsContractError("sensitivity must be normal or strict");
  }
  if (typeof hours.enabled !== "boolean") {
    throw new SchoolSettingsContractError("school_hours.enabled must be a boolean");
  }
  if (
    !Array.isArray(hours.weekdays) ||
    hours.weekdays.some((day) => !Number.isInteger(day) || day < 1 || day > 7)
  ) {
    throw new SchoolSettingsContractError("school_hours.weekdays must be 1-7");
  }
  return {
    school_id: requireString(value.school_id, "school_id"),
    push_levels: PUSH_LEVELS.filter((level) => (value.push_levels as unknown[]).includes(level)),
    school_hours: {
      enabled: hours.enabled,
      weekdays: [...(hours.weekdays as number[])].sort((a, b) => a - b),
      start: toClock(hours.start, "school_hours.start"),
      end: toClock(hours.end, "school_hours.end"),
      timezone: requireString(hours.timezone, "school_hours.timezone"),
    },
    sensitivity: value.sensitivity,
    updated_at: typeof value.updated_at === "string" ? value.updated_at : null,
  };
}

export function parseSchoolTerm(value: unknown, field = "school term"): SchoolTerm {
  if (!isRecord(value) || !Number.isInteger(value.id)) {
    throw new SchoolSettingsContractError(`${field} must have an integer id`);
  }
  return {
    id: value.id as number,
    text: requireString(value.text, `${field}.text`),
    language: readLanguage(value.language, `${field}.language`),
    severity_weight: readWeight(value.severity_weight, `${field}.severity_weight`),
    created_at: requireString(value.created_at, `${field}.created_at`),
  };
}

export function parseGlobalTermForSchool(value: unknown, field = "global term"): GlobalTermForSchool {
  if (!isRecord(value) || !Number.isInteger(value.term_id)) {
    throw new SchoolSettingsContractError(`${field} must have an integer term_id`);
  }
  if (typeof value.enabled_for_school !== "boolean") {
    throw new SchoolSettingsContractError(`${field}.enabled_for_school must be a boolean`);
  }
  return {
    term_id: value.term_id as number,
    text: requireString(value.text, `${field}.text`),
    language: readLanguage(value.language, `${field}.language`),
    severity_weight: readWeight(value.severity_weight, `${field}.severity_weight`),
    enabled_for_school: value.enabled_for_school,
  };
}

export function parseSchoolTerms(value: unknown): SchoolTerms {
  if (!isRecord(value) || !Array.isArray(value.global_terms) || !Array.isArray(value.school_terms)) {
    throw new SchoolSettingsContractError("expected global_terms and school_terms lists");
  }
  return {
    school_id: requireString(value.school_id, "school_id"),
    global_terms: value.global_terms.map((term, index) => parseGlobalTermForSchool(term, `global_terms[${index}]`)),
    school_terms: value.school_terms.map((term, index) => parseSchoolTerm(term, `school_terms[${index}]`)),
  };
}

/** The new push levels after toggling one, always in High, Medium, Low order. */
export function togglePushLevel(levels: readonly PushLevel[], level: PushLevel, on: boolean): PushLevel[] {
  const next = new Set(levels);
  if (on) next.add(level);
  else next.delete(level);
  return PUSH_LEVELS.filter((item) => next.has(item));
}

/** Checks the School hours form; returns a message to show, or null when it can be saved. */
export function schoolHoursProblem(hours: SchoolHours): string | null {
  if (!hours.enabled) return null;
  if (hours.weekdays.length === 0) return "Choose at least one school day.";
  if (!/^\d{2}:\d{2}$/.test(hours.start) || !/^\d{2}:\d{2}$/.test(hours.end)) {
    return "Enter the start and end time.";
  }
  if (hours.start === hours.end) return "The end time must be different from the start time.";
  return null;
}

export function sameSchoolHours(a: SchoolHours, b: SchoolHours): boolean {
  return (
    a.enabled === b.enabled &&
    a.start === b.start &&
    a.end === b.end &&
    a.timezone === b.timezone &&
    a.weekdays.length === b.weekdays.length &&
    a.weekdays.every((day, index) => day === b.weekdays[index])
  );
}

/** "Mon-Fri, 7:00 AM to 5:00 PM" style summary for the read-only line under the form. */
export function describeSchoolHours(hours: SchoolHours): string {
  if (!hours.enabled) return "Phone alerts can be sent at any time.";
  const days = WEEKDAY_OPTIONS.filter((day) => hours.weekdays.includes(day.value)).map((day) => day.short);
  const clock = (value: string) => {
    const [h, m] = value.split(":").map(Number);
    const suffix = h < 12 ? "AM" : "PM";
    return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${suffix}`;
  };
  const overnight = hours.end < hours.start ? " (overnight)" : "";
  return `${days.join(", ")}, ${clock(hours.start)} to ${clock(hours.end)}${overnight}`;
}

export interface NewSchoolTermForm {
  text: string;
  language: MonitoredTermLanguage;
  severity_weight: number;
}

export function buildSchoolTermPayload(
  form: NewSchoolTermForm
): { payload: NewSchoolTermForm } | { error: string } {
  const text = form.text.trim().replace(/\s+/g, " ");
  if (!text) return { error: "Enter the word or phrase to listen for." };
  if (text.length > 100) return { error: "Keep it to 100 characters or fewer." };
  if (!LANGUAGES.includes(form.language)) return { error: "Choose the language." };
  if (!Number.isFinite(form.severity_weight) || form.severity_weight < 0 || form.severity_weight > 1) {
    return { error: "Choose how serious this word is." };
  }
  return { payload: { text, language: form.language, severity_weight: form.severity_weight } };
}

/** Maps a failed school-settings request to text the admin can act on. */
export function schoolSettingsErrorMessage(status: number, detail: string): string {
  if (status === 409 && /global list/.test(detail)) {
    return "That word is already on the EchoSense list, so your school already listens for it.";
  }
  if (status === 409) return "Your school already listens for that word.";
  if (status === 403) return "Only this school's administrators can change these settings.";
  if (status === 422 && /Enter a school/.test(detail)) return "Enter a school from All schools first.";
  if (status === 404) return "That item no longer exists. Refresh and try again.";
  return "The change wasn't saved. Try again.";
}

/** Which Settings the user sees: one school's settings, or the platform's global ones. */
export type SettingsMode = "school" | "platform";

export function settingsModeFor(isSuperAdmin: boolean, hasSchoolScope: boolean): SettingsMode {
  return isSuperAdmin && !hasSchoolScope ? "platform" : "school";
}
