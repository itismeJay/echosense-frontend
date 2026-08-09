import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  parseAlertListResult,
  parseAlertResponse,
} from "../lib/alert-contract.ts";
import {
  isTestAlert,
  monitoredTermCount,
  triggerTypeLabel,
} from "../lib/alert-presentation.ts";
import {
  newlyObservedAlerts,
  newestAlert,
  runWithoutOverlap,
  shouldMarkRetainedAlertsStale,
} from "../lib/alert-polling.ts";
import { normalizeApiUrl } from "../lib/config.ts";
import {
  isReviewerRole,
  parseValidJwtClaims,
} from "../lib/auth-token.ts";

const REVIEW_MESSAGE =
  "Unverified possible-aggression alert. Human review required.";

const PHASE3_ALERT = {
  id: 42,
  event_id: "3f1f3a0c-1234-4abc-8def-1234567890ab",
  schema_version: 2,
  trigger_type: "ACOUSTIC",
  severity: "high",
  severity_level: "HIGH",
  severity_reasons: ["term_category:synthetic"],
  review_message: REVIEW_MESSAGE,
  device_id: "4f1f3a0c-1234-4abc-8def-1234567890ab",
  device_code: "room-7-pi",
  device_display_name: "Room 7 Sensor",
  classroom_name: "Grade 7 - Mabini",
  school_name: "EchoSense Integrated School",
  monitored_terms: ["synthetic phrase"],
  monitored_word_detected: true,
  monitored_word_occurrences: [
    { term: "synthetic phrase", confidence: 0.91, offset_seconds: 0.2 },
  ],
  acoustic_trigger_evidence: { class: "Speech", score: 0.83 },
  detailed_acoustic_evidence: { rms: 0.18, windows: [{ score: 0.8 }] },
  tone_evidence: { label: "upset", confidence: 0.7 },
  repetition_evidence: { count: 2 },
  direct_address_evidence: { detected: false },
  laughter_context: { detected: true },
  transcript: "Synthetic finalized transcript.",
  transcription_status: "complete",
  event_start_timestamp: "2026-08-04T00:00:00Z",
  trigger_timestamp: "2026-08-04T00:00:00.250Z",
  event_end_timestamp: "2026-08-04T00:00:01Z",
  test_mode: false,
  delivery_status: "stored",
  push_status: "accepted",
  created_at: "2026-08-04T00:00:02Z",
};

test("normalizes every finalized schema_version=2 Phase 3 field without legacy requirements", () => {
  const alert = parseAlertResponse(PHASE3_ALERT);
  assert.equal(alert.schema_version, 2);
  assert.equal(alert.trigger_type, "ACOUSTIC");
  assert.equal(alert.severity, "high");
  assert.equal(alert.severity_level, "HIGH");
  assert.deepEqual(alert.severity_reasons, PHASE3_ALERT.severity_reasons);
  assert.equal(alert.review_message, REVIEW_MESSAGE);
  assert.equal(alert.classroom_name, PHASE3_ALERT.classroom_name);
  assert.equal(alert.location, PHASE3_ALERT.classroom_name);
  assert.equal(alert.school_name, PHASE3_ALERT.school_name);
  assert.equal(alert.device_code, PHASE3_ALERT.device_code);
  assert.deepEqual(alert.monitored_terms, PHASE3_ALERT.monitored_terms);
  assert.deepEqual(alert.monitored_word_occurrences, PHASE3_ALERT.monitored_word_occurrences);
  assert.deepEqual(alert.acoustic_trigger_evidence, PHASE3_ALERT.acoustic_trigger_evidence);
  assert.deepEqual(alert.detailed_acoustic_evidence, PHASE3_ALERT.detailed_acoustic_evidence);
  assert.deepEqual(alert.tone_evidence, PHASE3_ALERT.tone_evidence);
  assert.deepEqual(alert.repetition_evidence, PHASE3_ALERT.repetition_evidence);
  assert.deepEqual(alert.direct_address_evidence, PHASE3_ALERT.direct_address_evidence);
  assert.deepEqual(alert.laughter_context, PHASE3_ALERT.laughter_context);
  assert.equal(alert.transcript, PHASE3_ALERT.transcript);
  assert.equal(alert.transcription_status, "complete");
  assert.equal(alert.event_start_timestamp, PHASE3_ALERT.event_start_timestamp);
  assert.equal(alert.trigger_timestamp, PHASE3_ALERT.trigger_timestamp);
  assert.equal(alert.event_end_timestamp, PHASE3_ALERT.event_end_timestamp);
  assert.equal(alert.delivery_status, "stored");
  assert.equal(alert.push_status, "accepted");
  assert.equal(alert.confidence, undefined);
  assert.equal(alert.duration, undefined);
  assert.equal(alert.status, "unknown");
  assert.equal(monitoredTermCount(alert), 1);
});

test("retains reasonable legacy aliases without finalized fields", () => {
  const alert = parseAlertResponse({
    id: 8,
    severity: "medium",
    severity_evidence: { level: "MEDIUM", reasons: ["legacy reason"] },
    review_notice: REVIEW_MESSAGE,
    transcribed_text: "Legacy transcript.",
    detected_words: ["legacy term"],
    location: "Legacy Classroom",
    created_at: "2026-08-03T00:00:00Z",
  });
  assert.equal(alert.schema_version, null);
  assert.equal(alert.trigger_type, "UNKNOWN");
  assert.deepEqual(alert.severity_reasons, ["legacy reason"]);
  assert.equal(alert.review_message, REVIEW_MESSAGE);
  assert.equal(alert.transcript, "Legacy transcript.");
  assert.deepEqual(alert.monitored_terms, ["legacy term"]);
  assert.equal(alert.location, "Legacy Classroom");
});

test("one malformed record cannot reject the valid alert list", () => {
  const result = parseAlertListResult([PHASE3_ALERT, { password: "not an alert" }]);
  assert.equal(result.alerts.length, 1);
  assert.equal(result.malformedCount, 1);
  assert.match(result.warning, /1 malformed alert record was omitted/);
});

test("TEST alerts are derived from either canonical test signal and labeled explicitly", () => {
  const alert = parseAlertResponse({
    ...PHASE3_ALERT,
    id: 43,
    trigger_type: "TEST",
    test_mode: true,
  });
  assert.equal(isTestAlert(alert), true);
  assert.equal(triggerTypeLabel(alert), "TEST — synthetic alert");
});

test("new-alert detection is independent of API ordering", () => {
  const older = parseAlertResponse({ ...PHASE3_ALERT, id: 10, created_at: "2026-08-04T00:00:01Z" });
  const newest = parseAlertResponse({ ...PHASE3_ALERT, id: 12, created_at: "2026-08-04T00:00:03Z" });
  const middle = parseAlertResponse({ ...PHASE3_ALERT, id: 11, created_at: "2026-08-04T00:00:02Z" });
  assert.equal(newestAlert([older, newest, middle])?.id, 12);
  assert.deepEqual(
    newlyObservedAlerts([middle, older, newest], new Set([10])).map((alert) => alert.id),
    [12, 11]
  );
  assert.equal(shouldMarkRetainedAlertsStale([older]), true);
  assert.equal(shouldMarkRetainedAlertsStale([]), false);
});

test("polling guard skips overlapping operations and releases after completion", async () => {
  const inFlight = { current: false };
  let release;
  let calls = 0;
  const operation = () => {
    calls += 1;
    return new Promise((resolve) => { release = resolve; });
  };
  const first = runWithoutOverlap(inFlight, operation);
  assert.equal(await runWithoutOverlap(inFlight, operation), false);
  assert.equal(calls, 1);
  release();
  assert.equal(await first, true);
  assert.equal(inFlight.current, false);
  assert.equal(await runWithoutOverlap(inFlight, async () => { calls += 1; }), true);
  assert.equal(calls, 2);
});

function tokenFor(payload) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
}

test("JWT optimistic validation requires numeric future exp and reviewer role", () => {
  const now = Date.parse("2026-08-04T00:00:00Z");
  const valid = tokenFor({ sub: "7", email: "staff@school.test", role: "staff", exp: now / 1000 + 60 });
  assert.equal(parseValidJwtClaims(valid, now)?.role, "staff");
  assert.equal(parseValidJwtClaims(tokenFor({ sub: "7", email: "x@y", role: "staff", exp: "later" }), now), null);
  assert.equal(parseValidJwtClaims(tokenFor({ sub: "7", email: "x@y", role: "staff", exp: now / 1000 - 1 }), now), null);
  assert.equal(parseValidJwtClaims(tokenFor({ sub: "7", email: "x@y", role: "student", exp: now / 1000 + 60 }), now), null);
  assert.equal(isReviewerRole("admin"), true);
  assert.equal(isReviewerRole("counselor"), true);
  assert.equal(isReviewerRole("student"), false);
});

test("LAN API configuration normalizes trailing slashes", async () => {
  assert.equal(normalizeApiUrl(" http://192.168.1.92:8000/// "), "http://192.168.1.92:8000");
  const example = await readFile(new URL("../.env.example", import.meta.url), "utf8");
  assert.match(example, /^NEXT_PUBLIC_API_URL=http:\/\/192\.168\.1\.92:8000$/m);
});
