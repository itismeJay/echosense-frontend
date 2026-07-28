import test from "node:test";
import assert from "node:assert/strict";
import {
  AlertContractError,
  parseAlertListResponse,
} from "../lib/alert-contract.ts";
import {
  matchedTermEvidenceLabel,
  matchedTermsCountLabel,
  NO_MATCHED_TERMS_MESSAGE,
  UNVERIFIED_EVIDENCE_NOTICE,
} from "../lib/alert-presentation.ts";
import {
  formatLanguageConfidence,
  languageLabel,
} from "../lib/format.ts";

const BASE_ALERT = {
  id: 7,
  severity: "medium",
  confidence: 0.74,
  duration: 2.4,
  location: "Grade 6 - Rizal",
  status: "active",
  created_at: "2026-07-28T03:00:00Z",
};

const MATCHED_TERM = {
  term_id: 12,
  term: "example monitored phrase",
  language: "ceb",
  match_type: "phrase",
};

test("maps every backend language value to a teacher-friendly label", () => {
  assert.equal(languageLabel("fil"), "Filipino");
  assert.equal(languageLabel("ceb"), "Bisaya/Cebuano");
  assert.equal(languageLabel("en"), "English");
  assert.equal(languageLabel("mixed"), "Mixed language");
  assert.equal(languageLabel("unknown"), "Language unavailable");
});

test("uses the safe language fallback for missing legacy values", () => {
  assert.equal(languageLabel(), "Language unavailable");
  assert.equal(languageLabel(null), "Language unavailable");
});

test("formats valid language confidence and omits missing confidence", () => {
  assert.equal(formatLanguageConfidence(0.82), "82%");
  assert.equal(formatLanguageConfidence(0), "0%");
  assert.equal(formatLanguageConfidence(1), "100%");
  assert.equal(formatLanguageConfidence(), null);
  assert.equal(formatLanguageConfidence(null), null);
});

test("reports no, one, and multiple possible matched terms", () => {
  assert.equal(matchedTermsCountLabel(), NO_MATCHED_TERMS_MESSAGE);
  assert.equal(matchedTermsCountLabel([]), NO_MATCHED_TERMS_MESSAGE);
  assert.equal(matchedTermsCountLabel([MATCHED_TERM]), "1 possible matched term");
  assert.equal(
    matchedTermsCountLabel([
      MATCHED_TERM,
      { ...MATCHED_TERM, term_id: 13, term: "another phrase" },
    ]),
    "2 possible matched terms"
  );
});

test("parses new alert language and matched-term evidence fields", () => {
  const [alert] = parseAlertListResponse([
    {
      ...BASE_ALERT,
      language: "ceb",
      language_confidence: 0.82,
      matched_terms: [MATCHED_TERM],
    },
  ]);

  assert.equal(alert.language, "ceb");
  assert.equal(alert.language_confidence, 0.82);
  assert.deepEqual(alert.matched_terms, [MATCHED_TERM]);
});

test("accepts multiple matched terms", () => {
  const matchedTerms = [
    MATCHED_TERM,
    {
      term_id: 13,
      term: "English monitored term",
      language: "en",
      match_type: "term",
    },
  ];
  const [alert] = parseAlertListResponse([
    { ...BASE_ALERT, language: "mixed", matched_terms: matchedTerms },
  ]);

  assert.equal(alert.matched_terms?.length, 2);
  assert.deepEqual(alert.matched_terms, matchedTerms);
});

test("rejects malformed matched-term response structures safely", () => {
  assert.throws(
    () =>
      parseAlertListResponse([
        {
          ...BASE_ALERT,
          matched_terms: [{ ...MATCHED_TERM, term_id: "12" }],
        },
      ]),
    AlertContractError
  );
  assert.throws(
    () =>
      parseAlertListResponse([
        {
          ...BASE_ALERT,
          matched_terms: [{ ...MATCHED_TERM, language: "tl" }],
        },
      ]),
    AlertContractError
  );
  assert.throws(
    () => parseAlertListResponse([{ ...BASE_ALERT, matched_terms: null }]),
    AlertContractError
  );
});

test("keeps legacy alerts compatible when new fields are absent", () => {
  const [alert] = parseAlertListResponse([BASE_ALERT]);

  assert.equal(alert.language, undefined);
  assert.equal(alert.language_confidence, undefined);
  assert.equal(alert.matched_terms, undefined);
  assert.equal(languageLabel(alert.language), "Language unavailable");
  assert.equal(formatLanguageConfidence(alert.language_confidence), null);
  assert.equal(
    matchedTermsCountLabel(alert.matched_terms),
    "No matched monitored terms available."
  );
});

test("uses careful, unverified wording for matched evidence", () => {
  assert.equal(
    matchedTermEvidenceLabel("phrase"),
    "Possible matched phrase"
  );
  assert.equal(
    matchedTermEvidenceLabel("term"),
    "Possible detected term"
  );
  assert.match(UNVERIFIED_EVIDENCE_NOTICE, /unverified/i);
  assert.doesNotMatch(UNVERIFIED_EVIDENCE_NOTICE, /confirmed/i);
  assert.doesNotMatch(matchedTermEvidenceLabel("phrase"), /aggressor/i);
});
