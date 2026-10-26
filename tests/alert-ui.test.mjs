import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readSource = (relativePath) =>
  readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("alert list includes loading, empty, error, forbidden, and retry states", async () => {
  const source = await readSource("components/AlertsView.tsx");

  assert.match(source, /<LoadingRows rows=\{5\} label="Loading alerts"/);
  assert.match(source, /No alerts need review/);
  assert.match(source, /No alerts match these filters/);
  assert.match(source, /EchoSense can't load alerts right now/);
  assert.match(source, /Your account can't view alerts/);
  assert.match(source, /onRetry=\{errorStatus === 403 \? undefined : \(\) => void refresh\(\)\}/);
  assert.match(source, /error && alerts\.length === 0 \?/);
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

test("inbox rows show severity, classroom, words and time, link to detail, and review in one click", async () => {
  const source = await readSource("components/AlertInbox.tsx");

  assert.match(source, /<SeverityTag severity=\{alert\.severity\} \/>/);
  assert.match(source, /<SeverityStripe severity=\{alert\.severity\} \/>/);
  assert.match(source, /classroomLabel\(alert\)/);
  assert.match(source, /wordsHeard\(alert\)/);
  assert.match(source, /formatWhen\(alert\.created_at\)/);
  assert.match(source, /href=\{`\/alerts\/\$\{alert\.id\}`\}/);
  assert.match(source, /Test alert, not a real incident/);
  assert.match(source, /Mark reviewed/);
  assert.match(source, /setStatus\(alert, "reviewed"\)/);
  // Rows stay short: no transcript in the list.
  assert.doesNotMatch(source, /storedTranscript|transcribed_text|exactTranscript/);
});

test("review actions call the review endpoint and offer Undo", async () => {
  const [hook, api] = await Promise.all([readSource("lib/useReviewAlert.tsx"), readSource("lib/api.ts")]);
  assert.match(api, /`\/alerts\/\$\{alertId\}\/review`/);
  assert.match(api, /JSON\.stringify\(\{ status \}\)/);
  assert.match(hook, /reviewAlert\(alert\.id, previous\)/);
  assert.match(hook, /Undo/);
  assert.match(hook, /The alert was not changed/);
});

test("alert detail includes review actions, exact transcript and evidence metadata", async () => {
  const [page, evidence] = await Promise.all([
    readSource("app/(app)/alerts/[id]/page.tsx"),
    readSource("components/AlertEvidence.tsx"),
  ]);

  assert.match(page, /Mark reviewed/);
  assert.match(page, /Mark resolved/);
  assert.match(page, /Move back to Needs review/);
  assert.match(page, /What was heard/);
  assert.match(page, /Alert ID/);
  assert.match(page, /Event ID/);
  assert.match(page, /Event timeline/);
  assert.match(page, /event_start_timestamp/);
  assert.match(page, /trigger_timestamp/);
  assert.match(page, /event_end_timestamp/);
  assert.match(page, /label="Device"/);
  assert.match(page, /Delivery and phone notifications/);
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
    readSource("components/AlertInbox.tsx"),
    readSource("components/AlertEvidence.tsx"),
    readSource("app/(app)/alerts/[id]/page.tsx"),
    readSource("components/AlertsView.tsx"),
    readSource("app/(app)/overview/page.tsx"),
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
  const [proxy, access, api, session] = await Promise.all([
    readSource("proxy.ts"),
    readSource("lib/access.ts"),
    readSource("lib/api.ts"),
    readSource("lib/session.ts"),
  ]);

  assert.match(proxy, /["']\/alerts\/:path\*["']/);
  assert.match(proxy, /["']\/alert\/:path\*["']/);
  assert.match(proxy, /decideProxy\(/);
  assert.match(access, /kind: "redirect", to: "\/login", clearToken: true/);
  assert.match(api, /res\.status === 401/);
  assert.match(api, /clearSessionCookies\(\)/);
  assert.match(session, /\$\{AUTH_COOKIE\}=; path=\/; max-age=0/);
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
  const source = await readSource("components/AlertsView.tsx");
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
  assert.match(auth, /if \(!token \|\| !decoded\) \{\s*if \(token\) clearAuthCookie\(\)/);
  assert.match(auth, /`\$\{API_URL\}\/auth\/me`/);
  assert.match(auth, /Authorization: `Bearer \$\{token\}`/);
  assert.match(auth, /response\.status === 401\) \{\s*redirectInvalidSession\(\)/);
  assert.match(auth, /response\.status === 403\) \{\s*if \(handleForbiddenResponse/);
  assert.match(auth, /currentUserRequest\?\.token === token/);
  assert.match(proxy, /decision\.clearToken/);
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
