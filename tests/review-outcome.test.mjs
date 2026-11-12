import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { falseAlertRate, parseReviewOutcome, reviewOutcomeLabel, REVIEW_OUTCOMES } from "../lib/review-outcome.ts";

const readSource = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("outcomes match the backend values and plain labels", () => {
  assert.deepEqual(
    REVIEW_OUTCOMES.map((o) => [o.value, o.label]),
    [
      ["confirmed_bullying", "Confirmed"],
      ["false_alert", "False alert"],
      ["joking_banter", "Just joking"],
      ["misheard", "Misheard"],
    ]
  );
  assert.equal(parseReviewOutcome("misheard"), "misheard");
  assert.equal(parseReviewOutcome("other"), null);
  assert.equal(parseReviewOutcome(undefined), null);
  assert.equal(reviewOutcomeLabel(null), null);
});

test("false-alert rate counts only alerts with an outcome", () => {
  assert.equal(falseAlertRate(null), null);
  assert.equal(falseAlertRate({ not_set: 4 }), null);
  assert.deepEqual(
    falseAlertRate({ confirmed_bullying: 2, false_alert: 1, joking_banter: 0, misheard: 1, not_set: 9 }),
    { falseAlerts: 1, withOutcome: 4, percent: 25 }
  );
});

test("review sends outcome and trimmed note, and the UI asks before marking", async () => {
  const api = await readSource("lib/api.ts");
  assert.match(api, /outcome: review\.outcome/);
  assert.match(api, /note\?\.trim\(\)/);
  const page = await readSource("app/(app)/alerts/[id]/page.tsx");
  assert.match(page, /setAsking\("reviewed"\)/);
  assert.match(page, /<ReviewOutcomeDialog/);
  const inbox = await readSource("components/AlertInbox.tsx");
  assert.match(inbox, /outcome=\{alert\.review_outcome\}/);
  const reports = await readSource("app/(app)/reports/page.tsx");
  assert.match(reports, /False alerts/);
});
