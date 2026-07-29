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
});

test("alert cards expose concise review metadata and link to detail", async () => {
  const source = await readSource("components/AlertCard.tsx");

  assert.match(source, /Possible aggression alert/);
  assert.match(source, /Transcript preview/);
  assert.match(source, /languageLabel\(alert\.language\)/);
  assert.match(source, /matchedTermsCountLabel\(alert\.matched_terms\)/);
  assert.match(source, /href=\{`\/alerts\/\$\{alert\.id\}`\}/);
});

test("alert detail includes exact transcript and evidence metadata", async () => {
  const [page, evidence] = await Promise.all([
    readSource("app/(app)/alerts/[id]/page.tsx"),
    readSource("components/AlertEvidence.tsx"),
  ]);

  assert.match(page, /Alert ID/);
  assert.match(page, /Event ID/);
  assert.match(page, /formatTimestamp\(alert\.created_at\)/);
  assert.match(page, /REQUIRED_REVIEW_NOTICE/);
  assert.match(evidence, /Detected transcript/);
  assert.match(evidence, /\{exactTranscript\(alert\)\}/);
  assert.match(evidence, /whitespace-pre-wrap break-words/);
  assert.match(evidence, /Detected monitored terms/);
  assert.match(evidence, /HUMAN_REVIEW_NOTE/);
  assert.match(evidence, /yamnetRanExplanation\(alert\.yamnet_ran\)/);
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
  assert.doesNotMatch(
    combined,
    /confirmed bullying|confirmed aggressor|guilty|proven incident|identifies a guilty student/i
  );
});

test("protected alert routes and 401 cleanup remain configured", async () => {
  const [proxy, api] = await Promise.all([
    readSource("proxy.ts"),
    readSource("lib/api.ts"),
  ]);

  assert.match(proxy, /'\/alerts\/:path\*'/);
  assert.match(proxy, /NextResponse\.redirect\(new URL\('\/login'/);
  assert.match(api, /res\.status === 401/);
  assert.match(api, /echosense_token=; path=\/; max-age=0/);
  assert.doesNotMatch(api, /console\.(log|debug)\([^)]*token/i);
});
