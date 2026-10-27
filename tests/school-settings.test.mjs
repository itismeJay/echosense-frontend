import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  PUSH_LEVEL_OPTIONS,
  SENSITIVITY_OPTIONS,
  SchoolSettingsContractError,
  buildSchoolTermPayload,
  describeSchoolHours,
  parseSchoolSettings,
  parseSchoolTerms,
  schoolHoursProblem,
  schoolSettingsErrorMessage,
  settingsModeFor,
  togglePushLevel,
} from "../lib/school-settings.ts";
import { canAccessPath, isSchoolPage } from "../lib/access.ts";

const readSource = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

const SETTINGS = {
  school_id: "cc5c511c-0a33-4ecb-bcaa-b00302b59879",
  push_levels: ["HIGH", "MEDIUM"],
  school_hours: { enabled: false, weekdays: [1, 2, 3, 4, 5], start: "07:00:00", end: "17:00:00", timezone: "Asia/Manila" },
  sensitivity: "normal",
  updated_at: "2026-10-27T01:00:00Z",
};

test("parses the backend defaults", () => {
  assert.deepEqual(parseSchoolSettings(SETTINGS), {
    ...SETTINGS,
    school_hours: { ...SETTINGS.school_hours, start: "07:00", end: "17:00" },
  });
});

test("rejects malformed school settings", () => {
  for (const bad of [
    { ...SETTINGS, push_levels: ["URGENT"] },
    { ...SETTINGS, sensitivity: "relaxed" },
    { ...SETTINGS, school_hours: { ...SETTINGS.school_hours, weekdays: [0] } },
    { ...SETTINGS, school_hours: { ...SETTINGS.school_hours, start: "7am" } },
    { ...SETTINGS, school_hours: { ...SETTINGS.school_hours, enabled: "yes" } },
  ]) {
    assert.throws(() => parseSchoolSettings(bad), SchoolSettingsContractError);
  }
});

test("push levels are plain toggles in High, Medium, Low order", () => {
  assert.deepEqual(
    PUSH_LEVEL_OPTIONS.map((option) => option.label),
    ["Send phone alerts for High", "Send phone alerts for Medium", "Send phone alerts for Low"]
  );
  assert.deepEqual(togglePushLevel(["HIGH", "MEDIUM"], "LOW", true), ["HIGH", "MEDIUM", "LOW"]);
  assert.deepEqual(togglePushLevel(["LOW", "HIGH"], "MEDIUM", true), ["HIGH", "MEDIUM", "LOW"]);
  assert.deepEqual(togglePushLevel(["HIGH", "MEDIUM"], "HIGH", false), ["MEDIUM"]);
});

test("sensitivity offers Normal and Strict with a one-line explanation each", () => {
  assert.deepEqual(SENSITIVITY_OPTIONS.map((option) => option.value), ["normal", "strict"]);
  for (const option of SENSITIVITY_OPTIONS) {
    assert.ok(option.explanation.length > 0 && !option.explanation.includes("\n"));
  }
});

test("school hours are checked before saving and described in plain words", () => {
  const on = { enabled: true, weekdays: [1, 2, 3, 4, 5], start: "07:00", end: "17:00", timezone: "Asia/Manila" };
  assert.equal(schoolHoursProblem({ ...on, enabled: false, weekdays: [] }), null);
  assert.equal(schoolHoursProblem(on), null);
  assert.match(schoolHoursProblem({ ...on, weekdays: [] }), /school day/);
  assert.match(schoolHoursProblem({ ...on, end: "07:00" }), /different/);
  assert.match(schoolHoursProblem({ ...on, start: "" }), /start and end/);
  assert.equal(describeSchoolHours(on), "Mon, Tue, Wed, Thu, Fri, 7:00 AM to 5:00 PM");
  assert.equal(describeSchoolHours({ ...on, start: "22:00", end: "06:00", weekdays: [5] }), "Fri, 10:00 PM to 6:00 AM (overnight)");
});

test("parses the monitored words for one school", () => {
  const parsed = parseSchoolTerms({
    school_id: SETTINGS.school_id,
    global_terms: [{ term_id: 3, text: "bobo", language: "fil", severity_weight: 0.6, enabled_for_school: false }],
    school_terms: [{ id: 9, text: "local word", language: "ceb", severity_weight: 0.5, created_at: "2026-10-27T01:00:00Z" }],
  });
  assert.equal(parsed.global_terms[0].enabled_for_school, false);
  assert.equal(parsed.school_terms[0].text, "local word");
  assert.throws(
    () => parseSchoolTerms({ school_id: "x", global_terms: [{ term_id: 1, text: "a", language: "xx", severity_weight: 1, enabled_for_school: true }], school_terms: [] }),
    SchoolSettingsContractError
  );
});

test("a new school word is trimmed and validated", () => {
  assert.deepEqual(buildSchoolTermPayload({ text: "  local   word ", language: "ceb", severity_weight: 0.5 }), {
    payload: { text: "local word", language: "ceb", severity_weight: 0.5 },
  });
  assert.ok("error" in buildSchoolTermPayload({ text: "   ", language: "en", severity_weight: 0.5 }));
  assert.ok("error" in buildSchoolTermPayload({ text: "x".repeat(101), language: "en", severity_weight: 0.5 }));
  assert.ok("error" in buildSchoolTermPayload({ text: "ok", language: "es", severity_weight: 0.5 }));
});

test("backend refusals become actionable messages", () => {
  assert.match(schoolSettingsErrorMessage(409, "This word is already on the global list"), /EchoSense list/);
  assert.match(schoolSettingsErrorMessage(409, "Your school already monitors this word"), /already listens/);
  assert.match(schoolSettingsErrorMessage(403, "School access denied"), /administrators/);
  assert.match(schoolSettingsErrorMessage(422, "Enter a school to manage its settings"), /All schools/);
});

test("super admins outside a school get platform settings; everyone else their school's", () => {
  assert.equal(settingsModeFor(true, false), "platform");
  assert.equal(settingsModeFor(true, true), "school");
  assert.equal(settingsModeFor(false, false), "school");
  assert.equal(isSchoolPage("/settings/hours"), true);
  assert.equal(isSchoolPage("/settings/sensitivity"), true);
  assert.equal(isSchoolPage("/settings/words"), false);
  for (const path of ["/settings", "/settings/hours", "/settings/sensitivity", "/settings/words"]) {
    assert.equal(canAccessPath("admin", path), true, path);
    assert.equal(canAccessPath("counselor", path), false, path);
    assert.equal(canAccessPath("staff", path), false, path);
  }
});

test("the Settings pages switch between school and platform views", async () => {
  const [layout, settingsPage, wordsPage, words] = await Promise.all(
    [
      "app/(app)/settings/layout.tsx",
      "app/(app)/settings/page.tsx",
      "app/(app)/settings/words/page.tsx",
      "components/settings/SchoolWords.tsx",
    ].map(readSource)
  );
  for (const label of ["Notifications", "School hours", "Sensitivity", "Monitored words"]) {
    assert.match(layout, new RegExp(`label: "${label}"`));
  }
  assert.match(layout, /Detection settings/);
  assert.match(settingsPage, /mode === "platform"\) return <DetectionInfo \/>/);
  assert.match(settingsPage, /mode === "school"\) return <NotificationsSettings \/>/);
  assert.match(wordsPage, /mode === "platform"\) return <GlobalWords \/>/);
  assert.match(wordsPage, /mode === "school"\) return <SchoolWords \/>/);
  assert.match(words, /Add a word for our school/);
  assert.match(words, /"Turn off for our school"/);
  assert.match(words, /Turned off for our school/);
});
