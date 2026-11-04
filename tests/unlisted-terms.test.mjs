import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseAlertResponse } from "../lib/alert-contract.ts";
import { alertTerms, monitoredTermCount, termSourceLabel, wordsHeard } from "../lib/alert-presentation.ts";

const fixture = await readFile(new URL("./phase3-compat.test.mjs", import.meta.url), "utf8");
// Reuse the phase-3 alert fixture literal so this test tracks the real contract.
const literal = fixture.slice(fixture.indexOf("const PHASE3_ALERT = {") + "const PHASE3_ALERT = ".length);
const REVIEW_MESSAGE = "Unverified possible-aggression alert. Human review required.";
const BASE = Function("REVIEW_MESSAGE", `return ${literal.slice(0, literal.indexOf("\n};") + 2)};`)(REVIEW_MESSAGE);

test("an alert with only an unlisted term (the rescued 'buanga' alert) shows that term", () => {
  const alert = parseAlertResponse({
    ...BASE,
    matched_terms: [],
    unlisted_terms: [{ term: "buanga", language: null, match_type: "word", source: "unlisted" }],
  });

  assert.deepEqual(alertTerms(alert), [
    { term: "buanga", language: null, match_type: "word", source: "unlisted" },
  ]);
  assert.equal(monitoredTermCount(alert), 1);
  assert.ok(wordsHeard(alert).includes("buanga"));
  assert.equal(termSourceLabel("unlisted"), "Not in the word list");
});

test("dictionary terms come first, then school words; duplicates are merged", () => {
  const alert = parseAlertResponse({
    ...BASE,
    matched_terms: [{ term_id: 7, term: "buang ka", language: "ceb", match_type: "phrase" }],
    unlisted_terms: [
      { term: "pulong sa eskwelahan", language: "ceb", match_type: "phrase", source: "school" },
      { term: "Buang ka", language: "ceb", match_type: "phrase", source: "unlisted" },
    ],
  });

  assert.deepEqual(
    alertTerms(alert).map((term) => [term.term, term.source]),
    [
      ["buang ka", "global"],
      ["pulong sa eskwelahan", "school"],
    ]
  );
  assert.equal(termSourceLabel("school"), "School word");
  assert.equal(termSourceLabel("global"), null);
});

test("malformed unlisted entries are skipped, never fatal to the alert", () => {
  const alert = parseAlertResponse({
    ...BASE,
    unlisted_terms: [null, { term: "  " }, { term: "yawa", language: "klingon", source: "weird" }],
  });

  assert.deepEqual(alert.unlisted_terms, [
    { term: "yawa", language: null, match_type: "exact", source: "unlisted" },
  ]);
});

test("an older backend without unlisted_terms still parses", () => {
  const alert = parseAlertResponse({ ...BASE });

  assert.equal(alert.unlisted_terms, undefined);
});
