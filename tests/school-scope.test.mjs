import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseSchoolScope, withSchoolScope } from "../lib/school-scope.ts";
import { DEVICE_ONLINE_WINDOW_MS, deviceStatusLabel, isDeviceOnline, offlineLabel } from "../lib/device-status.ts";

const SCOPE = { id: "0d42c341-74b0-44bd-8d7b-413fd8bb2751", name: "Panabo Pilot Elementary School" };
const readSource = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("inside a school, every API path carries that school's id", () => {
  assert.equal(withSchoolScope("/alerts/", SCOPE), `/alerts/?school_id=${SCOPE.id}`);
  assert.equal(withSchoolScope("/alerts/?limit=5", SCOPE), `/alerts/?limit=5&school_id=${SCOPE.id}`);
  assert.equal(withSchoolScope("/alerts/10", SCOPE), `/alerts/10?school_id=${SCOPE.id}`);
  // An explicit school_id is never doubled or overridden.
  assert.equal(withSchoolScope("/alerts/?school_id=x", SCOPE), "/alerts/?school_id=x");
  // Outside a school nothing is added.
  assert.equal(withSchoolScope("/alerts/", null), "/alerts/");
});

test("only a well-formed stored scope is trusted", () => {
  assert.deepEqual(parseSchoolScope(JSON.stringify(SCOPE)), SCOPE);
  assert.equal(parseSchoolScope(null), null);
  assert.equal(parseSchoolScope("not json"), null);
  assert.equal(parseSchoolScope(JSON.stringify({ id: "1 OR 1=1", name: "x" })), null);
  assert.equal(parseSchoolScope(JSON.stringify({ id: SCOPE.id, name: "  " })), null);
});

test("the scope is cleared on login, logout and any session reset", async () => {
  const [auth, session, schools] = await Promise.all([
    readSource("lib/auth.ts"),
    readSource("lib/session.ts"),
    readSource("app/(app)/schools/page.tsx"),
  ]);
  assert.match(auth, /clearSchoolScope\(\)\n\s+setAuthCookie\(data\.access_token\)/);
  assert.match(session, /export function clearSessionCookies\(\) \{[^}]*clearSchoolScope\(\);/);
  assert.match(schools, /clearSchoolScope\(\);/);
  assert.match(schools, /enterSchool\(\{ id: school\.id, name: school\.name \}\)/);
});

test("the green banner names the school and offers Exit to all schools", async () => {
  const topBar = await readSource("components/TopBar.tsx");
  assert.match(topBar, /Viewing <strong className="font-semibold">\{scope\.name\}<\/strong>/);
  assert.match(topBar, /Exit<span className="hidden sm:inline"> to all schools<\/span>/);
  assert.match(topBar, /border-brand bg-brand text-brand-ink/);
});

test("a device is online only if it checked in during the last two minutes", () => {
  const now = Date.parse("2026-10-26T08:00:00Z");
  assert.equal(DEVICE_ONLINE_WINDOW_MS, 120_000);
  assert.equal(isDeviceOnline("2026-10-26T07:58:30Z", now), true);
  assert.equal(isDeviceOnline("2026-10-26T07:58:00Z", now), true);
  assert.equal(isDeviceOnline("2026-10-26T07:57:59Z", now), false);
  assert.equal(isDeviceOnline(null, now), false);
  assert.equal(isDeviceOnline("garbage", now), false);
  assert.equal(offlineLabel(null), "Offline · never checked in");
  assert.match(deviceStatusLabel("2026-10-26T07:00:00Z", new Date(now)), /^Offline · last seen /);
});

test("device status comes from each device, never the global heartbeat", async () => {
  const sources = await Promise.all(
    [
      "app/(app)/overview/page.tsx",
      "app/(app)/classrooms/page.tsx",
      "app/(app)/classrooms/[id]/page.tsx",
      "app/(app)/schools/page.tsx",
    ].map(readSource)
  );
  for (const source of sources) assert.doesNotMatch(source, /getHeartbeat|last_heartbeat|getSystemSettings/);
  assert.match(sources[0], /useDeviceStatus\(\)/);
  assert.match(sources[3], /school\.devices_online/);
});
