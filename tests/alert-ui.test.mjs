import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readSource = (relativePath) =>
  readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("alert list includes loading, empty, error, forbidden, and retry states", async () => {
  const source = await readSource("components/AlertCollection.tsx");

  assert.match(source, /AlertListSkeleton/);
  assert.match(source, /No alerts need attention today\./);
  assert.match(source, /We couldn’t load classroom alerts\./);
  assert.match(source, /You do not have permission to view classroom alerts\./);
  assert.match(source, /onClick=\{\(\) => void refresh\(\)\}/);
  assert.match(source, /error && alerts\.length === 0 \? null/);
});

test("three-second alert polling prevents overlap and decouples optional endpoints", async () => {
  const source = await readSource("lib/AlertsProvider.tsx");
  assert.match(source, /runWithoutOverlap\(pollInFlightRef/);
  assert.match(source, /document\.visibilityState === "visible"/);
  assert.match(source, /\}, 3000\);/);
  assert.match(source, /refreshOptionalData/);
  assert.match(source, /optionalRefreshInFlightRef/);
  assert.match(source, /setIsStale/);
  assert.match(source, /setLastUpdated\(new Date\(\)\)/);
  assert.doesNotMatch(source, /Promise\.allSettled\(\[\s*getAlerts/);
});

test("alert cards expose concise review metadata and link to detail", async () => {
  const source = await readSource("components/AlertCard.tsx");

  assert.match(source, /severitySummary\(alert\.severity\)/);
  assert.doesNotMatch(source, /Transcript preview|storedTranscript|transcribed_text/);
  assert.match(source, /schoolLabel\(alert\)/);
  assert.match(source, /monitoredTermSummary\(alert\)/);
  assert.match(source, /triggerTypeLabel\(alert\)/);
  assert.match(source, /TEST ALERT — NOT A REAL INCIDENT/);
  assert.match(source, /severityEvidenceAvailabilityLabel\(alert\)/);
  assert.match(source, /reviewStatusLabel\(alert\)/);
  assert.match(source, /href=\{`\/alerts\/\$\{alert\.id\}`\}/);
});

test("alert detail includes exact transcript and evidence metadata", async () => {
  const [page, evidence] = await Promise.all([
    readSource("app/(app)/alerts/[id]/page.tsx"),
    readSource("components/AlertEvidence.tsx"),
  ]);

  assert.match(page, /Alert ID/);
  assert.match(page, /Event ID/);
  assert.match(page, /Event timeline/);
  assert.match(page, /event_start_timestamp/);
  assert.match(page, /trigger_timestamp/);
  assert.match(page, /event_end_timestamp/);
  assert.match(page, /Trusted device/);
  assert.match(page, /Delivery and push state/);
  assert.match(page, /REQUIRED_REVIEW_NOTICE/);
  assert.match(evidence, /Detected transcript/);
  assert.match(evidence, /\{exactTranscript\(alert\)\}/);
  assert.match(evidence, /whitespace-pre-wrap break-words/);
  assert.match(evidence, /Detected monitored terms/);
  assert.match(evidence, /HUMAN_REVIEW_NOTE/);
  assert.match(evidence, /yamnetRanExplanation\(alert\.yamnet_ran\)/);
  assert.match(evidence, /Why this alert received this severity/);
  assert.match(evidence, /Primary reasons/);
  assert.match(evidence, /Matched evidence categories/);
  assert.match(evidence, /Supporting acoustic or context evidence/);
  assert.match(evidence, /HISTORICAL_SEVERITY_EVIDENCE_MESSAGE/);
  assert.match(evidence, /UNAVAILABLE_SEVERITY_EVIDENCE_MESSAGE/);
  assert.match(evidence, /Acoustic model \(YAMNet\)/);
  assert.match(evidence, /Acoustic trigger evidence/);
  assert.match(evidence, /Detailed acoustic evidence/);
  assert.match(evidence, /Tone evidence/);
  assert.match(evidence, /Repetition evidence/);
  assert.match(evidence, /Direct-address evidence/);
  assert.match(evidence, /Laughter context/);
});

test("alert review UI does not add raw-audio controls or prohibited claims", async () => {
  const sources = await Promise.all([
    readSource("components/AlertCard.tsx"),
    readSource("components/AlertEvidence.tsx"),
    readSource("app/(app)/alerts/[id]/page.tsx"),
    readSource("components/AlertCollection.tsx"),
  ]);
  const combined = sources.join("\n");

  assert.doesNotMatch(combined, /<audio|Audio player/i);
  assert.doesNotMatch(combined, /JSON\.stringify\(alert\.severity_evidence\)/);
  assert.doesNotMatch(combined, /<pre[^>]*>.*severity_evidence/is);
  assert.doesNotMatch(
    combined,
    /bullying confirmed|bully detected|attacker|aggressor identified|guilty|intent confirmed|100% reliable|guaranteed detection|zero false positives|zero false negatives/i
  );
});

test("protected alert routes and 401 cleanup remain configured", async () => {
  const [proxy, api] = await Promise.all([
    readSource("proxy.ts"),
    readSource("lib/api.ts"),
  ]);

  assert.match(proxy, /["']\/alerts\/:path\*["']/);
  assert.match(proxy, /["']\/alert\/:path\*["']/);
  assert.match(proxy, /redirectAndClearToken\(request, ["']\/login["']\)/);
  assert.match(api, /res\.status === 401/);
  assert.match(api, /echosense_token=; path=\/; max-age=0/);
  assert.doesNotMatch(api, /console\.(log|debug)\([^)]*token/i);
});

test("notification deep-link compatibility route validates and redirects positive IDs", async () => {
  const source = await readSource("app/(app)/alert/[id]/page.tsx");
  assert.match(source, /\^\[1-9\]\\d\*\$/);
  assert.match(source, /Number\.isSafeInteger/);
  assert.match(source, /redirect\(`\/alerts\/\$\{id\}`\)/);
  assert.match(source, /notFound\(\)/);
});

test("alert list export excludes transcript and raw evidence", async () => {
  const source = await readSource("components/AlertCollection.tsx");
  assert.doesNotMatch(source, /storedTranscript|transcribed_text|transcriptPreview/);
  assert.doesNotMatch(source, /acoustic_trigger_evidence|tone_evidence|JSON\.stringify/);
  assert.match(source, /Monitored-term Occurrences/);
});

test("auth clears invalid or expired cookies and HTTPS cookies are Secure", async () => {
  const [auth, proxy] = await Promise.all([
    readSource("lib/auth.ts"),
    readSource("proxy.ts"),
  ]);
  assert.match(auth, /window\.location\.protocol === 'https:'/);
  assert.match(auth, /if \(!decoded\) \{\s*clearAuthCookie\(\)/);
  assert.match(auth, /`\$\{API_URL\}\/auth\/me`/);
  assert.match(auth, /Authorization: `Bearer \$\{token\}`/);
  assert.match(auth, /response\.status === 401 \|\| response\.status === 403/);
  assert.match(auth, /currentUserRequest\?\.token === token/);
  assert.match(proxy, /continueAndClearToken\(\)/);
  assert.match(proxy, /parseValidJwtClaims/);
});

test("detail route keeps distinct 401, 403, 404, and backend failure states", async () => {
  const source = await readSource("app/(app)/alerts/[id]/page.tsx");

  assert.match(source, /errorStatus === 401/);
  assert.match(source, /errorStatus === 403/);
  assert.match(source, /errorStatus === 404/);
  assert.match(source, /Your session is no longer authorized\./);
  assert.match(source, /You do not have permission to view this alert\./);
  assert.match(source, /Alert not found/);
  assert.match(source, /We couldn’t load this classroom alert\./);
  assert.match(source, /Retry/);
});

test("dictionary collection calls use the deployed canonical route", async () => {
  const api = await readSource("lib/api.ts");
  const dictionaryCollectionCalls = api.match(
    /apiFetch<unknown>\("\/dictionary\/"/g
  );

  assert.equal(dictionaryCollectionCalls?.length, 2);
});
