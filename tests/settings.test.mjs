import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SettingsContractError, parseSystemSettings } from "../lib/settings.ts";

const readSource = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

const SYSTEM_SETTINGS_RESPONSE = {
  setting_id: 1,
  device_status: "online",
  last_heartbeat: "2026-07-28T02:00:00Z",
  stt_model_version: "faster-whisper small int8",
  yamnet_version: "1.0",
  last_ota_update: null,
  updated_at: "2026-07-28T02:00:00Z",
};

test("parses the read-only engine information", () => {
  const parsed = parseSystemSettings(SYSTEM_SETTINGS_RESPONSE);

  assert.equal(parsed.setting_id, 1);
  assert.equal(parsed.stt_model_version, "faster-whisper small int8");
  assert.equal(parsed.device_status, "online");
  assert.equal("confidence_threshold" in parsed, false);
  assert.equal("aggression_duration_threshold" in parsed, false);
});

test("rejects malformed engine information", () => {
  assert.throws(() => parseSystemSettings({ ...SYSTEM_SETTINGS_RESPONSE, setting_id: "1" }), SettingsContractError);
  assert.throws(() => parseSystemSettings({ ...SYSTEM_SETTINGS_RESPONSE, yamnet_version: 1 }), SettingsContractError);
});

test("the fake sliders are gone from the UI and the API client", async () => {
  const sources = await Promise.all(
    ["lib/api.ts", "lib/settings.ts", "lib/types.ts", "components/settings/DetectionInfo.tsx", "app/(app)/settings/page.tsx"].map(
      readSource
    )
  );
  for (const source of sources) {
    assert.doesNotMatch(source, /confidence_threshold|aggression_duration_threshold|Alert sensitivity|Minimum sound length/);
    assert.doesNotMatch(source, /type="range"/);
  }
  assert.doesNotMatch(sources[0], /"\/system-settings\/", \{\s*method: "PUT"/);
});
