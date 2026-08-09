import test from "node:test";
import assert from "node:assert/strict";
import {
  AlertContractError,
  normalizeAlertSeverity,
  parseAlertListResult,
  parseAlertListResponse,
  parseAlertResponse,
} from "../lib/alert-contract.ts";
import {
  alertStatusLabel,
  exactTranscript,
  HISTORICAL_SEVERITY_EVIDENCE_MESSAGE,
  HUMAN_REVIEW_NOTE,
  matchedTermEvidenceLabel,
  matchedTermsCountLabel,
  MISSING_TRANSCRIPT_MESSAGE,
  NO_MATCHED_TERMS_MESSAGE,
  priorityLabel,
  REQUIRED_REVIEW_NOTICE,
  reviewStatusLabel,
  severityEvidenceAvailabilityLabel,
  severityLabel,
  severityReasonLabel,
  severitySummary,
  supportingEvidenceLabel,
  termCategoryEvidenceLabel,
  transcriptPreview,
  UNVERIFIED_EVIDENCE_NOTICE,
  UNAVAILABLE_SEVERITY_EVIDENCE_MESSAGE,
  uniqueMatchedTerms,
  yamnetRanExplanation,
} from "../lib/alert-presentation.ts";
import { buildApiHeaders } from "../lib/api-headers.ts";
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

test("isolates malformed matched-term response structures safely", () => {
  assert.equal(
      parseAlertListResult([
        {
          ...BASE_ALERT,
          matched_terms: [{ ...MATCHED_TERM, term_id: "12" }],
        },
      ]).malformedCount,
    1
  );
  assert.equal(
      parseAlertListResult([
        {
          ...BASE_ALERT,
          matched_terms: [{ ...MATCHED_TERM, language: "tl" }],
        },
      ]).alerts.length,
    0
  );
});

test("accepts a null matched-term field from a legacy record", () => {
  const [alert] = parseAlertListResponse([
    { ...BASE_ALERT, matched_terms: null },
  ]);
  assert.equal(alert.matched_terms, null);
  assert.equal(matchedTermsCountLabel(alert.matched_terms), NO_MATCHED_TERMS_MESSAGE);
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

test("accepts nullable legacy evidence from the deployed alert schema", () => {
  const [alert] = parseAlertListResponse([
    {
      ...BASE_ALERT,
      transcribed_text: null,
      detected_words: null,
      yamnet_class: null,
      yamnet_score: null,
      emotion: null,
      rms: null,
      energy_variance: null,
      zero_crossing_rate: null,
      peak_to_average: null,
      waveform_snapshot: null,
      categories: null,
      hard_hits: null,
      soft_hits: null,
      duration_gate: null,
      required_duration: null,
      language: "unknown",
      language_confidence: null,
      matched_terms: [],
    },
  ]);

  assert.equal(alert.transcribed_text, null);
  assert.equal(alert.categories, null);
  assert.equal(alert.language, "unknown");
  assert.equal(alert.language_confidence, null);
  assert.deepEqual(alert.matched_terms, []);
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

test("preserves exact Filipino, Cebuano, and mixed-language transcripts", () => {
  const transcripts = [
    "Huwag mo akong sigawan, please.",
    "Ayaw ko'g singgit! Palihog.",
    "Tama na—please, undang na.",
  ];

  for (const transcribed_text of transcripts) {
    const [alert] = parseAlertListResponse([
      { ...BASE_ALERT, transcribed_text },
    ]);
    assert.equal(exactTranscript(alert), transcribed_text);
  }
});

test("preserves capitalization and punctuation in the exact transcript", () => {
  const transcribed_text = "STOP! Ayaw ko—please, Tama Na.";
  const [alert] = parseAlertListResponse([
    { ...BASE_ALERT, transcribed_text },
  ]);
  assert.equal(exactTranscript(alert), transcribed_text);
});

test("uses the exact missing-transcript fallback", () => {
  assert.equal(
    exactTranscript({ ...BASE_ALERT, transcribed_text: null }),
    MISSING_TRANSCRIPT_MESSAGE
  );
  assert.equal(
    exactTranscript({ ...BASE_ALERT }),
    MISSING_TRANSCRIPT_MESSAGE
  );
});

test("shortens only long list previews while preserving the stored value", () => {
  const transcript = `ABC, ñ, Cebuano! ${"x".repeat(220)}`;
  const preview = transcriptPreview(transcript, 40);
  assert.equal(preview.length, 40);
  assert.ok(preview.endsWith("…"));
  assert.equal(transcript.startsWith(preview.slice(0, -1)), true);
  assert.equal(exactTranscript({ ...BASE_ALERT, transcribed_text: transcript }), transcript);
});

test("deduplicates matched terms without altering multilingual text", () => {
  const duplicate = { ...MATCHED_TERM };
  const second = {
    term_id: 14,
    term: "Ayaw na",
    language: "ceb",
    match_type: "term",
  };
  assert.deepEqual(
    uniqueMatchedTerms([MATCHED_TERM, duplicate, second]),
    [MATCHED_TERM, second]
  );
});

test("explains all yamnet_ran legacy states accurately", () => {
  assert.equal(yamnetRanExplanation(true), "Acoustic classification was executed.");
  assert.equal(yamnetRanExplanation(false), "Acoustic classification was not executed.");
  assert.equal(yamnetRanExplanation(null), null);
  assert.equal(yamnetRanExplanation(), null);
});

test("parses event_id and yamnet_ran and handles legacy nulls", () => {
  const event_id = "3f1f3a0c-1234-4abc-8def-1234567890ab";
  const [complete, legacy] = parseAlertListResponse([
    { ...BASE_ALERT, event_id, yamnet_ran: true },
    { ...BASE_ALERT, id: 8, event_id: null, yamnet_ran: null },
  ]);
  assert.equal(complete.event_id, event_id);
  assert.equal(complete.yamnet_ran, true);
  assert.equal(legacy.event_id, null);
  assert.equal(legacy.yamnet_ran, null);
});

test("isolates a malformed event_id and discards malformed optional legacy evidence", () => {
  assert.equal(
    parseAlertListResult([{ ...BASE_ALERT, event_id: "not-a-uuid" }]).malformedCount,
    1
  );
  const alert = parseAlertResponse({ ...BASE_ALERT, yamnet_ran: "false" });
  assert.equal(alert.yamnet_ran, undefined);
});

test("maps supported and unknown status values without implying guilt", () => {
  const unknown = parseAlertResponse({ ...BASE_ALERT, status: "pending" });
  assert.equal(priorityLabel(BASE_ALERT.severity), "Medium priority");
  assert.equal(unknown.severity, "medium");
  assert.equal(alertStatusLabel(), "Unverified — review required");
  assert.equal(reviewStatusLabel(BASE_ALERT), "Awaiting review");
  assert.equal(reviewStatusLabel({ ...BASE_ALERT, status: "resolved" }), "Marked resolved");
  assert.equal(reviewStatusLabel(unknown), "Review status unavailable");
});

test("renders LOW, MEDIUM, and HIGH from canonical mocked API responses", () => {
  const alerts = parseAlertListResponse([
    { ...BASE_ALERT, id: 1, severity: "LOW", severity_level: "LOW" },
    { ...BASE_ALERT, id: 2, severity: "MEDIUM", severity_level: "MEDIUM" },
    { ...BASE_ALERT, id: 3, severity: "HIGH", severity_level: "HIGH" },
  ]);

  assert.deepEqual(
    alerts.map((alert) => alert.severity),
    ["low", "medium", "high"]
  );
  assert.deepEqual(
    alerts.map((alert) => severityLabel(alert.severity)),
    ["LOW", "MEDIUM", "HIGH"]
  );
  assert.deepEqual(
    alerts.map((alert) => severitySummary(alert.severity)),
    [
      "Possible classroom concern",
      "Possible verbal-aggression indicators",
      "High-priority classroom alert",
    ]
  );
});

test("keeps lowercase severity compatible and never defaults invalid values to LOW", () => {
  assert.equal(normalizeAlertSeverity("low"), "low");
  assert.equal(normalizeAlertSeverity("MeDiUm"), "medium");
  assert.equal(normalizeAlertSeverity(" HIGH "), "high");
  assert.equal(normalizeAlertSeverity("critical"), "unknown");
  assert.equal(severityLabel("unknown"), "SEVERITY UNAVAILABLE");

  assert.throws(
    () => parseAlertResponse({ ...BASE_ALERT, severity: "critical" }),
    AlertContractError
  );
});

test("prefers a valid canonical severity_level from a mocked backend response", () => {
  const alert = parseAlertResponse({
    ...BASE_ALERT,
    severity: "legacy-value",
    severity_level: "HIGH",
  });

  assert.equal(alert.severity, "high");
  assert.equal(alert.severity_level, "HIGH");
});

test("malformed new optional fields degrade safely without hiding valid legacy data", () => {
  const legacyTranscript = "Exact stored legacy transcript.";
  const alert = parseAlertResponse({
    ...BASE_ALERT,
    severity: "MEDIUM",
    severity_level: "CRITICAL",
    severity_evidence: { level: "HIGH", reasons: null },
    review_notice: { message: "invalid" },
    transcript: 123,
    transcribed_text: legacyTranscript,
  });

  assert.equal(alert.severity, "medium");
  assert.equal(alert.severity_level, "MEDIUM");
  assert.equal(alert.severity_evidence, undefined);
  assert.equal(alert.review_notice, undefined);
  assert.equal(alert.transcript, legacyTranscript);
  assert.equal(exactTranscript(alert), legacyTranscript);
});

test("parses complete severity evidence and review notice without raw payload fields", () => {
  const transcript = "STOP! Huwag mo akong sigawan—please.";
  const alert = parseAlertResponse({
    ...BASE_ALERT,
    severity: "HIGH",
    severity_level: "HIGH",
    severity_evidence: {
      level: "HIGH",
      reasons: ["term_category:self_harm_directive"],
      term_categories: {
        self_harm_directive: ["matched phrase"],
      },
      supporting_evidence: [
        "laughter_or_excitement_marker_present",
      ],
    },
    review_notice:
      "Unverified possible-aggression alert. Human review required.",
    transcript,
    internal_debug_payload: { should_not_reach_ui: true },
  });

  assert.equal(alert.severity_evidence?.level, "HIGH");
  assert.deepEqual(alert.severity_evidence?.reasons, [
    "term_category:self_harm_directive",
  ]);
  assert.deepEqual(alert.severity_evidence?.term_categories, {
    self_harm_directive: ["matched phrase"],
  });
  assert.deepEqual(alert.severity_evidence?.supporting_evidence, [
    "laughter_or_excitement_marker_present",
  ]);
  assert.equal(alert.review_notice, REQUIRED_REVIEW_NOTICE);
  assert.equal(exactTranscript(alert), transcript);
  assert.equal("internal_debug_payload" in alert, false);
});

test("keeps historical null evidence distinct from unavailable malformed evidence", () => {
  const historical = parseAlertResponse({
    ...BASE_ALERT,
    severity_evidence: null,
  });
  const malformed = parseAlertResponse({
    ...BASE_ALERT,
    severity_evidence: {
      level: "HIGH",
      reasons: "not-an-array",
    },
  });

  assert.equal(historical.severity_evidence, null);
  assert.equal(
    severityEvidenceAvailabilityLabel(historical),
    "Historical severity details unavailable"
  );
  assert.equal(malformed.severity_evidence, undefined);
  assert.equal(
    severityEvidenceAvailabilityLabel(malformed),
    "Severity details unavailable"
  );
  assert.equal(
    HISTORICAL_SEVERITY_EVIDENCE_MESSAGE,
    "Detailed severity evidence was not recorded for this historical alert."
  );
  assert.equal(
    UNAVAILABLE_SEVERITY_EVIDENCE_MESSAGE,
    "Detailed severity evidence is unavailable for this alert."
  );
});

test("turns severity evidence keys into accurate readable labels", () => {
  assert.equal(
    severityReasonLabel("term_category:self_harm_directive"),
    "Severe self-harm directive detected in the transcript"
  );
  assert.equal(
    termCategoryEvidenceLabel("self_harm_directive"),
    "Severe self-harm directive"
  );
  assert.equal(
    supportingEvidenceLabel("laughter_or_excitement_marker_present"),
    "Laughter or excitement was present, but it did not cancel the stronger text evidence"
  );
  assert.equal(
    severityReasonLabel("term_category:physical_threat"),
    "Transcript matched the physical threat category"
  );
  assert.doesNotMatch(
    severityReasonLabel("term_category:physical_threat"),
    /term_category|_/
  );
});

test("uses the required human-review language and no confirmation wording", () => {
  assert.equal(
    REQUIRED_REVIEW_NOTICE,
    "Unverified possible-aggression alert. Human review required."
  );
  assert.equal(
    HUMAN_REVIEW_NOTE,
    "This transcript and acoustic evidence are automated indicators. Staff must review the surrounding context before taking action."
  );
  for (const copy of [
    REQUIRED_REVIEW_NOTICE,
    HUMAN_REVIEW_NOTE,
    alertStatusLabel(),
    matchedTermEvidenceLabel("phrase"),
  ]) {
    assert.doesNotMatch(
      copy,
      /confirmed bullying|confirmed aggressor|guilty|proven incident/i
    );
  }
});

test("authenticated API headers use the bearer token without rendering it", () => {
  const syntheticToken = "synthetic-test-token";
  const headers = buildApiHeaders(syntheticToken, {
    Accept: "application/json",
  });
  assert.equal(headers.get("Authorization"), `Bearer ${syntheticToken}`);
  assert.equal(headers.get("Accept"), "application/json");
  assert.doesNotMatch(REQUIRED_REVIEW_NOTICE, new RegExp(syntheticToken));
});
