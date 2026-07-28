import test from "node:test";
import assert from "node:assert/strict";
import {
  SettingsContractError,
  parseSystemSettings,
  settingsToUpdatePayload,
  systemSettingsToForm,
} from "../lib/settings.ts";

const SYSTEM_SETTINGS_RESPONSE = {
  setting_id: 1,
  confidence_threshold: 0.55,
  aggression_duration_threshold: 2,
  device_status: "online",
  last_heartbeat: "2026-07-28T02:00:00Z",
  vosk_version: "1.0",
  yamnet_version: "1.0",
  last_ota_update: null,
  updated_at: "2026-07-28T02:00:00Z",
};

test("parses the deployed system-settings response", () => {
  const parsed = parseSystemSettings(SYSTEM_SETTINGS_RESPONSE);

  assert.equal(parsed.setting_id, 1);
  assert.equal(parsed.confidence_threshold, 0.55);
  assert.equal(parsed.aggression_duration_threshold, 2);
  assert.equal(parsed.device_status, "online");
});

test("converts backend confidence decimals into UI percentages", () => {
  const form = systemSettingsToForm(
    parseSystemSettings(SYSTEM_SETTINGS_RESPONSE)
  );

  assert.deepEqual(form, {
    confidence_threshold_percent: 55,
    aggression_duration_threshold: 2,
  });
});

test("maps supported UI settings to the backend update contract", () => {
  const payload = settingsToUpdatePayload({
    confidence_threshold_percent: 55,
    aggression_duration_threshold: 2,
  });

  assert.deepEqual(payload, {
    confidence_threshold: 0.55,
    aggression_duration_threshold: 2,
  });
  assert.equal("duration_threshold" in payload, false);
  assert.equal("notifications" in payload, false);
  assert.equal("location" in payload, false);
});

test("rejects malformed settings responses and invalid percentages", () => {
  assert.throws(
    () =>
      parseSystemSettings({
        ...SYSTEM_SETTINGS_RESPONSE,
        confidence_threshold: "0.55",
      }),
    SettingsContractError
  );
  assert.throws(
    () =>
      settingsToUpdatePayload({
        confidence_threshold_percent: 101,
        aggression_duration_threshold: 2,
      }),
    RangeError
  );
});
